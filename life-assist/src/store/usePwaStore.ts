import { create } from 'zustand';

interface PwaState {
  deferredPrompt: any | null;
  isInstallable: boolean;
  setDeferredPrompt: (prompt: any) => void;
  clearDeferredPrompt: () => void;
  triggerInstall: () => Promise<boolean>;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  deferredPrompt: null,
  isInstallable: false,
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt, isInstallable: true }),
  clearDeferredPrompt: () => set({ deferredPrompt: null, isInstallable: false }),
  triggerInstall: async () => {
    const prompt = get().deferredPrompt;
    if (!prompt) return false;

    try {
      prompt.prompt();
      const choiceResult = await prompt.userChoice;
      get().clearDeferredPrompt();
      return choiceResult.outcome === 'accepted';
    } catch (err) {
      console.error('[PWA] Installation prompt failed:', err);
      return false;
    }
  },
}));
