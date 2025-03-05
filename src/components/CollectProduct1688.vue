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
        // 用來收集唯一的 spec 與 option
        let specSet = new Map();
        let optionSet = new Map();
        let skuPrices = [];

        // 遍歷每筆 SKU
        item.skus.sku.forEach((sku) => {
            // 取出該 SKU 的價格（乘上倍數）
            const skuPrice = sku.price ? parseFloat(sku.price) * multiplier : 0;
            skuPrices.push(skuPrice);

            const skuProps = sku.properties_name || "";
            const parts = skuProps.split(";");
            // 處理 spec（前綴 "0:"）
            parts
                .filter((part) => part.startsWith("0:"))
                .forEach((part) => {
                    const tokens = part.split(":");
                    if (tokens.length >= 4) {
                        // 組合 spec 名稱與值，例如 "颜色:塞巴莉莉【裙+手套+头饰+颈圈+蝴蝶结】"
                        const specText = tokens[2] + ":" + tokens[3];
                        if (!specSet.has(specText)) {
                            specSet.set(specText, { name: specText, price: skuPrice });
                        }
                    }
                });
            // 處理 option（前綴 "1:"）
            parts
                .filter((part) => part.startsWith("1:"))
                .forEach((part) => {
                    const tokens = part.split(":");
                    if (tokens.length >= 4) {
                        // 組合 option 的名稱與值，例如 "尺码:S"
                        const optText = tokens[2] + ":" + tokens[3];
                        if (!optionSet.has(optText)) {
                            optionSet.set(optText, {
                                option_name: tokens[2] || "",
                                option_value: tokens[3] || "",
                            });
                        }
                    }
                });
        });

        // 將唯一的 spec 與 option 塞入產品資料
        product.specifications = Array.from(specSet.values());
        product.options = Array.from(optionSet.values());
        // 以所有 SKU 中最低的價格作為產品原價與售價，並做四捨五入
        const minPrice = Math.min(...skuPrices);
        product.originalPrice = Math.round(minPrice);
        product.price = product.originalPrice;
    } else {
        // 若無 SKU，採用 item 上的價格，並先轉為數字後四捨五入
        product.options = [];
        product.specifications = [];
        const basePrice = item.price ? parseFloat(item.price) : 0;
        product.originalPrice = Math.round(basePrice);
        product.price = Math.round(product.originalPrice * multiplier);
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
