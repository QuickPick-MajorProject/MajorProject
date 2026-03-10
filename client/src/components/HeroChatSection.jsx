import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.jsx';

// Flat-style AI robot with grocery basket illustration from undraw.co
const AI_GROCERY_IMAGE =
  'https://undraw.co/api/illustrations/undraw_robot_grocery_basket_re_5n6p.svg';

const MOTIVATIONAL_QUOTE =
  'Smart Shopping, Fast Ordering — QuickPick has you covered.';

const HeroChatSection = () => {
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: 'Hi! I am your grocery assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const chatEndRef = useRef(null);

  const { user, setCartItems } = useAppContext();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post('/api/chat', {
        userId: user?._id || 'demo-user',
        message: input
      });
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: res.data.reply }
      ]);
      if (res.data.cartUpdated) {
        const cartRes = await axios.get(`/api/cart/${user?._id || 'demo-user'}`);
        const cartItems = {};
        (cartRes.data.cart || []).forEach(item => {
          if (item.product && item.product._id) {
            cartItems[item.product._id] = Number(item.quantity);
          }
        });
        setCartItems(cartItems);
      }
    } catch (err) {
      let errorMsg = '❌ There was an error. Please try again.';
      if (err.response && err.response.data && err.response.data.reply) {
        errorMsg = err.response.data.reply;
      }
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: errorMsg }
      ]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="w-full flex flex-col md:flex-row items-center justify-center min-h-[420px] py-8 px-2 md:px-8 bg-gradient-to-br from-green-50 to-white">
      {/* Left: Illustration + Quote */}
      <div className="flex flex-col items-center justify-center flex-1 mb-8 md:mb-0 md:mr-8">
        <img
          src={AI_GROCERY_IMAGE}
          alt="AI robot with grocery basket"
          className="w-48 h-48 md:w-64 md:h-64 object-contain rounded-2xl shadow-lg mb-4 bg-white"
          loading="lazy"
        />
        <p className="font-[Inter] text-[1.25rem] md:text-[1.5rem] text-green-800 font-medium text-center max-w-xs tracking-wide leading-snug" style={{ fontFamily: 'Inter, Poppins, Open Sans, sans-serif' }}>
          {MOTIVATIONAL_QUOTE}
        </p>
      </div>

      {/* Right: Chat Widget */}
      <div className="fixed md:static bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Toggle Button (mobile/desktop) */}
        <button
          className="md:hidden mb-2 bg-green-600 text-white rounded-full shadow-lg p-3 focus:outline-none"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close chat' : 'Open chat'}
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 14h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
            </svg>
          )}
        </button>
        {/* Chat Box */}
        <div
          className={`
            ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}
            transition-all duration-300
            w-[95vw] max-w-[380px] min-h-[420px] bg-white/90 rounded-3xl shadow-2xl flex flex-col
            border border-green-100
            md:static md:w-[360px] md:max-w-[400px] md:mr-0
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-green-100 bg-gradient-to-r from-green-100 to-green-50 rounded-t-3xl">
            <span className="font-bold text-green-700 text-lg">QuickPick Chat</span>
            <button
              className="hidden md:block text-green-600 hover:text-green-800"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white/80" style={{ scrollbarWidth: 'thin' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[75%] px-4 py-2 rounded-2xl text-base shadow-sm
                  ${msg.sender === 'user'
                    ? 'bg-green-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none border border-green-100'}
                `}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          {/* Input */}
          <div className="p-4 bg-white flex items-center gap-2 border-t border-green-100 rounded-b-3xl">
            <input
              type="text"
              className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{ fontFamily: 'Inter, Poppins, Open Sans, sans-serif' }}
            />
            <button
              onClick={handleSend}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full font-semibold disabled:opacity-50"
              disabled={loading || !input.trim()}
              style={{ fontFamily: 'Inter, Poppins, Open Sans, sans-serif' }}
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroChatSection; 