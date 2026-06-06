import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

import { environment } from '../../../environments/environment';

const firebaseApp = initializeApp(environment.firebase);

export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp);

if (environment.useEmulators) {
  connectAuthEmulator(firebaseAuth, `http://${environment.emulators.auth.host}:${environment.emulators.auth.port}`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(firestore, environment.emulators.firestore.host, environment.emulators.firestore.port);
  connectFunctionsEmulator(functions, environment.emulators.functions.host, environment.emulators.functions.port);
}
