// const express = require('express');
// const axios = require('axios');
// const { default: mongoose } = require('mongoose');

// const app = express();
// const PORT = 3000;

// const GOOGLE_API_KEY = 'AIzaSyASiWN1hMgJIheIilG-uZrkbUTuB2af4V8'; 

// const prompt = `
// You are a grocery assistant that converts cooking requests into a structured JSON shopping list, formatted for real-world grocery stores.

// The goal is to generate accurate and store-ready quantities. Consider how groceries are sold in actual stores. Avoid arbitrary or kitchen-specific units like “cups” or “tablespoons”.

// ### Output Format:
// Return a JSON object with:
// - dish (string)
// - servings (integer)
// - ingredients (array of objects with: name, quantity, category, inStock [boolean, true if available in store, false if not])

// ### Important:
// - You may use synonyms or common names for products (e.g., "kajus" for "cashew nuts").
// - For vegetables, always list each vegetable individually (never use group names like "mixed vegetables").
// - Do not include a 'unit' field in the output.
// - If a product is not available in the store, set inStock to false.

// ### Quantity Logic Rules:
// 1. For grains and dals, use: 0.5kg, 1kg, 1.5kg, etc.
// 2. For oils and liquids, use: 250ml, 500ml, 1L
// 3. For nuts & dry fruits, use: 50g, 100g, 200g
// 4. For vegetables, use number of pieces (e.g., 2 onions) or weight (e.g., 500g carrots)
// 5. For spices and masalas, use: 1 packet, 2 packets
// 6. Always round up to nearest reasonable grocery unit (no "37g of rice")
// 7. Only respond with valid JSON. Do not include comments or explanations.

// ### Example Input:
// "I want to cook veg dum biryani for 4 people"

// ### Example Output:
// {
//   "dish": "Veg Dum Biryani",
//   "servings": 4,
//   "ingredients": [
//     { "name": "Basmati rice", "quantity": 1, "category": "grains", "inStock": true },
//     { "name": "Onion", "quantity": 3, "category": "vegetables", "inStock": true },
//     { "name": "Carrot", "quantity": 2, "category": "vegetables", "inStock": true },
//     { "name": "Cooking oil", "quantity": 1, "category": "liquids", "inStock": true },
//     { "name": "Garam masala", "quantity": 1, "category": "spices", "inStock": false },
//     { "name": "Kajus", "quantity": 1, "category": "dry fruits", "inStock": true }
//   ]
// }

// Now process this input:
// "I want to make veg dum biriyani curry for 3 people"
// `;

// app.get('/test-ai', async (req, res) => {
//   try {
//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
//       {
//         contents: [
//           {
//             role: 'user',
//             parts: [{ text: prompt }]
//           }
//         ],
//         generationConfig: {
//           responseMimeType: "application/json",
//           responseSchema: {
//             type: "OBJECT",
//             properties: {
//               dish: { type: "STRING" },
//               servings: { type: "NUMBER" },
//               ingredients: {
//                 type: "ARRAY",
//                 items: {
//                   type: "OBJECT",
//                   properties: {
//                     name: { type: "STRING" },
//                     quantity: { type: "NUMBER" },
//                     category: { type: "STRING" },
//                     inStock: { type: "BOOLEAN" },
//                   },
//                   propertyOrdering: ["name", "quantity", "category", "inStock"],
//                 },
//               },
//             },
//             propertyOrdering: ["dish", "servings", "ingredients"],
//           },
//         }
//       }
//     );

//     const jsonResponseText = response.data.candidates[0].content.parts[0].text;
//     const aiResult = JSON.parse(jsonResponseText);

//     // Overwrite inStock and quantity for each ingredient based on MongoDB products (flexible match)
//     const products = await require('./product_model').default.find({});
//     aiResult.ingredients = aiResult.ingredients.map(ing => {
//       const prod = products.find(p => {
//         const prodName = p.name.toLowerCase();
//         const ingName = ing.name.toLowerCase();
//         return prodName === ingName || prodName.includes(ingName) || ingName.includes(prodName);
//       });
//       // If a generic match, use the specific product name from DB
//       const nameToUse = prod ? prod.name : ing.name;
//       return {
//         name: nameToUse,
//         quantity: prod && Array.isArray(prod.description) ? prod.description.length || 1 : 1, // always integer
//         category: ing.category,
//         inStock: !!(prod && prod.inStock)
//       };
//     });
//     res.json(aiResult);

