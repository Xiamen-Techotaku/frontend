<template>
    <v-app>
        <v-container>
            <!-- 返回按鈕 -->
            <v-btn color="primary" @click="$router.go(-1)" class="mb-4">返回</v-btn>

            <!-- 分頁標籤 -->
            <v-tabs v-model="tab" background-color="primary" dark>
                <v-tab value="one">1688採集</v-tab>
                <v-tab value="two">京東採集</v-tab>
            </v-tabs>

            <!-- 分頁內容 -->
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

/**
 * 第一步：將平面結構轉換成樹狀結構（每個節點都含有 children）
 * @param {Array} categories - 後端回傳的平面分類陣列
 * @returns {Array} - 樹狀結構的分類陣列
 */
function buildCategoryTree(categories) {
    const map = new Map();
    // 先在每個物件上加 children: []
    categories.forEach((cat) => {
        map.set(cat.id, { ...cat, children: [] });
    });

    const tree = [];
    categories.forEach((cat) => {
        const current = map.get(cat.id);
        if (cat.parent_id) {
            // 找到父節點，加入父節點的 children
            const parent = map.get(cat.parent_id);
            if (parent) {
                parent.children.push(current);
            }
        } else {
            // parent_id = null，代表頂層
            tree.push(current);
        }
    });
    return tree;
}

/**
 * 第二步：將樹狀結構攤平，並在名稱前加上對應層級數量的 "-"
 * @param {Array} tree - 樹狀結構的分類陣列
 * @param {number} level - 層級深度，預設 0
 * @returns {Array} - 一維陣列，名稱前帶有層級前綴
 */
function flattenCategories(tree, level = 0) {
    let result = [];
    tree.forEach((cat) => {
        const prefix = "-".repeat(level);
        result.push({
            ...cat,
            name: prefix + cat.name, // 在原名稱前加上 "-"
        });
        if (cat.children && cat.children.length) {
            result = result.concat(flattenCategories(cat.children, level + 1));
        }
    });
    return result;
}

export default {
    name: "CollectProduct",
    components: { CollectProduct1688, CollectProductJD },
    data() {
        return {
            tab: "one",
            categories: [], // 給子組件的分類列表
        };
    },
    mounted() {
        this.fetchCategories();
    },
    methods: {
        async fetchCategories() {
            try {
                // 假設後端回傳的資料是平面結構，例如：
                // [
                //   { id:1, name:"男性情趣用品", parent_id:null },
                //   { id:2, name:"飛機杯", parent_id:1 },
                //   ...
                // ]
                const response = await axios.get(`${this.$backendUrl}/api/categories`);
                const rawCategories = response.data.categories;

                // 第一步：先建立樹狀結構
                const tree = buildCategoryTree(rawCategories);
                // 第二步：攤平並在名稱前加上層級前綴
                this.categories = flattenCategories(tree);
                console.log("處理後的 categories：", this.categories);
            } catch (error) {
                console.error("取得分類資料失敗:", error);
            }
        },
    },
};
</script>

<style scoped>
/* 可根據需要自行調整樣式 */
</style>
