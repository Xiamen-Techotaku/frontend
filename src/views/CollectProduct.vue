<template>
    <v-app>
        <v-container>
            <div v-if="loading" class="text-center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
            <div v-else>
                <div v-if="adminUser">
                    <v-btn color="primary" @click="$router.go(-1)" class="mb-4">返回</v-btn>
                    <v-tabs v-model="tab" background-color="primary" dark>
                        <v-tab value="one">1688採集</v-tab>
                        <v-tab value="two">京東採集</v-tab>
                    </v-tabs>
                    <v-tabs-window v-model="tab">
                        <v-tabs-window-item value="one">
                            <!-- 引入 1688 採集的子組件 -->
                            <CollectProduct1688
                                :categories="categories"
                                :backendUrl="$backendUrl"
                            />
                        </v-tabs-window-item>
                        <v-tabs-window-item value="two">
                            <!-- 引入 京東 採集的子組件 -->
                            <CollectProductJD :categories="categories" :backendUrl="$backendUrl" />
                        </v-tabs-window-item>
                    </v-tabs-window>
                </div>
                <div v-else>
                    <v-alert type="error" dense> 您沒有管理員權限，請重新登入。 </v-alert>
                </div>
            </div>
        </v-container>
    </v-app>
</template>

<script>
import axios from "axios";
import CollectProduct1688 from "../components/CollectProduct1688.vue";
import CollectProductJD from "../components/CollectProductJD.vue";

export default {
    name: "CollectProduct",
    components: { CollectProduct1688, CollectProductJD },
    data() {
        return {
            tab: "one",
            categories: [],
            adminUser: null,
            loading: false,
        };
    },
    mounted() {
        this.fetchAdminUser();
        this.fetchCategories();
    },
    methods: {
        async fetchAdminUser() {
            this.loading = true;
            try {
                const response = await axios.get(`${this.$backendUrl}/api/admin/me`, {
                    withCredentials: true,
                });
                this.adminUser = response.data.user;
            } catch (error) {
                console.error("管理員驗證失敗：", error);
                // 驗證失敗導向首頁
                this.$router.push("/");
            } finally {
                this.loading = false;
            }
        },
        async fetchCategories() {
            try {
                const response = await axios.get(`${this.$backendUrl}/api/categories`);
                this.categories = response.data.categories;
            } catch (error) {
                console.error("取得分類資料失敗:", error);
            }
        },
    },
};
</script>

<style scoped>
/* 根據需要自定義樣式 */
</style>