//   } catch (err) {
//     console.error('Gemini API error:', err.response?.data || err.message);
//     res.status(500).json({ error: 'Gemini API request failed' });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
//   mongoose.connect("mongodb+srv://saidhruvaa9:11032005@quickpick-cluster.meofzxg.mongodb.net/?retryWrites=true&w=majority&appName=quickpick-cluster")
//   .then(()=>console.log("Database Connected"))
//   .catch((err)=>console.log(err))
// });

const express = require('express');
const axios = require('axios');
const { default: mongoose } = require('mongoose');
const { processChatAndAddToCart } = require('./server/controllers/chatController.js');

const app = express();
const PORT = 4000;

const GOOGLE_API_KEY = 'AIzaSyASiWN1hMgJIheIilG-uZrkbUTuB2af4V8'; 

// Middleware
app.use(express.json());

// Validation middleware
const validateRecipeRequest = (req, res, next) => {
  const { recipeDescription, servings } = req.body;
  
  if (!recipeDescription || recipeDescription.trim().length < 5) {
    return res.status(400).json({ error: 'Recipe description is required (minimum 5 characters)' });
  }
  
  if (!servings || servings < 1 || servings > 20) {
    return res.status(400).json({ error: 'Servings must be between 1 and 20' });
  }
  
  next();
};

