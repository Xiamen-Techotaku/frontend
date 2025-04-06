<template>
    <v-app>
        <v-container class="py-8">
            <!-- 返回按鈕 -->
            <v-btn color="primary" @click="goBack" class="mb-4">返回</v-btn>

            <v-row>
                <!-- 左側：圖片輪播 -->
                <v-col cols="12" md="6">
                    <v-carousel
                        v-if="product.images && product.images.length"
                        show-arrows="hover"
                        hide-delimiters
                    >
                        <v-carousel-item v-for="(img, index) in product.images" :key="index">
                            <BaseImage
                                :src="img.image_url"
                                :alt="product.name"
                                class="fill-height"
                            ></BaseImage>
                        </v-carousel-item>
                    </v-carousel>
                    <v-skeleton-loader v-else type="image"></v-skeleton-loader>
                </v-col>

                <!-- 右側：商品資訊 -->
                <v-col cols="12" md="6">
                    <v-card outlined>
                        <!-- 顯示商品名稱 -->
                        <v-card-title class="text-h5 product-title">
                            {{ product.name }}
                        </v-card-title>

                        <!-- 顯示價格 -->
                        <v-card-subtitle class="price">
                            {{ displayPrice }}
                        </v-card-subtitle>

                        <v-card-text>
                            <!-- 規格選擇 (單選) -->
                            <div
                                v-if="product.specifications && product.specifications.length"
                                class="my-4"
                            >
                                <label class="spec-label">規格：</label>
                                <v-chip-group
                                    v-model="selectedSpecId"
                                    selected-class="chip-active"
                                    column
                                    mandatory
                                >
                                    <v-chip
                                        v-for="spec in product.specifications"
                                        :key="spec.id"
                                        :value="spec.id"
                                        outlined
                                        class="spec-chip"
                                    >
                                        {{ getDisplayText(spec.name) }}
                                    </v-chip>
                                </v-chip-group>
                            </div>

                            <!-- 選項選擇 (單選) -->
                            <div
                                v-if="optionGroups && Object.keys(optionGroups).length"
                                class="my-4"
                            >
                                <div
                                    v-for="(options, group) in optionGroups"
                                    :key="group"
                                    class="mb-2"
                                >
                                    <label class="spec-label">{{ group }}：</label>
                                    <v-chip-group
                                        v-model="selectedOptions[group]"
                                        selected-class="chip-active"
                                        column
                                        mandatory
                                    >
                                        <v-chip
                                            v-for="option in options"
                                            :key="option.id"
                                            :value="option.id"
                                            outlined
                                            class="spec-chip"
                                        >
                                            {{ getDisplayText(option.option_value) }}
                                        </v-chip>
                                    </v-chip-group>
                                </div>
                            </div>

                            <!-- 數量與按鈕 -->
                            <v-row align="center" class="my-4">
                                <v-col cols="12" md="6">
                                    <label class="spec-label">數量：</label>
                                    <v-number-input
                                        control-variant="split"
                                        v-model.number="orderQuantity"
                                        :min="1"
                                        density="compact"
                                    ></v-number-input>
                                </v-col>
                                <v-col cols="12" md="6" class="text-right">
                                    <v-btn color="primary" class="mr-2" @click="addToCart">
                                        放入購物車
                                    </v-btn>
                                    <v-btn color="error" @click="buyNow"> 立即購買 </v-btn>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <!-- 分頁式顯示：商品內容 與 評論 -->
            <v-tabs v-model="tab" background-color="transparent" class="mt-6">
                <v-tab value="one">商品內容</v-tab>
                <v-tab value="two">評論</v-tab>
            </v-tabs>

            <v-card-text>
                <v-tabs-window v-model="tab">
                    <!-- 商品內容 -->
                    <v-tabs-window-item value="one">
                        <v-card-text v-html="product.description"></v-card-text>
                    </v-tabs-window-item>
                    <!-- 評論 -->
                    <v-tabs-window-item value="two">
                        <div v-if="reviews && reviews.length">
                            <div v-for="(review, index) in reviews" :key="index" class="mb-4">
                                <v-card outlined>
                                    <v-card-title>
                                        {{ review.reviewer_name ? review.reviewer_name : "匿名" }}
                                    </v-card-title>
                                    <v-card-text>
                                        {{ review.content }}
                                        <div v-if="review.rating" class="mt-2">
                                            <!-- 用星星顯示評分 -->
                                            <v-rating
                                                :model-value="review.rating"
                                                readonly
                                                color="amber"
                                                background-color="grey lighten-3"
                                                dense
                                            ></v-rating>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </div>
                        </div>
                        <div v-else>
                            <p>目前沒有評論</p>
                        </div>
                    </v-tabs-window-item>
                </v-tabs-window>
            </v-card-text>
        </v-container>
    </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { useHead } from "@vueuse/head";

