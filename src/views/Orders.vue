<template>
    <v-app>
        <v-container class="py-8">
            <v-card>
                <v-card-title class="headline">我的訂單</v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                    <v-data-table
                        :headers="headers"
                        :items="orders"
                        :items-per-page="5"
                        class="elevation-1"
                        :loading="loading"
                        loading-text="載入中..."
                    >
                        <template v-slot:item.created_at="{ item }">
                            {{ formatDate(item.created_at) }}
                        </template>
                        <template v-slot:item.tracking_number="{ item }">
                            <span v-if="item.tracking_number">{{ item.tracking_number }}</span>
                            <span v-else>未填寫</span>
                        </template>
                        <template v-slot:item.actions="{ item }">
                            <v-btn color="primary" small @click="viewOrder(item.id)"
                                >查看詳情</v-btn
                            >
                        </template>
                    </v-data-table>
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
                { title: "建立日期", key: "created_at" },
                { title: "貨運單號", key: "tracking_number" },
                { title: "操作", key: "actions", sortable: false },
            ],
        };
    },
    methods: {
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
                // 根據需求顯示錯誤訊息，例如使用 snackbar
            } finally {
                this.loading = false;
            }
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
            // 依需求導向訂單詳情頁
            this.$router.push(`/order/${orderId}`);
        },
    },
    mounted() {
        this.fetchMyOrders();
    },
};
</script>

<style scoped>
/* 根據需求自定義樣式 */
</style>
