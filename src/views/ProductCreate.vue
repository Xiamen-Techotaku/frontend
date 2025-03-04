<template>
    <v-app>
        <v-container>
            <v-row>
                <v-col cols="12">
                    <v-btn color="primary" @click="$router.go(-1)" class="mb-4"> 返回 </v-btn>
                </v-col>
            </v-row>
            <v-card>
                <v-card-title class="headline">上架新商品</v-card-title>
                <v-card-text>
                    <v-form ref="productForm" @submit.prevent="handleSubmit">
                        <!-- 商品名稱 -->
                        <v-text-field v-model="form.name" label="商品名稱" required></v-text-field>

                        <!-- 分類下拉選單 -->
                        <v-select
                            v-model="form.category_id"
                            :items="categories"
                            item-title="name"
                            item-value="id"
                            label="分類"
                            required
                            placeholder="請選擇分類"
                        ></v-select>

                        <!-- 價格 -->
                        <v-text-field
                            v-model="form.price"
                            label="價格"
                            type="number"
                            required
                            step="0.01"
                        ></v-text-field>

                        <!-- 商品介紹 -->
                        <v-textarea
                            v-model="form.description"
                            label="商品介紹"
                            rows="5"
                            required
                        ></v-textarea>

                        <!-- 商品圖片：多檔上傳 -->
                        <v-file-input
                            v-model="images"
                            label="商品圖片"
                            multiple
                            accept="image/*"
                            @change="handleFileChange"
                        ></v-file-input>

                        <!-- 圖片預覽與順序調整 -->
                        <div v-if="imagePreviews.length">
                            <v-subheader>圖片預覽</v-subheader>
                            <v-row>
                                <v-col
                                    v-for="(img, index) in imagePreviews"
                                    :key="index"
                                    cols="12"
                                    sm="4"
                                >
                                    <v-img :src="img" aspect-ratio="1" class="mb-2"></v-img>
                                    <v-row dense>
                                        <v-col cols="6">
                                            <v-btn
                                                small
                                                block
                                                @click="moveImageUp(index)"
                                                :disabled="index === 0"
                                            >
                                                上移
                                            </v-btn>
                                        </v-col>
                                        <v-col cols="6">
                                            <v-btn
                                                small
                                                block
                                                @click="moveImageDown(index)"
                                                :disabled="index === imagePreviews.length - 1"
                                            >
                                                下移
                                            </v-btn>
                                        </v-col>
                                    </v-row>
                                </v-col>
                            </v-row>
                        </div>

                        <!-- 規格區塊：價格可能不同 -->
                        <v-card class="mb-4" outlined>
                            <v-card-title>規格 (價格可能不同)</v-card-title>
                            <v-card-text>
                                <v-row
                                    v-for="(spec, index) in specifications"
                                    :key="index"
                                    align="center"
                                    class="mb-2"
                                >
                                    <v-col cols="5">
                                        <v-text-field
                                            v-model="spec.name"
                                            label="規格名稱"
                                            required
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="5">
                                        <v-text-field
                                            v-model="spec.price"
                                            label="價格"
                                            type="number"
                                            step="0.01"
                                            required
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="2">
                                        <v-btn icon @click="removeSpecification(index)">
                                            <v-icon color="red">mdi-delete</v-icon>
                                        </v-btn>
                                    </v-col>
                                </v-row>
                                <v-btn color="primary" @click="addSpecification">新增規格</v-btn>
                            </v-card-text>
                        </v-card>

                        <!-- 項目區塊：價格相同 -->
                        <v-card class="mb-4" outlined>
                            <v-card-title>項目 (價格相同)</v-card-title>
                            <v-card-text>
                                <v-row
                                    v-for="(opt, index) in options"
                                    :key="index"
                                    align="center"
                                    class="mb-2"
                                >
                                    <v-col cols="5">
                                        <v-text-field
                                            v-model="opt.option_name"
                                            label="項目類型 (如顏色)"
                                            required
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="5">
                                        <v-text-field
                                            v-model="opt.option_value"
                                            label="項目值 (如紅色)"
                                            required
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="2">
                                        <v-btn icon @click="removeOption(index)">
                                            <v-icon color="red">mdi-delete</v-icon>
                                        </v-btn>
                                    </v-col>
                                </v-row>
                                <v-btn color="primary" @click="addOption">新增項目</v-btn>
                            </v-card-text>
                        </v-card>

                        <!-- 上架按鈕 -->
                        <v-btn type="submit" color="success" block>上架商品</v-btn>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-container>
    </v-app>
</template>

<script>
import axios from "axios";
export default {
    name: "ProductCreate",
    data() {
        return {
            form: {
                name: "",
                category_id: "",
                price: "",
                description: "",
            },
            images: [], // 儲存上傳的檔案物件
            imagePreviews: [], // 儲存圖片預覽用的 data URL
            categories: [], // 從後端取得的分類資料
            specifications: [], // 格式：[ { name: "", price: "" }, ... ]
            options: [], // 格式：[ { option_name: "", option_value: "" }, ... ]
            adminUser: null,
            loading: false,
        };
    },
    methods: {
        async fetchCategories() {
            try {
                const response = await axios.get(`${this.$backendUrl}/api/categories`);
                this.categories = response.data.categories;
            } catch (error) {
                console.error("取得分類資料失敗:", error);
                this.categories = [];
            }
        },
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
        handleFileChange() {
            this.imagePreviews = [];
            if (this.images && this.images.length) {
                this.images.forEach((file) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.imagePreviews.push(e.target.result);
                    };
                    reader.readAsDataURL(file);
                });
            }
        },
        addSpecification() {
            this.specifications.push({ name: "", price: "" });
        },
        removeSpecification(index) {
            this.specifications.splice(index, 1);
        },
        addOption() {
            this.options.push({ option_name: "", option_value: "" });
        },
        removeOption(index) {
            this.options.splice(index, 1);
        },
        moveImageUp(index) {
            if (index === 0) return;
            [this.images[index - 1], this.images[index]] = [
                this.images[index],
                this.images[index - 1],
            ];
            [this.imagePreviews[index - 1], this.imagePreviews[index]] = [
                this.imagePreviews[index],
                this.imagePreviews[index - 1],
            ];
        },
        moveImageDown(index) {
            if (index === this.imagePreviews.length - 1) return;
            [this.images[index + 1], this.images[index]] = [
                this.images[index],
                this.images[index + 1],
            ];
            [this.imagePreviews[index + 1], this.imagePreviews[index]] = [
                this.imagePreviews[index],
                this.imagePreviews[index + 1],
            ];
        },
        async handleSubmit() {
            try {
                const formData = new FormData();
                formData.append("name", this.form.name);
                formData.append("category_id", this.form.category_id);
                formData.append("price", this.form.price);
                formData.append("description", this.form.description);
                // 附加圖片檔案（順序按照 images 陣列）
                this.images.forEach((file) => {
                    formData.append("images", file);
                });
                formData.append("specifications", JSON.stringify(this.specifications));
                formData.append("options", JSON.stringify(this.options));
                const response = await axios.post(`${this.$backendUrl}/api/products`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    withCredentials: true,
                });
                alert("商品上架成功");
                // 重置表單
                this.form = { name: "", category_id: "", price: "", description: "" };
                this.images = [];
                this.imagePreviews = [];
                this.specifications = [];
                this.options = [];
            } catch (error) {
                console.error("上架商品失敗:", error);
                alert("上架商品失敗，請檢查輸入或稍後再試");
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
/* 若有需要可在此加入額外的樣式調整 */
</style>
