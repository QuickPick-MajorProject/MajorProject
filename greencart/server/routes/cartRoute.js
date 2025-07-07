import express from "express"
import authUser from "../middlewares/authUser.js";
import { updateCart } from "../controllers/cartController.js";
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const cartRouter = express.Router();

cartRouter.post('/update', authUser, updateCart)

// GET /api/cart/:userId - Return user's cart with product details
cartRouter.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId }).lean();
    if (!cart || !cart.items.length) return res.json({ cart: [] });
    // Populate product details
    const productIds = cart.items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));
    const cartWithDetails = cart.items.map(i => ({
      product: productMap[i.productId.toString()] || null,
      quantity: i.quantity
    }));
    res.json({ cart: cartWithDetails });
  } catch (err) {
    console.error(err);
    res.status(500).json({ cart: [], error: 'Failed to fetch cart.' });
  }
});

export default cartRouter;