/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HOST_BACKEND: string
  readonly VITE_BASE_ROUTE: string
  readonly VITE_INSIGHTS_PROJECT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
