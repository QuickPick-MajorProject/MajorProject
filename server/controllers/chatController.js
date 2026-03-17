import axios from "axios";
import Product from "../models/Product.js";
import User from "../models/User.js";

// Use Groq API key from .env
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Groq model to use (free tier, fast, capable)
const GROQ_MODEL = "llama-3.3-70b-versatile";

// Helper to extract servings from user message
function extractServings(message) {
  const match = message.match(/(?:for|serves|servings|make|cook|prepare|feed)\s*(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 1;
}

// Helper to call Groq API
async function callGroq(prompt, apiKey) {
  console.log(`Calling Groq model: ${GROQ_MODEL}`);
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a grocery assistant. You MUST respond with valid JSON only, no extra text or markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: "json_object" }
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  console.log(`Success with Groq model: ${GROQ_MODEL}`);
  return response;
}

// POST /api/chat/process
// req.body: { message: string }
// Requires authUser middleware to set req.userId if logged in
export const processChatAndAddToCart = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.userId;

    if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_API_KEY_HERE') {
      return res.json({ success: false, reply: "Groq API key is not configured. Please add your API key to the .env file." });
    }

    if (!userId) {
      return res.json({ success: false, reply: "login to use this" });
    }
    if (!message || message.length < 3) {
      return res.json({ success: false, reply: "Please enter a valid request." });
    }

    // Get all products for context — send only name, category, and _id to minimize tokens
    const products = await Product.find({});
    const productList = products.map(p => ({
      name: p.name,
      category: p.category || 'general',
      _id: p._id
    }));

    // Extract servings from message or default to 1
    const servings = extractServings(message);

    // Build a more compact prompt to save tokens
    const prompt = `Convert the cooking request into a JSON shopping list.

Rules:
- List ONLY ingredients needed for the requested dish
- Respect dietary constraints (veg/vegan/eggless = no meat/fish/eggs)
- Respect exclusions (e.g., "no onion")
- Match ingredient names to store products when possible; if no match, set inStock=false
- quantity must be a positive integer (count of store items/packs)

Output JSON format (no extra text):
{"dish":"...","servings":${servings},"ingredients":[{"name":"...","quantity":1,"category":"...","inStock":true}]}

User request: "${message} for ${servings} people"

Store products:
${JSON.stringify(productList)}
`;

    // Call Groq API
    const groqRes = await callGroq(prompt, GROQ_API_KEY);

    const jsonText = groqRes.data.choices[0].message.content;
    let aiResult;
    // Robustly extract JSON from AI output
    function extractJson(text) {
      // Remove markdown/code block if present
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return match[0];
      return text;
    }
    try {
      aiResult = JSON.parse(extractJson(jsonText));
    } catch (e) {
      return res.json({ success: false, reply: "Sorry, could not understand the AI response.", raw: jsonText });
    }

    // Validate AI result structure
    if (!aiResult || !Array.isArray(aiResult.ingredients) || aiResult.ingredients.length === 0) {
      return res.json({ success: false, reply: "No products found in your request." });
    }

    // Post-process: match ingredients to products, set inStock, category, productId
    aiResult.ingredients = aiResult.ingredients.map(ing => {
      // Support both rich and simple AI output
      const ingName = ing.matchedProduct || ing.name || ing.requiredIngredient;
      const prod = products.find(p => {
        const prodName = p.name.toLowerCase();
        const testName = (ingName || '').toLowerCase();
        return prodName === testName || prodName.includes(testName) || testName.includes(prodName);
      });
      return {
        name: prod ? prod.name : (ingName || ''),
        quantity: ing.quantity || 1,
        category: prod ? prod.category : (ing.category || ''),
        inStock: !!(prod && prod.inStock),
        productId: prod ? prod._id : null,
        // Optionally include extra fields for debugging
        unit: ing.unit,
        matchConfidence: ing.matchConfidence,
        requiredIngredient: ing.requiredIngredient,
        matchedProduct: ing.matchedProduct
      };
    });

    // Build cartItems object (add only available products)
    const user = await User.findById(userId);
    const cartItems = { ...user.cartItems };
    const unavailableItems = [];
    aiResult.ingredients.forEach(ing => {
      if (ing.inStock && ing.productId) {
        // Ensure quantity is a valid positive integer
        const qty = Math.max(1, Math.floor(Number(ing.quantity) || 1));

        // If already in cart, increment quantity, else set
        if (cartItems[ing.productId]) {
          const prev = Math.max(1, Math.floor(Number(cartItems[ing.productId]) || 1));
          cartItems[ing.productId] = Math.min(20, prev + qty); // Cap at 20
        } else {
          cartItems[ing.productId] = Math.min(20, qty); // Cap at 20
        }
      } else {
        unavailableItems.push(ing.name);
      }
    });
    await User.findByIdAndUpdate(userId, { cartItems });

    // Build response message
    let responseText = `Here is your shopping list for "${aiResult.dish}" (serves ${aiResult.servings}):\n` +
      aiResult.ingredients.map(ing =>
        `- ${ing.name} (${ing.quantity}${ing.unit ? ' ' + ing.unit : ''})${ing.inStock ? '' : ' [Not in stock]'}`
      ).join('\n');
    responseText += '\n\nProducts required for you have been added to cart. Please review them and proceed to checkout.';
    if (unavailableItems.length > 0) {
      responseText += `\n\nHere are some additional/out of stock/unavailable products that you might want to buy:\n` +
        unavailableItems.map(item => `- ${item}`).join('\n');
    }

    res.json({ success: true, reply: responseText, aiResult, cartItems });
  } catch (error) {
    if (error.response?.status === 429) {
      console.error("Chat API Error: Groq rate limited.");
      return res.status(429).json({
        success: false,
        reply: "The AI service is temporarily unavailable due to rate limits. Please wait a minute and try again."
      });
    }
    console.error("Chat API Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, reply: "There was an error processing your request. Please try again." });
  }
};
