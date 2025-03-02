<template>
    <v-app>
        <v-container>
            <!-- 頂部按鈕 -->
            <v-row class="mb-4" justify="space-between">
                <v-col cols="12" md="6">
                    <v-btn color="primary" @click="$router.push('/collect')" class="mr-2">
                        1688採集上架
                    </v-btn>
                    <v-btn color="secondary" @click="$router.push('/productCreate')" class="mr-2">
                        手動採集上架
                    </v-btn>
                    <v-btn color="warning" @click="$router.push('/CategoryEdit')">
                        類別編輯
                    </v-btn>
                </v-col>
                <v-col cols="12" md="6" class="text-right">
                    <v-btn color="info" @click="fetchOrders"> 重新整理訂單 </v-btn>
                </v-col>
            </v-row>

            <!-- 管理員驗證狀態 -->
            <div v-if="!adminUser && !loading">
                <p>您沒有管理員權限！</p>
            </div>

            <!-- 訂單分組顯示 -->
            <v-expansion-panels v-if="adminUser" multiple>
                <v-expansion-panel v-for="(orders, status) in groupedOrders" :key="status">
                    <v-expansion-panel-title>
                        {{ status }} ({{ orders.length }})
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <v-data-table
                            :headers="orderHeaders"
                            :items="orders"
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
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>

            <v-row v-if="loading" justify="center">
                <v-col cols="12" class="text-center">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </v-col>
            </v-row>
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
            // 儲存每筆訂單目前所選的狀態，預設以物件儲存： { orderId: status }
            statusSelections: {},
            // 下拉選單選項： value 為資料庫中的狀態，text 為顯示文字
            statusOptions: [
                { value: "pending", text: "等待處理" },
                { value: "processing", text: "處理中" },
                { value: "completed", text: "完成" },
                { value: "cancelled", text: "取消" },
            ],
        };
    },
    computed: {
        groupedOrders() {
            // 將 orders 依據 order_status 分組
            return this.orders.reduce((groups, order) => {
                const status = order.order_status || "unknown";
                if (!groups[status]) groups[status] = [];
                groups[status].push(order);
                return groups;
            }, {});
        },
    },
    methods: {
        async fetchAdminUser() {
            this.loading = true;
            try {
                // 呼叫後端管理員驗證 API (使用 /api/admin/me)
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
                    // 初始化 statusSelections
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
            return new Date(dateStr).toLocaleDateString("zh-TW", options);
        },
        viewOrder(orderId) {
            this.$router.push(`/order/${orderId}`);
        },
        async updateStatus(orderId, newStatus) {
            if (!newStatus) {
                alert("請選擇訂單狀態");
                return;
            }
            try {
                await axios.put(
                    `${this.$backendUrl}/api/admin/orders/${orderId}/status`,
                    { order_status: newStatus },
                    { withCredentials: true }
                );
                alert("訂單狀態更新成功");
                this.fetchOrders();
            } catch (error) {
                console.error("更新訂單狀態失敗：", error);
                alert("更新訂單狀態失敗");
            }
        },
    },
    async mounted() {
        await this.fetchAdminUser();
        if (this.adminUser) {
            this.fetchOrders();
        }
    },
};
</script>

<style scoped>
/* 根據需求調整樣式 */
</style>
