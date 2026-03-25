import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateDesignCode = async (imageUrl: string, prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: imageUrl.split(",")[1],
            },
          },
          {
            text: `You are an expert UI developer. Analyze this design sketch and generate high-quality React + Tailwind CSS code. ${prompt}`,
          },
        ],
      },
    ],
  });
  return response.text;
};

export const chatWithAssistant = async (history: { role: "user" | "model"; parts: { text: string }[] }[]) => {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are Nexus, a brilliant multimodal research and design assistant. You help users brainstorm, design, and build legendary projects. You can see their workspace and provide insights.",
    },
  });

  // We'll send the full history for now
  const lastMessage = history[history.length - 1].parts[0].text;
  const response = await chat.sendMessage({ message: lastMessage });
  return response.text;
};

export const searchGrounding = async (query: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
  };
};
