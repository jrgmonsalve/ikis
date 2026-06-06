export const environment = {
  useEmulators: false,
  production: true,
  firebase: {
    apiKey: 'AIzaSyB91Q0yVJz1J-e-KUk2YG4bUTHuQt1Jywk',
    authDomain: 'ikis-5fed9.firebaseapp.com',
    projectId: 'ikis-5fed9',
    storageBucket: 'ikis-5fed9.firebasestorage.app',
    messagingSenderId: '802368966666',
    appId: '1:802368966666:web:fbf4ae34870c313135cff3',
    measurementId: 'G-E8LRT7BK83',
  },
  emulators: {
    auth: { host: 'localhost', port: 9099 },
    firestore: { host: 'localhost', port: 8081 },
    functions: { host: 'localhost', port: 5001 },
  },
};
