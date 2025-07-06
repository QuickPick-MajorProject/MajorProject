import React from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

const ProductCard = ({product}) => {
    const {currency, addToCart, removeFromCart, cartItems, navigate} = useAppContext()

    return product && (
        <div
            onClick={()=> {navigate(`/products/${product.category.toLowerCase()}/${product._id}`); scrollTo(0,0)}}
            className="border border-gray-500/20 rounded-md bg-white min-w-48 max-w-48 w-full flex flex-col items-center justify-between py-3 px-3 h-[255px]"
            style={{ boxSizing: 'border-box' }}
        >
            <div className="flex items-center justify-center w-full h-24 mb-2">
                <img className="object-contain h-full w-full group-hover:scale-105 transition" src={product.image[0]} alt={product.name} />
            </div>
            <div className="flex flex-col w-full flex-1 justify-between mt-0 items-center">
                <p className="text-gray-500/60 text-xs mb-1 text-center leading-tight">{product.category}</p>
                <p className="text-gray-700 font-medium text-base truncate w-full text-center mb-1 leading-tight">{product.name}</p>
                <div className="flex items-center gap-1 justify-center mb-1">
                    {Array(5).fill('').map((_, i) => (
                        <img key={i} className="w-3" src={i < 4 ? assets.star_icon : assets.star_dull_icon} alt=""/>
                    ))}
                    <p className="text-xs">(4)</p>
                </div>
                <div className="flex items-end justify-between mt-2 w-full">
                    <p className="text-base font-bold text-primary">
                        {currency}{product.offerPrice}{" "} <span className="text-gray-500/60 text-xs line-through">{currency}{product.price}</span>
                    </p>
                    <div onClick={(e) => { e.stopPropagation(); }} className="text-primary">
                        {!cartItems[product._id] ? (
                            <button className="flex items-center justify-center gap-1 bg-primary/10 border border-primary/40 w-[60px] h-[28px] rounded cursor-pointer text-xs font-medium" onClick={() => addToCart(product._id)} >
                                <img src={assets.cart_icon} alt="cart_icon" className="w-4 h-4"/>
                                Add
                            </button>
                        ) : (
                            <div className="flex items-center justify-center gap-2 w-16 h-[28px] bg-primary/25 rounded select-none">
                                <button onClick={() => {removeFromCart(product._id)}} className="cursor-pointer text-base px-2 h-full font-bold" >
                                    -
                                </button>
                                <span className="w-5 text-center text-xs font-semibold">{cartItems[product._id]}</span>
                                <button onClick={() => {addToCart(product._id)}} className="cursor-pointer text-base px-2 h-full font-bold" >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;