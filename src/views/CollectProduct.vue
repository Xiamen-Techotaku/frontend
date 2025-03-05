<template>
    <v-app>
        <v-container>
            <v-btn color="primary" @click="$router.go(-1)" class="mb-4">返回</v-btn>
            <v-tabs v-model="tab" background-color="primary" dark>
                <v-tab value="one">1688採集</v-tab>
                <v-tab value="two">京東採集</v-tab>
            </v-tabs>
            <v-tabs-window v-model="tab">
                <v-tabs-window-item value="one">
                    <!-- 引入 1688 採集的子組件 -->
                    <CollectProduct1688 :categories="categories" :backendUrl="$backendUrl" />
                </v-tabs-window-item>
                <v-tabs-window-item value="two">
                    <!-- 引入 京東 採集的子組件 -->
                    <CollectProductJD :categories="categories" :backendUrl="$backendUrl" />
                </v-tabs-window-item>
            </v-tabs-window>
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
        };
    },
    mounted() {
        this.fetchCategories();
    },
    methods: {
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
