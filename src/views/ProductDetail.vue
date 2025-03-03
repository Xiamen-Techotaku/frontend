<template>
    <v-app>
        <v-container class="py-8">
            <!-- 返回按鈕 -->
            <v-btn color="primary" @click="goBack" class="mb-4">返回</v-btn>

            <v-row>
                <!-- 左側：圖片輪播 -->
                <v-col cols="12" md="6">
                    <v-carousel
                        v-if="product.images && product.images.length"
                        show-arrows="hover"
                        hide-delimiters
                    >
                        <v-carousel-item v-for="(img, index) in product.images" :key="index">
                            <v-img
                                :src="img.image_url"
                                :alt="product.name"
                                class="fill-height"
                            ></v-img>
                        </v-carousel-item>
                    </v-carousel>
                    <v-skeleton-loader v-else type="image"></v-skeleton-loader>
                </v-col>

                <!-- 右側：商品資訊 -->
                <v-col cols="12" md="6">
                    <v-card outlined>
                        <!-- 顯示商品名稱 -->
                        <v-card-title class="text-h5 product-title">
                            {{ product.name }}
                        </v-card-title>

                        <!-- 顯示價格 -->
                        <v-card-subtitle class="price">
                            {{ displayPrice }}
                        </v-card-subtitle>

                        <v-card-text>
                            <!-- 規格選擇 (單選) -->
                            <div
                                v-if="product.specifications && product.specifications.length"
                                class="my-4"
                            >
                                <label class="spec-label">規格：</label>
                                <v-chip-group
                                    v-model="selectedSpecId"
                                    selected-class="chip-active"
                                    column
                                    mandatory
                                >
                                    <v-chip
                                        v-for="spec in product.specifications"
                                        :key="spec.id"
                                        :value="spec.id"
                                        outlined
                                        class="spec-chip"
                                    >
                                        {{ spec.name }} ({{ formatPrice(spec.price) }})
                                    </v-chip>
                                </v-chip-group>
                            </div>

                            <!-- 選項選擇 (單選) -->
                            <div
                                v-if="optionGroups && Object.keys(optionGroups).length"
                                class="my-4"
                            >
                                <div
                                    v-for="(values, group) in optionGroups"
                                    :key="group"
                                    class="mb-2"
                                >
                                    <label class="spec-label">{{ group }}：</label>
                                    <v-chip-group
                                        v-model="selectedOptions[group]"
                                        selected-class="chip-active"
                                        column
                                        mandatory
                                    >
                                        <v-chip
                                            v-for="(value, index) in values"
                                            :key="index"
                                            :value="value"
                                            outlined
                                            class="spec-chip"
                                        >
                                            {{ value }}
                                        </v-chip>
                                    </v-chip-group>
                                </div>
                            </div>

                            <!-- 數量與按鈕 -->
                            <v-row align="center" class="my-4">
                                <v-col cols="12" md="6">
                                    <label class="spec-label">數量：</label>
                                    <v-number-input
                                        control-variant="split"
                                        v-model.number="orderQuantity"
                                        min="1"
                                        density="compact"
                                    ></v-number-input>
                                </v-col>
                                <v-col cols="12" md="6" class="text-right">
                                    <v-btn color="primary" class="mr-2" @click="addToCart">
                                        放入購物車
                                    </v-btn>
                                    <v-btn color="error" @click="buyNow">立即購買</v-btn>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <!-- 分頁式顯示：商品內容 與 評論 -->
            <v-tabs v-model="tab" background-color="transparent" class="mt-6">
                <v-tab value="one">商品內容</v-tab>
                <v-tab value="two">評論</v-tab>
            </v-tabs>

            <v-card-text>
                <v-tabs-window v-model="tab">
                    <!-- 商品內容 -->
                    <v-tabs-window-item value="one">
                        <v-card-text v-html="product.description"></v-card-text>
                    </v-tabs-window-item>
                    <!-- 評論 -->
                    <v-tabs-window-item value="two">
                        <div v-if="reviews && reviews.length">
                            <div v-for="(review, index) in reviews" :key="index" class="mb-4">
                                <v-card outlined>
                                    <v-card-title>
                                        {{ review.reviewer_name ? review.reviewer_name : "匿名" }}
                                    </v-card-title>
                                    <v-card-text>
                                        {{ review.content }}
                                        <div v-if="review.rating" class="mt-2">
                                            <!-- 用星星顯示評分 -->
                                            <v-rating
                                                :model-value="review.rating"
                                                readonly
                                                color="amber"
                                                background-color="grey lighten-3"
                                                dense
                                            ></v-rating>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </div>
                        </div>
                        <div v-else>
                            <p>目前沒有評論</p>
                        </div>
                    </v-tabs-window-item>
                </v-tabs-window>
            </v-card-text>
        </v-container>
    </v-app>
