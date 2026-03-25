import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Radio, Sparkles } from "lucide-react";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { cn } from "../lib/utils";

const LiveAudio: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<"idle" | "connecting" | "active" | "error">("idle");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const startSession = async () => {
    setStatus("connecting");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        callbacks: {
          onopen: () => {
            setStatus("active");
            setIsActive(true);
            startAudioCapture();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              playAudioChunk(base64Audio);
            }
            if (message.serverContent?.interrupted) {
              stopAudioPlayback();
            }
          },
          onclose: () => {
            stopSession();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setStatus("error");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are Nexus, a collaborative research partner. You are listening to the user as they work on their design studio. Provide brief, helpful insights and answer questions naturally.",
        },
      });
      
      sessionRef.current = session;
    } catch (error) {
      console.error("Failed to start Live session:", error);
      setStatus("error");
    }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    sessionRef.current = null;
    stopAudioCapture();
    setIsActive(false);
    setStatus("idle");
  };

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        sessionRef.current?.sendRealtimeInput({
          audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" }
        });
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      processorRef.current = processor;
      setIsRecording(true);
    } catch (error) {
      console.error("Audio capture failed:", error);
    }
  };

  const stopAudioCapture = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    processorRef.current?.disconnect();
    audioContextRef.current?.close();
    setIsRecording(false);
  };

  const playAudioChunk = (base64Data: string) => {
    if (!audioContextRef.current) return;
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x7FFF;
    }
    
    const buffer = audioContextRef.current.createBuffer(1, floatData.length, 24000);
    buffer.getChannelData(0).set(floatData);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  const stopAudioPlayback = () => {
    // Implementation for stopping current playback if needed
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
      <div 
        className={cn(
          "flex items-center gap-3 bg-white border-2 border-black p-2 pr-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all",
          isActive ? "border-green-500 shadow-green-500" : "border-black"
        )}
      >
        <button 
          onClick={isActive ? stopSession : startSession}
          className={cn(
            "p-3 border-2 border-black transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none",
            isActive ? "bg-red-500 text-white" : "bg-black text-white"
          )}
        >
          {isActive ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase font-bold opacity-50">
            {status === "idle" ? "Live Assistant Offline" : status === "connecting" ? "Connecting..." : "Nexus Live"}
          </span>
          <div className="flex items-center gap-2">
            {isActive && (
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-green-500 animate-bounce" style={{ animationDelay: "0s" }} />
                <div className="w-1 h-4 bg-green-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-1 h-4 bg-green-500 animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            )}
            <span className="text-sm font-bold tracking-tighter uppercase">
              {isActive ? "Voice Active" : "Start Voice Session"}
            </span>
          </div>
        </div>

        {isActive && (
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={cn("p-2 border border-black ml-2", isMuted ? "bg-red-100" : "bg-white")}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}
      </div>
      
      {status === "error" && (
        <div className="bg-red-500 text-white text-xs p-2 border-2 border-black font-bold uppercase">
          Connection Error
        </div>
      )}
    </div>
  );
};

export default LiveAudio;
