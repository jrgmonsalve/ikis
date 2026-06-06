import { Injectable, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { firebaseAuth, firestore } from '../firebase/firebase';
import { I18nService } from '../i18n/i18n.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly i18n = inject(I18nService);
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly readySignal = signal(false);
  private readyResolver: (() => void) | null = null;
  private readonly readyPromise = new Promise<void>((resolve) => {
    this.readyResolver = resolve;
  });

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly ready = this.readySignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor() {
    void this.initializeAuthState();
  }

  async waitUntilReady(): Promise<void> {
    if (this.readySignal()) {
      return;
    }

    await this.readyPromise;
  }

  async signInWithGoogle(): Promise<void> {
    await setPersistence(firebaseAuth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(firebaseAuth, provider);
  }

  async signInForDevelopment(): Promise<void> {
    await setPersistence(firebaseAuth, browserLocalPersistence);
    await signInAnonymously(firebaseAuth);
  }

  async signOut(): Promise<void> {
    await signOut(firebaseAuth);
  }

  private async initializeAuthState(): Promise<void> {
    await setPersistence(firebaseAuth, browserLocalPersistence);

    onAuthStateChanged(firebaseAuth, async (user) => {
      this.currentUserSignal.set(user);

      try {
        if (user) {
          await this.ensureUserProfile(user);
        }
      } catch (error) {
        console.warn('Unable to synchronize the user profile with Firestore.', error);
      } finally {
        this.readySignal.set(true);
        this.readyResolver?.();
      }
    });
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

    this.i18n.setLanguage(snapshot.data()['preferredLanguage'] === 'en' ? 'en' : 'es');

    await updateDoc(userRef, {
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  }
}
