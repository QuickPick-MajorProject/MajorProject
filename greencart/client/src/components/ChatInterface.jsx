import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.jsx';
import robotBanner from '../assets/robot-quickpick.jpg';

const CHAT_ICON = (
  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-green-600">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 14h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
  </svg>
);

const BOT_AVATAR = (
  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold text-lg">Q</span>
);
const USER_AVATAR = (
  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-500 font-bold text-lg">U</span>
);

const FloatingChatbot = () => {
  const { user, setCartItems } = useAppContext();
  const userId = user?._id || 'guest';
  const [userMessages, setUserMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const chatEndRef = useRef(null);

  // Fetch chat history for this user on mount or when user changes
  useEffect(() => {
    if (!userId || userId === 'guest') {
      setUserMessages([
        { sender: 'assistant', text: 'Hi! I am your grocery assistant. How can I help you today?' }
      ]);
      return;
    }
    axios.get(`/api/chat/${userId}`)
      .then(res => {
        if (res.data && res.data.messages && res.data.messages.length > 0) {
          setUserMessages(res.data.messages);
        } else {
          setUserMessages([
            { sender: 'assistant', text: 'Hi! I am your grocery assistant. How can I help you today?' }
          ]);
        }
      })
      .catch(() => {
        setUserMessages([
          { sender: 'assistant', text: 'Hi! I am your grocery assistant. How can I help you today?' }
        ]);
      });
  }, [userId]);

  useEffect(() => {
    if (open) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [userMessages, open]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...userMessages, { sender: 'user', text: input }];
    setUserMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post('/api/chat', {
        userId,
        message: input
      });
      setUserMessages([...newMessages, { sender: 'assistant', text: res.data.reply }]);
      // Optionally update cart if needed
      if (res.data.cartUpdated) {
        const cartRes = await axios.get(`/api/cart/${userId}`);
        const cartItems = {};
        (cartRes.data.cart || []).forEach(item => {
          if (item.product && item.product._id) {
            cartItems[item.product._id] = Number(item.quantity);
          }
        });
        setCartItems(cartItems);
      }
    } catch (err) {
      setUserMessages([...userMessages, { sender: 'assistant', text: '❌ Sorry, something went wrong. Please try again.' }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Animation classes for chat open/close
  const chatBoxClass = `
    fixed z-50 bottom-6 right-6 md:bottom-6 md:right-6
    w-[95vw] max-w-[360px] h-[500px]
    bg-white rounded-3xl shadow-2xl border border-green-100 flex flex-col
    transition-all duration-300
    ${open ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-90 opacity-0 pointer-events-none'}
    md:w-[360px]
    ${open ? 'chatbox-open' : 'chatbox-closed'}
  `;

  // Mobile full width
  const mobileChatBoxClass = `
    fixed z-50 bottom-0 left-0 right-0 w-full h-[100dvh] max-h-[100dvh] md:hidden
    bg-white rounded-t-3xl shadow-2xl border-t border-green-100 flex flex-col
    transition-all duration-300
    ${open ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-90 opacity-0 pointer-events-none'}
    chatbox-mobile
  `;

  // Floating button
  const floatingBtnClass = `
    fixed z-50 bottom-6 right-6 md:bottom-6 md:right-6
    w-16 h-16 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-xl flex items-center justify-center text-3xl cursor-pointer
    transition-transform duration-200 active:scale-90
    ${open ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100 pointer-events-auto'}
  `;

  // Message animation
  const getMessageClass = (sender) =>
    `message flex items-end gap-2 mb-2 ${sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeSlide`;

  return (
    <>
      {/* Floating Chat Icon */}
      <button
        className={floatingBtnClass}
        aria-label="Open chat"
        onClick={() => setOpen(true)}
      >
        {CHAT_ICON}
      </button>

      {/* Chat Box (desktop) */}
      <div className={chatBoxClass + ' hidden md:flex'}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-green-100 bg-gradient-to-r from-green-100 to-green-50 rounded-t-3xl">
          <span className="font-bold text-green-700 text-lg">QuickPick Chat</span>
          <button
            className="text-green-600 hover:text-green-800"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-white/80" style={{ scrollbarWidth: 'thin' }}>
          {userMessages.map((msg, idx) => (
            <div key={idx} className={getMessageClass(msg.sender)}>
              {msg.sender === 'assistant' ? BOT_AVATAR : USER_AVATAR}
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-base shadow-sm message-bubble ${msg.sender === 'user'
                  ? 'bg-gray-100 text-gray-800 rounded-br-none'
                  : 'bg-green-50 text-green-900 rounded-bl-none border border-green-100'}
                `}
              >
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

      {/* Chat Box (mobile) */}
      <div className={mobileChatBoxClass + ' md:hidden'}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-green-100 bg-gradient-to-r from-green-100 to-green-50 rounded-t-3xl">
          <span className="font-bold text-green-700 text-lg">QuickPick Chat</span>
          <button
            className="text-green-600 hover:text-green-800"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-white/80" style={{ scrollbarWidth: 'thin' }}>
          {userMessages.map((msg, idx) => (
            <div key={idx} className={getMessageClass(msg.sender)}>
              {msg.sender === 'assistant' ? BOT_AVATAR : USER_AVATAR}
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-base shadow-sm message-bubble ${msg.sender === 'user'
                  ? 'bg-gray-100 text-gray-800 rounded-br-none'
                  : 'bg-green-50 text-green-900 rounded-bl-none border border-green-100'}
                `}
              >
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

      {/* Animations for message bubbles */}
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .message { animation: fadeSlide 0.4s ease; }
        .chatbox-open { pointer-events: auto; }
        .chatbox-closed { pointer-events: none; }
        .message-bubble { box-shadow: 0 2px 8px 0 rgba(60,180,120,0.04); }
        @media (max-width: 768px) {
          .chatbox-mobile { border-radius: 1.5rem 1.5rem 0 0 !important; }
        }
      `}</style>
    </>
  );
};

// --- Main HeroChatSection Component ---
const HeroChatSection = () => {
  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-center min-h-[420px] py-8 px-2 md:px-8 bg-gradient-to-br from-green-50 to-white">
      {/* Left: Illustration */}
      <div className="flex flex-col items-center justify-center flex-1 mb-8 md:mb-0 md:mr-8">
        <img
          src={robotBanner}
          alt="AI robot with grocery basket"
          className="w-[220px] h-[220px] md:w-[420px] md:h-[420px] object-contain rounded-2xl shadow-lg mb-4 bg-white"
          loading="lazy"
        />
      </div>
      {/* Right: Tagline + Floating Chatbot */}
      <div className="flex flex-col flex-1 items-center md:items-start justify-center w-full">
        <h1 className="mb-6 text-green-800 text-[2rem] md:text-[2.5rem] lg:text-[2.75rem] font-semibold tracking-tight leading-tight" style={{ fontFamily: 'Inter, Poppins, Open Sans, sans-serif' }}>
          Effortless Grocery <span style={{ fontFamily: 'Playfair Display, serif', color: '#FFD700', fontStyle: 'italic', fontWeight: 700 }}>Magic</span> — Curated by <span className="text-green-600 font-bold">QuickPick AI</span>.
        </h1>
        <FloatingChatbot />
      </div>
    </div>
  );
};

export default HeroChatSection; 