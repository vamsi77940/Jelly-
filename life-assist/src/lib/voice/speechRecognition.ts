import { useEffect, useRef, useState } from 'react';

function getRecognitionCtor(): { new (): SpeechRecognition } | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  error: string | null;
  /** Starts listening. No-op if unsupported or already listening — safe to call from a click handler unconditionally. */
  start: () => void;
  stop: () => void;
}

/**
 * Enhanced wrapper around the Web Speech API's SpeechRecognition.
 * Supports continuous listening, real-time interim transcript streams,
 * and custom silence detection for auto-submission.
 */
export function useSpeechRecognition(
  onResult: (text: string, isFinal: boolean) => void,
  onSilence?: (text: string) => void
) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onSilenceRef = useRef(onSilence);
  onSilenceRef.current = onSilence;

  const isSupported = isSpeechRecognitionSupported();

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  function start() {
    if (!isSupported || isListening) return;
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; ++i) {
        const result = event.results[i];
        const text = result[0]?.transcript || '';
        if (result.isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      const fullTranscript = (finalTranscript + interimTranscript).trim();
      onResultRef.current(fullTranscript, interimTranscript === '');

      // Silence detection: reset timer when the user is actively speaking
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      if (fullTranscript) {
        silenceTimerRef.current = setTimeout(() => {
          onSilenceRef.current?.(fullTranscript);
        }, 1800); // 1.8 seconds of silence to auto-submit
      }
    };

    recognition.onerror = (event) => {
      // "no-speech" and "aborted" fire on ordinary silence/stop — not real errors, don't surface them.
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(
          event.error === 'not-allowed'
            ? 'Microphone access was blocked. Check your browser site settings.'
            : 'Voice input failed. Try again.'
        );
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };

    recognitionRef.current = recognition;
    setError(null);
    setIsListening(true);
    recognition.start();
  }

  function stop() {
    recognitionRef.current?.stop();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  }

  const result: UseSpeechRecognitionResult = { isSupported, isListening, error, start, stop };
  return result;
}

