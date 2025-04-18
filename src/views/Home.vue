<template>
    <v-app>
        <v-container class="pa-8">
            <!-- Hero 區塊 -->
            <BaseImage
                src="/header.png"
                height="400px"
                class="white--text d-flex align-center justify-center"
            >
                <div class="text-center">
                    <h1 class="display-2 font-weight-bold mb-4">歡迎來到 {{ shopName }}</h1>
                    <p class="subtitle-1 mb-4">發現我們精選的好貨，立即體驗精彩購物！</p>
                </div>
            </BaseImage>

            <!-- 精選產品區塊 -->
            <v-row class="mt-10">
                <v-col cols="12" class="text-center">
                    <h2 class="mb-6">精選產品</h2>
                </v-col>
            </v-row>
            <v-row>
                <v-col v-for="product in products" :key="product.id" cols="12" sm="6" md="4" lg="3">
                    <v-card class="mx-auto" max-width="300" outlined>
                        <BaseImage
                            :src="product.image_url || placeholderImage"
                            height="200px"
                        ></BaseImage>
                        <v-tooltip :text="product.name" open-delay="500">
                            <template v-slot:activator="{ props }">
                                <v-card-title v-bind="props">{{ product.name }}</v-card-title>
                            </template>
                        </v-tooltip>
                        <v-card-text>
                            <div class="mb-2">{{ product.description }}</div>
                            <div class="price font-weight-bold">
                                {{ product.spec_price || "$" + product.price }}
                            </div>
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
            placeholderImage: "/header.png",
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
                    console.log(this.products);
                }
            } catch (error) {
                console.error("取得產品資料失敗：", error);
            }
        },
        displayPrice(product) {
            // 如果產品有 specifications，取出所有 spec 的價格
            if (product.specifications && product.specifications.length > 0) {
                const prices = product.specifications.map((spec) => spec.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                // 如果最低價與最高價相同，僅顯示一個價格
                if (minPrice === maxPrice) {
                    return `$${minPrice}`;
                } else {
                    return `$${minPrice} ~ $${maxPrice}`;
                }
            } else {
                // 若無 specifications，直接使用 product.price
                return `$${product.price}`;
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
