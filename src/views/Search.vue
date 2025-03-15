<template>
    <v-app>
        <v-container>
            <v-row justify="center">
                <v-col cols="12" class="text-center">
                    <h1>搜尋結果：{{ searchQuery }}</h1>
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
    name: "Search",
    data() {
        return {
            products: [],
            loading: true,
            placeholderImage: "https://via.placeholder.com/200?text=No+Image",
        };
    },
    computed: {
        // 從路由 query 取得搜尋關鍵字
        searchQuery() {
            return this.$route.query.q || "";
        },
    },
    methods: {
        async fetchProducts() {
            try {
                // 依搜尋關鍵字調用後端 API 取得搜尋結果
                const url = `${this.$backendUrl}/api/products/search?q=${encodeURIComponent(
                    this.searchQuery
                )}`;
                const response = await axios.get(url);
                this.products = response.data.products;
            } catch (error) {
                console.error("取得搜尋結果失敗：", error);
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
    },
    mounted() {
        this.fetchProducts();
    },
    watch: {
        "$route.query.q"(newVal, oldVal) {
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
