import { motion } from 'framer-motion';

interface AssistantOrbProps {
  state?: 'idle' | 'thinking' | 'speaking';
  size?: number;
}

export function AssistantOrb({ state = 'idle', size = 36 }: AssistantOrbProps) {
  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking';

  const baseColor = isSpeaking ? 'bg-accent-mint' : 'bg-accent-cyan';
  const pulseDuration = isSpeaking ? 0.6 : isThinking ? 1.2 : 3.2;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Outer blurred aura for Apple-like glow */}
      <motion.div
        className={`absolute inset-0 rounded-full blur-md ${baseColor}`}
        animate={{
          scale: isSpeaking ? [1, 1.5, 1] : isThinking ? [1, 1.2, 1] : [1, 1.1, 1],
          opacity: isSpeaking ? [0.3, 0.7, 0.3] : isThinking ? [0.2, 0.5, 0.2] : [0.15, 0.3, 0.15]
        }}
        transition={{
          duration: pulseDuration,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {/* Core ring */}
      <motion.div
        className={`absolute inset-0 rounded-full border-[1.5px] ${
          isSpeaking ? 'border-accent-mint/60' : 'border-accent-cyan/60'
        }`}
        animate={{
          scale: isSpeaking ? [0.9, 1.1, 0.9] : [1, 1.05, 1],
          rotate: isThinking ? 360 : 0
        }}
        transition={{
          scale: { duration: pulseDuration, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 1.5, repeat: Infinity, ease: 'linear' }
        }}
        style={isThinking ? { borderTopColor: 'transparent', borderRightColor: 'transparent' } : {}}
      />

      {/* Jelly logo inner core */}
      <motion.div
        className="relative z-10 w-[75%] h-[75%] rounded-full overflow-hidden border border-cyan-300/50 shadow-lg shadow-cyan-500/40"
        animate={{
          scale: isSpeaking ? [0.9, 1.15, 0.9] : [1, 1.06, 1]
        }}
        transition={{
          duration: pulseDuration,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <img src="/jelly-logo.png" alt="Jelly" className="w-full h-full object-cover" />
      </motion.div>
    </div>
  );
}
