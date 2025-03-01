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
        <!-- RetailModal 組件，透過事件 select-store 傳回資料 -->
        <RetailModal
            v-if="showRetailModal"
            @close="showRetailModal = false"
            @select-store="onSelectStore"
        />
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
            // 預期格式：{ store_id: 數字, store_name: 字串 }
            selectedStore: null,
            showRetailModal: false,
            loading: false,
        };
    },
    methods: {
        openRetailModal() {
            this.showRetailModal = true;
        },
        // 當 RetailModal 傳出超商資料時（透過 $emit('select-store', store)）
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
        // 如果使用 popup 的 postMessage 傳回資料，也支援此方式
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
        async submitOrder() {
            console.log("submitOrder triggered");
            console.log("Backend URL:", this.$backendUrl);
            // 檢查必要欄位
            if (!this.customerName || !this.phone || !this.selectedStore) {
                this.$emit("showMessage", "請填寫所有必要欄位");
                return;
            }
            // 再次檢查超商資料是否完整
            if (!this.selectedStore.store_id || !this.selectedStore.store_name) {
                this.$emit("showMessage", "超商資料不完整，請重新選擇");
                return;
            }
            this.loading = true;
            try {
                // 組成 payload，確保 store_id 為數字
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
                    this.$emit("showMessage", `訂單建立成功，訂單編號：${response.data.orderId}`);
                } else {
                    this.$emit("showMessage", "訂單建立成功，但未收到訂單編號");
                }
                // 清除表單資料
                this.customerName = "";
                this.phone = "";
                this.selectedStore = null;
            } catch (error) {
                console.error("提交訂單失敗：", error);
                this.$emit("showMessage", "提交訂單失敗，請稍後再試");
            } finally {
                this.loading = false;
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
