<template>
    <v-app>
        <v-container>
            <v-row justify="center">
                <v-col cols="12" class="text-center">
                    <h1 v-if="!categoryId">商品列表</h1>
                    <h1 v-else>分類【{{ getCategoryName(categoryId) }}】商品列表</h1>
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
                        <BaseImage :src="product.image_url || placeholderImage" height="200px"></BaseImage>
                        <v-card-title>{{ product.name }}</v-card-title>
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

<script>
import axios from "axios";
export default {
    name: "Product",
    data() {
        return {
            products: [],
            loading: true,
            categories: [],
            placeholderImage: "https://via.placeholder.com/200?text=No+Image",
        };
    },
    computed: {
        // 讀取路由中的 category id
        categoryId() {
            return this.$route.params.id || null;
        },
    },
    methods: {
        async fetchCategories() {
            try {
                const response = await axios.get(`${this.$backendUrl}/api/categories`);
                this.categories = response.data.categories;
            } catch (error) {
                console.error("取得分類資料失敗:", error);
                this.categories = [];
            }
        },
        async fetchProducts() {
            try {
                console.log(this.$backendUrl)
                const url = this.categoryId
                    ? `${this.$backendUrl}/api/products?category_id=${this.categoryId}`
                    : `${this.$backendUrl}/api/products`;
                const response = await axios.get(url);
                this.products = response.data.products;
            } catch (error) {
                console.error("取得商品資料失敗：", error);
            } finally {
                this.loading = false;
            }
        },
        displayPrice(product) {
            if (product.spec_price) {
                return product.spec_price;
            } else {
                return `$${product.price}`;
            }
        },
        viewProduct(productId) {
            this.$router.push(`/product/${productId}`);
        },
        getCategoryName(categoryId) {
            const cat = this.categories.find((c) => c.id == categoryId);
            return cat ? cat.name : "";
        },
    },
    mounted() {
        if (this.categoryId) {
            this.fetchCategories().then(() => {
                this.fetchProducts();
            });
        } else {
            this.fetchProducts();
        }
    },
    watch: {
        "$route.params.id"(newVal, oldVal) {
            this.loading = true;
            this.fetchProducts();
        },
    },
};
</script>

<style scoped>
.price {
    color: #ff6600;
    font-weight: bold;
}
</style>
