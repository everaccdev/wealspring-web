/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_FIREBASE_API_KEY: string;
  readonly PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  readonly PUBLIC_FIREBASE_PROJECT_ID: string;
  readonly STRIPE_SECRET_KEY: string;
  readonly STRIPE_FOUNDERS_MONTHLY_PRICE: string;
  readonly STRIPE_FOUNDERS_ANNUAL_PRICE: string;
  readonly STRIPE_BUNDLE_MONTHLY_PRICE: string;
  readonly STRIPE_BUNDLE_ANNUAL_PRICE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
