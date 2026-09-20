import { useEffect, useRef, useState } from 'react';
import { Send, Mic, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AssistantOrb } from '@/components/layout/AssistantOrb';
import { IconButton } from '@/components/ui/IconButton';
import { useAssistantStore } from '@/store/useAssistantStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSpeechRecognition } from '@/lib/voice/speechRecognition';
import { speak, cancelSpeech } from '@/lib/voice/speechSynthesis';
import { MessageBubble } from './MessageBubble';

export function ChatWindow() {
  const messages = useAssistantStore((s) => s.messages);
  const isThinking = useAssistantStore((s) => s.isThinking);
  const error = useAssistantStore((s) => s.error);
  const sendMessage = useAssistantStore((s) => s.sendMessage);
  const hasKey = useSettingsStore((s) => Boolean(s.geminiApiKey));
  const voiceInputEnabled = useSettingsStore((s) => s.settings.voiceInputEnabled);
  const voiceOutputEnabled = useSettingsStore((s) => s.settings.voiceOutputEnabled);
  const backendConfigured = Boolean(import.meta.env.VITE_ASSISTANT_API_URL);
  const isConfigured = backendConfigured || hasKey;

  const [draft, setDraft] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSpokenIdRef = useRef<string | null>(null);

  const { isSupported: micSupported, isListening, error: micError, start, stop } =
    useSpeechRecognition((transcript) => {
      setDraft(transcript);
    });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    if (!voiceOutputEnabled) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant' || last.id === 'welcome') return;
    if (lastSpokenIdRef.current === last.id) return;
    lastSpokenIdRef.current = last.id;
    speak(last.text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  }, [messages, voiceOutputEnabled]);

  useEffect(() => () => cancelSpeech(), []);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void sendMessage(text);
  }

  function handleStopSpeaking() {
    cancelSpeech();
    setIsSpeaking(false);
  }

  return (
    <div className="flex flex-col h-[32rem] rounded-3xl border border-white/10 bg-base-panel/40 backdrop-blur-glass shadow-glass overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-accent-cyan/[0.02] pointer-events-none" />
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 relative">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <MessageBubble message={m} />
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 text-ink-muted text-sm px-2"
          >
            <AssistantOrb state="thinking" size={24} />
            <span className="animate-pulse">Thinking…</span>
          </motion.div>
        )}
        
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 text-ink-muted text-sm px-2"
          >
            <AssistantOrb state="speaking" size={24} />
            <span className="text-accent-mint font-medium">Speaking…</span>
            <button
              onClick={handleStopSpeaking}
              className="text-ink-muted hover:text-white underline underline-offset-2 ml-2 transition-colors"
            >
              Stop
            </button>
          </motion.div>
        )}
        
        {(error || micError) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-accent-rose bg-accent-rose/10 border border-accent-rose/20 rounded-xl px-4 py-3"
          >
            {error || micError}
          </motion.p>
        )}
      </div>

      {!isConfigured && (
        <p className="text-xs text-ink-faint border-t border-white/10 bg-black/20 px-5 py-3 relative">
          Add a Gemini API key in{' '}
          <Link to="/settings" className="text-accent-cyan hover:text-accent-cyan/80 font-medium transition-colors">
            Settings
          </Link>{' '}
          to enable the assistant.
        </p>
      )}

      <div className="flex items-center gap-2 border-t border-white/10 bg-black/20 p-3 relative">
        <label htmlFor="assistant-input" className="sr-only">
          Message the assistant
        </label>
        <input
          id="assistant-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isListening ? 'Listening…' : 'Ask me anything…'}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent-cyan/60 transition-all placeholder:text-ink-faint"
        />
        {voiceInputEnabled && micSupported && (
          <IconButton
            label={isListening ? 'Stop voice input' : 'Start voice input'}
            icon={isListening ? <Square size={18} /> : <Mic size={18} />}
            active={isListening}
            onClick={() => (isListening ? stop() : start())}
            className={isListening ? 'text-accent-rose bg-accent-rose/10 hover:bg-accent-rose/20' : 'hover:bg-white/10'}
          />
        )}
        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          aria-label="Send message"
          className="h-11 w-11 flex items-center justify-center rounded-xl bg-accent-cyan text-base-bg disabled:opacity-30 disabled:bg-white/10 disabled:text-ink-faint transition-colors duration-200"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
