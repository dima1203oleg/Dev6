import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

function pcmToBase64(pcmData: Float32Array): string {
  const buffer = new ArrayBuffer(pcmData.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < pcmData.length; i++) {
    let s = Math.max(-1, Math.min(1, pcmData[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function VoiceCall() {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCall = async () => {
    try {
      setError(null);
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputAudioCtx;

      const outputAudioCtx = new AudioContext({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputAudioCtx;
      nextStartTimeRef.current = outputAudioCtx.currentTime;

      // Force resume AudioContext on mobile/iOS
      if (inputAudioCtx.state === 'suspended') {
        await inputAudioCtx.resume();
      }
      if (outputAudioCtx.state === 'suspended') {
        await outputAudioCtx.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      source.connect(processor);
      processor.connect(inputAudioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
          ws.send(JSON.stringify({ audio: base64 }));
        }
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "command") {
          console.log("[LIVE API COMMAND]", msg.command, msg.args);
          if (msg.command === "changeTab" && msg.args?.tabId) {
            const ev = new CustomEvent("change-active-tab", { detail: msg.args.tabId });
            window.dispatchEvent(ev);
          } else if (msg.command === "triggerOsintSearch" && msg.args?.query) {
            const evTab = new CustomEvent("change-active-tab", { detail: "osint" });
            window.dispatchEvent(evTab);
            setTimeout(() => {
              const evSearch = new CustomEvent("trigger-osint-search", { detail: { query: msg.args.query } });
              window.dispatchEvent(evSearch);
            }, 300);
          } else if (msg.command === "triggerSystemScan") {
            const evTab = new CustomEvent("change-active-tab", { detail: "audit-log" });
            window.dispatchEvent(evTab);
            const evScan = new CustomEvent("trigger-system-scan");
            window.dispatchEvent(evScan);
          }
          return;
        }

        if (msg.audio) {
          const binary = atob(msg.audio);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const pcm16 = new Int16Array(bytes.buffer);
          const float32 = new Float32Array(pcm16.length);
          for (let i = 0; i < pcm16.length; i++) {
            float32[i] = pcm16[i] / 0x8000;
          }

          const audioBuffer = outputAudioCtx.createBuffer(1, float32.length, 24000);
          audioBuffer.getChannelData(0).set(float32);

          const sourceNode = outputAudioCtx.createBufferSource();
          sourceNode.buffer = audioBuffer;
          
          // PREDATOR COLD ANALYST (Profile B)
          // Rate is 0.82 - slower, controlled delivery
          sourceNode.playbackRate.value = 0.82;

          // 1. Low Shelf Filter: Extreme Deep Sub-Bass
          // Massive boost to sub-low frequencies for an earth-shaking deep bass
          const chestResonance = outputAudioCtx.createBiquadFilter();
          chestResonance.type = 'lowshelf';
          chestResonance.frequency.value = 85; // Deep sub-bass resonance
          chestResonance.gain.value = 18.0; // Extreme +18dB push for powerful bass

          // 1.5 Peaking Filter: Sub-bass rumble boost
          const subBassRumble = outputAudioCtx.createBiquadFilter();
          subBassRumble.type = 'peaking';
          subBassRumble.frequency.value = 60; // Sub-bass frequency
          subBassRumble.Q.value = 0.7; // Wide band
          subBassRumble.gain.value = 10.0; // Additional +10dB for the deep rumble

          // 2. Peaking Filter: Nasal Cut (1000-1200 Hz)
          // Cut nasal frequencies to achieve a dark, matte sound
          const nasalCut = outputAudioCtx.createBiquadFilter();
          nasalCut.type = 'peaking';
          nasalCut.frequency.value = 1000;
          nasalCut.Q.value = 1.0;
          nasalCut.gain.value = -10.0; // Strong cut to eliminate nasality

          // 3. High Shelf Filter: Brightness Cut (4000+ Hz)
          // Make the voice "DARK" but retain articulation
          const darkHighCut = outputAudioCtx.createBiquadFilter();
          darkHighCut.type = 'highshelf';
          darkHighCut.frequency.value = 4000;
          darkHighCut.gain.value = -8.0; // Cut high frequencies to remove brightness

          // 4. Dynamics Compressor: Dense and Monolithic
          // Compress dynamic range for a steady, unwavering delivery
          const roboticCompressor = outputAudioCtx.createDynamicsCompressor();
          roboticCompressor.threshold.value = -20; // Moderate threshold
          roboticCompressor.knee.value = 10;
          roboticCompressor.ratio.value = 4; // 4:1 compression ratio
          roboticCompressor.attack.value = 0.1; // Slow attack (100ms) to let hard consonants through
          roboticCompressor.release.value = 0.25;

          // Connect dark, menacing heavy audio pipeline to destination
          sourceNode.connect(chestResonance);
          chestResonance.connect(subBassRumble);
          subBassRumble.connect(nasalCut);
          nasalCut.connect(darkHighCut);
          darkHighCut.connect(roboticCompressor);
          roboticCompressor.connect(outputAudioCtx.destination);
          
          if (nextStartTimeRef.current < outputAudioCtx.currentTime) {
            nextStartTimeRef.current = outputAudioCtx.currentTime;
          }
          sourceNode.start(nextStartTimeRef.current);
          nextStartTimeRef.current += audioBuffer.duration;
        }
        if (msg.interrupted) {
           nextStartTimeRef.current = outputAudioCtx.currentTime;
        }
      };

      ws.onopen = () => {
        setIsActive(true);
      };
      
      ws.onerror = (e) => {
        console.error("WS error", e);
        setError("WebSocket connection failed.");
      };

      ws.onclose = () => {
        stopCall();
      };
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start microphone.");
      stopCall();
    }
  };

  const stopCall = () => {
    setIsActive(false);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCall();
    };
  }, []);

  return (
    <div className="fixed sm:bottom-6 bottom-24 sm:right-24 right-24 z-50">
      <div className="flex flex-col items-end gap-2">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-red-950/90 border border-red-500/50 text-red-200 px-2 py-1.5 rounded-2xl shadow-2xl backdrop-blur-md max-w-[210px] text-xs font-mono"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <p>{error}</p>
              </div>
            </motion.div>
          )}
          
          {isActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="bg-slate-950/95 border border-slate-800 px-2 py-1.5 rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.15)] backdrop-blur-md flex items-center gap-2"
            >
              <div className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
              </div>
              <div className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">
                PREDATOR LIVE
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isActive ? stopCall : startCall}
          className={`h-10 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all border ${
            isActive 
              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30' 
              : 'bg-slate-900/50 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] hover:bg-slate-800 text-slate-300 border-slate-800'
          }`}
        >
          {isActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </motion.button>
      </div>
    </div>
  );
}
