<template>
    <v-card class="pa-4" outlined>
        <v-card-text class="text-center">
            <v-btn color="primary" @click="selectStore"> 選擇超商 (7-11) </v-btn>
        </v-card-text>
    </v-card>
</template>

<script>
import axios from "axios";

export default {
    name: "RetailModal",
    methods: {
        async selectStore() {
            try {
                // 從 .env 取得 callback domain 與 api domain
                const callbackDomain = import.meta.env.VITE_WAASHIP_CALLBACK_URL;
                const apiDomain = import.meta.env.VITE_WAASHIP_URL;
                // 組出 callback URL，例如：https://buyeastern.xyz/api/waaship/buyeastern.xyz/callback
                const callback_url = `https://${apiDomain}/api/waaship/${callbackDomain}/callback`;

                // 準備要傳給後端的參數（後端再轉發給 Waaship）
                const body = {
                    store_type: "seven_eleven", // 或 family_mart, hi_life
                    callback_url, // 使用從 .env 取得並組好的 URL
                    callback_data: "orderData", // 可放訂單相關資料
                    device_type: "pc", // 或 "mobile"
                    shop_collection: 1, // 只適用於7-11
                    pickup_payment: true, // 只適用於7-11
                    response_in_params: true,
                };

                // 呼叫自己的後端 API，而非直接呼叫 Waaship
                const response = await axios.post(
                    "https://buyeastern.xyz/api/waaship/select-store",
                    body,
                    {
                        responseType: "text", // 後端回傳 HTML
                    }
                );

                // 將後端轉發回來的 HTML 寫到新開視窗
                const newWindow = window.open("", "_blank");
                newWindow.document.open();
                newWindow.document.write(response.data);
                newWindow.document.close();
            } catch (error) {
                console.error("選擇門市失敗：", error);
                alert("選擇門市失敗，請稍後再試");
            }
        },
    },
};
</script>

<style scoped>
/* 如果需要額外客製化樣式，可在此加入 */
</style>