const route = useRoute();
const router = useRouter();
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const product = ref({
    images: [],
    specifications: [],
    options: [],
});
const loading = ref(true);
const selectedSpecId = ref(null);
const selectedOptions = ref({});
const orderQuantity = ref(1);
const tab = ref("one");
const reviews = ref([]);

// 取得商品資料
const fetchProduct = async () => {
    const productId = route.params.id;
    try {
        const response = await axios.get(`${backendUrl}/api/products/${productId}`);
        product.value = response.data.product;
        const reviewsResponse = await axios.get(`${backendUrl}/api/reviews`, {
            params: { product_id: productId },
        });
        reviews.value = reviewsResponse.data.reviews || [];
    } catch (error) {
        console.error("取得商品資料失敗：", error);
    } finally {
        loading.value = false;
        autoSelectSingle();
    }
};

const autoSelectSingle = () => {
    if (product.value.specifications && product.value.specifications.length > 0) {
        selectedSpecId.value = product.value.specifications[0].id;
    }
    // 對於每個選項群預設選第一個
    (product.value.options || []).forEach((opt) => {
        if (!selectedOptions.value[opt.option_name]) {
            selectedOptions.value[opt.option_name] = opt.id;
        }
    });
};

onMounted(() => {
    fetchProduct();
});

const goBack = () => {
    router.back();
};

const addToCart = async () => {
    try {
        let optionId = null;
        const groups = Object.keys(selectedOptions.value);
        if (groups.length > 0) {
            optionId = selectedOptions.value[groups[0]];
        }
        const payload = {
            productId: product.value.id,
            specificationId: selectedSpec.value ? selectedSpec.value.id : null,
            optionId,
            quantity: orderQuantity.value,
        };
        await axios.post(`${backendUrl}/api/cart`, payload, {
            withCredentials: true,
        });
        alert("已加入購物車");
    } catch (error) {
        console.error("加入購物車失敗：", error);
        alert("加入購物車失敗，請稍後再試");
    }
};

const buyNow = async () => {
    await addToCart();
    router.push("/checkout");
};

const formatPrice = (value) => {
    return `$${Math.round(parseFloat(value))}`;
};

const getDisplayText = (text) => {
    if (text && text.includes(":")) {
        return text.split(":")[1].trim();
    }
    return text;
};

const selectedSpec = computed(() => {
    if (!product.value.specifications) return null;
    return product.value.specifications.find((spec) => spec.id === selectedSpecId.value) || null;
});

const displayPrice = computed(() => {
    if (selectedSpec.value) {
        return formatPrice(selectedSpec.value.price);
    } else if (product.value.specifications && product.value.specifications.length) {
        const prices = product.value.specifications.map((spec) => spec.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        return minPrice === maxPrice
            ? formatPrice(minPrice)
            : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
    } else {
        return formatPrice(product.value.price);
    }
});

const optionGroups = computed(() => {
    const groups = {};
    if (product.value.options && product.value.options.length) {
        product.value.options.forEach((opt) => {
            if (!groups[opt.option_name]) {
                groups[opt.option_name] = [];
            }
            groups[opt.option_name].push(opt);
        });
    }
    return groups;
});

// 設定該頁面的 OG meta 標籤
function stripHtml(html) {
    return html.replace(/<[^>]+>/g, "").trim();
}

const pageTitle = computed(() => {
    return product.value.name || "商品詳情";
});
const pageDescription = computed(() => {
    return product.value.description
        ? stripHtml(product.value.description.substring(0, 160))
        : "商品詳情";
});
const pageImage = computed(() => {
    return product.value.images && product.value.images.length
        ? product.value.images[0].image_url
        : "https://via.placeholder.com/200?text=No+Image";
});

useHead({
    title: pageTitle,
    meta: [
        { name: "description", content: pageDescription },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: pageDescription },
        { property: "og:image", content: pageImage },
    ],
});
</script>

<style scoped>
.price {
    color: #ff6600;
    font-weight: bold;
    font-size: 1.4rem;
}
.product-title {
    white-space: normal !important;
    word-break: break-word;
    overflow: visible !important;
    text-overflow: clip !important;
}
.spec-label {
    font-weight: 500;
    margin-right: 8px;
}
.spec-chip {
    border: 1px solid #ccc !important;
    border-radius: 0 !important;
    margin: 4px;
}
.chip-active {
    border-color: red !important;
}
</style>
