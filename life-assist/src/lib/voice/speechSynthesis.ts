export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

interface SpeakCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Speaks text aloud, cancelling any utterance already in progress first —
 * there's exactly one assistant voice, so a new reply should interrupt
 * whatever it was saying rather than queueing behind it.
 */
export function speak(text: string, { onStart, onEnd }: SpeakCallbacks = {}): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();

  // Clean text of markdown characters, code blocks, and extra whitespace for natural speech synthesis
  let cleanText = text
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/`[^`]+`/g, '')        // remove inline code blocks
    .replace(/[*#_\->[\]()|:]/g, ' ') // remove markdown syntax characters
    .replace(/\s+/g, ' ')           // normalize spaces
    .trim();

  // Safeguard: Limit spoken feedback length to prevent SpeechSynthesis congestion/crashes
  if (cleanText.length > 220) {
    // Find the nearest boundary to truncate cleanly
    const truncated = cleanText.substring(0, 200);
    const lastPeriod = truncated.lastIndexOf('.');
    if (lastPeriod > 100) {
      cleanText = cleanText.substring(0, lastPeriod + 1) + ' I have completed the requested changes, sir.';
    } else {
      cleanText = truncated + '... I have scheduled these updates, sir. Details are on your screen.';
    }
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  // Dynamically query available voices to find a matching deep British/English male profile (Jarvis/Ultron style)
  const voices = window.speechSynthesis.getVoices();
  const jarvisVoice = voices.find(v => 
    v.lang.startsWith('en') && 
    (v.name.toLowerCase().includes('male') || 
     v.name.toLowerCase().includes('gb') || 
     v.name.toLowerCase().includes('uk') || 
     v.name.toLowerCase().includes('david') || 
     v.name.toLowerCase().includes('george') || 
     v.name.toLowerCase().includes('google uk english'))
  ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

  if (jarvisVoice) {
    utterance.voice = jarvisVoice;
  }

  // Deeper pitch and articulate rate to mimic Jarvis/Ultron mechanical responses
  utterance.pitch = 0.9;
  utterance.rate = 1.0;

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}
