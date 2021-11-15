/// <reference types="vite/client" />

interface ImportMetaEnv extends Readonly<Record<string, string>> {
    readonly VITE_NETWORK: string // 构建时指定网络
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}