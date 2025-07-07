import React from 'react';
import HeroChatSection from '../components/ChatInterface';
import Categories from '../components/Categories';
import BestSeller from '../components/BestSeller';
import BottomBanner from '../components/BottomBanner';
import NewsLetter from '../components/NewsLetter';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4fdf4] py-8 px-2">
      <HeroChatSection />
      {/* Other homepage sections below */}
      <div className="w-full mt-12">
        <Categories />
        <BestSeller />
        <BottomBanner />
        <NewsLetter />
      </div>
    </div>
  );
};

export default Home;
