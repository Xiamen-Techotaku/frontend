<template>
    <v-app>
        <v-container>
            <!-- 頂部按鈕 -->
            <v-row class="mb-4" justify="space-between">
                <v-col cols="12" md="6">
                    <v-btn color="primary" @click="$router.push('/collect')" class="mr-2">
                        自動採集上架
                    </v-btn>
                    <v-btn color="secondary" @click="$router.push('/productCreate')" class="mr-2">
                        手動採集上架
                    </v-btn>
                    <v-btn color="warning" @click="$router.push('/CategoryEdit')" class="mr-2">
                        類別編輯
                    </v-btn>
                    <v-btn color="success" @click="showReviewForm = true" class="mr-2">
                        增加評論
                    </v-btn>
                    <v-btn color="error" @click="showDeleteProductForm = true"> 刪除商品 </v-btn>
                </v-col>
                <v-col cols="12" md="6" class="text-right">
                    <v-btn color="info" @click="fetchOrders">重新整理訂單</v-btn>
                </v-col>
            </v-row>

            <!-- 管理員驗證狀態 -->
            <div v-if="!adminUser && !loading">
                <p>您沒有管理員權限！</p>
            </div>

            <!-- 訂單 Tabs 與資料表 -->
            <div v-if="adminUser">
                <!-- Tabs 標籤 -->
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
                            :headers="orderHeaders"
                            :items="filteredOrders(tab.value)"
                            class="elevation-1"
                            disable-sort
                        >
                            <template v-slot:item.created_at="{ item }">
                                {{ formatDate(item.created_at) }}
                            </template>
                            <template v-slot:item.actions="{ item }">
                                <v-btn color="primary" small @click="viewOrder(item.id)">
                                    查看詳情
                                </v-btn>
                                <v-select
                                    :items="statusOptions"
                                    v-model="statusSelections[item.id]"
                                    item-title="text"
                                    item-value="value"
                                    hide-details
                                    dense
                                />
                                <v-btn
                                    color="success"
                                    small
                                    @click="updateStatus(item.id, statusSelections[item.id])"
                                >
                                    更新
                                </v-btn>
                            </template>
                        </v-data-table>
                    </v-tabs-window-item>
                </v-tabs-window>
            </div>

            <!-- Loading 指示 -->
            <v-row v-if="loading" justify="center">
                <v-col cols="12" class="text-center">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </v-col>
            </v-row>

            <!-- 新增評論的對話框 -->
            <v-dialog v-model="showReviewForm" max-width="500">
                <v-card>
                    <v-card-title>
                        <span class="headline">新增評論</span>
                    </v-card-title>
                    <v-card-text>
                        <v-form ref="reviewFormRef">
                            <v-text-field
                                label="商品ID"
                                v-model="reviewForm.product_id"
                                type="number"
                                required
                            ></v-text-field>
                            <v-text-field
                                label="評論者名稱"
                                v-model="reviewForm.reviewer_name"
                                placeholder="可留空代表匿名"
                            ></v-text-field>
                            <v-textarea
                                label="評論內容"
                                v-model="reviewForm.content"
                                required
                            ></v-textarea>
                            <div class="my-2">
                                <span>評分：</span>
                                <v-rating
                                    v-model="reviewForm.rating"
                                    background-color="grey lighten-3"
                                    color="amber"
                                    large
                                ></v-rating>
                            </div>
                        </v-form>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="blue darken-1" text @click="showReviewForm = false">
                            取消
                        </v-btn>
                        <v-btn color="blue darken-1" text @click="submitReview"> 送出評論 </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <!-- 刪除商品的對話框 -->
            <v-dialog v-model="showDeleteProductForm" max-width="500">
                <v-card>
                    <v-card-title>
                        <span class="headline">刪除商品</span>
                    </v-card-title>
                    <v-card-text>
                        <v-form ref="deleteProductFormRef">
                            <v-text-field
                                label="商品ID"
                                v-model="deleteProductForm.productId"
                                type="number"
                                required
                            ></v-text-field>
                        </v-form>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="blue darken-1" text @click="showDeleteProductForm = false">
                            取消
                        </v-btn>
                        <v-btn color="blue darken-1" text @click="deleteProduct">確認刪除</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-container>
    </v-app>
