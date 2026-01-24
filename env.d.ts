/// <reference types="astro/client" />
/// <reference types="vite/client" />

export {};

declare global {
  interface ImportMetaEnv {
    readonly DEV: boolean;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
