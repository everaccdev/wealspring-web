// Wealspring's Firebase project (never Whisp's life-signs-be094), for the
// browser. Only Auth is used here: the account email links on /auth/action.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const config = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId);

export const auth = isFirebaseConfigured
  ? getAuth(getApps().length ? getApp() : initializeApp(config))
  : null;
