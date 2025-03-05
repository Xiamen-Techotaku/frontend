<template>
    <v-card class="pa-4 mt-4">
        <v-card-title>產品採集 - 1688</v-card-title>
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

// 1688 轉換函式
function transform1688Product(data, multiplier = 10) {
    const item = data.item;
    const product = {};
    product.name = item.title || "";
    product.description = item.desc || "";
    product.image_url = item.pic_url || "";
    product.images = Array.isArray(item.item_imgs)
        ? item.item_imgs.map((img) => ({ image_url: img.url }))
        : [];

    if (item.skus && item.skus.sku && Array.isArray(item.skus.sku) && item.skus.sku.length) {
        product.options = [];
        product.specifications = [];

        // 從第一筆 sku 擷取 options (預設各 sku 的 option 定義皆相同)
        const firstSkuProps = item.skus.sku[0].properties_name || "";
        const parts = firstSkuProps.split(";");
        parts.forEach((part) => {
            const tokens = part.split(":");
            // tokens[0] 為 "0" 的為 option
            if (tokens[0] === "0") {
                product.options.push({
                    option_name: tokens[2] || "",
                    option_value: tokens[3] || "",
                });
            }
        });

        // 每筆 sku 處理規格與價格資訊
        item.skus.sku.forEach((sku) => {
            const skuProps = sku.properties_name || "";
            // 取出前綴為 "1" 的 spec 資料
            const specParts = skuProps.split(";").filter((part) => part.startsWith("1:"));
            let specDetail = "";
            specParts.forEach((part) => {
                const tokens = part.split(":");
                if (tokens.length >= 4) {
                    specDetail += tokens[2] + ":" + tokens[3] + " ";
                }
            });
            product.specifications.push({
                name: specDetail.trim(),
                price: sku.price ? parseFloat(sku.price) * multiplier : 0,
            });
        });

        // 以所有 sku 中最低的價格作為原價與售價的基準
        const skuPrices = product.specifications.map((s) => s.price);
        product.originalPrice = Math.min(...skuPrices);
        product.price = product.originalPrice;
    } else {
        product.options = [];
        product.specifications = [];
        product.originalPrice = item.price ? parseFloat(item.price) : 0;
        product.price = product.originalPrice * multiplier;
    }

    return product;
}

export default {
    name: "CollectProduct1688",
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
                    `${this.backendUrl}/api/collect/1688`,
                    { link: this.productLink },
                    { withCredentials: true }
                );
                console.log(response.data.data);
                let data = transform1688Product(response.data.data, this.priceMultiplier);
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
                !this.collectedData.price ||
                !this.collectedData.description
            ) {
                this.error = "請確認商品資料（名稱、分類、價格、介紹）皆已填寫";
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
