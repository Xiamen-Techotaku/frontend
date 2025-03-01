<template>
    <v-app>
        <v-container class="py-8">
            <!-- Hero 區塊 -->
            <v-img
                src="https://via.placeholder.com/1200x400"
                height="400px"
                gradient="to top, rgba(0,0,0,.7), rgba(0,0,0,.1)"
                class="white--text d-flex align-center justify-center"
            >
                <div class="text-center">
                    <h1 class="display-2 font-weight-bold mb-4">
                        歡迎來到 {{ shopName }}
                    </h1>
                    <p class="subtitle-1 mb-4">發現我們精選的好貨，立即體驗精彩購物！</p>
                    <v-btn color="primary" large @click="goToProducts">立即購物</v-btn>
                </div>
            </v-img>

            <!-- 精選產品區塊 -->
            <v-row class="mt-10">
                <v-col cols="12" class="text-center">
                    <h2 class="mb-6">精選產品</h2>
                </v-col>
            </v-row>
            <v-row>
                <v-col v-for="product in products" :key="product.id" cols="12" sm="6" md="4" lg="3">
                    <v-card class="mx-auto" max-width="300" outlined>
                        <v-img
                            :src="product.image_url || placeholderImage"
                            height="200px"
                            class="white--text align-end"
                        ></v-img>
                        <v-card-title>{{ product.name }}</v-card-title>
                        <v-card-text>
                            <div class="mb-2">{{ product.description }}</div>
                            <div class="price font-weight-bold">$ {{ product.price }}</div>
                        </v-card-text>
                        <v-card-actions>
                            <v-btn color="primary" block @click="viewProduct(product.id)">
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
    name: "Home",
    data() {
        return {
            shopName: import.meta.env.VITE_SHOP_NAME || "ShopName",
            products: [],
            placeholderImage: "https://via.placeholder.com/150?text=No+Image",
        };
    },
    methods: {
        goToProducts() {
            this.$router.push("/products");
        },
        viewProduct(productId) {
            this.$router.push(`/product/${productId}`);
        },
        async fetchProducts() {
            try {
                const response = await axios.get(`${this.$backendUrl}/api/products/random`);
                if (response.data && response.data.products) {
                    this.products = response.data.products;
                }
            } catch (error) {
                console.error("取得產品資料失敗：", error);
            }
        },
    },
    mounted() {
        this.fetchProducts();
    },
};
</script>

<style scoped>
.price {
    color: #ff6600;
    font-size: 1.2rem;
}
</style>
