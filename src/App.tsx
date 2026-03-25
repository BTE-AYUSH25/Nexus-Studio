import React, { useState } from "react";
import Canvas from "./components/Canvas";
import Assistant from "./components/Assistant";
import LiveAudio from "./components/LiveAudio";
import { CanvasShape } from "./types";
import { Sparkles, Layers, Share2, Settings, Github, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [selectedShape, setSelectedShape] = useState<CanvasShape | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden">
      {/* Scanline Effect */}
      <div className="scanline" />

      {/* Top Navigation */}
      <header className="h-14 bg-white border-b-2 border-black flex items-center justify-between px-6 z-40 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-4">
          <div className="bg-black text-white p-1 px-2 font-bold tracking-tighter text-xl flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-400" />
            NEXUS STUDIO
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-mono font-bold uppercase opacity-50">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Collaborative Session
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center font-bold text-xs">
                U{i}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-black bg-black text-white flex items-center justify-center font-bold text-xs">
              +
            </div>
          </div>
          <div className="h-6 w-[2px] bg-black opacity-20" />
          <button className="flex items-center gap-2 font-bold uppercase text-sm hover:underline">
            <Share2 size={16} />
            Share
          </button>
          <button className="bg-black text-white px-4 py-1 font-bold uppercase text-sm border-2 border-black hover:bg-white hover:text-black transition-colors">
            Export
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 relative">
        <Canvas 
          onShapeSelect={setSelectedShape} 
          selectedShapeId={selectedShape?.id || null} 
        />
        
        <Assistant 
          isOpen={isAssistantOpen} 
          onToggle={() => setIsAssistantOpen(!isAssistantOpen)} 
        />
        
        <LiveAudio />

        {/* Floating Info Panel */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
          <div className="bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-xs pointer-events-auto">
            <h4 className="font-bold text-sm uppercase tracking-tighter mb-1 flex items-center gap-2">
              <Info size={14} />
              Workspace Info
            </h4>
            <div className="text-[10px] font-mono space-y-1">
              <div className="flex justify-between">
                <span>Active Users:</span>
                <span className="font-bold">4</span>
              </div>
              <div className="flex justify-between">
                <span>Elements:</span>
                <span className="font-bold">12</span>
              </div>
              <div className="flex justify-between">
                <span>AI Grounding:</span>
                <span className="font-bold text-green-600">ENABLED</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Intro Modal */}
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-black p-8 max-w-2xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative"
            >
              <button 
                onClick={() => setShowIntro(false)}
                className="absolute top-4 right-4 p-2 hover:bg-black hover:text-white transition-colors"
              >
                <Settings size={24} />
              </button>
              
              <div className="space-y-6">
                <div className="inline-block bg-black text-white p-2 px-4 font-bold text-4xl tracking-tighter uppercase">
                  Nexus Studio
                </div>
                <h2 className="text-3xl font-bold tracking-tight leading-none">
                  The AI-Native Collaborative Workspace for the Next Generation of Creators.
                </h2>
                <p className="text-lg opacity-70">
                  Nexus combines real-time collaboration with multimodal AI. Brainstorm with your team, talk to Gemini Live, and turn your sketches into production-ready code instantly.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border-2 border-black bg-[#F5F5F5]">
                    <div className="font-bold uppercase text-xs mb-2 text-blue-600">Multimodal</div>
                    <p className="text-xs font-medium">AI sees your canvas and helps you design in real-time.</p>
                  </div>
                  <div className="p-4 border-2 border-black bg-[#F5F5F5]">
                    <div className="font-bold uppercase text-xs mb-2 text-green-600">Live Audio</div>
                    <p className="text-xs font-medium">Talk to your research partner hands-free while you work.</p>
                  </div>
                  <div className="p-4 border-2 border-black bg-[#F5F5F5]">
                    <div className="font-bold uppercase text-xs mb-2 text-purple-600">Real-time</div>
                    <p className="text-xs font-medium">Seamless sync across all users with zero latency.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowIntro(false)}
                  className="w-full bg-black text-white py-4 font-bold text-xl uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]"
                >
                  ENTER WORKSPACE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Status Bar */}
      <footer className="h-8 bg-black text-white flex items-center justify-between px-4 text-[10px] font-mono uppercase tracking-widest z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            System: Operational
          </div>
          <div>Latency: 12ms</div>
          <div>Region: US-EAST-1</div>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:underline flex items-center gap-1">
            <Github size={12} />
            Source
          </a>
          <div>v1.0.4-beta</div>
        </div>
      </footer>
    </div>
  );
}
