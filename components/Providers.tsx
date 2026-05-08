'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { auth, database } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';

export function Providers({ children }: { children: React.ReactNode }) {
  const setUser = useStore((state) => state.setUser);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsHydrated(true), 0);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Build user object
        const userData = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        };
        setUser(userData);

        // Check if user exists in database, if not create
        const userRef = ref(database, `users/${currentUser.uid}`);
        get(userRef).then((snapshot) => {
          if (!snapshot.exists()) {
            set(userRef, {
              name: currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              createdAt: new Date().toISOString(),
            });
          }
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  if (!isHydrated) return null; // Avoid hydration mismatch

  return <>{children}</>;
}
