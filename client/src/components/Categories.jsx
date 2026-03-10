import React from 'react'
import { categories } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const Categories = () => {
    const {navigate} = useAppContext()

  return (
    <div className='mt-16'>
      <p className='text-2xl md:text-3xl font-medium'>Categories</p>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 mt-6 gap-6'>
        {categories.map((category, index)=>(
            <div
              key={index}
              className='group cursor-pointer py-6 px-3 rounded-lg flex flex-col items-center justify-center transition-all min-h-[200px] h-full'
              style={{backgroundColor: category.bgColor}}
              onClick={()=>{
                  navigate(`/products/${category.path.toLowerCase()}`);
                  scrollTo(0,0)
              }}
            >
              <div className="flex items-center justify-center w-32 h-32 mb-3">
                <img
                  src={category.image}
                  alt={category.text}
                  className='object-contain max-h-28 max-w-28 transition group-hover:scale-105'
                  style={{ display: 'block', margin: '0 auto' }}
                />
              </div>
              <p className='text-base font-semibold text-center text-gray-900'>{category.text}</p>
            </div>
        ))}
      </div>
    </div>
  )
}

export default Categories
