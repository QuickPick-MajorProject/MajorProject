import React from 'react'
import { assets } from '../assets/assets'

const contact = () => {
  return (
    <div className='mt-10 flex flex-col items-center w-full'>
      <p className='text-4xl font-medium uppercase'>Get in touch!!</p>
      <div className='w-16 h-0.5 bg-primary rounded-full mb-10'></div>
      <div className='flex flex-col gap-4 w-full'>
        <div className='flex gap-5 items-center'>
          <div className='flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-md'>
            <img src={assets.call_icon} className='w-8 h-8' alt="Call Icon"/>
          </div>
          <h3 className='text-lg md:text-xl font-semibold text-gray-800'>9938288572</h3>
        </div>
        <div className='flex gap-5 items-center'>
          <div className='flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-md'>
            <img src={assets.location_icon} className='w-8 h-8' alt="Location Icon"/>
          </div>
          <h3 className='text-lg md:text-xl font-semibold text-gray-800'>
            Manikonda Hyderabad,<br/>Telangana , Pin - 500089
          </h3>
        </div>
        <div className='flex gap-5 items-center'>
          <div className='flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-md'>
            <img src={assets.mail_icon} className='w-8 h-8' alt="Mail Icon"/>
          </div>
          <h3 className='text-lg md:text-xl font-semibold text-gray-800'>support@quickpick.ac.in</h3>
        </div>
        <div className='flex gap-5 items-center'>
          <div className='flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-md'>
            <img src={assets.insta_icon} className='w-8 h-8' alt="Instagram Icon"/>
          </div>
          <h3 className='text-lg md:text-xl font-semibold text-gray-800'>quickpickoninsta</h3>
        </div>
        <div className='flex gap-5 items-center'>
          <div className='flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-md'>
            <img src={assets.x_icon} className='w-8 h-8' alt="X Icon"/>
          </div>
          <h3 className='text-lg md:text-xl font-semibold text-gray-800'>quickpicktweets</h3>
        </div>
      </div>
    </div>
  )
}

export default contact