// Main recipe generation endpoint
app.post('/api/recipes/generate-shopping-list', async (req, res) => {
  try {
    // Hardcoded input for now
    const recipeDescription = "chicken biryani with cashews and almonds";
    const servings = 4;
    
    console.log('Recipe request received:', { recipeDescription, servings });
    
    // Step 1: Get all products from database
    const products = await require('./product_model').default.find({});
    console.log(`Found ${products.length} products in database`);
    
    // Step 2: Create AI prompt with product context
    const productList = products.map(p => ({
      name: p.name,
      description: p.description,
      category: p.category || 'general',
      inStock: p.inStock
    }));
    
    const prompt = `
You are an intelligent grocery assistant that generates a shopping list for a given recipe.

TASK: Generate a shopping list for "${recipeDescription}" for ${servings} people.

INSTRUCTIONS:
1. Determine ALL ingredients needed for the recipe (do not include extra or unrelated items).
2. For each required ingredient, check if it is available in the store by matching with the provided product list below.
3. If a match is found, set inStock to true; if not, set inStock to false.
4. Use semantic matching for synonyms (e.g., "cashews" = "kajus" = "badams").
5. For vegetables, match singular/plural forms (e.g., "onion" = "onions").
6. For spices, match powder/whole forms (e.g., "turmeric" = "turmeric powder").
7. Use product descriptions for better understanding if needed.
8. For each ingredient, provide the required quantity and a realistic grocery unit (see rules below).
9. Only include ingredients needed for the recipe, not all store products.
10. For unavailable items, still add them to the list but mark inStock as false.

AVAILABLE PRODUCTS IN STORE:
${JSON.stringify(productList, null, 2)}

QUANTITY RULES:
- For grains/rice: 0.5kg, 1kg, 1.5kg (based on servings)
- For vegetables: count pieces (2 onions, 3 tomatoes) or weight (500g carrots)
- For liquids: 250ml, 500ml, 1L
- For spices: 1 packet, 2 packets
- For nuts/dry fruits: 50g, 100g, 200g
- Always use realistic grocery quantities

OUTPUT FORMAT:
Return only valid JSON with this structure:
{
  "dish": "name of the dish",
  "servings": ${servings},
  "ingredients": [
    {
      "requiredIngredient": "what recipe needs",
      "matchedProduct": "actual product name from store OR required ingredient name if not found",
      "quantity": number,
      "unit": "kg/pieces/packets/ml/g",
      "category": "product category",
      "inStock": true/false,
      "matchConfidence": "high/medium/low",
      "productId": "store product id if matched, null if not found"
    }
  ]
}

IMPORTANT:
- Only respond with valid JSON
- No explanations or comments
- Only include ingredients needed for the recipe
- Set inStock to true only if product exists in store, false otherwise
- Include productId only for matched items, null for unavailable items
- Include ALL ingredients needed for the recipe, regardless of availability
`;

    // Step 3: Call Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              dish: { type: "STRING" },
              servings: { type: "NUMBER" },
              ingredients: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    requiredIngredient: { type: "STRING" },
                    matchedProduct: { type: "STRING" },
                    quantity: { type: "NUMBER" },
                    unit: { type: "STRING" },
                    category: { type: "STRING" },
                    inStock: { type: "BOOLEAN" },
                    matchConfidence: { type: "STRING" },
                    productId: { type: "STRING" }
                  },
                  propertyOrdering: ["requiredIngredient", "matchedProduct", "quantity", "unit", "category", "inStock", "matchConfidence", "productId"]
                }
              }
            },
            propertyOrdering: ["dish", "servings", "ingredients"]
          }
        }
      }
    );

    const jsonResponseText = response.data.candidates[0].content.parts[0].text;
    let aiResult = JSON.parse(jsonResponseText);

    // Step 4: Post-process and validate AI matches
    aiResult.ingredients = aiResult.ingredients.map(ing => {
      // Find the actual product in database
      const matchedProduct = products.find(p => 
        p.name.toLowerCase() === ing.matchedProduct.toLowerCase() ||
        (ing.productId && p._id.toString() === ing.productId)
      );

      if (matchedProduct) {
        // Product found in database
        return {
          ...ing,
          matchedProduct: matchedProduct.name,
          productId: matchedProduct._id.toString(),
          inStock: matchedProduct.inStock,
          price: matchedProduct.price || null,
          category: matchedProduct.category || ing.category
        };
      } else {
        // Product not found in database - keep required ingredient but mark as unavailable
        return {
          ...ing,
          matchedProduct: ing.requiredIngredient,
          productId: null,
          inStock: false,
          matchConfidence: 'low'
        };
      }
    });

    // Step 5: Add summary statistics
    const summary = {
      totalItems: aiResult.ingredients.length,
      availableItems: aiResult.ingredients.filter(ing => ing.inStock).length,
      unavailableItems: aiResult.ingredients.filter(ing => !ing.inStock).length,
      highConfidenceMatches: aiResult.ingredients.filter(ing => ing.matchConfidence === 'high').length
    };

    console.log('Generated shopping list:', aiResult);
    console.log('Summary:', summary);

    res.json({
      success: true,
      data: aiResult,
      summary: summary,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Recipe generation error:', {
      error: err.message,
      stack: err.stack,
      requestBody: req.body
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate shopping list',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Additional endpoint to get available products (for frontend reference)
app.get('/api/products/available', async (req, res) => {
  try {
    const products = await require('./product_model').default.find({ inStock: true });
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// New chat endpoint to process chat input and add products to cart
app.post('/api/chat/process', processChatAndAddToCart);

// Test endpoint (enhanced version of your original)
app.get('/test-ai-enhanced', async (req, res) => {
  try {
    const products = await require('./product_model').default.find({});
    
    res.json({
      success: true,
      message: 'Test endpoint - shows available products',
      availableProducts: products.map(p => ({
        name: p.name,
        description: p.description,
        inStock: p.inStock,
        category: p.category
      })),
      count: products.length
    });

  } catch (err) {
    console.error('Test error:', err);
    res.status(500).json({ error: 'Test failed' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  mongoose.connect("mongodb+srv://saidhruvaa9:11032005@quickpick-cluster.meofzxg.mongodb.net/?retryWrites=true&w=majority&appName=quickpick-cluster")
    .then(() => console.log("Database Connected"))
    .catch((err) => console.log("Database connection error:", err));
});