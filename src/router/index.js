// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import Auth from "../views/Auth.vue";
import Home from "../views/Home.vue";
import Products from "../views/Products.vue";
import ProductDetail from "../views/ProductDetail.vue";
import productCreate from "../views/ProductCreate.vue";
import CategoryEdit from "../views/CategoryEdit.vue";
import ShoppingCart from "../views/ShoppingCart.vue";
import Checkout from "../views/Checkout.vue";
import CollectProduct from "../views/CollectProduct.vue";
import Profile from "../views/Profile.vue";
import Orders from "../views/Orders.vue";
import OrderDetail from "../views/OrderDetail.vue";
import AdminDashboard from "../views/AdminDashboard.vue";
import Search from "../views/Search.vue";

const routes = [
    { path: "/", name: "Home", component: Home },
    { path: "/login", name: "Auth", component: Auth },
    { path: "/products", name: "products", component: Products },
    { path: "/product/:id", name: "ProductDetail", component: ProductDetail },
    { path: "/productCreate", name: "productCreate", component: productCreate },
    { path: "/CategoryEdit", name: "CategoryEdit", component: CategoryEdit },
    { path: "/category/:id", name: "CategoryProducts", component: Products },
    { path: "/cart", name: "ShoppingCart", component: ShoppingCart },
    { path: "/checkout", name: "Checkout", component: Checkout },
    { path: "/collect", name: "CollectProduct", component: CollectProduct },
    { path: "/profile", name: "Profile", component: Profile },
    { path: "/orders", name: "Orders", component: Orders },
    { path: "/order/:id", name: "OrderDetail", component: OrderDetail },
    { path: "/admin", name: "AdminDashboard", component: AdminDashboard },
    { path: "/search", name: "Search", component: Search },
];

const router = createRouter({
    history: createWebHistory(), // 使用 HTML5 History 模式
    routes,
});

export default router;