</template>

<script>
import axios from "axios";
export default {
    name: "ProductDetail",
    data() {
        return {
            product: {
                images: [],
                specifications: [],
                options: [],
            },
            loading: true,
            selectedSpecId: null, // 保存規格 id
            selectedOptions: {}, // 每個選項群只保存一個值
            orderQuantity: 1,
            tab: "one", // 分頁控制，預設顯示商品內容
            reviews: [], // 儲存評論資料
        };
    },
    computed: {
        selectedSpec() {
            if (!this.product.specifications) return null;
            return (
                this.product.specifications.find((spec) => spec.id === this.selectedSpecId) || null
            );
        },
        displayPrice() {
            if (this.selectedSpec) {
                return this.formatPrice(this.selectedSpec.price);
            } else if (this.product.specifications && this.product.specifications.length) {
                const prices = this.product.specifications.map((spec) => spec.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                return minPrice === maxPrice
                    ? this.formatPrice(minPrice)
                    : `${this.formatPrice(minPrice)} - ${this.formatPrice(maxPrice)}`;
            } else {
                return this.formatPrice(this.product.price);
            }
        },
        optionGroups() {
            const groups = {};
            if (this.product.options && this.product.options.length) {
                this.product.options.forEach((opt) => {
                    if (!groups[opt.option_name]) {
                        groups[opt.option_name] = [];
                    }
                    if (!groups[opt.option_name].includes(opt.option_value)) {
                        groups[opt.option_name].push(opt.option_value);
                    }
                });
            }
            return groups;
        },
    },
    methods: {
        formatPrice(value) {
            return `$${parseFloat(value).toFixed(2)}`;
        },
        async fetchProduct() {
            const productId = this.$route.params.id;
            try {
                const response = await axios.get(`${this.$backendUrl}/api/products/${productId}`);
                this.product = response.data.product;
                // 取得該商品的評論資料
                const reviewsResponse = await axios.get(`${this.$backendUrl}/api/reviews`, {
                    params: { product_id: productId },
                });
                this.reviews = reviewsResponse.data.reviews || [];
            } catch (error) {
                console.error("取得商品資料失敗：", error);
            } finally {
                this.loading = false;
                this.autoSelectSingle();
            }
        },
        autoSelectSingle() {
            if (this.product.specifications && this.product.specifications.length > 0) {
                this.selectedSpecId = this.product.specifications[0].id;
            }
            for (const group in this.optionGroups) {
                const values = this.optionGroups[group];
                if (values.length > 0) {
                    this.selectedOptions[group] = values[0];
                }
            }
        },
        goBack() {
            this.$router.back();
        },
        async addToCart() {
            try {
                const payload = {
                    productId: this.product.id, // 內部使用，不在畫面上顯示
                    specificationId: this.selectedSpec ? this.selectedSpec.id : null,
                    options: this.selectedOptions,
                    quantity: this.orderQuantity,
                };
                await axios.post(`${this.$backendUrl}/api/cart`, payload, {
                    withCredentials: true,
                });
                alert("已加入購物車");
            } catch (error) {
                console.error("加入購物車失敗：", error);
                alert("加入購物車失敗，請稍後再試");
            }
        },
        async buyNow() {
            await this.addToCart();
            this.$router.push("/checkout");
        },
    },
    mounted() {
        this.fetchProduct();
    },
};
</script>

<style scoped>
.price {
    color: #ff6600;
    font-weight: bold;
    font-size: 1.4rem;
}
.product-title {
    white-space: normal !important;
    word-break: break-word;
    overflow: visible !important;
    text-overflow: clip !important;
}
.spec-label {
    font-weight: 500;
    margin-right: 8px;
}
.spec-chip {
    border: 1px solid #ccc !important;
    border-radius: 0 !important;
    margin: 4px;
}
.chip-active {
    border-color: red !important;
}
</style>
