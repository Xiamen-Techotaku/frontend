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

// 京東 轉換函式，更新後根據主商品 id 與 sku_url 取得正確價格
async function transformJDProduct(data, multiplier = 10, backendUrl, mainSkuId) {
    const item = data.item || {};
    const product = {};
    product.name = item.title || "";
    product.description = item.desc || "";
    product.image_url = item.pic_url || "";
    product.images = Array.isArray(item.item_imgs)
        ? item.item_imgs.map((img) => ({ image_url: img.url }))
        : [];

    if (item.skus && item.skus.sku && Array.isArray(item.skus.sku) && item.skus.sku.length) {
        const skus = item.skus.sku;
        // 處理每一筆 sku：若 sku_id 與 mainSkuId 相同，直接使用 jd API 回傳的價格
        // 否則呼叫 /api/collect/jd_sku 取得正確價格
        const updatedSkus = await Promise.all(
            skus.map(async (sku) => {
                const skuId = sku.sku_id;
                let correctPrice;
                if (skuId === mainSkuId) {
                    correctPrice = parseFloat(sku.price);
                    console.log("相同");
                } else {
                    try {
                        console.log(sku.sku_id);
                        const resp = await axios.post(
                            `${backendUrl}/api/collect/jd_sku`,
                            { link: sku.sku_url },
                            { withCredentials: true }
                        );

                        console.log(resp);

                        // 如果取得的資料有正確的價格則使用，否則 fallback
                        correctPrice =
                            resp.data.data && resp.data.data.item
                                ? parseFloat(resp.data.data.item.price)
                                : parseFloat(sku.price);
                    } catch (error) {
                        correctPrice = parseFloat(sku.price);
                    }
                }
                return { ...sku, price: correctPrice };
            })
        );

        // 收集規格：僅取前綴為 "0:" 的部分
        let specSet = new Map();
        updatedSkus.forEach((sku) => {
            const skuProps = sku.properties_name || "";
            const parts = skuProps.split(";");
            parts
                .filter((part) => part.startsWith("0:"))
                .forEach((part) => {
                    const tokens = part.split(":");
                    if (tokens.length >= 4) {
                        const specText = tokens[2] + ":" + tokens[3];
                        if (!specSet.has(specText)) {
                            // 更新價格乘上倍數後四捨五入
                            specSet.set(specText, {
                                name: specText,
                                price: Math.round(sku.price * multiplier),
                            });
                        }
                    }
                });
        });
        product.specifications = Array.from(specSet.values());

        // 收集選項：若有 "1:" 的資料（若有則組合）
        let optionSet = new Map();
        if (item.props_name) {
            item.props_name
                .split(";")
                .filter((str) => str.trim() !== "")
                .forEach((part) => {
                    const tokens = part.split(":");
                    if (tokens[0] === "1" && tokens.length >= 4) {
                        const optText = tokens[2] + ":" + tokens[3];
                        if (!optionSet.has(optText)) {
                            optionSet.set(optText, {
                                option_name: tokens[2] || "",
                                option_value: tokens[3] || "",
                            });
                        }
                    }
                });
        }
        product.options = Array.from(optionSet.values());

        // 以所有 sku 中最低的價格作為產品原價與售價
        const prices = updatedSkus.map((sku) => Math.round(sku.price * multiplier));
        product.originalPrice = Math.min(...prices);
        product.price = product.originalPrice;
    } else {
        product.options = [];
        product.specifications = [];
        const basePrice = item.price ? parseFloat(item.price) : 0;
        product.originalPrice = Math.round(basePrice);
        product.price = Math.round(product.originalPrice * multiplier);
    }
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
                // 呼叫 jd 的 API 取得主要架構
                const response = await axios.post(
                    `${this.backendUrl}/api/collect/jd`,
                    { link: this.productLink },
                    { withCredentials: true }
                );
                console.log(response.data.data);
                // 從使用者輸入的連結中提取主 sku id
                const mainSkuMatch = this.productLink.match(/\/(\d+)\.html/);
                const mainSkuId = mainSkuMatch ? mainSkuMatch[1] : null;
                // 呼叫 transformJDProduct 時傳入 mainSkuId
                let data = await transformJDProduct(
                    response.data.data,
                    this.priceMultiplier,
                    this.backendUrl,
                    mainSkuId
                );
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
