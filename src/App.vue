<template>
    <v-app>
        <!-- 全局 Loading 進度條 -->
        <v-progress-linear
            v-if="globalLoading"
            indeterminate
            color="primary"
            height="4"
        ></v-progress-linear>

        <!-- Header 區塊 -->
        <v-app-bar app :color="primaryColor" dark>
            <v-toolbar-title>
                <router-link to="/" class="shop-name-link">{{ shopName }}</router-link>
            </v-toolbar-title>
            <!-- 新增搜尋商品輸入框 -->
            <v-text-field
                v-model="searchQuery"
                append-icon="mdi-magnify"
                label="搜尋商品"
                single-line
                hide-details
                class="mx-4"
                @keyup.enter="searchProducts"
                @click:append="searchProducts"
            ></v-text-field>
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

        <!-- 主要內容，包覆於 transition 中 -->
        <v-main class="main-content">
            <transition name="fade">
                <router-view v-if="!globalLoading"></router-view>
            </transition>
        </v-main>

        <!-- Footer -->
        <v-footer :color="primaryColor" dark>
            <v-col class="text-center"> &copy; 2025 {{ shopName }}. All rights reserved. </v-col>
        </v-footer>

        <!-- 右下角浮動對話按鈕 -->
        <v-fab
            :absolute="false"
            :app="true"
            color="primary"
            :location="'right bottom'"
            size="x-large"
            icon="mdi-message-text"
            variant="flat"
            @click="openChat"
        ></v-fab>
    </v-app>
</template>

<script>
import { useHead } from "@vueuse/head";
import axios from "axios";

export default {
    name: "App",
    setup() {
        useHead({
            title: import.meta.env.VITE_SHOP_NAME,
            meta: [
                { name: "description", content: import.meta.env.VITE_OG_DESCRIPTION },
                { property: "og:title", content: import.meta.env.VITE_SHOP_NAME },
                { property: "og:description", content: import.meta.env.VITE_OG_DESCRIPTION },
            ],
        });
    },
    data() {
        return {
            globalLoading: false,
            currentUser: null,
            cartCount: 0,
            categories: [],
            shopName: import.meta.env.VITE_SHOP_NAME || "ShopName",
            searchQuery: "",
            cartCountInterval: null,
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
        chatUrl() {
            return import.meta.env.VITE_CHAT_URL || "https://default-chat-url.com";
        },
    },
    methods: {
        async fetchCurrentUser() {
            try {
                const response = await axios.get(`${this.$backendUrl}/api/auth/me`, {
                    withCredentials: true,
                });
                this.currentUser = response.data.user;
            } catch (error) {
                this.currentUser = null;
            }
        },
        async fetchCartCount() {
            try {
                const response = await axios.get(`${this.$backendUrl}/api/cart`, {
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
                const response = await axios.get(`${this.$backendUrl}/api/categories`);
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
                await axios.get(`${this.$backendUrl}/api/auth/logout`, {
                    withCredentials: true,
                });
                this.currentUser = null;
                this.$router.push("/login");
            } catch (error) {
                console.error("登出失敗:", error);
            }
        },
        openChat() {
            window.open(this.chatUrl, "_blank");
        },
        searchProducts() {
            if (this.searchQuery.trim() !== "") {
                this.$router.push({ path: "/search", query: { q: this.searchQuery } });
            }
        },
        startGlobalLoading() {
            this.globalLoading = true;
        },
        stopGlobalLoading() {
            this.globalLoading = false;
        },
    },
    async mounted() {
        await this.fetchCurrentUser();
        if (this.currentUser) {
            this.fetchCartCount();
            this.cartCountInterval = setInterval(this.fetchCartCount, 3000);
        }
        this.fetchCategories();
        // 設置 router 守衛，讓頁面切換時顯示全局 loading
        this.$router.beforeEach((to, from, next) => {
            this.startGlobalLoading();
            next();
        });
        this.$router.afterEach(() => {
            setTimeout(() => {
                this.stopGlobalLoading();
            }, 500);
        });
    },
    unmounted() {
        if (this.cartCountInterval) {
            clearInterval(this.cartCountInterval);
        }
    },
};
</script>

<style>
body {
    font-family: "Noto Sans TC", sans-serif;
}
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
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
    padding-top: 130px;
    padding-bottom: 30px;
}
.category-col {
    position: relative;
}
.chat-button {
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 1000;
}
</style>
