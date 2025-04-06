import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    ssr: {
        // 例如，如果有需要外部化特定依賴可以在這裡設定
        noExternal: ["@vueuse/head"],
    },
    server: {
        port: 3000,
    },
});
