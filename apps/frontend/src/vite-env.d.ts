/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_SOCKET_URL?: string
  readonly VITE_API_TIMEOUT?: string
  readonly VITE_PORT?: string
  readonly VITE_HOST?: string
  readonly VITE_HTTPS?: string
  readonly VITE_PROXY_SECURE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
