import { Injectable, computed, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { firebaseAuth, firestore } from '../firebase/firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly readySignal = signal(false);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly ready = this.readySignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor() {
    onAuthStateChanged(firebaseAuth, async (user) => {
      this.currentUserSignal.set(user);
      if (user) {
        await this.ensureUserProfile(user);
      }
      this.readySignal.set(true);
    });
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(firebaseAuth, provider);
  }

  async signOut(): Promise<void> {
    await signOut(firebaseAuth);
  }

  private async ensureUserProfile(user: User): Promise<void> {
    const userRef = doc(firestore, `users/${user.uid}`);
    const snapshot = await getDoc(userRef);
    const providerId = user.providerData[0]?.uid ?? user.uid;

    if (!snapshot.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        googleProviderId: providerId,
        email: user.email ?? '',
        displayName: user.displayName ?? user.email ?? 'IKIS user',
        photoUrl: user.photoURL ?? null,
        preferredLanguage: 'es',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        status: 'active',
      });
      return;
    }

    await updateDoc(userRef, {
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  }
}
