'use client';

import { useState } from 'react';
import { geminiService } from '@/lib/services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send } from 'lucide-react';

export default function AIScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: "user", parts: [{ text: input }] };
    setMessages([...messages, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await geminiService.chat(input, messages);
      const aiMsg = { role: "model", parts: [{ text: response }] };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto border rounded-3xl overflow-hidden bg-white shadow-xl">
      <div className="bg-lipstick p-4 text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5" />
        <span className="font-bold">Beauty Assistant</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-lipstick text-white' : 'bg-gray-100 text-gray-800'}`}>
              {msg.parts[0].text}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-gray-400 animate-pulse">Assistant is typing...</div>}
      </div>

      <div className="p-4 border-t flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about beauty..." 
          className="flex-1 p-3 border rounded-xl" 
        />
        <button onClick={handleSend} className="bg-lipstick text-white p-3 rounded-xl">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
