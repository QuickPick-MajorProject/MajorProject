import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
  quantity: { type: String, required: true }, // String to allow '1 dozen', '2kg', etc.
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  items: { type: [cartItemSchema], default: [] },
}, { timestamps: true });

const Cart = mongoose.models.cart || mongoose.model('cart', cartSchema);
export default Cart; 