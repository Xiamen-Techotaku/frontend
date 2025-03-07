<template>
    <v-container class="py-8">
        <v-row justify="center">
            <v-col cols="12" md="8">
                <v-card>
                    <v-card-title class="headline">結帳</v-card-title>
                    <v-card-text>
                        <v-form ref="orderForm" @submit.prevent="submitOrder">
                            <!-- 取件姓名 -->
                            <v-text-field
                                label="姓名"
                                v-model="customerName"
                                required
                            ></v-text-field>
                            <!-- 取件電話 -->
                            <v-text-field label="手機號碼" v-model="phone" required></v-text-field>
                            <!-- 發送驗證碼按鈕 -->
                            <v-btn
                                color="info"
                                @click="sendVerificationCode"
                                :disabled="sendingCode || !phoneValid || countdown > 0"
                            >
                                {{
                                    countdown > 0
                                        ? `請等待 ${countdown} 秒`
                                        : sendingCode
                                        ? "發送中..."
                                        : "發送驗證碼"
                                }}
                            </v-btn>
                            <!-- 驗證碼輸入與驗證按鈕 -->
                            <v-row v-if="verificationCodeSent" class="mt-2" align="center">
                                <v-col cols="6">
                                    <v-text-field
                                        label="請輸入驗證碼"
                                        v-model="userVerificationCode"
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="6">
                                    <v-btn
                                        color="success"
                                        @click="verifyCode"
                                        :disabled="isPhoneVerified"
                                    >
                                        驗證手機
                                    </v-btn>
                                </v-col>
                            </v-row>
                            <!-- 驗證結果提示 -->
                            <v-alert v-if="isPhoneVerified" type="success" class="mt-2" dense>
                                手機驗證成功
                            </v-alert>
                            <!-- 超商資訊 -->
                            <v-row class="my-4" align="center">
                                <v-col cols="12" sm="8">
                                    <div v-if="selectedStore && selectedStore.store_name">
                                        <div>
                                            <strong>{{ selectedStore.store_name }}</strong>
                                        </div>
                                    </div>
                                    <div v-else>請選擇超商</div>
                                </v-col>
                                <v-col cols="12" sm="4">
                                    <v-btn color="primary" @click="openRetailModal">
                                        選擇超商
                                    </v-btn>
                                </v-col>
                            </v-row>
                            <!-- 提交訂單按鈕 -->
                            <v-btn type="submit" color="success" :loading="loading">
                                提交訂單
                            </v-btn>
                        </v-form>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <!-- RetailModal 組件 -->
        <RetailModal
            v-if="showRetailModal"
            @close="showRetailModal = false"
            @select-store="onSelectStore"
        />
        <!-- 全屏訂單成功提示 Dialog -->
        <v-dialog
            v-model="orderSuccessDialog"
            fullscreen
            hide-overlay
            transition="dialog-bottom-transition"
            persistent
        >
            <v-card>
                <v-toolbar dark color="primary">
                    <v-btn icon dark @click="closeSuccessDialog">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <v-toolbar-title>訂單成功</v-toolbar-title>
                </v-toolbar>
                <v-card-text class="text-center">
                    <div class="display-1 mb-6">{{ orderSuccessMessage }}</div>
                    <v-btn color="primary" @click="closeSuccessDialog"> 確認 </v-btn>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script>
import axios from "axios";
import RetailModal from "../components/RetailModal.vue"; // 請根據實際路徑調整

