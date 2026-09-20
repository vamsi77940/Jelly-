import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSyncStore } from '@/lib/sync';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { ToastViewport } from '@/components/ui/ToastViewport';
import { NotificationScheduler } from '@/components/NotificationScheduler';
import { AlarmScheduler } from '@/components/AlarmScheduler';
import { VoiceMode } from '@/components/VoiceMode';
import { FloatingJarvis } from './FloatingJarvis';
import { BackgroundWisp } from './BackgroundWisp';

export function AppShell() {
  const location = useLocation();
  const isAnonymous = useSyncStore((s) => s.isAnonymous);
  const bypassLogin = localStorage.getItem('lifeassist_bypass_login') === 'true';

  if (isAnonymous && !bypassLogin) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="flex min-h-screen bg-transparent relative z-0">
      <BackgroundWisp />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 px-4 md:px-8 py-6 pb-24 md:pb-6 max-w-5xl w-full mx-auto overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
      <ToastViewport />
      <NotificationScheduler />
      <AlarmScheduler />
      <FloatingJarvis />
      <VoiceMode />
    </div>
  );
}



