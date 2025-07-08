import User from "../models/User.js"

// Helper function to update user cart programmatically
export const updateUserCart = async (userId, cartItems) => {
    try {
        await User.findByIdAndUpdate(userId, { cartItems });
        return { success: true, message: "Cart Updated" };
    } catch (error) {
        console.log(error.message);
        return { success: false, message: error.message };
    }
};

// Update User CartData : /api/cart/update
export const updateCart = async (req, res)=>{
    try {
        const { userId, cartItems } = req.body     
        const result = await updateUserCart(userId, cartItems);
        res.json(result);
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}