import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'

const MyOrders = () => {

    const [myOrders, setMyOrders] = useState([])
    const [expandedOrders, setExpandedOrders] = useState(new Set())
    const {currency, axios, user} = useAppContext()

    const fetchMyOrders = async ()=>{
        try {
            const { data } = await axios.get('/api/order/user')
            if(data.success){
                setMyOrders(data.orders)
            }
        } catch (error) {
            console.log(error);
        }
    }

    const toggleOrder = (orderId) => {
        setExpandedOrders(prev => {
            const next = new Set(prev)
            if (next.has(orderId)) {
                next.delete(orderId)
            } else {
                next.add(orderId)
            }
            return next
        })
    }

    useEffect(()=>{
        if(user){
            fetchMyOrders()
        }
    },[user])

  return (
    <div className='mt-16 pb-16'>
        <div className='flex flex-col items-end w-max mb-8'>
            <p className='text-2xl font-medium uppercase'>My orders</p>
            <div className='w-16 h-0.5 bg-primary rounded-full'></div>
        </div>
        {myOrders.map((order, index)=>{
            const isExpanded = expandedOrders.has(order._id)
            return (
            <div key={order._id} className='border border-gray-300 rounded-lg mb-6 max-w-4xl overflow-hidden'>
                {/* Order Summary Header - Always visible, clickable */}
                <div
                    onClick={() => toggleOrder(order._id)}
                    className='flex flex-col md:flex-row md:items-center justify-between p-4 py-5 cursor-pointer hover:bg-gray-50 transition-colors duration-200 select-none'
                >
                    <div className='flex flex-col md:flex-row md:items-center gap-3 md:gap-6 flex-1'>
                        <div className='flex items-center gap-2'>
                            <span className='text-xs font-medium text-gray-400 uppercase tracking-wide'>Order</span>
                            <span className='text-sm font-semibold text-gray-700'>#{order._id.slice(-8)}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <span className={`inline-block w-2 h-2 rounded-full ${
                                order.status === 'Delivered' ? 'bg-green-500' :
                                order.status === 'Out for Delivery' ? 'bg-blue-500' :
                                order.status === 'Order Packed' ? 'bg-yellow-500' :
                                'bg-gray-400'
                            }`}></span>
                            <span className='text-sm text-gray-600'>{order.status}</span>
                        </div>
                        <span className='text-sm text-gray-500'>{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        <span className='text-sm text-gray-500'>{order.paymentType}</span>
                        <span className='text-xs text-gray-400'>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className='flex items-center gap-4 mt-3 md:mt-0'>
                        <span className='text-primary text-lg font-semibold'>{currency}{order.amount}</span>
                        <svg
                            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                            fill='none' stroke='currentColor' viewBox='0 0 24 24'
                        >
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                        </svg>
                    </div>
                </div>

                {/* Expandable product details */}
                <div
                    className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                    style={{ overflow: 'hidden' }}
                >
                    <div className='border-t border-gray-200 px-4 pb-4'>
                        {order.items.map((item, idx)=>(
                            <div key={idx}
                            className={`bg-white text-gray-500/70 ${
                                order.items.length !== idx + 1 ? "border-b" : ""
                            } border-gray-200 flex flex-col md:flex-row md:items-center justify-between p-4 py-5 md:gap-16 w-full`}>

                              <div className='flex items-center mb-4 md:mb-0'>
                                <div className='bg-primary/10 p-4 rounded-lg'>
                                 <img src={item.product.image[0]} alt="" className='w-16 h-16 object-cover' />
                                 </div>
                                 <div className='ml-4'>
                                    <h2 className='text-xl font-medium text-gray-800'>{item.product.name}</h2>
                                    <p>Category: {item.product.category}</p>
                                 </div>
                               </div>

                            <div className='flex flex-col justify-center md:ml-8 mb-4 md:mb-0'>
                                <p>Quantity: {item.quantity || "1"}</p>
                                <p>Status: {order.status}</p>
                                <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <p className='text-primary text-lg font-medium'>
                                Amount: {currency}{item.product.offerPrice * item.quantity}
                            </p>
                                
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )})}
      
    </div>
  )
}

export default MyOrders
