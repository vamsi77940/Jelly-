import { useRef, useState } from 'react';
import { Download, Upload, Cloud, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Field, inputClass } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';
import { useSyncStore } from '@/lib/sync';
import { usePwaStore } from '@/store/usePwaStore';
import { exportAllData, importAllData } from '@/lib/storage';
import { toLocalDateString } from '@/lib/time';
import {
  getNotificationPermissionState,
  requestNotificationPermission,
} from '@/lib/notifications/permissions';
import { isSpeechRecognitionSupported } from '@/lib/voice/speechRecognition';
import { isSpeechSynthesisSupported } from '@/lib/voice/speechSynthesis';
import type { AssistantTone } from '@/types';

const TONE_OPTIONS: { value: AssistantTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'motivational', label: 'Motivational' },
];

export function SettingsPage() {
  const profile = useSettingsStore((s) => s.profile);
  const setProfileName = useSettingsStore((s) => s.setProfileName);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const showToast = useUIStore((s) => s.showToast);

  const [name, setName] = useState(profile.name);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backendConfigured = Boolean(import.meta.env.VITE_ASSISTANT_API_URL);
  const [permissionState, setPermissionState] = useState(getNotificationPermissionState());
  const micSupported = isSpeechRecognitionSupported();
  const speechSupported = isSpeechSynthesisSupported();

  const syncConfigured = useSyncStore((s) => s.isConfigured);
  const syncStatus = useSyncStore((s) => s.syncStatus);
  const syncUserId = useSyncStore((s) => s.userId);
  const syncEmail = useSyncStore((s) => s.email);
  const syncIsAnonymous = useSyncStore((s) => s.isAnonymous);
  const syncNow = useSyncStore((s) => s.syncNow);
  const signUp = useSyncStore((s) => s.signUp);
  const logIn = useSyncStore((s) => s.logIn);
  const logOut = useSyncStore((s) => s.logOut);

  const isInstallable = usePwaStore((s) => s.isInstallable);
  const triggerInstall = usePwaStore((s) => s.triggerInstall);

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  async function handleRequestPermission() {
    const result = await requestNotificationPermission();
    setPermissionState(result);
    if (result === 'granted') showToast('Notifications enabled.', 'success');
    else if (result === 'denied') showToast('Notifications were blocked.', 'warning');
  }

  async function exportData() {
    const dump = await exportAllData();
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeassist-backup-${toLocalDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded.', 'success');
  }

  function importData(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result as string) as Record<string, unknown>;
        await importAllData(parsed);
        showToast('Backup restored. Reloading…', 'success');
        setTimeout(() => window.location.reload(), 800);
      } catch {
        showToast('That file could not be read as a LifeAssist backup.', 'warning');
      }
    };
    reader.readAsText(file);
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setAuthError('Email and password are required.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'signup') {
        await signUp(emailInput, passwordInput);
        showToast('Account created and linked successfully.', 'success');
      } else {
        await logIn(emailInput, passwordInput);
        showToast('Signed in successfully.', 'success');
      }
      setEmailInput('');
      setPasswordInput('');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'An error occurred during authentication.');
      showToast('Authentication failed.', 'warning');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogOut() {
    setAuthLoading(true);
    try {
      localStorage.removeItem('lifeassist_bypass_login');
      await logOut();
      showToast('Logged out and local session reset.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Log out failed.', 'warning');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleInstallPwa() {
    const success = await triggerInstall();
    if (success) {
      showToast('LifeAssist installation started!', 'success');
    }
  }

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'assistant' | 'data'>('profile');

  const tabs = [
    { id: 'profile', label: 'Profile & Account' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'assistant', label: 'AI & Voice' },
    { id: 'data', label: 'Privacy & Data' },
  ] as const;

  return (
    <div className="animate-fadeUp max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-64 shrink-0">
        <h1 className="text-3xl font-display font-semibold tracking-tight mb-6">Settings</h1>
        <nav className="flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-cyan/10 text-accent-cyan'
                  : 'text-ink-muted hover:bg-white/5 hover:text-ink-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 space-y-6 pt-2">
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fadeUp">
            <Card>
              <h2 className="font-medium mb-4">Profile Settings</h2>
              <Field label="Name" htmlFor="profile-name">
                <div className="flex gap-2">
                  <input
                    id="profile-name"
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setProfileName(name);
                      showToast('Profile updated.', 'success');
                    }}
                  >
                    Save
                  </Button>
                </div>
              </Field>
            </Card>

            <Card>
              <h2 className="font-medium mb-2">Cloud Synchronization & Account</h2>
              <p className="text-sm text-ink-muted mb-4">
                Keep your tasks, habits, and progress securely backed up and synced across your devices.
              </p>

              {!syncConfigured ? (
                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-lg p-4 text-sm text-ink-muted">
                  <p>
                    Cloud sync is currently disabled because Firebase environment variables are not set.
                  </p>
                  <p className="mt-2 text-xs">
                    Please configure your <code>.env</code> file with <code>VITE_FIREBASE_API_KEY</code> and <code>VITE_FIREBASE_PROJECT_ID</code> to enable.
                  </p>
                </div>
              ) : !syncIsAnonymous ? (
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Account</p>
                      <p className="text-sm font-medium text-ink-primary mt-0.5">{syncEmail}</p>
                      <p className="text-[10px] text-accent-mint font-mono mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-mint animate-pulse" />
                        Synced & Secure (User ID: {syncUserId?.substring(0, 8)}...)
                      </p>
                    </div>
                    <Button variant="danger" onClick={handleLogOut} disabled={authLoading}>
                      Log Out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg p-4 text-xs text-ink-primary">
                    <p className="font-semibold text-accent-cyan mb-1">Temporary Anonymous Session</p>
                    <p className="text-ink-muted">
                      Your progress is stored locally and backed up temporarily. To secure your data permanentely or sync across multiple devices, sign up to link your session data.
                    </p>
                  </div>

                  {authError && (
                    <div className="bg-accent-rose/10 border border-accent-rose/20 rounded-lg p-3 text-xs text-accent-rose">
                      {authError}
                    </div>
                  )}

                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Email Address" htmlFor="auth-email">
                        <input
                          id="auth-email"
                          type="email"
                          className={inputClass}
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="name@example.com"
                          required
                          disabled={authLoading}
                        />
                      </Field>
                      <Field label="Password" htmlFor="auth-password">
                        <input
                          id="auth-password"
                          type="password"
                          className={inputClass}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={authLoading}
                          minLength={6}
                        />
                      </Field>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode(authMode === 'login' ? 'signup' : 'login');
                          setAuthError(null);
                        }}
                        className="text-xs text-accent-cyan hover:underline"
                        disabled={authLoading}
                      >
                        {authMode === 'login'
                          ? 'Need an account? Sign Up & Link Local Data'
                          : 'Already have an account? Sign In'}
                      </button>

                      <Button type="submit" disabled={authLoading}>
                        {authLoading
                          ? 'Connecting...'
                          : authMode === 'login'
                          ? 'Sign In'
                          : 'Sign Up & Link'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6 animate-fadeUp">
            <Card>
              <h2 className="font-medium mb-1">Theme</h2>
              <p className="text-sm text-ink-muted mb-4">Choose your preferred visual style.</p>
              <Field label="Color Theme" htmlFor="theme">
                <select
                  id="theme"
                  className={inputClass}
                  value={settings.theme}
                  onChange={(e) => updateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                >
                  <option value="system">System Default</option>
                  <option value="dark">Dark Mode</option>
                  <option value="light">Light Mode</option>
                </select>
              </Field>
            </Card>

            <Card>
              <h2 className="font-medium mb-1">Time & Date</h2>
              <p className="text-sm text-ink-muted mb-4">Customize how time is displayed across the app.</p>
              <Field label="Time Format" htmlFor="time-format">
                <select
                  id="time-format"
                  className={inputClass}
                  value={settings.timeFormat}
                  onChange={(e) => updateSettings({ timeFormat: e.target.value as '12h' | '24h' })}
                >
                  <option value="12h">12-hour (1:00 PM)</option>
                  <option value="24h">24-hour (13:00)</option>
                </select>
              </Field>
            </Card>

            {isInstallable && (
              <Card>
                <h2 className="font-medium mb-1">App Installation</h2>
                <p className="text-sm text-ink-muted mb-4">
                  Install LifeAssist on your home screen or desktop to run it as a standalone offline-enabled PWA.
                </p>
                <Button onClick={handleInstallPwa} className="shadow-glow">
                  Install LifeAssist App
                </Button>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-fadeUp">
            <Card>
              <h2 className="font-medium mb-1">Browser Notifications</h2>
              <p className="text-sm text-ink-muted mb-4">
                Receive important reminders even when the app is in the background.
              </p>
              <label className="flex items-start gap-2.5 mt-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
                  className="h-4 w-4 mt-0.5 accent-accent-cyan"
                />
                <span>
                  <span className="block text-ink-primary">Enable notifications</span>
                  <span className="block text-ink-muted text-xs mt-0.5">
                    At most 3 a day, never during quiet hours.
                  </span>
                </span>
              </label>

              {settings.notificationsEnabled && (
                <div className="mt-4 pl-6 space-y-4">
                  <div>
                    {permissionState === 'granted' && (
                      <p className="text-sm text-accent-mint">Notifications are allowed.</p>
                    )}
                    {permissionState === 'denied' && (
                      <p className="text-sm text-accent-rose">
                        Notifications are blocked by your browser.
                      </p>
                    )}
                    {permissionState === 'default' && (
                      <Button variant="secondary" onClick={handleRequestPermission}>
                        Allow notifications
                      </Button>
                    )}
                    {permissionState === 'unsupported' && (
                      <p className="text-sm text-ink-muted">
                        This browser doesn't support notifications.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Quiet hours start" htmlFor="quiet-start">
                      <input
                        id="quiet-start"
                        type="time"
                        className={inputClass}
                        value={settings.quietHoursStart}
                        onChange={(e) => updateSettings({ quietHoursStart: e.target.value })}
                      />
                    </Field>
                    <Field label="Quiet hours end" htmlFor="quiet-end">
                      <input
                        id="quiet-end"
                        type="time"
                        className={inputClass}
                        value={settings.quietHoursEnd}
                        onChange={(e) => updateSettings({ quietHoursEnd: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <h2 className="font-medium mb-1">Focus Timer</h2>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Field label="Session (minutes)" htmlFor="pomodoro-minutes">
                  <input
                    id="pomodoro-minutes"
                    type="number"
                    min={5}
                    max={90}
                    className={inputClass}
                    value={settings.pomodoroMinutes}
                    onChange={(e) => updateSettings({ pomodoroMinutes: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Break (minutes)" htmlFor="break-minutes">
                  <input
                    id="break-minutes"
                    type="number"
                    min={1}
                    max={30}
                    className={inputClass}
                    value={settings.breakMinutes}
                    onChange={(e) => updateSettings({ breakMinutes: Number(e.target.value) })}
                  />
                </Field>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'assistant' && (
          <div className="space-y-6 animate-fadeUp">
            <Card>
              <h2 className="font-medium mb-1">AI Providers</h2>
              <p className="text-sm text-ink-muted mb-4">
                Connect your own API keys. Keys are stored locally on your device.
              </p>
              {backendConfigured ? (
                <p className="text-sm text-accent-mint bg-accent-mint/10 rounded-lg px-3 py-2">
                  Connected via secure server. The fields below aren't used while this is active.
                </p>
              ) : (
                <div className="space-y-4">
                  <Field label="Active AI Provider" htmlFor="model-provider">
                    <select
                      id="model-provider"
                      className={inputClass}
                      value={settings.modelProvider}
                      onChange={(e) => updateSettings({ modelProvider: e.target.value as any })}
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="openai">OpenAI (ChatGPT)</option>
                      <option value="claude">Anthropic Claude</option>
                      <option value="openrouter">OpenRouter</option>
                      <option value="ollama">Ollama (Local)</option>
                    </select>
                  </Field>

                  <div className="border-t border-base-border my-6"></div>

                  <Field label="Gemini API Key" htmlFor="gemini-key">
                    <div className="flex gap-2">
                      <input
                        id="gemini-key"
                        type="password"
                        className={inputClass}
                        value={useSettingsStore((s) => s.geminiApiKey)}
                        onChange={(e) => useSettingsStore.getState().setApiKeys({ geminiApiKey: e.target.value })}
                        placeholder="AIzaSy..."
                      />
                    </div>
                  </Field>
                  <Field label="OpenAI API Key" htmlFor="openai-key">
                    <div className="flex gap-2">
                      <input
                        id="openai-key"
                        type="password"
                        className={inputClass}
                        value={useSettingsStore((s) => s.openAIApiKey)}
                        onChange={(e) => useSettingsStore.getState().setApiKeys({ openAIApiKey: e.target.value })}
                        placeholder="sk-..."
                      />
                    </div>
                  </Field>
                  <Field label="Claude API Key" htmlFor="claude-key">
                    <div className="flex gap-2">
                      <input
                        id="claude-key"
                        type="password"
                        className={inputClass}
                        value={useSettingsStore((s) => s.claudeApiKey)}
                        onChange={(e) => useSettingsStore.getState().setApiKeys({ claudeApiKey: e.target.value })}
                        placeholder="sk-ant-..."
                      />
                    </div>
                  </Field>
                  <Field label="OpenRouter API Key" htmlFor="openrouter-key">
                    <div className="flex gap-2">
                      <input
                        id="openrouter-key"
                        type="password"
                        className={inputClass}
                        value={useSettingsStore((s) => s.openRouterApiKey)}
                        onChange={(e) => useSettingsStore.getState().setApiKeys({ openRouterApiKey: e.target.value })}
                        placeholder="sk-or-v1-..."
                      />
                    </div>
                  </Field>
                  <Field label="Ollama Endpoint" htmlFor="ollama-url">
                    <div className="flex gap-2">
                      <input
                        id="ollama-url"
                        type="url"
                        className={inputClass}
                        value={useSettingsStore((s) => s.ollamaEndpoint)}
                        onChange={(e) => useSettingsStore.getState().setApiKeys({ ollamaEndpoint: e.target.value })}
                        placeholder="http://localhost:11434"
                      />
                    </div>
                  </Field>
                </div>
              )}
            </Card>

            <Card>
              <h2 className="font-medium mb-1">Assistant Behavior</h2>
              <Field label="Notification tone" htmlFor="assistant-tone">
                <select
                  id="assistant-tone"
                  className={inputClass}
                  value={settings.assistantTone}
                  onChange={(e) => updateSettings({ assistantTone: e.target.value as AssistantTone })}
                >
                  {TONE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <label className="flex items-start gap-2.5 mt-4 text-sm">
                <input
                  type="checkbox"
                  checked={settings.learningEnabled}
                  onChange={(e) => updateSettings({ learningEnabled: e.target.checked })}
                  className="h-4 w-4 mt-0.5 accent-accent-cyan"
                />
                <span>
                  <span className="block text-ink-primary">Let the assistant learn my routines</span>
                  <span className="block text-ink-muted text-xs mt-0.5">
                    Used to notice patterns and suggest improvements without asking.
                  </span>
                </span>
              </label>
            </Card>

            <Card>
              <h2 className="font-medium mb-1">Voice</h2>
              <label className="flex items-start gap-2.5 text-sm mt-4">
                <input
                  type="checkbox"
                  checked={settings.voiceInputEnabled}
                  disabled={!micSupported}
                  onChange={(e) => updateSettings({ voiceInputEnabled: e.target.checked })}
                  className="h-4 w-4 mt-0.5 accent-accent-cyan disabled:opacity-40"
                />
                <span>
                  <span className="block text-ink-primary">Voice input</span>
                  <span className="block text-ink-muted text-xs mt-0.5">
                    {micSupported
                      ? 'Adds a mic button to dictate messages.'
                      : "This browser doesn't support voice input."}
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 mt-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.voiceOutputEnabled}
                  disabled={!speechSupported}
                  onChange={(e) => updateSettings({ voiceOutputEnabled: e.target.checked })}
                  className="h-4 w-4 mt-0.5 accent-accent-cyan disabled:opacity-40"
                />
                <span>
                  <span className="block text-ink-primary">Read replies aloud</span>
                  <span className="block text-ink-muted text-xs mt-0.5">
                    {speechSupported
                      ? "The assistant's chat replies are spoken as they arrive."
                      : "This browser doesn't support reading text aloud."}
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 mt-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.lowPerformanceMode || false}
                  onChange={(e) => updateSettings({ lowPerformanceMode: e.target.checked })}
                  className="h-4 w-4 mt-0.5 accent-accent-cyan"
                />
                <span>
                  <span className="block text-ink-primary">Low Performance Mode</span>
                  <span className="block text-ink-muted text-xs mt-0.5">
                    Replaces heavy 3D WebGL holograms with lightweight 2D glowing CSS waves. Ideal for high CPU/GPU loads.
                  </span>
                </span>
              </label>
            </Card>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-6 animate-fadeUp">
            <Card>
              <h2 className="font-medium mb-1">Privacy & Data Storage</h2>
              <p className="text-sm text-ink-muted mb-4">
                Everything lives on this device. Export a backup, or restore one, at any time.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" icon={<Download size={16} />} onClick={exportData}>
                  Export Backup
                </Button>
                <Button
                  variant="secondary"
                  icon={<Upload size={16} />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Restore Backup
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importData(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-1">
                <Cloud className="text-accent-cyan" size={20} />
                <h2 className="font-medium">Firebase Cloud Sync</h2>
              </div>
              <p className="text-sm text-ink-muted mb-4">
                Automatically backup and sync your database in real-time to your Firestore collection.
              </p>

              {!syncConfigured ? (
                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-lg p-4 text-sm text-ink-muted">
                  <p>
                    Cloud synchronization is disabled because Firebase credentials are not set in the environment.
                  </p>
                  <p className="mt-2 text-xs">
                    Please configure your <code>.env</code> file with <code>VITE_FIREBASE_API_KEY</code> and <code>VITE_FIREBASE_PROJECT_ID</code> to enable.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 p-4 rounded-lg border border-white/10 backdrop-blur-md">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Status</span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          syncStatus === 'synced' ? 'bg-accent-mint/10 text-accent-mint' :
                          syncStatus === 'syncing' ? 'bg-accent-cyan/10 text-accent-cyan animate-pulse' :
                          syncStatus === 'offline' ? 'bg-ink-muted/10 text-ink-muted' :
                          syncStatus === 'error' ? 'bg-accent-rose/10 text-accent-rose' :
                          'bg-white/5 text-ink-primary'
                        }`}>
                          {syncStatus === 'synced' && 'Synced'}
                          {syncStatus === 'syncing' && 'Syncing...'}
                          {syncStatus === 'offline' && 'Offline (Local only)'}
                          {syncStatus === 'error' && 'Sync Error'}
                          {syncStatus === 'idle' && 'Connected'}
                        </span>
                      </div>
                      {syncUserId && (
                        <p className="text-xs text-ink-muted mt-1.5 font-mono">
                          User ID: {syncUserId}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="secondary"
                      icon={<RefreshCw size={14} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />}
                      onClick={() => syncNow()}
                      disabled={syncStatus === 'syncing' || syncStatus === 'offline'}
                    >
                      Sync Now
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
