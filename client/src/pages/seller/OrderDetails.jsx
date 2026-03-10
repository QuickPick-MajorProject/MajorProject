import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const STATUSES = [
    'Order Placed',
    'Order Packed',
    'Out for Delivery',
    'Delivered'
]

const OrderDetails = () => {
    const { id } = useParams()
    const { axios, currency } = useAppContext()
    const [order, setOrder] = useState(null)
    const [updating, setUpdating] = useState(false)

    const fetchOrder = async ()=>{
        try {
            const { data } = await axios.get(`/api/order/${id}`)
            if(data.success){
                setOrder(data.order)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleUpdate = async (newStatus)=>{
        try {
            setUpdating(true)
            const { data } = await axios.patch(`/api/order/${id}/status`, { status: newStatus })
            if(data.success){
                setOrder(data.order)
                toast.success('Status updated')
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setUpdating(false)
        }
    }

    useEffect(()=>{ fetchOrder() }, [id])

    const totalItems = useMemo(()=>{
        if(!order) return 0
        return order.items.reduce((sum, i)=> sum + i.quantity, 0)
    }, [order])

    if(!order){
        return <div className='no-scrollbar flex-1 h-[95vh] overflow-y-scroll'><div className='md:p-10 p-4'>Loading order...</div></div>
    }

    return (
        <div className='no-scrollbar flex-1 h-[95vh] overflow-y-scroll'>
            <div className='md:p-10 p-4 space-y-6 max-w-5xl'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-xl font-semibold'>Order #{order._id}</h2>
                    <div className='text-right'>
                        <p className='text-sm text-black/60'>Placed on {new Date(order.createdAt).toLocaleString()}</p>
                        <p className='text-sm text-black/60'>Payment: {order.isPaid ? 'Paid' : 'Pending'} ({order.paymentType})</p>
                    </div>
                </div>

                <div className='grid md:grid-cols-3 gap-6'>
                    <div className='md:col-span-2 border border-gray-300 rounded-md'>
                        <div className='border-b border-gray-300 p-4'>
                            <p className='font-medium'>Items ({totalItems})</p>
                        </div>
                        <div className='divide-y divide-gray-200'>
                            {order.items.map((item, idx)=> (
                                <div key={idx} className='p-4 flex items-center justify-between gap-4'>
                                    <div className='flex items-center gap-4'>
                                        <img src={item.product.image?.[0]} alt={item.product.name} className='w-14 h-14 object-cover rounded' />
                                        <div>
                                            <p className='font-medium'>{item.product.name}</p>
                                            <p className='text-sm text-black/60'>Category: {item.product.category}</p>
                                            <p className='text-sm text-black/60'>Quantity: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <div className='text-right font-medium'>
                                        {currency}{item.product.offerPrice * item.quantity}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className='border-t border-gray-300 p-4 flex items-center justify-end gap-8'>
                            <div>
                                <p className='text-black/60 text-sm'>Subtotal + tax</p>
                                <p className='text-lg font-semibold'>{currency}{order.amount}</p>
                            </div>
                        </div>
                    </div>

                    <div className='space-y-6'>
                        <div className='border border-gray-300 rounded-md p-4'>
                            <p className='font-medium mb-2'>Delivery Address</p>
                            <p>{order.address.firstName} {order.address.lastName}</p>
                            <p>{order.address.street}</p>
                            <p>{order.address.city}, {order.address.state} {order.address.zipcode}</p>
                            <p>{order.address.country}</p>
                            <p className='text-black/60 mt-1'>Phone: {order.address.phone}</p>
                        </div>

                        <div className='border border-gray-300 rounded-md p-4'>
                            <p className='font-medium mb-3'>Status</p>
                            <div className='flex flex-wrap gap-2'>
                                {STATUSES.map((s)=> (
                                    <button
                                        key={s}
                                        disabled={updating}
                                        onClick={()=>handleUpdate(s)}
                                        className={`px-3 py-1.5 rounded border text-sm transition-colors ${s === order.status ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <p className='text-sm text-black/60 mt-2'>Current: <span className='font-medium text-gray-800'>{order.status}</span></p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default OrderDetails 