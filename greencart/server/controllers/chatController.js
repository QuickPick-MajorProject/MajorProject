import axios from "axios";
import Product from "../models/Product.js";
import User from "../models/User.js";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "AIzaSyASiWN1hMgJIheIilG-uZrkbUTuB2af4V8";

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
    const prompt = `You are a grocery assistant that converts cooking requests into a structured JSON shopping list, formatted for real-world grocery stores.\n\nThe goal is to generate accurate and store-ready quantities. Consider how groceries are sold in actual stores. Avoid arbitrary or kitchen-specific units like “cups” or “tablespoons”.\n\n### Output Format:\nReturn a JSON object with:\n- dish (string)\n- servings (integer)\n- ingredients (array of objects with: name, quantity, category, inStock [boolean, true if available in store, false if not])\n\n### Important:\n- You may use synonyms or common names for products (e.g., \"kajus\" for \"cashew nuts\").\n- For vegetables, always list each vegetable individually (never use group names like \"mixed vegetables\").\n- Do not include a 'unit' field in the output.\n- If a product is not available in the store, set inStock to false.\n\n### Quantity Logic Rules:\n1. For grains and dals, use: 0.5kg, 1kg, 1.5kg, etc.\n2. For oils and liquids, use: 250ml, 500ml, 1L\n3. For nuts & dry fruits, use: 50g, 100g, 200g\n4. For vegetables, use number of pieces (e.g., 2 onions) or weight (e.g., 500g carrots)\n5. For spices and masalas, use: 1 packet, 2 packets\n6. Always round up to nearest reasonable grocery unit (no \"37g of rice\")\n7. Only respond with valid JSON. Do not include comments or explanations.\n\n### Example Input:\n\"${message} for ${servings} people\"\n\n### Example Output:\n{\n  \"dish\": \"Veg Dum Biryani\",\n  \"servings\": ${servings},\n  \"ingredients\": [\n    { \"name\": \"Basmati rice\", \"quantity\": 1, \"category\": \"grains\", \"inStock\": true },\n    { \"name\": \"Onion\", \"quantity\": 3, \"category\": \"vegetables\", \"inStock\": true }\n  ]\n}\n\nAVAILABLE PRODUCTS IN STORE:\n${JSON.stringify(productList, null, 2)}\n`;

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
        // If already in cart, increment quantity (if numeric), else set
        if (cartItems[ing.productId]) {
          const prev = Number(cartItems[ing.productId]);
          const add = Number(ing.quantity) || 1;
          cartItems[ing.productId] = prev + add;
        } else {
          cartItems[ing.productId] = ing.quantity;
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
