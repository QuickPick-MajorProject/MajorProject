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
    const prompt = `You are an intelligent grocery shopping assistant for an online store.\n\nYour job is to process any user request related to groceries, recipes, or adding specific products to the cart.\n\nInstructions:\n- Carefully read and understand the user's message. Only add products that are clearly required or explicitly requested by the user.\n- The user may request a recipe, a list, or a specific product/quantity (e.g., 'add 1 bag of basmati rice').\n- Do NOT add unrelated, extra, or generic products.\n- Use the available products list below to match and fulfill the user's request as best as possible.\n- For recipes or meal requests, infer the required products and quantities, but do not add unnecessary items. For direct product requests, add only those products and quantities.\n- Always match products using names, synonyms, and categories.\n- If a requested product is not available in the store, include it in the output as unavailable.\n- Output ONLY a valid JSON object with:\n  - dish (string, if applicable, else null or empty)\n  - servings (integer, if applicable, else 1)\n  - ingredients: array of objects with: name, quantity, category, inStock (true/false)\n- Do NOT include any extra text, explanation, or formatting.\n- Example output: {\"dish\":null,\"servings\":1,\"ingredients\":[{\"name\":\"Basmati rice\",\"quantity\":1,\"category\":\"grains\",\"inStock\":true}]}\n\nUser request: \"${message}\"\nAvailable products: ${JSON.stringify(productList)}\n`;

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
    function normalize(str) {
      return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/s$/, '');
    }
    aiResult.ingredients = aiResult.ingredients.map(ing => {
      const ingName = ing.matchedProduct || ing.name || ing.requiredIngredient;
      // Try exact match, then normalized match, then partial match
      let prod = products.find(p => p.name.toLowerCase() === (ingName || '').toLowerCase());
      if (!prod) {
        prod = products.find(p => normalize(p.name) === normalize(ingName));
      }
      if (!prod) {
        prod = products.find(p => normalize(ingName).includes(normalize(p.name)) || normalize(p.name).includes(normalize(ingName)));
      }
      // Ensure quantity is a discrete integer >= 1
      let quantity = Number(ing.quantity);
      if (isNaN(quantity) || quantity < 1) quantity = 1;
      quantity = Math.ceil(quantity);
      return {
        name: prod ? prod.name : (ingName || ''),
        quantity: quantity,
        category: prod ? prod.category : (ing.category || ''),
        inStock: !!(prod && prod.inStock),
        productId: prod ? prod._id : null,
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
          const newQty = prev + add;
          cartItems[ing.productId] = newQty > 0 ? newQty : 0;
        } else {
          cartItems[ing.productId] = Number(ing.quantity) > 0 ? ing.quantity : 0;
        }
      } else {
        unavailableItems.push(ing.name);
      }
    });
    // Remove products with 0 or less quantity from cart
    Object.keys(cartItems).forEach(pid => {
      if (Number(cartItems[pid]) <= 0) {
        delete cartItems[pid];
      }
    });
    await User.findByIdAndUpdate(userId, { cartItems });

    // Build response message
    let responseText = `Products required for you have been added to cart. Please review them and proceed to checkout.\n`;
    if (aiResult.dish && aiResult.dish !== 'null' && aiResult.dish !== null && aiResult.dish !== '') {
      responseText += `Here is your shopping list for \"${aiResult.dish}\" (serves ${aiResult.servings}):\n`;
    } else {
      responseText += `Here is your shopping list as per your request:\n`;
    }
    responseText += aiResult.ingredients.filter(ing => ing.inStock).map(ing =>
      `- ${ing.name} (${ing.quantity}${ing.unit ? ' ' + ing.unit : ''})`
    ).join('\n');
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