</template>

<script>
import axios from "axios";
export default {
    name: "AdminDashboard",
    data() {
        return {
            adminUser: null,
            orders: [],
            loading: false,
            orderHeaders: [
                { title: "訂單編號", key: "id" },
                { title: "客戶姓名", key: "customer_name" },
                { title: "電話", key: "phone" },
                { title: "超商", key: "store_name" },
                { title: "狀態", key: "order_status" },
                { title: "建立日期", key: "created_at" },
                { title: "操作", key: "actions", sortable: false },
            ],
            statusSelections: {},
            statusOptions: [
                { value: "pending", text: "等待處理" },
                { value: "processing", text: "處理中" },
                { value: "shipping", text: "運輸中" },
                { value: "completed", text: "完成" },
                { value: "cancelled", text: "取消" },
            ],
            activeTab: "all",
            showReviewForm: false,
            reviewForm: {
                product_id: "",
                reviewer_name: "",
                content: "",
                rating: 5,
            },
            // 刪除商品對話框資料
            showDeleteProductForm: false,
            deleteProductForm: {
                productId: "",
            },
        };
    },
    computed: {
        tabs() {
            return [
                { value: "all", text: "全部" },
                ...this.statusOptions.map((option) => ({
                    value: option.value,
                    text: option.text,
                })),
            ];
        },
    },
    methods: {
        countOrders(status) {
            return this.orders.filter((order) => order.order_status === status).length;
        },
        filteredOrders(tabValue) {
            if (tabValue === "all") {
                return this.orders;
            }
            return this.orders.filter((order) => order.order_status === tabValue);
        },
        async fetchAdminUser() {
            this.loading = true;
            try {
                const response = await axios.get(`${this.$backendUrl}/api/admin/me`, {
                    withCredentials: true,
                });
                this.adminUser = response.data.user;
            } catch (error) {
                console.error("管理員驗證失敗：", error);
                this.$router.push("/");
            } finally {
                this.loading = false;
            }
        },
        async fetchOrders() {
            this.loading = true;
            try {
                const response = await axios.get(`${this.$backendUrl}/api/admin/orders`, {
                    withCredentials: true,
                });
                if (response.data && response.data.orders) {
                    this.orders = response.data.orders;
                    this.orders.forEach((order) => {
                        if (!this.statusSelections[order.id]) {
                            this.statusSelections[order.id] = order.order_status || "pending";
                        }
                    });
                }
            } catch (error) {
                console.error("取得所有訂單失敗：", error);
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
            return new Date(dateStr).toLocaleString("zh-TW", options);
        },
        async updateStatus(orderId, status) {
            try {
                await axios.put(
                    `${this.$backendUrl}/api/admin/orders/${orderId}`,
                    { order_status: status },
                    { withCredentials: true }
                );
                alert("訂單狀態更新成功！");
                this.fetchOrders(); // 重新取得訂單
            } catch (error) {
                console.error("更新訂單狀態失敗：", error);
            }
        },
        async deleteProduct() {
            try {
                await axios.delete(
                    `${this.$backendUrl}/api/products/${this.deleteProductForm.productId}`,
                    {
                        withCredentials: true,
                    }
                );
                alert("商品刪除成功");
                this.showDeleteProductForm = false;
                this.deleteProductForm.productId = "";
                this.fetchOrders(); // 重新整理訂單列表或其他商品相關操作
            } catch (error) {
                console.error("刪除商品失敗：", error);
                alert("刪除商品失敗");
            }
        },
    },
    mounted() {
        this.fetchAdminUser();
        this.fetchOrders();
    },
};
</script>

<style scoped>
/* 根據需要自定義樣式 */
</style>
