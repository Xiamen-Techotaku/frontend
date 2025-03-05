<template>
    <v-app>
        <v-container>
            <!-- 返回按鈕 -->
            <v-btn color="primary" class="mb-4" @click="$router.back()">返回</v-btn>

            <v-card>
                <v-card-title class="headline">訂單詳情</v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                    <div v-if="loading" class="text-center">
                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    </div>
                    <div v-else>
                        <!-- 訂單基本資訊 -->
                        <v-list two-line>
                            <v-list-item>
                                <v-list-item-content>
                                    <v-list-item-title>訂單編號：{{ order.id }}</v-list-item-title>
                                    <v-list-item-subtitle>
                                        建立日期：{{ formatDate(order.created_at) }}
                                    </v-list-item-subtitle>
                                </v-list-item-content>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-content>
                                    <v-list-item-title
                                        >取件姓名：{{ order.customer_name }}</v-list-item-title
                                    >
                                    <v-list-item-subtitle
                                        >取件電話：{{ order.phone }}</v-list-item-subtitle
                                    >
                                </v-list-item-content>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-content>
                                    <v-list-item-title
                                        >超商：{{ order.store_name }}</v-list-item-title
                                    >
                                    <v-list-item-subtitle>
                                        貨運單號：
                                        <span v-if="order.tracking_number">{{
                                            order.tracking_number
                                        }}</span>
                                        <span v-else>未填寫</span>
                                    </v-list-item-subtitle>
                                </v-list-item-content>
                            </v-list-item>
                        </v-list>

                        <v-divider class="my-4"></v-divider>

                        <!-- 訂單項目列表 -->
                        <v-card-subtitle>訂單項目</v-card-subtitle>
                        <v-data-table
                            :headers="itemHeaders"
                            :items="orderItems"
                            :items-per-page="5"
                            class="elevation-1"
                        >
                            <template #item.productImage="{ item }">
                                <v-img
                                    :src="item.productImage"
                                    width="150"
                                    height="150"
                                    contain
                                ></v-img>
                            </template>
                            <template #item.productName="{ item }">
                                {{ item.productName }}
                            </template>
                            <template #item.remark="{ item }">
                                {{ formatRemark(item) }}
                            </template>
                            <template #item.quantity="{ item }">
                                {{ item.quantity }}
                            </template>
                            <template #item.unit_price="{ item }">
                                {{ formatPrice(item.unit_price) }}
                            </template>
                            <template #item.subtotal="{ item }">
                                {{ formatPrice(item.unit_price * item.quantity) }}
                            </template>
                        </v-data-table>

                        <!-- 如果是 admin，就顯示輸入單號的區塊 -->
                        <div v-if="isAdmin" class="mt-4">
                            <v-divider class="my-2"></v-divider>
                            <v-text-field
                                label="輸入或更新貨運單號"
                                v-model="newTrackingNumber"
                                outlined
                                hide-details
                            ></v-text-field>
                            <v-btn color="primary" @click="updateTrackingNumber">更新單號</v-btn>
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-container>
    </v-app>
</template>

<script>
import axios from "axios";

export default {
    name: "OrderDetail",
    data() {
        return {
            order: {},
            orderItems: [],
            loading: false,
            isAdmin: false,
            newTrackingNumber: "",
            // 更新後的 itemHeaders，備註欄位將呈現規格與選項資訊
            itemHeaders: [
                { title: "商品圖", key: "productImage" },
                { title: "商品名稱", key: "productName" },
                { title: "備註", key: "remark" },
                { title: "數量", key: "quantity" },
                { title: "單價", key: "unit_price" },
                { title: "小計", key: "subtotal" },
            ],
        };
    },
    methods: {
        async fetchOrderDetail() {
            this.loading = true;
            try {
                const orderId = this.$route.params.id;
                const response = await axios.get(`${this.$backendUrl}/api/orders/${orderId}`, {
                    withCredentials: true,
                });
                console.log(response.data);
                if (response.data) {
                    this.order = response.data.order;
                    this.orderItems = response.data.orderItems || [];
                    // 取得每筆訂單項目的商品詳細資料
                    await Promise.all(
                        this.orderItems.map(async (item) => {
                            try {
                                const prodRes = await axios.get(
                                    `${this.$backendUrl}/api/products/${item.product_id}`,
                                    { withCredentials: true }
                                );
                                if (prodRes.data && prodRes.data.product) {
                                    const product = prodRes.data.product;
                                    item.productName = product.name;
                                    if (product.images && product.images.length > 0) {
                                        item.productImage = product.images[0].image_url;
                                    } else {
                                        item.productImage =
                                            "https://via.placeholder.com/80?text=No+Image";
                                    }
                                } else {
                                    item.productName = "未知商品";
                                    item.productImage =
                                        "https://via.placeholder.com/80?text=No+Image";
                                }
                            } catch (error) {
                                console.error(`取得產品 ${item.product_id} 詳細資料失敗：`, error);
                                item.productName = "未知商品";
                                item.productImage = "https://via.placeholder.com/80?text=No+Image";
                            }
                        })
                    );
                }
            } catch (error) {
                console.error("取得訂單詳情失敗：", error);
            } finally {
                this.loading = false;
            }
        },
        async updateTrackingNumber() {
            if (!this.newTrackingNumber) {
                alert("請輸入貨運單號");
                return;
            }
            try {
                const orderId = this.order.id;
                await axios.put(
                    `${this.$backendUrl}/api/admin/orders/${orderId}/tracking`,
                    { tracking_number: this.newTrackingNumber },
                    { withCredentials: true }
                );
                alert("單號更新成功");
                this.newTrackingNumber = "";
                this.fetchOrderDetail();
            } catch (error) {
                console.error("更新單號失敗：", error);
                alert("更新單號失敗，請稍後再試");
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
        formatPrice(value) {
            return `$${parseFloat(value).toFixed(2)}`;
        },
        // 將 spec 與 option 合併為備註內容
        formatRemark(item) {
            const remarks = [];
            if (item.spec_name) {
                remarks.push(`規格: ${item.spec_name}`);
            }
            if (item.option_name && item.option_value) {
                remarks.push(`選項: ${item.option_name}:${item.option_value}`);
            }
            return remarks.join("； ");
        },
    },
    async mounted() {
        // 檢查是否為 admin (依需求調整)
        try {
            const meRes = await axios.get(`${this.$backendUrl}/api/auth/me`, {
                withCredentials: true,
            });
            if (meRes.data && meRes.data.user && meRes.data.user.is_admin) {
                this.isAdmin = true;
            }
        } catch (e) {
            console.error("取得使用者資訊失敗：", e);
        }
        this.fetchOrderDetail();
    },
};
</script>

<style scoped>
/* 可根據需求進一步自定義樣式 */
</style>
