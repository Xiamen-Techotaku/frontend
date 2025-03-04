<template>
    <v-app>
        <v-container>
            <v-row>
                <v-col cols="12">
                    <v-btn color="primary" @click="$router.go(-1)" class="mb-4">返回</v-btn>
                </v-col>
            </v-row>
            <!-- 分頁選單：'one' 代表 1688，'two' 代表 京東 -->
            <v-tabs v-model="tab" background-color="primary" dark>
                <v-tab value="one">1688採集</v-tab>
                <v-tab value="two">京東採集</v-tab>
            </v-tabs>
            <v-tabs-window v-model="tab">
                <!-- 1688 採集分頁 -->
                <v-tabs-window-item value="one">
                    <v-card class="pa-4 mt-4">
                        <v-card-title>產品採集 - 1688</v-card-title>
                        <v-card-text>
                            <!-- 商品分類選擇 -->
                            <v-select
                                v-model="selectedCategory"
                                :items="categories"
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
                                class="mb-4"
                            ></v-text-field>
                            <!-- 價格欄位：原價、倍數、賣價（皆一直顯示） -->
                            <v-row>
                                <v-col cols="4">
                                    <v-text-field
                                        label="原價"
                                        :value="collectedData ? collectedData.originalPrice : ''"
                                        readonly
                                        outlined
                                        dense
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="4">
                                    <v-text-field
                                        label="倍數"
                                        v-model.number="priceMultiplier"
                                        type="number"
                                        :min="1"
                                        outlined
                                        dense
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="4">
                                    <v-text-field
                                        label="賣價"
                                        v-model.number="sellingPrice"
                                        type="number"
                                        outlined
                                        dense
                                    ></v-text-field>
                                </v-col>
                            </v-row>
                            <v-btn color="primary" class="mt-4" @click="collectProduct">
                                採集商品
                            </v-btn>
                            <v-alert v-if="error" type="error" class="mt-4" dismissible>
                                {{ error }}
                            </v-alert>
                            <!-- 採集結果預覽 -->
                            <div v-if="collectedData" class="mt-4">
                                <v-card outlined class="mb-4">
                                    <v-card-title>採集結果預覽</v-card-title>
                                    {{ collectedData }}
                                </v-card>
                                <div>
                                    <strong>所選分類：</strong>
                                    <span>{{ selectedCategory ? selectedCategory.name : "" }}</span>
                                </div>
                                <v-btn color="success" class="mt-4" @click="uploadProduct">
                                    上傳
                                </v-btn>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-tabs-window-item>
                <!-- 京東 採集分頁 -->
                <v-tabs-window-item value="two">
                    <v-card class="pa-4 mt-4">
                        <v-card-title>產品採集 - 京東</v-card-title>
                        <v-card-text>
                            <!-- 同上，共用變數 -->
                            <v-select
                                v-model="selectedCategory"
                                :items="categories"
                                item-title="name"
                                item-value="id"
                                label="請選擇商品分類"
                                outlined
                                dense
                                class="mb-4"
                                return-object
                            ></v-select>
                            <v-text-field
                                label="產品連結"
                                v-model="productLink"
                                outlined
                                dense
                                class="mb-4"
                            ></v-text-field>
                            <!-- 三格價格欄位 -->
                            <v-row>
                                <v-col cols="4">
                                    <v-text-field
                                        label="原價"
                                        :value="collectedData ? collectedData.originalPrice : ''"
                                        readonly
                                        outlined
                                        dense
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="4">
                                    <v-text-field
                                        label="倍數"
                                        v-model.number="priceMultiplier"
                                        type="number"
                                        :min="1"
                                        outlined
                                        dense
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="4">
                                    <v-text-field
                                        label="賣價"
                                        v-model.number="sellingPrice"
                                        type="number"
                                        outlined
                                        dense
                                    ></v-text-field>
                                </v-col>
                            </v-row>
                            <v-btn color="primary" class="mt-4" @click="collectProduct">
                                採集商品
                            </v-btn>
                            <v-alert v-if="error" type="error" class="mt-4" dismissible>
                                {{ error }}
                            </v-alert>
                            <!-- 採集結果預覽 -->
                            <div v-if="collectedData" class="mt-4">
                                <v-card outlined class="mb-4">
                                    <v-card-title>採集結果預覽</v-card-title>
                                    {{ collectedData }}
                                </v-card>
                                <div>
                                    <strong>所選分類：</strong>
                                    <span>{{ selectedCategory ? selectedCategory.name : "" }}</span>
                                </div>
                                <v-btn color="success" class="mt-4" @click="uploadProduct">
                                    上傳
                                </v-btn>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-tabs-window-item>
            </v-tabs-window>
        </v-container>
    </v-app>
</template>

<script>
import axios from "axios";

