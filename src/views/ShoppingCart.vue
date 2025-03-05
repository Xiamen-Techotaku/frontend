<template>
    <v-app>
        <v-container class="pa-4">
            <v-card class="pa-4">
                <v-card-title class="text-h5">購物車</v-card-title>
                <v-divider></v-divider>
                <v-card-text>
                    <v-row v-if="loading" justify="center">
                        <v-col cols="12" class="text-center">
                            <v-progress-circular
                                indeterminate
                                color="primary"
                            ></v-progress-circular>
                        </v-col>
                    </v-row>
                    <v-row v-else>
                        <v-col cols="12" v-if="cartItems.length === 0">
                            <p>購物車目前是空的</p>
                        </v-col>
                        <v-col cols="12" v-else>
                            <v-simple-table>
                                <thead>
                                    <tr>
                                        <th class="text-center">產品</th>
                                        <th class="text-center">名稱</th>
                                        <th class="text-center">規格/價格</th>
                                        <th class="text-center">選項</th>
                                        <th class="text-center">數量</th>
                                        <th class="text-center">小計</th>
                                        <th class="text-center">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, index) in cartItems" :key="item.id">
                                        <!-- 圖片 -->
                                        <td class="text-center">
                                            <v-img
                                                :src="
                                                    getProductMainImage(item.product) ||
                                                    fallbackImage
                                                "
                                                max-width="80"
                                                max-height="80"
                                                contain
                                            ></v-img>
                                        </td>
                                        <!-- 名稱 -->
                                        <td class="text-center">{{ item.product.name }}</td>
                                        <!-- 規格/價格 -->
                                        <td class="text-center">
                                            <span v-if="item.selectedSpec">
                                                {{ formatPrice(item.selectedSpec.price) }}
                                            </span>
                                            <span v-else>
                                                {{
                                                    item.product.spec_price ||
                                                    formatPrice(item.product.price)
                                                }}
                                            </span>
                                        </td>
                                        <!-- 選項 -->
                                        <td class="text-center">
                                            <div v-if="hasOptions(item.options)">
                                                <div
                                                    v-for="(value, key) in item.options"
                                                    :key="key"
                                                >
                                                    {{ key }}: {{ value }}
                                                </div>
                                            </div>
                                            <div v-else>無</div>
                                        </td>
                                        <!-- 數量 -->
                                        <td class="text-center">
                                            <v-text-field
                                                type="number"
                                                v-model.number="item.quantity"
                                                min="1"
                                                dense
                                                hide-details
                                                style="max-width: 60px"
                                                @change="updateQuantity(item.id, item.quantity)"
                                            ></v-text-field>
                                        </td>
                                        <!-- 小計 -->
                                        <td class="text-center">
                                            {{ formatPrice(item.unitPrice * item.quantity) }}
                                        </td>
                                        <!-- 操作 -->
                                        <td class="text-center">
                                            <v-btn color="error" small @click="removeItem(item.id)">
                                                移除
                                            </v-btn>
                                        </td>
                                    </tr>
                                </tbody>
                            </v-simple-table>

                            <v-divider class="my-4"></v-divider>
                            <!-- 總計 -->
                            <v-row justify="end">
                                <v-col cols="auto">
                                    <span class="text-h6">總計：{{ formatPrice(totalPrice) }}</span>
                                </v-col>
                            </v-row>
                            <!-- 結帳按鈕 -->
                            <v-btn class="checkout" color="warning" block @click="checkout">
                                結帳
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-container>
    </v-app>
</template>

<script>
import axios from "axios";

