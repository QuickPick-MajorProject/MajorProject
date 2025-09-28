import axios from "axios";
import Product from "../models/Product.js";
import User from "../models/User.js";

// const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "AIzaSyASiWN1hMgJIheIilG-uZrkbUTuB2af4V8";
const GOOGLE_API_KEY = "AIzaSyCTILucJ5CK5up7GL_2C4VXOsnyR43NfqA";

// Helper to extract servings from user message
function extractServings(message) {
  const match = message.match(/(?:for|serves|servings|make|cook|prepare|feed)\s*(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 1;
}

// POST /api/chat/process
// req.body: { message: string }
// Requires authUser middleware to set req.body.userId if logged in
export const processChatAndAddToCart = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.body.userId;
    if (!userId) {
      return res.json({ success: false, reply: "login to use this" });
    }
    if (!message || message.length < 3) {
      return res.json({ success: false, reply: "Please enter a valid request." });
    }

    // Get all products for context
    const products = await Product.find({});
    const productList = products.map(p => ({
      name: p.name,
      description: p.description,
      category: p.category || 'general',
      inStock: p.inStock,
      _id: p._id
    }));

    // Extract servings from message or default to 1
    const servings = extractServings(message);

    // Build strict prompt for Gemini
    const prompt = `You are a grocery assistant that converts cooking requests into a structured JSON shopping list for real-world grocery stores.\n\nYour job is to list ONLY the ingredients truly required for the exact dish the user requests. Respect dietary constraints implied by the dish name or explicitly stated by the user.\n\n### Output Format (JSON ONLY):\nReturn an object with:\n- dish (string)\n- servings (integer)\n- ingredients: array of objects with fields: { name, quantity, category, inStock }\n\n### Global Rules (CRITICAL):\n- If the user says "veg", "vegetarian", "vegan", "eggless", or the dish is a vegetarian variant (e.g., "veg biryani"), DO NOT include meat, fish/seafood, eggs, or animal-based additions.\n- If the user specifies exclusions (e.g., "no onion", "without garlic"), do not include those ingredients.\n- Use ONLY ingredients required for the requested dish. Do not add unrelated items.\n- Choose ingredient names that match items from the store when possible. If not found, set inStock=false.\n- Do not include a 'unit' field. Set inStock=true only if an equivalent product appears in the store list.\n\n### Quantity Rules (INTEGERS ONLY):\n- quantity MUST be a positive integer (1, 2, 3, 4, 5, ...). NO decimals, NO fractions.\n- quantity represents the COUNT of store units/packs/items to add to cart.\n- For vegetables/fruits: quantity = number of pieces (e.g., onions = 2)\n- For staples/oils/spices: quantity = number of retail packs (e.g., rice pack = 1, oil bottle = 1)\n- If uncertain, choose the minimal reasonable count (often 1).\n\n### Important:\n- Use synonyms and common names (e.g., "kajus" -> "cashew nuts").\n- Map to store items when names are similar. If no match, set inStock=false.\n- Do NOT infer non-vegetarian ingredients when request implies vegetarian.\n\n### JSON Only:\nRespond with valid JSON only. No headings, comments, or explanations.\n\n### Example Input:\n"${message} for ${servings} people"\n\nAVAILABLE PRODUCTS IN STORE:\n${JSON.stringify(productList, null, 2)}\n`;

    // Call Gemini API
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      }
    );
    const jsonText = geminiRes.data.candidates[0].content.parts[0].text;
    let aiResult;
    // Robustly extract JSON from Gemini output
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
    console.log(error.message);
    res.status(500).json({ success: false, reply: "Internal server error" });
  }
};
