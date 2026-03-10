import React from 'react'
import { assets } from '../assets/assets'

const contact = () => {
  return (
    <div className='mt-10 flex flex-col items-center w-full'>
      <p className='text-4xl font-medium uppercase'>Get in touch!!</p>
      <div className='w-16 h-0.5 bg-primary rounded-full mb-10'></div>
      <div className='flex flex-col md:flex-row gap-10 w-full'>
        {/* Contact Info */}
        <div className='flex flex-col gap-4 md:w-1/2'>
          <a href="tel:9938288572" className='flex gap-5 items-center cursor-pointer hover:opacity-75 transition-opacity'>
            <div className='flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-md'>
              <img src={assets.call_icon} className='w-8 h-8' alt="Call Icon" />
            </div>
            <h3 className='text-lg md:text-xl font-semibold text-gray-800 hover:underline'>9938288572</h3>
          </a>
          <a href="https://maps.app.goo.gl/dFR1sagSYfQmAQEP8" target="_blank" rel="noopener noreferrer" className='flex gap-5 items-center cursor-pointer hover:opacity-75 transition-opacity'>
            <div className='flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-md'>
              <img src={assets.location_icon} className='w-8 h-8' alt="Location Icon" />
            </div>
            <h3 className='text-lg md:text-xl font-semibold text-gray-800 hover:underline'>
              Manikonda Hyderabad,<br />Telangana , Pin - 500089
            </h3>
          </a>
          <a href="mailto:support@quickpick.ac.in" className='flex gap-5 items-center cursor-pointer hover:opacity-75 transition-opacity'>
            <div className='flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-md'>
              <img src={assets.mail_icon} className='w-8 h-8' alt="Mail Icon" />
            </div>
            <h3 className='text-lg md:text-xl font-semibold text-gray-800 hover:underline'>support@quickpick.ac.in</h3>
          </a>
          <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className='flex gap-5 items-center cursor-pointer hover:opacity-75 transition-opacity'>
            <div className='flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-md'>
              <img src={assets.insta_icon} className='w-8 h-8' alt="Instagram Icon" />
            </div>
            <h3 className='text-lg md:text-xl font-semibold text-gray-800 hover:underline'>quickpickoninsta</h3>
          </a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" className='flex gap-5 items-center cursor-pointer hover:opacity-75 transition-opacity'>
            <div className='flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-md'>
              <img src={assets.x_icon} className='w-8 h-8' alt="X Icon" />
            </div>
            <h3 className='text-lg md:text-xl font-semibold text-gray-800 hover:underline'>quickpicktweets</h3>
          </a>
        </div>

        {/* Google Map */}
        <div className='md:w-1/2 w-full'>
          <a
            href="https://maps.app.goo.gl/dFR1sagSYfQmAQEP8"
            target="_blank"
            rel="noopener noreferrer"
            title="Click to open in Google Maps"
          >
            <iframe
              title="Our Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30456.905982888!2d78.3655!3d17.3950!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9512e382d1db%3A0x6a2c4c8b8e6f7a89!2sManikonda%2C%20Hyderabad%2C%20Telangana%20500089!5e0!3m2!1sen!2sin!4v1700000000000"
              width="100%"
              height="300"
              style={{ border: 0, borderRadius: '12px', pointerEvents: 'none' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </a>
          <p className='text-sm text-gray-500 mt-2 text-center'>📍 Click on the map to open in Google Maps</p>
        </div>
      </div>
    </div>
  )
}

export default contact