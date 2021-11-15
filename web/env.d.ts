/// <reference types="vite/client" />

interface ImportMetaEnv extends Readonly<Record<string, string>> {
    readonly VITE_NETWORK: string
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}