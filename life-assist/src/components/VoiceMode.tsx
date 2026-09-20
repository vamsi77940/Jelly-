import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, X } from 'lucide-react';
import { useAssistantStore } from '@/store/useAssistantStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSpeechRecognition } from '@/lib/voice/speechRecognition';
import { speak, cancelSpeech } from '@/lib/voice/speechSynthesis';
import { ThreeOrb } from '@/components/ThreeOrb';

export function VoiceMode() {
  const { isVoiceModeOpen, setVoiceMode, sendMessage, isThinking, messages, error } = useAssistantStore();
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastSpokenIdRef = useRef<string | null>(null);

  const voiceOutputEnabled = useSettingsStore((s) => s.settings.voiceOutputEnabled);

  const { isListening, start, stop } = useSpeechRecognition(
    (text) => {
      setTranscript(text);
    },
    (finalTranscript) => {
      if (finalTranscript.trim()) {
        sendMessage(finalTranscript);
        setTranscript('');
        stop();
      }
    }
  );

  // Clean up and initialize variables when Voice Mode is toggled
  useEffect(() => {
    if (isVoiceModeOpen) {
      setTranscript('');
      lastSpokenIdRef.current = null;
      setIsSpeaking(false);
      useAssistantStore.setState({ error: null });
    } else {
      stop();
      cancelSpeech();
    }
  }, [isVoiceModeOpen]); // eslint-disable-line

  // Manage microphone state based on assistant state machine
  useEffect(() => {
    if (isVoiceModeOpen) {
      if (!isThinking && !isSpeaking && !error) {
        // Use a 100ms debounce to prevent microphone collisions during state transitions
        const timer = setTimeout(() => {
          start();
        }, 100);
        return () => clearTimeout(timer);
      } else {
        stop();
      }
    } else {
      stop();
    }
  }, [isVoiceModeOpen, isThinking, isSpeaking, error]); // eslint-disable-line

  // Read assistant replies aloud
  useEffect(() => {
    if (!voiceOutputEnabled || !isVoiceModeOpen) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant' || last.id === 'welcome') return;
    if (lastSpokenIdRef.current === last.id) return;
    lastSpokenIdRef.current = last.id;

    setIsSpeaking(true);
    speak(last.text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
      },
    });
  }, [messages, voiceOutputEnabled, isVoiceModeOpen]); // eslint-disable-line

  // Cancel speech on close
  useEffect(() => {
    if (!isVoiceModeOpen) {
      cancelSpeech();
      setIsSpeaking(false);
    }
  }, [isVoiceModeOpen]);

  const handleClose = () => {
    stop();
    cancelSpeech();
    setVoiceMode(false);
  };

  const handleSend = () => {
    if (transcript.trim()) {
      sendMessage(transcript);
      setTranscript('');
      stop();
    }
  };

  const handleMicToggle = () => {
    // Clear any previous store errors when user interacts to retry
    useAssistantStore.setState({ error: null });
    
    if (isListening) {
      stop();
    } else {
      cancelSpeech();
      setIsSpeaking(false);
      start();
    }
  };

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  const currentOrbState = isThinking 
    ? 'thinking' 
    : isSpeaking 
    ? 'speaking' 
    : isListening 
    ? 'listening' 
    : 'idle';

  return (
    <AnimatePresence>
      {isVoiceModeOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-3xl"
        >
          {/* Apple Intelligence Edge Glow */}
          <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden m-2 border-[1.5px] border-white/10">
             <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/10 via-transparent to-accent-mint/10 opacity-50" />
          </div>

          <div className="absolute top-8 right-8 flex items-center gap-4 z-50">
            <button
              onClick={() => {
                const lp = useSettingsStore.getState().settings.lowPerformanceMode;
                useSettingsStore.getState().updateSettings({ lowPerformanceMode: !lp });
              }}
              className="px-4 py-2 rounded-full border border-white/20 hover:border-white/40 text-xs font-medium text-white/70 hover:text-white transition-all bg-white/5 cursor-pointer select-none"
              title="Toggle Graphics Performance Mode"
            >
              {useSettingsStore((s) => s.settings.lowPerformanceMode) ? "🔋 2D Mode" : "⚡ 3D Mode"}
            </button>

            <button 
              onClick={handleClose} 
              className="text-white/50 hover:text-white transition-colors p-2 cursor-pointer"
            >
              <X size={32} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center max-w-3xl w-full gap-16 relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            >
              {useSettingsStore((s) => s.settings.lowPerformanceMode) ? (
                <div className="relative flex items-center justify-center h-[280px] w-[280px]">
                  {/* Outer pulsating wave */}
                  <div className={`absolute inset-0 rounded-full border-2 animate-ping opacity-35 duration-1000 ${
                    currentOrbState === 'listening' ? 'border-accent-cyan' :
                    currentOrbState === 'thinking' ? 'border-accent-amber' :
                    currentOrbState === 'speaking' ? 'border-accent-mint' : 'border-accent-cyan/30'
                  }`} />
                  
                  {/* Mid breathing wave */}
                  <div className={`absolute inset-6 rounded-full border-[3px] shadow-[0_0_30px_rgba(0,0,0,0.2)] bg-white/5 transition-colors duration-500 ${
                    currentOrbState === 'listening' ? 'border-accent-cyan/60 animate-pulse shadow-accent-cyan/20' :
                    currentOrbState === 'thinking' ? 'border-accent-amber/60 animate-bounce duration-750 shadow-accent-amber/20' :
                    currentOrbState === 'speaking' ? 'border-accent-mint/60 animate-pulse shadow-accent-mint/20' : 'border-accent-cyan/40 shadow-accent-cyan/10'
                  }`} />
                  
                  {/* Glowing inner core */}
                  <div className={`absolute inset-16 rounded-full bg-gradient-to-tr transition-all duration-500 shadow-lg ${
                    currentOrbState === 'listening' ? 'from-accent-cyan via-accent-cyan/70 to-accent-mint shadow-accent-cyan/40 scale-105' :
                    currentOrbState === 'thinking' ? 'from-accent-amber via-accent-amber/70 to-accent-rose shadow-accent-amber/40 scale-95' :
                    currentOrbState === 'speaking' ? 'from-accent-mint via-accent-mint/70 to-accent-cyan shadow-accent-mint/40 scale-110' : 'from-accent-cyan/80 via-accent-cyan/50 to-accent-indigo shadow-accent-cyan/20'
                  }`} />
                </div>
              ) : (
                <ThreeOrb size={280} state={currentOrbState} showControls={false} />
              )}
            </motion.div>
            
            <div className="text-center space-y-6 w-full px-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isThinking ? 'thinking' : isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle'}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="min-h-[100px] flex items-center justify-center"
                >
                  <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[80px]">
                    <p className={
                      isSpeaking && (lastAssistantMessage?.text?.length ?? 0) > 150
                        ? "text-lg md:text-xl font-sans font-normal text-white/90 leading-relaxed text-center max-h-[180px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10"
                        : "text-2xl md:text-3xl font-display font-medium text-white tracking-tight leading-tight text-center"
                    }>
                      {isThinking 
                        ? 'Thinking...' 
                        : isSpeaking 
                        ? (lastAssistantMessage?.text || 'Speaking...') 
                        : isListening 
                        ? 'Listening...' 
                        : 'How can I help you?'}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-accent-rose bg-accent-rose/10 border border-accent-rose/20 rounded-2xl px-6 py-4 max-w-md mx-auto"
                >
                  {error}
                </motion.p>
              )}

              {transcript && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xl md:text-2xl text-white/50 font-light max-w-2xl mx-auto leading-relaxed"
                >
                  "{transcript}"
                </motion.p>
              )}
            </div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="flex items-center gap-6 mt-4"
            >
              <button
                onClick={handleMicToggle}
                className={`h-20 w-20 rounded-full flex items-center justify-center border-[1.5px] transition-all duration-500 shadow-glow ${
                  isListening 
                    ? 'border-accent-rose bg-accent-rose/20 text-accent-rose' 
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isListening ? <Square size={32} /> : <Mic size={32} />}
              </button>
              
              {transcript && !isListening && (
                <motion.button 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={handleSend}
                  className="px-8 py-5 rounded-full bg-accent-cyan text-base-bg font-medium text-xl hover:bg-accent-cyan/90 transition-colors shadow-glow shadow-accent-cyan"
                >
                  Send
                </motion.button>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

