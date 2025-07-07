import axios from 'axios';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';

// Helper: Call Ollama and extract items robustly, with logging
async function extractItemsWithOllama(message) {
  const ollamaPrompt = `Extract products and quantities from this input: '${message}'. Output strict JSON like: [{ "name": "apples", "quantity": "1kg" }]. Return only raw JSON. No explanation.`;
  let ollamaRes, text, match, parsed;
  try {
    ollamaRes = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3',
      prompt: ollamaPrompt,
      stream: false
    });
    text = ollamaRes.data.response || ollamaRes.data;
    console.log('Ollama raw response:', text);
    match = text.match(/\[.*\]/s);
    if (!match) throw new Error('No JSON array found in Ollama output.');
    try {
      parsed = JSON.parse(match[0]);
      console.log('Parsed product list:', parsed);
    } catch (jsonErr) {
      console.error('Failed to parse JSON:', jsonErr.message);
      throw new Error('Could not understand the request.');
    }
    return parsed;
  } catch (err) {
    console.error('Ollama call or parse failed:', err);
    throw new Error('Could not process your request.');
  }
}

export const postChatMessage = async (req, res) => {
  try {
    const { userId, message } = req.body;
    console.log('User message:', message);
    if (!userId || !message) return res.status(400).json({ reply: 'Missing userId or message.', cartUpdated: false });

    // 1. Parse with Ollama (robust)
    let items;
    try {
      items = await extractItemsWithOllama(message);
    } catch (err) {
      return res.status(200).json({ reply: err.message, cartUpdated: false });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(404).json({ reply: 'No recognizable grocery items found in your message.', cartUpdated: false });
    }
    console.log('Parsed input:', items);

    // 2. Product lookup and cart update
    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });
    let added = [];
    let unavailable = [];
    for (const item of items) {
      let quantity = 1;
      if (item.quantity && !isNaN(Number(item.quantity))) {
        quantity = Number(item.quantity);
      }
      // Find product by name (case-insensitive, partial match)
      const product = await Product.findOne({ name: { $regex: item.name, $options: 'i' } });
      console.log('MongoDB product found:', product);
      if (product && product.inStock !== false && (product.stock === undefined || product.stock > 0)) {
        const idx = cart.items.findIndex(i => i.productId.toString() === product._id.toString());
        if (idx !== -1) {
          const prevQty = Number(cart.items[idx].quantity) || 0;
          cart.items[idx].quantity = String(prevQty + quantity);
        } else {
          cart.items.push({ productId: product._id, quantity: String(quantity) });
        }
        added.push(`${item.quantity || 1} ${product.name}`);
        console.log('Added to cart:', product.name);
      } else {
        unavailable.push(item.name);
      }
    }
    await cart.save();

    let reply = '';
    let cartUpdated = false;
    if (added.length > 0) {
      reply = `Added ${added.join(' and ')} to your cart.`;
      cartUpdated = true;
    }
    if (unavailable.length > 0) {
      reply += (reply ? ' ' : '') + unavailable.map(n => `${n} is not available`).join(' ');
    }
    if (!reply) reply = 'No matching products found to add to your cart.';

    if (cartUpdated) {
      return res.status(200).json({ reply, cartUpdated });
    } else {
      return res.status(404).json({ reply, cartUpdated });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ reply: 'Could not process your request.', cartUpdated: false });
  }
};

// Integration: Import this controller in chat.route.js and wire to POST /api/chat 