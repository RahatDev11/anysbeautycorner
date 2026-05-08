'use client';

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" 
});

export const geminiService = {
  async chat(message: string, history: any[] = []) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: "user", parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: "You are Any's Beauty Assistant. You help customers with beauty tips, product recommendations, and order inquiries. Be polite, helpful, and professional.",
        }
      });

      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  },

  async getBeautyTips(topic: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide 3 beauty tips for ${topic}. Response should be in Bengali.`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }
};
