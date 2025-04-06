// src/entry-server.js
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import App from "./App.vue";
import { createHead } from "@vueuse/head";

export async function render(url, manifest) {
    const app = createSSRApp(App);
    const head = createHead();
    app.use(head);

    // 如果你有使用 router，要在這裡初始化 router 並跳轉到 url
    // 例如：
    import { createRouter } from './router'
    const router = createRouter()
    app.use(router)
    await router.push(url)
    await router.isReady()

    const appContent = await renderToString(app);
    const headTags = head.renderTags(); // 收集 meta、title 等

    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        ${headTags}
      </head>
      <body>
        <div id="app">${appContent}</div>
        <script type="module" src="/src/entry-client.js"></script>
      </body>
    </html>
  `;
}
