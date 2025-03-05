<template>
    <v-app>
        <v-container class="py-8">
            <v-card>
                <v-card-title class="headline">我的訂單</v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                    <!-- 訂單 Tabs 標籤 -->
                    <v-tabs v-model="activeTab" background-color="primary" dark>
                        <v-tab
                            v-for="(tab, index) in tabs"
                            :key="tab.value"
                            :value="tab.value"
                            :disabled="tab.value !== 'all' && countOrders(tab.value) === 0"
                        >
                            {{ tab.text }} ({{
                                tab.value === "all" ? orders.length : countOrders(tab.value)
                            }})
                        </v-tab>
                    </v-tabs>
                    <!-- 分頁內容 -->
                    <v-tabs-window v-model="activeTab">
                        <v-tabs-window-item
                            v-for="(tab, index) in tabs"
                            :key="tab.value"
                            :value="tab.value"
                        >
                            <v-data-table
                                :headers="headers"
                                :items="filteredOrders(tab.value)"
                                :items-per-page="5"
                                class="elevation-1"
                                :loading="loading"
                                loading-text="載入中..."
                            >
                                <template v-slot:item.created_at="{ item }">
                                    {{ formatDate(item.created_at) }}
                                </template>
                                <template v-slot:item.order_status="{ item }">
                                    {{ item.order_status }}
                                </template>
                                <template v-slot:item.tracking_number="{ item }">
                                    <span v-if="item.tracking_number">{{
                                        item.tracking_number
                                    }}</span>
                                    <span v-else>未填寫</span>
                                </template>
                                <template v-slot:item.actions="{ item }">
                                    <v-btn color="primary" small @click="viewOrder(item.id)">
                                        查看詳情
                                    </v-btn>
                                </template>
                            </v-data-table>
                        </v-tabs-window-item>
                    </v-tabs-window>
                </v-card-text>
            </v-card>
        </v-container>
    </v-app>
</template>

<script>
import axios from "axios";
export default {
    name: "MyOrders",
    data() {
        return {
            orders: [],
            loading: false,
            headers: [
                { title: "訂單編號", key: "id" },
                { title: "取件姓名", key: "customer_name" },
                { title: "取件電話", key: "phone" },
                { title: "超商", key: "store_name" },
                { title: "狀態", key: "order_status" },
                { title: "建立日期", key: "created_at" },
                { title: "貨運單號", key: "tracking_number" },
                { title: "操作", key: "actions", sortable: false },
            ],
            activeTab: "all",
            // tabs 順序為全部、等待處理、處理中、運輸中、完成、取消
            tabs: [
                { value: "all", text: "全部" },
                { value: "pending", text: "等待處理" },
                { value: "processing", text: "處理中" },
                { value: "shipping", text: "運輸中" },
                { value: "completed", text: "完成" },
                { value: "cancelled", text: "取消" },
            ],
        };
    },
    methods: {
        async fetchUser() {
            try {
                const response = await axios.get(`${this.$backendUrl}/api/auth/me`, {
                    withCredentials: true,
                });
                if (response.data && response.data.user) {
                    // 將後端回傳的使用者資料合併到 this.user
                    this.user = {
                        ...this.user,
                        ...response.data.user,
                    };
                }
            } catch (error) {
                console.error("取得個人資料失敗：", error);
                alert("請先登入！");
                this.$router.push("/login");
            }
        },
        async fetchMyOrders() {
            this.loading = true;
            try {
                const response = await axios.get(`${this.$backendUrl}/api/orders/my`, {
                    withCredentials: true,
                });
                if (response.data && response.data.orders) {
                    this.orders = response.data.orders;
                }
            } catch (error) {
                console.error("取得訂單失敗：", error);
            } finally {
                this.loading = false;
            }
        },
        // 回傳指定狀態的訂單數量
        countOrders(status) {
            return this.orders.filter((order) => order.order_status === status).length;
        },
        // 根據 tab 過濾訂單；若 tab 為 all 則回傳全部訂單
        filteredOrders(tabValue) {
            if (tabValue === "all") {
                return this.orders;
            }
            return this.orders.filter((order) => order.order_status === tabValue);
        },
        formatDate(dateStr) {
            const options = {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            };
            return new Date(dateStr).toLocaleDateString("zh-TW", options);
        },
        viewOrder(orderId) {
            this.$router.push(`/order/${orderId}`);
        },
    },
    mounted() {
        this.fetchUser();
        this.fetchMyOrders();
    },
};
</script>

<style scoped>
/* 如有需要請自行調整樣式 */
</style>