// 1688 轉換函式
function transform1688Product(data, multiplier = 10) {
    const item = data.item;
    const product = {};
    product.originalPrice = item.price || 0;
    product.name = item.title || "";
    product.price = product.originalPrice * multiplier;
    product.description = item.desc || "";
    product.image_url = item.pic_url || "";
    product.images = Array.isArray(item.item_imgs)
        ? item.item_imgs.map((img) => ({ image_url: img.url }))
        : [];
    product.specifications =
        data.skus && data.skus.sku && Array.isArray(data.skus.sku)
            ? data.skus.sku.map((sku) => ({
                  name: sku.properties_name || "",
                  price: sku.price || "",
              }))
            : [];
    product.options = item.props_name
        ? item.props_name
              .split(";")
              .filter((str) => str.trim() !== "")
              .map((str) => {
                  const parts = str.split(":");
                  return {
                      option_name: parts[2] || "",
                      option_value: parts[3] || "",
                  };
              })
        : [];
    return product;
}

// 京東 轉換函式
function transformJDProduct(data, multiplier = 10) {
    const item = data.item || {};
    const product = {};
    product.originalPrice = parseFloat(item.price) || 0;
    product.name = item.title || "";
    product.price = product.originalPrice * multiplier;
    product.description = item.desc || "";
    product.image_url = item.pic_url || "";
    product.images = Array.isArray(item.item_imgs)
        ? item.item_imgs.map((img) => ({ image_url: img.url }))
        : [];
    product.specifications =
        data.skus && data.skus.sku && Array.isArray(data.skus.sku)
            ? data.skus.sku.map((sku) => ({
                  name: sku.properties_name || "",
                  price: sku.price || "",
              }))
            : [];
    product.options = item.props_name
        ? item.props_name
              .split(";")
              .filter((str) => str.trim() !== "")
              .map((str) => {
                  const parts = str.split(":");
                  return {
                      option_name: parts[2] || "",
                      option_value: parts[3] || "",
                  };
              })
        : [];
    return product;
}

export default {
    name: "CollectProduct",
    data() {
        return {
            categories: [],
            productLink: "",
            collectedData: null,
            error: null,
            selectedCategory: null,
            priceMultiplier: 10,
            sellingPrice: null,
            tab: "one",
            // 新增 adminUser 與 loading 狀態
            adminUser: null,
            loading: false,
        };
    },
    methods: {
        async fetchAdminUser() {
            this.loading = true;
            try {
                const response = await axios.get(`${this.$backendUrl}/api/admin/me`, {
                    withCredentials: true,
                });
                this.adminUser = response.data.user;
                if (!this.adminUser) {
                    alert("您沒有管理員權限！");
                    this.$router.push("/login");
                }
            } catch (error) {
                console.error("管理員驗證失敗：", error);
                alert("您沒有管理員權限！");
                this.$router.push("/login");
            } finally {
                this.loading = false;
            }
        },
        async fetchCategories() {
            try {
                const response = await axios.get(`${this.$backendUrl}/api/categories`);
                this.categories = response.data.categories;
            } catch (error) {
                console.error("取得分類資料失敗:", error);
            }
        },
        // 共用採集方法：根據 tab 選擇對應 API 與轉換函式
        async collectProduct() {
            this.error = null;
            this.collectedData = null;
            if (!this.productLink) {
                this.error = "請先輸入產品連結";
                return;
            }
            try {
                const endpoint = this.tab === "one" ? "/api/collect/1688" : "/api/collect/jd";
                const response = await axios.post(
                    `${this.$backendUrl}${endpoint}`,
                    { link: this.productLink },
                    { withCredentials: true }
                );
                const transformFn = this.tab === "one" ? transform1688Product : transformJDProduct;
                let data = transformFn(response.data.data, this.priceMultiplier);
                if (this.selectedCategory && this.selectedCategory.id) {
                    data.category_id = this.selectedCategory.id;
                }
                this.collectedData = data;
                // 初始賣價以原價 * 倍數計算
                this.sellingPrice = data.price;
            } catch (err) {
                console.error(err);
                this.error = err.response?.data?.error || "採集失敗";
            }
        },
        // 共用上傳方法：上傳前將使用者自訂的賣價寫入
        async uploadProduct() {
            if (
                !this.collectedData ||
                !this.collectedData.name ||
                !this.collectedData.category_id ||
                !this.collectedData.price ||
                (this.tab === "one" && !this.collectedData.description)
            ) {
                this.error =
                    this.tab === "one"
                        ? "請確認商品資料（名稱、分類、價格、介紹）皆已填寫"
                        : "請確認商品資料（名稱、分類、價格）皆已填寫";
                return;
            }
            // 將使用者修改的賣價寫回採集資料
            this.collectedData.price = this.sellingPrice;
            try {
                const response = await axios.post(
                    `${this.$backendUrl}/api/collect/upload`,
                    this.collectedData,
                    { withCredentials: true }
                );
                alert("上傳成功，產品ID：" + response.data.productId);
                this.productLink = "";
                this.collectedData = null;
            } catch (err) {
                console.error(err);
                alert("上傳失敗，請稍後再試");
            }
        },
    },
    watch: {
        // 當 multiplier 改變時，更新賣價（自動計算覆蓋原來的賣價）
        priceMultiplier(newVal) {
            if (this.collectedData) {
                this.sellingPrice = this.collectedData.originalPrice * newVal;
            }
        },
    },
    mounted() {
        this.fetchAdminUser();
        this.fetchCategories();
    },
};
</script>

<style scoped>
/* 根據需求進一步調整樣式 */
</style>
