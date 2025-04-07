<template>
    <v-app>
        <v-container>
            <v-row justify="center">
                <v-col cols="12" class="text-center">
                    <h1 v-if="!categoryId">商品列表</h1>
                    <h1 v-else>{{ getCategoryName(categoryId) }}</h1>
                </v-col>
            </v-row>
            <v-row v-if="loading">
                <v-col cols="12" class="text-center">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </v-col>
            </v-row>
            <v-row v-else>
                <v-col v-for="product in products" :key="product.id" cols="12" sm="6" md="4" lg="3">
                    <v-card>
                        <BaseImage
                            :src="product.image_url || placeholderImage"
                            height="200px"
                        ></BaseImage>
                        <v-tooltip :text="product.name" open-delay="500">
                            <template v-slot:activator="{ props }">
                                <v-card-title v-bind="props">{{ product.name }}</v-card-title>
                            </template>
                        </v-tooltip>
                        <v-card-subtitle class="price">
                            {{ displayPrice(product) }}
                        </v-card-subtitle>
                        <v-card-actions>
                            <v-btn color="primary" @click="viewProduct(product.id)">
                                查看詳情
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </v-app>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { useHead } from "@vueuse/head";

// 從環境變數取得後端 API 的 URL
const backendUrl = import.meta.env.VITE_BACKEND_URL;

// 路由與 Router
const route = useRoute();
const router = useRouter();

// 商品、分類、loading 狀態等
const products = ref([]);
const categories = ref([]);
const loading = ref(true);
const placeholderImage = "https://via.placeholder.com/200?text=No+Image";

// 從路由參數取得 category id
const categoryId = computed(() => route.params.id || null);

// 在 setup 中定義 getCategoryName 函數
const getCategoryName = (id) => {
    const cat = categories.value.find((c) => c.id == id);
    return cat ? cat.name : "";
};

// 設定頁面標題，若有分類則顯示分類名稱，否則顯示 "商品列表"
const pageTitle = computed(() =>
    categoryId.value
        ? import.meta.env.VITE_SHOP_NAME + "-" + getCategoryName(categoryId.value)
        : "商品列表"
);

// 使用 vueuse/head 設定 meta 與 OG 標籤
useHead({
    title: pageTitle,
    meta: [
        {
            name: "description",
            content: computed(() => pageTitle.value + "，歡迎選購！"),
        },
        {
            property: "og:title",
            content: pageTitle,
        },
        {
            property: "og:description",
            content: computed(() => pageTitle.value + "，歡迎選購！"),
        },
    ],
});

// 取得分類資料
const fetchCategories = async () => {
    try {
        const response = await axios.get(`${backendUrl}/api/categories`);
        categories.value = response.data.categories;
    } catch (error) {
        console.error("取得分類資料失敗:", error);
        categories.value = [];
    }
};

// 取得商品資料
const fetchProducts = async () => {
    try {
        const url = categoryId.value
            ? `${backendUrl}/api/products?category_id=${categoryId.value}`
            : `${backendUrl}/api/products`;
        const response = await axios.get(url);
        products.value = response.data.products;
    } catch (error) {
        console.error("取得商品資料失敗：", error);
    } finally {
        loading.value = false;
    }
};

// 顯示價格的函數
const displayPrice = (product) => {
    if (product.spec_price) {
        return product.spec_price;
    } else {
        return `$${product.price}`;
    }
};

// 跳轉到商品詳情頁面
const viewProduct = (productId) => {
    router.push(`/product/${productId}`);
};

// 初次掛載時，如果有 categoryId 則先抓分類資料，再抓商品資料
onMounted(async () => {
    if (categoryId.value) {
        await fetchCategories();
    }
    await fetchProducts();
});

// 監控路由變化，重新載入商品資料
watch(
    () => route.params.id,
    async (newVal, oldVal) => {
        loading.value = true;
        await fetchProducts();
    }
);
</script>

<style scoped>
.price {
    color: #ff6600;
    font-weight: bold;
}
</style>
