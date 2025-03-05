<template>
    <v-card class="pa-4 mt-4">
        <v-card-title>產品採集 - 京東</v-card-title>
        <v-card-text>
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
            <v-btn color="primary" class="mt-4" @click="collectProduct"> 採集商品 </v-btn>
            <v-alert v-if="error" type="error" class="mt-4" dismissible>
                {{ error }}
            </v-alert>
            <div v-if="collectedData" class="mt-4">
                <v-card outlined class="mb-4">
                    <v-card-title>採集結果預覽</v-card-title>
                    {{ collectedData }}
                </v-card>
                <div>
                    <strong>所選分類：</strong>
                    <span>{{ selectedCategory ? selectedCategory.name : "" }}</span>
                </div>
                <v-btn color="success" class="mt-4" @click="uploadProduct"> 上傳 </v-btn>
            </div>
        </v-card-text>
    </v-card>
</template>

<script>
import axios from "axios";

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
    name: "CollectProductJD",
    props: {
        categories: {
            type: Array,
            default: () => [],
        },
        backendUrl: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            productLink: "",
            collectedData: null,
            error: null,
            selectedCategory: null,
            priceMultiplier: 10,
            sellingPrice: null,
        };
    },
    methods: {
        async collectProduct() {
            this.error = null;
            this.collectedData = null;
            if (!this.productLink) {
                this.error = "請先輸入產品連結";
                return;
            }
            try {
                const response = await axios.post(
                    `${this.backendUrl}/api/collect/jd`,
                    { link: this.productLink },
                    { withCredentials: true }
                );
                console.log(response.data.data);
                let data = transformJDProduct(response.data.data, this.priceMultiplier);
                if (this.selectedCategory && this.selectedCategory.id) {
                    data.category_id = this.selectedCategory.id;
                }
                this.collectedData = data;
                this.sellingPrice = data.price;
            } catch (err) {
                console.error(err);
                this.error = err.response?.data?.error || "採集失敗";
            }
        },
        async uploadProduct() {
            if (
                !this.collectedData ||
                !this.collectedData.name ||
                !this.collectedData.category_id ||
                !this.collectedData.price
            ) {
                this.error = "請確認商品資料（名稱、分類、價格）皆已填寫";
                return;
            }
            // 更新賣價
            this.collectedData.price = this.sellingPrice;
            try {
                const response = await axios.post(
                    `${this.backendUrl}/api/collect/upload`,
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
        priceMultiplier(newVal) {
            if (this.collectedData) {
                this.sellingPrice = this.collectedData.originalPrice * newVal;
            }
        },
    },
};
</script>