export default {
    name: "ShoppingCart",
    data() {
        return {
            cart: [],
            cartItems: [],
            loading: true,
            fallbackImage: "https://via.placeholder.com/100?text=No+Image",
        };
    },
    computed: {
        totalPrice() {
            return this.cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        },
    },
    methods: {
        async checkAuthentication() {
            try {
                // 從環境變數讀取後端 URL
                const backendUrl = import.meta.env.VITE_BACKEND_URL;
                await axios.get(`${backendUrl}/api/auth/me`, {
                    withCredentials: true,
                });
            } catch (error) {
                // 驗證失敗則導向 /login 頁面
                this.$router.push("/login");
            }
        },
        async fetchCartAndEnrich() {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL;
                const response = await axios.get(`${backendUrl}/api/cart`, {
                    withCredentials: true,
                });
                this.cart = response.data.cart;
                await this.enrichCartItems();
            } catch (error) {
                console.error("取得購物車資料失敗：", error);
                this.cart = [];
            } finally {
                this.loading = false;
            }
        },
        async enrichCartItems() {
            const items = [];
            if (!this.cart || !Array.isArray(this.cart)) return;

            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            for (const item of this.cart) {
                try {
                    const productId = item.productId || item.product_id;
                    if (!productId) {
                        console.error("取得產品 undefined 資料失敗：", item);
                        continue;
                    }
                    const response = await axios.get(`${backendUrl}/api/products/${productId}`);
                    const product = response.data.product;

                    let selectedSpec = null;
                    let unitPrice = product.price;

                    if (item.specificationId || item.specification_id) {
                        const specId = item.specificationId || item.specification_id;
                        selectedSpec = product.specifications.find((spec) => spec.id === specId);
                        if (selectedSpec) {
                            unitPrice = selectedSpec.price;
                        }
                    } else if (product.spec_price) {
                        const prices = product.specifications.map((spec) => spec.price);
                        if (prices.length > 0) {
                            unitPrice = Math.min(...prices);
                        }
                    }

                    // 處理選項：如果有 option_id，就從產品的 options 中找出對應項目
                    let options = {};
                    if (item.optionId || item.option_id) {
                        const optId = item.optionId || item.option_id;
                        if (product.options && Array.isArray(product.options)) {
                            const opt = product.options.find((o) => o.id === optId);
                            if (opt) {
                                options = { [opt.option_name]: opt.option_value };
                            }
                        }
                    } else {
                        // 如果沒有 option_id，嘗試解析原本存入的 JSON 格式
                        try {
                            options = JSON.parse(item.options);
                        } catch (e) {
                            options = item.options;
                        }
                    }

                    items.push({
                        ...item,
                        product,
                        selectedSpec,
                        unitPrice,
                        options,
                    });
                } catch (error) {
                    console.error(
                        `取得產品 ${item.productId || item.product_id} 資料失敗：`,
                        error
                    );
                }
            }
            this.cartItems = items;
        },
        getProductMainImage(product) {
            if (product && product.images && product.images.length > 0) {
                return product.images[0].image_url;
            }
            return "";
        },
        async updateQuantity(itemId, quantity) {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL;
                await axios.put(
                    `${backendUrl}/api/cart/${itemId}`,
                    { quantity },
                    { withCredentials: true }
                );
                await this.fetchCartAndEnrich();
            } catch (error) {
                console.error("更新購物車失敗：", error);
            }
        },
        async removeItem(itemId) {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL;
                await axios.delete(`${backendUrl}/api/cart/${itemId}`, {
                    withCredentials: true,
                });
                await this.fetchCartAndEnrich();
            } catch (error) {
                console.error("刪除購物車項目失敗：", error);
            }
        },
        checkout() {
            localStorage.setItem("checkoutCart", JSON.stringify(this.cartItems));
            this.$router.push("/checkout");
        },
        formatPrice(value) {
            return `$${parseFloat(value).toFixed(2)}`;
        },
        hasOptions(options) {
            return options && Object.keys(options).length > 0;
        },
    },
    async mounted() {
        // 先檢查是否已登入
        await this.checkAuthentication();
        // 驗證通過後再取得購物車資料
        this.fetchCartAndEnrich();
    },
};
</script>

<style scoped>
/* 根據需要調整樣式 */
</style>
