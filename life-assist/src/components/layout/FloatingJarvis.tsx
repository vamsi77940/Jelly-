import { motion, AnimatePresence } from 'framer-motion';
import { useAssistantStore } from '@/store/useAssistantStore';

export function FloatingJarvis() {
  const { isVoiceModeOpen, setVoiceMode } = useAssistantStore();

  return (
    <AnimatePresence>
      {!isVoiceModeOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3 }}
          onClick={() => setVoiceMode(true)}
          className="fixed bottom-6 right-6 z-50 h-20 w-20 flex items-center justify-center rounded-full bg-black/40 border border-white/10 hover:border-accent-cyan/45 hover:bg-black/60 shadow-glass focus:outline-none group select-none cursor-pointer"
          aria-label="Talk to Jelly"
          title="Talk to Jelly"
        >
          <div className="relative flex items-center justify-center h-16 w-16 rounded-full overflow-hidden border border-cyan-300/40 shadow-xl shadow-cyan-500/30">
            <img src="/jelly-logo.png" alt="Jelly" className="w-full h-full object-cover animate-pulse" />
          </div>

          {/* Dynamic hover ring and ambient visual cue */}
          <div className="absolute inset-0 rounded-full border-[1.5px] border-accent-cyan/0 group-hover:border-accent-cyan/40 group-hover:scale-105 transition-all duration-300 pointer-events-none" />
          <div className="absolute inset-0 rounded-full blur-md bg-accent-cyan/0 group-hover:bg-accent-cyan/15 group-hover:scale-110 transition-all duration-300 pointer-events-none" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
