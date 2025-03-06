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
            <!-- 採集進度提示 -->
            <div v-if="progressMessage" class="mt-4">
                <v-alert type="info" dense text>{{ progressMessage }}</v-alert>
            </div>
            <div v-if="collectedData" class="mt-4">
                <v-card outlined class="mb-4">
                    <v-card-title>採集結果預覽</v-card-title>
                    <pre>{{ collectedData }}</pre>
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

// 等待函式
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 轉換京東產品資料，加入進度更新回呼函式
 * @param {object} data 京東 API 回傳的資料
 * @param {number} multiplier 價格倍數
 * @param {string} backendUrl 後端 API 網址
 * @param {string} mainSkuId 主 SKU id
 * @param {function} updateProgress 回呼函式，更新進度訊息
 */
async function transformJDProduct(data, multiplier = 10, backendUrl, mainSkuId, updateProgress) {
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
        const updatedSkus = [];
        // 逐一處理每個 SKU，並更新進度訊息
        for (let i = 0; i < skus.length; i++) {
            updateProgress(`採集sku中 第 ${i + 1} 個`);
            const sku = skus[i];
            const skuId = sku.sku_id;
            let correctPrice;
            if (skuId === mainSkuId) {
                // 主 SKU 直接使用原始價格
                correctPrice = parseFloat(sku.price);
                console.log("相同的 sku_id，直接使用價格");
            } else {
                // 非主 SKU 無限重試直到採集成功
                while (true) {
                    await delay(1500); // 控制 QPS，每次呼叫延遲 1.5 秒
                    try {
                        const resp = await axios.post(
                            `${backendUrl}/api/collect/jd_sku`,
                            { link: sku.sku_url },
                            { withCredentials: true }
                        );
                        if (
                            resp.data &&
                            resp.data.data &&
                            resp.data.data.item &&
                            resp.data.data.item.price
                        ) {
                            correctPrice = parseFloat(resp.data.data.item.price);
                            break; // 成功取得後跳出重試迴圈
                        } else {
                            throw new Error("採集內容失敗");
                        }
                    } catch (error) {
                        updateProgress(`採集sku中 第 ${i + 1} 個失敗，重新採集中...`);
                        // 重試前再延遲一段時間
                        await delay(1500);
                    }
                }
            }
            updatedSkus.push({ ...sku, price: correctPrice });
        }

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
                            specSet.set(specText, {
                                name: specText,
                                price: Math.round(sku.price * multiplier),
                            });
                        }
                    }
                });
        });
        product.specifications = Array.from(specSet.values());

        // 收集選項：若有 "1:" 的資料
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

        // 以所有 SKU 中最低的價格作為產品原價與售價
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
            progressMessage: "", // 採集進度訊息
        };
    },
    methods: {
        async collectProduct() {
            // 檢查是否選擇分類
            if (!this.selectedCategory) {
                this.error = "請先選擇商品分類";
                return;
            }
            this.error = null;
            this.collectedData = null;
            this.progressMessage = "採集商品中...";
            if (!this.productLink) {
                this.error = "請先輸入產品連結";
                this.progressMessage = "";
                return;
            }
            try {
                // 呼叫京東 API 採集 SKU 部分
                const response = await axios.post(
                    `${this.backendUrl}/api/collect/jd`,
                    { link: this.productLink },
                    { withCredentials: true }
                );
                // 從連結中提取主 sku id
                const mainSkuMatch = this.productLink.match(/\/(\d+)\.html/);
                const mainSkuId = mainSkuMatch ? mainSkuMatch[1] : null;
                // 進入 SKU 採集，並傳入更新進度的回呼函式
                let data = await transformJDProduct(
                    response.data.data,
                    this.priceMultiplier,
                    this.backendUrl,
                    mainSkuId,
                    (msg) => {
                        this.progressMessage = msg;
                    }
                );
                // 加入分類資訊
                if (this.selectedCategory && this.selectedCategory.id) {
                    data.category_id = this.selectedCategory.id;
                }
                this.collectedData = data;
                this.sellingPrice = data.price;
                // 更新進度進入描述採集
                this.progressMessage = "採集商品描述中...";
                await this.collectDescription();
            } catch (err) {
                console.error(err);
                this.error = err.response?.data?.error || "採集失敗";
                this.progressMessage = "";
            }
        },
        async collectDescription() {
            while (true) {
                try {
                    this.progressMessage = `採集商品描述中...`;
                    const response = await axios.post(
                        `${this.backendUrl}/api/collect/jd_desc`,
                        { link: this.productLink },
                        { withCredentials: true }
                    );
                    if (
                        response.data &&
                        response.data.data &&
                        response.data.data.item &&
                        response.data.data.item.desc
                    ) {
                        const descData = response.data.data.item.desc;
                        // 將描述補進採集資料中
                        this.collectedData.description = descData;
                        this.progressMessage = "採集完成";
                        break; // 成功後跳出無限迴圈
                    } else {
                        throw new Error("採集內容失敗");
                    }
                } catch (err) {
                    this.progressMessage = "採集商品描述失敗，重新採集中...";
                    // 可根據需要增加延遲
                    await delay(1000);
                }
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
                this.progressMessage = "";
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
