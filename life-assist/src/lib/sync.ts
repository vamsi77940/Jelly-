import { create } from 'zustand';
import {
  signInAnonymously,
  onAuthStateChanged,
  EmailAuthProvider,
  linkWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import {
  isFirebaseConfigured,
  getFirebaseAuth,
  getFirebaseFirestore,
} from './firebase';
import {
  db,
  writeJSONFromSync,
  rehydrateAllStores,
  addStorageChangeListener,
  clearAllData,
} from './storage';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface SyncState {
  isConfigured: boolean;
  syncStatus: SyncStatus;
  userId: string | null;
  email: string | null;
  isAnonymous: boolean;
  syncNow: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((_set, get) => ({
  isConfigured: false,
  syncStatus: 'idle',
  userId: null,
  email: null,
  isAnonymous: true,
  syncNow: async () => {
    const { userId, syncStatus } = get();
    if (!userId || syncStatus === 'offline') return;
    await performTwoWaySync(userId);
  },
  signUp: async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Authentication is not configured.');

    const currentUser = auth.currentUser;
    if (currentUser && currentUser.isAnonymous) {
      // Elevate the current anonymous user account to credentials to preserve local data
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(currentUser, credential);
    } else {
      // Otherwise create a fresh credentials user
      await createUserWithEmailAndPassword(auth, email, password);
    }
  },
  logIn: async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Authentication is not configured.');

    // Clear local database before sign-in to protect privacy and prevent data leakage/mixing
    await clearAllData();
    // Perform log in
    await signInWithEmailAndPassword(auth, email, password);
  },
  logOut: async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Authentication is not configured.');

    // Clear local database before logging out
    await clearAllData();
    // Perform sign out
    await signOut(auth);
  },
}));

let isSyncRunning = false;
let changeListenerUnsubscribe: (() => void) | null = null;

export function initializeSync(): void {
  if (!isFirebaseConfigured()) {
    useSyncStore.setState({ isConfigured: false });
    return;
  }

  useSyncStore.setState({ isConfigured: true });

  const auth = getFirebaseAuth();
  if (!auth) return;

  // Handle online/offline events
  const updateOnlineStatus = () => {
    if (!navigator.onLine) {
      useSyncStore.setState({ syncStatus: 'offline' });
    } else {
      useSyncStore.setState({ syncStatus: 'idle' });
      const { userId } = useSyncStore.getState();
      if (userId) {
        performTwoWaySync(userId).catch(console.error);
      }
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  if (!navigator.onLine) {
    useSyncStore.setState({ syncStatus: 'offline' });
  }

  // Setup auth listener
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      useSyncStore.setState({
        userId: user.uid,
        email: user.email || null,
        isAnonymous: user.isAnonymous,
      });
      // Start background change listener
      setupBackgroundSyncListener(user.uid);
      // Run initial sync
      if (navigator.onLine) {
        await performTwoWaySync(user.uid);
      }
    } else {
      useSyncStore.setState({
        userId: null,
        email: null,
        isAnonymous: true,
      });
      // Stop change listener
      if (changeListenerUnsubscribe) {
        changeListenerUnsubscribe();
        changeListenerUnsubscribe = null;
      }
      // Attempt anonymous sign in
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error('[sync] Anonymous sign in failed:', err);
        useSyncStore.setState({ syncStatus: 'error' });
      }
    }
  });
}

async function performTwoWaySync(uid: string): Promise<void> {
  if (isSyncRunning) return;
  isSyncRunning = true;
  useSyncStore.setState({ syncStatus: 'syncing' });

  try {
    const firestore = getFirebaseFirestore();
    if (!firestore) throw new Error('Firestore not initialized');

    // 1. Fetch remote data from Firestore
    const colRef = collection(firestore, 'users', uid, 'data');
    const snapshot = await getDocs(colRef);
    const remoteData = new Map<string, { value: unknown; updatedAt: number }>();
    
    snapshot.forEach((d) => {
      const data = d.data();
      if (data && typeof data.updatedAt === 'number') {
        remoteData.set(d.id, {
          value: data.value,
          updatedAt: data.updatedAt,
        });
      }
    });

    // 2. Fetch local data from Dexie
    const localRows = await db.kv.toArray();
    const localData = new Map<string, { value: unknown; updatedAt: number }>();
    localRows.forEach((row) => {
      // Ignore migration markers and system keys
      if (!row.key.startsWith('__')) {
        localData.set(row.key, {
          value: row.value,
          updatedAt: row.updatedAt ?? 0,
        });
      }
    });

    let hasLocalUpdates = false;

    // 3. Compare local items
    for (const [key, local] of localData.entries()) {
      const remote = remoteData.get(key);

      if (remote) {
        if (local.updatedAt > remote.updatedAt) {
          // Local is newer: upload to remote
          await setDoc(doc(firestore, 'users', uid, 'data', key), {
            value: local.value,
            updatedAt: local.updatedAt,
          });
        } else if (remote.updatedAt > local.updatedAt) {
          // Remote is newer: update local
          await writeJSONFromSync(key, remote.value, remote.updatedAt);
          hasLocalUpdates = true;
        }
      } else {
        // Remote doesn't have it: upload local to remote
        await setDoc(doc(firestore, 'users', uid, 'data', key), {
          value: local.value,
          updatedAt: local.updatedAt,
        });
      }
    }

    // 4. Check for remote items that local doesn't have
    for (const [key, remote] of remoteData.entries()) {
      if (!localData.has(key)) {
        await writeJSONFromSync(key, remote.value, remote.updatedAt);
        hasLocalUpdates = true;
      }
    }

    // 5. If we modified local database, hot-reload the stores
    if (hasLocalUpdates) {
      rehydrateAllStores();
    }

    useSyncStore.setState({ syncStatus: 'synced' });
  } catch (err) {
    console.error('[sync] Two-way sync failed:', err);
    useSyncStore.setState({ syncStatus: 'error' });
  } finally {
    isSyncRunning = false;
  }
}

function setupBackgroundSyncListener(uid: string): void {
  if (changeListenerUnsubscribe) {
    changeListenerUnsubscribe();
  }

  // Hook into storage writes to push to firestore in real time
  changeListenerUnsubscribe = addStorageChangeListener((name, value, updatedAt) => {
    // Ignore internal keys
    if (name.startsWith('__')) return;

    if (!navigator.onLine) {
      useSyncStore.setState({ syncStatus: 'offline' });
      return;
    }

    const firestore = getFirebaseFirestore();
    if (!firestore) return;

    setDoc(doc(firestore, 'users', uid, 'data', name), {
      value,
      updatedAt,
    }).catch((err) => {
      console.error(`[sync] Failed to push "${name}" to firestore`, err);
      useSyncStore.setState({ syncStatus: 'error' });
    });
  });
}
