<template>
    <v-app>
        <v-container>
            <v-card class="pa-4">
                <v-card-title>產品採集 - 1688</v-card-title>
                <v-card-text>
                    <!-- 商品分類選擇，先讓用戶選擇分類 -->
                    <v-select
                        v-model="selectedCategory"
                        :items="this.categories"
                        item-title="name"
                        item-value="id"
                        label="請選擇商品分類"
                        outlined
                        dense
                        class="mb-4"
                        return-object
                    ></v-select>
                    <!-- 產品連結輸入 -->
                    <v-text-field
                        label="產品連結"
                        v-model="productLink"
                        outlined
                        dense
                    ></v-text-field>
                    <v-btn color="primary" class="mt-4" @click="collectProduct"> 採集商品 </v-btn>
                    <v-alert v-if="error" type="error" class="mt-4" dismissible>
                        {{ error }}
                    </v-alert>

                    <!-- 採集結果預覽 -->
                    <div v-if="collectedData" class="mt-4">
                        <v-card outlined class="mb-4">
                            <v-card-title>採集結果預覽</v-card-title>
                            {{ this.collectedData }}
                            <!-- <v-card-text>
                                <div><strong>商品名稱：</strong> {{ collectedData.name }}</div>
                                <div><strong>價格：</strong> {{ collectedData.price }}</div>
                                <div>
                                    <strong>商品介紹：</strong>
                                    <div v-html="collectedData.description"></div>
                                </div>
                                <div class="mt-2">
                                    <strong>主圖：</strong>
                                    <v-img :src="collectedData.image_url" max-width="200"></v-img>
                                </div>
                            </v-card-text> -->
                        </v-card>
                        <!-- 顯示已選分類名稱 -->
                        <div>
                            <strong>所選分類：</strong>
                            <span>{{ selectedCategory ? selectedCategory.name : "" }}</span>
                        </div>
                        <v-btn color="success" class="mt-4" @click="uploadProduct"> 上傳 </v-btn>
                    </div>
                </v-card-text>
            </v-card>
        </v-container>
    </v-app>
</template>

<script>
import axios from "axios";

// 轉換 1688 API 回傳資料為符合上架格式的函式
function transform1688Product(data) {
    const item = data.item;
    const product = {};
    console.log(item);
    // 基本資料
    product.name = item.title || "";
    product.price = item.price * 10 || "";
    product.description = item.desc || "";
    product.image_url = item.pic_url || "";

    console.log(data);
    // 圖片集合
    if (Array.isArray(item.item_imgs)) {
        product.images = item.item_imgs.map((img) => ({ image_url: img.url }));
    } else {
        product.images = [];
    }
    console.log(product.images);

    // 規格：以 skus.sku 陣列轉換成 { name, price }
    if (data.skus && data.skus.sku && Array.isArray(data.skus.sku)) {
        product.specifications = data.skus.sku.map((sku) => ({
            name: sku.properties_name || "",
            price: sku.price || "",
        }));
    } else {
        product.specifications = [];
    }

    // 選項：從 item.props_name 字串解析
    if (item.props_name) {
        product.options = item.props_name
            .split(";")
            .filter((str) => str.trim() !== "")
            .map((str) => {
                const parts = str.split(":");
                return {
                    option_name: parts[2] || "",
                    option_value: parts[3] || "",
                };
            });
    } else {
        product.options = [];
    }

    return product;
}

export default {
    name: "CollectProduct",
    data() {
        return {
            productLink: "",
            collectedData: null, // 採集並轉換後的商品資料
            error: null,
            categories: [], // 從後端取得的所有分類資料
            selectedCategory: null, // 用戶選擇的分類（整個物件）
        };
    },
    methods: {
        async fetchCategories() {
            try {
                const response = await axios.get(`${this.$backendUrl}/api/categories`);
                this.categories = response.data.categories;
                console.log(this.categories);
            } catch (error) {
                console.error("取得分類資料失敗:", error);
                // this.categories = [];
            }
        },
        async collectProduct() {
            this.error = null;
            this.collectedData = null;
            if (!this.productLink) {
                this.error = "請先輸入產品連結";
                return;
            }
            try {
                const response = await axios.post(`${this.$backendUrl}/api/collect/1688`, {
                    link: this.productLink,
                });
                // 將原始資料轉換成符合上架格式
                this.collectedData = transform1688Product(response.data.data);
                // 將採集資料的分類欄位設為所選分類的 id
                if (this.selectedCategory && this.selectedCategory.id) {
                    this.collectedData.category_id = this.selectedCategory.id;
                }
                console.log(this.collectedData);
            } catch (err) {
                console.error(err);
                this.error = err.response?.data?.error || "採集失敗";
            }
        },
        async uploadProduct() {
            // 檢查必填欄位：name, category_id, price, description
            if (
                !this.collectedData.name ||
                !this.collectedData.category_id ||
                !this.collectedData.price ||
                !this.collectedData.description
            ) {
                this.error = "請確認商品資料（名稱、分類、價格、介紹）皆已填寫";
                return;
            }
            try {
                const response = await axios.post(
                    `${this.$backendUrl}/api/collect/upload`,
                    this.collectedData
                );
                alert("上傳成功，產品ID：" + response.data.productId);
                // 重置
                this.productLink = "";
                this.collectedData = null;
            } catch (err) {
                console.error(err);
                alert("上傳失敗，請稍後再試");
            }
        },
    },
    mounted() {
        this.fetchCategories();
    },
};
</script>

<style scoped>
/* 你可以根據需要進一步調整樣式 */
</style>
