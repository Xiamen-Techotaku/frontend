<template>
    <v-app>
        <v-app-bar app :color="primaryColor" dark>
            <v-toolbar-title>
                <router-link to="/" class="shop-name-link">{{ shopName }}</router-link>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <div v-if="!currentUser">
                <v-btn text to="/login">
                    <v-icon left>mdi-account</v-icon>
                    註冊|登入
                </v-btn>
            </div>
            <div v-else class="d-flex align-center">
                <span class="mr-2">
                    歡迎,
                    <router-link to="/profile" class="profile-link">
                        {{ currentUser.name }}
                    </router-link>
                </span>
                <!-- 新增查看訂單按鈕 -->
                <v-btn text to="/Orders">
                    <v-icon left>mdi-receipt</v-icon>
                    我的訂單
                </v-btn>
                <v-btn text @click="logout">
                    <v-icon left>mdi-logout</v-icon>
                    登出
                </v-btn>
            </div>
            <v-btn icon to="/cart">
                <v-badge :content="cartCount" color="red" overlap>
                    <v-icon>mdi-cart</v-icon>
                </v-badge>
            </v-btn>
        </v-app-bar>

        <!-- Header Bottom：商品分類 -->
        <v-app-bar :color="secondaryColor" dark>
            <v-container>
                <v-row>
                    <v-col
                        v-for="cat in topCategories"
                        :key="cat.id"
                        class="d-flex align-center category-col"
                    >
                        <v-menu open-on-hover v-if="getChildren(cat.id).length" offset-y>
                            <template v-slot:activator="{ props }">
                                <v-list-item
                                    :to="`/category/${cat.id}`"
                                    :color="primaryColor"
                                    v-bind="props"
                                >
                                    {{ cat.name }}
                                </v-list-item>
                            </template>
                            <v-list :style="{ backgroundColor: secondaryColor2 }">
                                <v-list-item
                                    v-for="child in getChildren(cat.id)"
                                    :key="child.id"
                                    :to="`/category/${child.id}`"
                                >
                                    <v-list-item-title>{{ child.name }}</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </v-col>
                </v-row>
            </v-container>
        </v-app-bar>

        <!-- 主要內容 -->
        <v-main class="main-content">
            <router-view></router-view>
        </v-main>

        <!-- Footer (非固定，隨內容延伸) -->
        <v-footer :color="primaryColor" dark>
            <v-col class="text-center"> &copy; 2025 {{ shopName }}. All rights reserved. </v-col>
        </v-footer>
    </v-app>
</template>

<script>
import axios from "axios";
export default {
    name: "App",
    data() {
        return {
            currentUser: null,
            cartCount: 0,
            categories: [],
            shopName: import.meta.env.VITE_SHOP_NAME || "ShopName",
        };
    },
    computed: {
        primaryColor() {
            return import.meta.env.VITE_PRIMARY_COLOR || "#3498db";
        },
        secondaryColor() {
            return import.meta.env.VITE_SECONDARY_COLOR_1 || "#2ecc71";
        },
        secondaryColor2() {
            return import.meta.env.VITE_SECONDARY_COLOR_2 || "#e74c3c";
        },
        topCategories() {
            return this.categories.filter((cat) => !cat.parent_id || cat.parent_id === "");
        },
    },
    methods: {
        async fetchCurrentUser() {
            try {
                const response = await axios.get("http://localhost:4000/api/auth/me", {
                    withCredentials: true,
                });
                this.currentUser = response.data.user;
            } catch (error) {
                this.currentUser = null;
            }
        },
        async fetchCartCount() {
            try {
                const response = await axios.get("http://localhost:4000/api/cart", {
                    withCredentials: true,
                });
                this.cartCount = response.data.cart.reduce((sum, item) => sum + item.quantity, 0);
            } catch (error) {
                console.error("取得購物車資料失敗:", error);
                this.cartCount = 0;
            }
        },
        async fetchCategories() {
            try {
                const response = await axios.get("http://localhost:4000/api/categories");
                this.categories = response.data.categories;
            } catch (error) {
                console.error("取得分類資料失敗：", error);
                this.categories = [];
            }
        },
        getChildren(parentId) {
            return this.categories.filter((cat) => cat.parent_id === parentId);
        },
        async logout() {
            try {
                await axios.get("http://localhost:4000/api/auth/logout", {
                    withCredentials: true,
                });
                this.currentUser = null;
                this.$router.push("/login");
            } catch (error) {
                console.error("登出失敗:", error);
            }
        },
    },
    mounted() {
        this.fetchCurrentUser();
        this.fetchCartCount();
        this.fetchCategories();
        this.cartCountInterval = setInterval(this.fetchCartCount, 3000);
    },
    unmounted() {
        clearInterval(this.cartCountInterval);
    },
};
</script>

<style scoped>
.shop-name-link {
    text-decoration: none;
    color: inherit;
}
.profile-link {
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
}
.main-content {
    padding-top: 130px; /* 調整此值以確保主要內容不被 Header 擋住 */
    padding-bottom: 30px;
}
.category-col {
    position: relative;
}
</style>