export default {
    name: "Checkout",
    components: { RetailModal },
    data() {
        return {
            customerName: "",
            phone: "",
            selectedStore: null,
            showRetailModal: false,
            loading: false,
            orderSuccessDialog: false,
            orderSuccessMessage: "",
            // 手機驗證相關變數
            userVerificationCode: "",
            isPhoneVerified: false,
            sendingCode: false,
            verificationCodeSent: false,
            countdown: 0, // 倒數秒數
            countdownInterval: null,
        };
    },
    computed: {
        // 檢查手機格式是否正確 (09開頭的十碼數字)
        phoneValid() {
            const phoneRegex = /^09\d{8}$/;
            return phoneRegex.test(this.phone);
        },
    },
    methods: {
        openRetailModal() {
            this.showRetailModal = true;
        },
        // 當 RetailModal 傳出超商資料時
        onSelectStore(store) {
            console.log("onSelectStore 收到資料：", store);
            if (store && store.store_id && store.store_name) {
                this.selectedStore = {
                    store_id: Number(store.store_id),
                    store_name: store.store_name,
                };
            } else {
                console.error("收到的超商資料不完整：", store);
            }
            this.showRetailModal = false;
        },
        // 發送驗證碼，呼叫後端 API
        async sendVerificationCode() {
            if (!this.phoneValid) {
                alert("請輸入正確的手機號碼");
                return;
            }
            this.sendingCode = true;
            try {
                const response = await axios.post(
                    `${this.$backendUrl}/api/auth/send-sms`,
                    { phone: this.phone },
                    { withCredentials: true }
                );
                alert(response.data.message || "驗證碼已發送");
                this.verificationCodeSent = true;
                // 啟動 60 秒倒數
                this.startCountdown();
            } catch (error) {
                console.error("發送驗證碼失敗：", error);
                alert("發送驗證碼失敗，請稍後再試");
            } finally {
                this.sendingCode = false;
            }
        },
        // 開始 60 秒倒數
        startCountdown() {
            this.countdown = 60;
            // 如果之前已經有倒數計時，先清除
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
            }
            this.countdownInterval = setInterval(() => {
                if (this.countdown > 0) {
                    this.countdown--;
                } else {
                    clearInterval(this.countdownInterval);
                    this.countdownInterval = null;
                }
            }, 1000);
        },
        // 驗證驗證碼，呼叫後端 API
        async verifyCode() {
            if (!this.userVerificationCode) {
                alert("請輸入驗證碼");
                return;
            }
            try {
                const response = await axios.post(
                    `${this.$backendUrl}/api/auth/verify-sms`,
                    { code: this.userVerificationCode, phone: this.phone },
                    { withCredentials: true }
                );
                alert(response.data.message || "手機驗證成功");
                this.isPhoneVerified = true;
            } catch (error) {
                console.error("驗證碼錯誤：", error);
                alert(error.response.data.error || "驗證碼錯誤");
                this.isPhoneVerified = false;
            }
        },
        async submitOrder() {
            console.log("submitOrder triggered");
            // 檢查必要欄位與手機驗證狀態
            if (!this.customerName || !this.phone || !this.selectedStore) {
                alert("請填寫所有必要欄位");
                return;
            }
            if (!this.phoneValid) {
                alert("請輸入有效的手機號碼");
                return;
            }
            if (!this.isPhoneVerified) {
                alert("請先完成手機驗證");
                return;
            }
            // 檢查超商資料是否完整
            if (!this.selectedStore.store_id || !this.selectedStore.store_name) {
                alert("超商資料不完整，請重新選擇");
                return;
            }
            this.loading = true;
            try {
                // 組成 payload
                const payload = {
                    customerName: this.customerName,
                    phone: this.phone,
                    store: {
                        store_id: Number(this.selectedStore.store_id),
                        store_name: this.selectedStore.store_name,
                    },
                };
                console.log("送出 payload：", payload);
                const response = await axios.post(`${this.$backendUrl}/api/orders`, payload, {
                    withCredentials: true,
                });
                console.log("後端回應：", response.data);
                if (response.data && response.data.orderId) {
                    this.orderSuccessMessage = `訂單建立成功，訂單編號：${response.data.orderId}`;
                } else {
                    this.orderSuccessMessage = "訂單建立成功，但未收到訂單編號";
                }
                // 顯示全屏提示
                this.orderSuccessDialog = true;
                // 清除表單與驗證資料
                this.customerName = "";
                this.phone = "";
                this.selectedStore = null;
                this.userVerificationCode = "";
                this.isPhoneVerified = false;
                this.verificationCodeSent = false;
            } catch (error) {
                console.error("提交訂單失敗：", error);
                alert("提交訂單失敗，請稍後再試");
            } finally {
                this.loading = false;
            }
        },
        // 當全屏提示關閉時導向 /orders
        closeSuccessDialog() {
            this.orderSuccessDialog = false;
            this.$router.push("/orders");
        },
        // 處理從 RetailModal 傳來的超商資料 (例如 window message)
        handleStoreMessage(event) {
            if (event && event.data && event.data.store_id && event.data.store_name) {
                console.log("handleStoreMessage 收到資料：", event.data);
                this.selectedStore = {
                    store_id: Number(event.data.store_id),
                    store_name: event.data.store_name,
                };
                this.showRetailModal = false;
            }
        },
    },
    mounted() {
        window.addEventListener("message", this.handleStoreMessage);
    },
    beforeUnmount() {
        window.removeEventListener("message", this.handleStoreMessage);
    },
};
</script>

<style scoped>
/* 可根據需要調整樣式 */
</style>
