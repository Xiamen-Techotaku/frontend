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
                        v-model="originalPrice"
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
            <v-alert v-if="progressMessage" type="info" class="mt-4" dense>
                {{ progressMessage }}
            </v-alert>
            <!-- 採集結果預覽 -->
            <div v-if="collectedData" class="mt-4">
                <v-card outlined class="mb-4">
                    <v-card-title>採集結果預覽</v-card-title>
                    <v-card-text>
                        <!-- 產品名稱，這裡改成可編輯 -->
                        <v-text-field
                            label="產品名稱"
                            v-model="collectedData.name"
                            outlined
                            dense
                        ></v-text-field>
                        <div class="mt-2">
                            <strong>產品介紹：</strong>
                            <div
                                v-if="!descriptionExpanded"
                                style="max-height: 150px; overflow: hidden"
                                v-html="collectedData.description"
                            ></div>
                            <div v-else v-html="collectedData.description"></div>
                            <v-btn text small @click="toggleDescription">
                                {{ descriptionExpanded ? "收起" : "展開更多" }}
                            </v-btn>
                        </div>
                        <div class="mt-2">
                            <strong>主圖：</strong>
                            <v-img :src="collectedData.image_url" max-width="200" />
                        </div>
                        <div
                            class="mt-2"
                            v-if="collectedData.images && collectedData.images.length"
                        >
                            <strong>更多圖片：</strong>
                            <v-row>
                                <v-col
                                    v-for="(img, index) in collectedData.images"
                                    :key="index"
                                    cols="3"
                                >
                                    <v-img :src="img.image_url" max-width="100" />
                                    <v-btn
                                        color="error"
                                        small
                                        @click="removeImage(index)"
                                        class="mt-1"
                                    >
                                        刪除
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </div>
                        <div
                            class="mt-2"
                            v-if="
                                collectedData.specifications && collectedData.specifications.length
                            "
                        >
                            <strong>規格：</strong>
                            <v-simple-table>
                                <thead>
                                    <tr>
                                        <th>規格名稱</th>
                                        <th>價格</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="(spec, index) in collectedData.specifications"
                                        :key="index"
                                    >
                                        <td>{{ spec.name }}</td>
                                        <td>{{ spec.price }}</td>
                                    </tr>
                                </tbody>
                            </v-simple-table>
                        </div>
                        <div
                            class="mt-2"
                            v-if="collectedData.options && collectedData.options.length"
                        >
                            <strong>選項：</strong>
                            <v-simple-table>
                                <thead>
                                    <tr>
                                        <th>選項名稱</th>
                                        <th>選項值</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(opt, index) in collectedData.options" :key="index">
                                        <td>{{ opt.option_name }}</td>
                                        <td>{{ opt.option_value }}</td>
                                    </tr>
                                </tbody>
                            </v-simple-table>
                        </div>
                    </v-card-text>
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

// 轉換 1688 產品資料的函式，保留規格原始價格以便後續更新
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
        let specSet = new Map();
        let optionSet = new Map();
        let skuPrices = [];

        item.skus.sku.forEach((sku) => {
            const basePrice = sku.price ? parseFloat(sku.price) : 0;
            const skuPrice = basePrice * multiplier;
            skuPrices.push(skuPrice);

            const skuProps = sku.properties_name || "";
            const parts = skuProps.split(";");
            parts
                .filter((part) => part.startsWith("0:"))
                .forEach((part) => {
                    const tokens = part.split(":");
                    if (tokens.length >= 4) {
                        const specText = tokens[2] + ":" + tokens[3];
                        if (!specSet.has(specText)) {
                            specSet.set(specText, {
                                name: specText,
                                originalPrice: basePrice,
                                price: basePrice * multiplier,
                            });
                        }
                    }
                });
            parts
                .filter((part) => part.startsWith("1:"))
                .forEach((part) => {
                    const tokens = part.split(":");
                    if (tokens.length >= 4) {
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

        product.specifications = Array.from(specSet.values());
        product.options = Array.from(optionSet.values());
        const minPrice = Math.min(...skuPrices);
        product.originalPrice = Math.round(minPrice);
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
            progressMessage: "",
            descriptionExpanded: false,
        };
    },
    computed: {
        originalPrice: {
            get() {
                return this.collectedData ? this.collectedData.originalPrice : "";
            },
            set(val) {
                if (this.collectedData) {
                    this.collectedData.originalPrice = val;
                }
            },
        },
    },
    methods: {
        async collectProduct() {
            this.error = null;
            this.collectedData = null;
            this.progressMessage = "開始採集商品...";
            if (!this.productLink) {
                this.error = "請先輸入產品連結";
                this.progressMessage = "";
                return;
            }
            try {
                this.progressMessage = "正在呼叫採集 API...";
                const response = await axios.post(
                    `${this.backendUrl}/api/collect/1688`,
                    { link: this.productLink },
                    { withCredentials: true }
                );
                this.progressMessage = "轉換資料中...";
                let data = transform1688Product(response.data.data, this.priceMultiplier);
                if (this.selectedCategory && this.selectedCategory.id) {
                    data.category_id = this.selectedCategory.id;
                }
                this.collectedData = data;
                // 設定賣價為原價乘上倍數
                this.sellingPrice = data.originalPrice * this.priceMultiplier;
                this.progressMessage = "採集完成";
            } catch (err) {
                console.error(err);
                this.error = err.response?.data?.error || "採集失敗";
                this.progressMessage = "";
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
        toggleDescription() {
            this.descriptionExpanded = !this.descriptionExpanded;
        },
        removeImage(index) {
            if (this.collectedData && this.collectedData.images) {
                const removedImage = this.collectedData.images[index].image_url;
                this.collectedData.images.splice(index, 1);
                if (this.collectedData.image_url === removedImage) {
                    if (this.collectedData.images.length > 0) {
                        this.collectedData.image_url = this.collectedData.images[0].image_url;
                    } else {
                        this.collectedData.image_url = "";
                    }
                }
            }
        },
    },
    watch: {
        priceMultiplier(newVal) {
            if (this.collectedData) {
                const newSellingPrice = this.collectedData.originalPrice * newVal;
                this.sellingPrice = newSellingPrice;
                this.collectedData.price = newSellingPrice;
                if (this.collectedData.specifications && this.collectedData.specifications.length) {
                    this.collectedData.specifications.forEach((spec) => {
                        spec.price = spec.originalPrice * newVal;
                    });
                }
            }
        },
    },
};
</script>

<style scoped>
/* 根據需要自定義樣式 */
</style>
