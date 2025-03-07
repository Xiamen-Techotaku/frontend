import { createApp } from "vue";
import { createHead } from "@vueuse/head";
import App from "./App.vue";
import router from "./router"; // 引入 router
import vuetify from "./plugins/vuetify.js";

const app = createApp(App); // 建立 app 實例
const head = createHead();

// 設定全域屬性
app.config.globalProperties.$backendUrl = import.meta.env.VITE_BACKEND_URL;
document.title = import.meta.env.VITE_SHOP_NAME;
app.use(router) // 使用 router
    .use(head)
    .use(vuetify)
    .mount("#app");
