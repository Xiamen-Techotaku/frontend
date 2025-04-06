// src/entry-client.js
import { createApp } from "vue";
import App from "./App.vue";
import { createHead } from "@vueuse/head";

const app = createApp(App);
const head = createHead();
app.use(head);

// 如果你有 router，也要在這裡初始化
import { createRouter } from "./router";
const router = createRouter();
app.use(router);
router.isReady().then(() => {
    app.mount("#app");
});
