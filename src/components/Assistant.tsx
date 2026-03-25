import React, { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, Search, Code, Sparkles, X, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "../lib/utils";
import ReactMarkdown from "react-markdown";
import { chatWithAssistant, generateDesignCode, searchGrounding } from "../services/gemini";
import { ChatMessage } from "../types";

interface AssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Assistant: React.FC<AssistantProps> = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"chat" | "design" | "search">("chat");
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (mode === "chat") {
        const history = messages.map((m) => ({
          role: m.role,
          parts: [{ text: m.content }],
        }));
        history.push({ role: "user", parts: [{ text: input }] });
        
        const response = await chatWithAssistant(history);
        setMessages((prev) => [...prev, { role: "model", content: response || "I'm not sure how to respond to that.", timestamp: Date.now() }]);
      } else if (mode === "search") {
        const { text, sources } = await searchGrounding(input);
        let content = text;
        if (sources.length > 0) {
          content += "\n\n**Sources:**\n" + sources.map((s: any) => `- [${s.web.title}](${s.web.uri})`).join("\n");
        }
        setMessages((prev) => [...prev, { role: "model", content: content || "No results found.", timestamp: Date.now() }]);
      }
    } catch (error) {
      console.error("Assistant error:", error);
      setMessages((prev) => [...prev, { role: "model", content: "Sorry, I encountered an error. Please try again.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDesignCode = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "model", content: "🎨 Analyzing your canvas design... Generating React + Tailwind code.", timestamp: Date.now() }]);

    try {
      // Capture canvas from the global window object (we'll expose it in Canvas.tsx)
      const stage = (window as any).konvaStage;
      if (!stage) throw new Error("Canvas not found");
      
      const dataUrl = stage.toDataURL();
      const code = await generateDesignCode(dataUrl, input || "Generate a responsive React component based on this layout.");
      
      setMessages((prev) => [...prev, { 
        role: "model", 
        content: "### Generated Code\n\n```tsx\n" + code + "\n```\n\n*You can now copy this into your project!*", 
        timestamp: Date.now() 
      }]);
      
      // Celebration!
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#000000', '#FFD700', '#FFFFFF']
      });

    } catch (error) {
      console.error("Design generation failed:", error);
      setMessages((prev) => [...prev, { role: "model", content: "Failed to generate code. Make sure the canvas has elements.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={cn(
        "fixed top-0 right-0 h-full bg-white border-l-2 border-black transition-all duration-300 z-50 flex flex-col shadow-[-8px_0px_0px_0px_rgba(0,0,0,1)]",
        isOpen ? "w-[450px]" : "w-0 border-none"
      )}
    >
      {/* Toggle Button */}
      <button 
        onClick={onToggle}
        className="absolute top-1/2 -left-10 transform -translate-y-1/2 bg-white border-2 border-black p-2 shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors"
      >
        {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {isOpen && (
        <>
          {/* Header */}
          <div className="p-4 border-bottom-2 border-black flex items-center justify-between bg-black text-white">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-400" />
              <h2 className="font-bold uppercase tracking-tighter text-xl">Nexus Assistant</h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setMode("chat")}
                className={cn("p-1 border border-white/20 hover:bg-white/10", mode === "chat" && "bg-white text-black")}
              >
                <Send size={16} />
              </button>
              <button 
                onClick={() => setMode("search")}
                className={cn("p-1 border border-white/20 hover:bg-white/10", mode === "search" && "bg-white text-black")}
              >
                <Search size={16} />
              </button>
              <button 
                onClick={() => setMode("design")}
                className={cn("p-1 border border-white/20 hover:bg-white/10", mode === "design" && "bg-white text-black")}
              >
                <Code size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F5F5]">
            {messages.length === 0 && (
              <div className="text-center py-10 space-y-4">
                <div className="inline-block p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="font-mono text-sm uppercase">System Ready</p>
                  <h3 className="text-2xl font-bold tracking-tighter">How can I help you build today?</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                  <button onClick={() => setInput("Brainstorm some app ideas for a hackathon")} className="text-xs p-2 border border-black hover:bg-black hover:text-white text-left">Brainstorm ideas</button>
                  <button onClick={() => setInput("What are the latest trends in UI design?")} className="text-xs p-2 border border-black hover:bg-black hover:text-white text-left">UI Trends</button>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-[90%]",
                  m.role === "user" ? "ml-auto bg-white" : "mr-auto bg-black text-white"
                )}
              >
                <div className="text-xs font-mono uppercase opacity-50 mb-1">
                  {m.role === "user" ? "Human" : "Nexus"}
                </div>
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm font-mono animate-pulse">
                <div className="w-2 h-2 bg-black rounded-full" />
                Processing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t-2 border-black bg-white">
            <div className="flex gap-2">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={mode === "chat" ? "Ask anything..." : mode === "search" ? "Search the web..." : "Design prompt..."}
                className="flex-1 p-2 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="bg-black text-white p-2 border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
            {mode === "design" && (
              <button 
                onClick={handleDesignCode}
                className="mt-2 w-full bg-yellow-400 text-black font-bold py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                GENERATE CODE FROM CANVAS
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Assistant;
