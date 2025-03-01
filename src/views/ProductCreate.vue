<template>
    <div class="product-create">
        <h1>上架新商品</h1>
        <form @submit.prevent="handleSubmit">
            <!-- 商品名稱 -->
            <div class="form-group">
                <label for="name">商品名稱:</label>
                <input type="text" id="name" v-model="form.name" required />
            </div>

            <!-- 分類下拉選單 -->
            <div class="form-group">
                <label for="category">分類:</label>
                <select id="category" v-model="form.category_id" required>
                    <option value="" disabled>請選擇分類</option>
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                        {{ cat.name }}
                    </option>
                </select>
            </div>

            <!-- 價格 -->
            <div class="form-group">
                <label for="price">價格:</label>
                <input type="number" id="price" v-model="form.price" required step="0.01" />
            </div>

            <!-- 商品介紹（支持內嵌圖片的 HTML 格式） -->
            <div class="form-group">
                <label for="description">商品介紹:</label>
                <textarea id="description" v-model="form.description" rows="5" required></textarea>
            </div>

            <!-- 商品圖片：多檔上傳 -->
            <div class="form-group">
                <label for="images">商品圖片:</label>
                <input
                    type="file"
                    id="images"
                    @change="handleFileChange"
                    multiple
                    accept="image/*"
                />
            </div>

            <!-- 圖片預覽與順序調整 -->
            <div class="image-previews" v-if="imagePreviews.length">
                <h3>圖片預覽:</h3>
                <div class="preview" v-for="(img, index) in imagePreviews" :key="index">
                    <img :src="img" alt="Product Image Preview" />
                    <div class="move-buttons">
                        <button type="button" @click="moveImageUp(index)" :disabled="index === 0">
                            上移
                        </button>
                        <button
                            type="button"
                            @click="moveImageDown(index)"
                            :disabled="index === imagePreviews.length - 1"
                        >
                            下移
                        </button>
                    </div>
                </div>
            </div>

            <!-- 規格區塊：價格可能不同 -->
            <div class="specifications">
                <h2>規格 (價格可能不同)</h2>
                <div v-for="(spec, index) in specifications" :key="index" class="spec-item">
                    <input type="text" v-model="spec.name" placeholder="規格名稱" required />
                    <input
                        type="number"
                        v-model="spec.price"
                        placeholder="價格"
                        required
                        step="0.01"
                    />
                    <button type="button" @click="removeSpecification(index)">刪除</button>
                </div>
                <button type="button" @click="addSpecification">新增規格</button>
            </div>

            <!-- 項目區塊：價格相同 -->
            <div class="options">
                <h2>項目 (價格相同)</h2>
                <div v-for="(opt, index) in options" :key="index" class="option-item">
                    <input
                        type="text"
                        v-model="opt.option_name"
                        placeholder="項目類型 (如顏色)"
                        required
                    />
                    <input
                        type="text"
                        v-model="opt.option_value"
                        placeholder="項目值 (如紅色)"
                        required
                    />
                    <button type="button" @click="removeOption(index)">刪除</button>
                </div>
                <button type="button" @click="addOption">新增項目</button>
            </div>

            <!-- 上架按鈕 -->
            <button type="submit">上架商品</button>
        </form>
    </div>
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
        handleFileChange(e) {
            const files = e.target.files;
            this.images = Array.from(files);
            this.imagePreviews = [];
            Array.from(files).forEach((file) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.imagePreviews.push(e.target.result);
                };
                reader.readAsDataURL(file);
            });
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
        // 上移圖片：將 index 與 index-1 的位置互換
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
        // 下移圖片：將 index 與 index+1 的位置互換
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
        this.fetchCategories();
    },
};
</script>

<style scoped>
.product-create {
    max-width: 600px;
    margin: 2em auto;
    padding: 1em;
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
}
.product-create h1 {
    text-align: center;
    margin-bottom: 1em;
}
.form-group {
    margin-bottom: 1em;
}
.form-group label {
    display: block;
    margin-bottom: 0.5em;
}
.form-group input[type="text"],
.form-group input[type="number"],
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 0.5em;
    border: 1px solid #ccc;
    border-radius: 4px;
}
.image-previews {
    margin-bottom: 1em;
}
.image-previews h3 {
    margin-bottom: 0.5em;
}
.image-previews .preview {
    display: inline-block;
    margin-right: 10px;
    vertical-align: top;
    text-align: center;
}
.image-previews .preview img {
    max-width: 100px;
    max-height: 100px;
    border: 1px solid #ccc;
    border-radius: 4px;
    display: block;
    margin-bottom: 0.3em;
}
.move-buttons {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.move-buttons button {
    padding: 0.2em 0.5em;
    font-size: 12px;
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
.move-buttons button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

/* 規格與項目區塊 */
.specifications,
.options {
    margin-bottom: 1em;
    padding: 1em;
    border: 1px dashed #aaa;
    border-radius: 4px;
}
.specifications h2,
.options h2 {
    margin-bottom: 0.5em;
}
.spec-item,
.option-item {
    display: flex;
    gap: 0.5em;
    margin-bottom: 0.5em;
}
.spec-item input,
.option-item input {
    flex: 1;
}
button {
    padding: 0.5em 1em;
    background-color: #007bff;
    border: none;
    color: #fff;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 0.5em;
}
button:hover {
    background-color: #0056b3;
}
button[type="submit"] {
    width: 100%;
    padding: 0.7em;
    background-color: #ff6600;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
button[type="submit"]:hover {
    background-color: #e65c00;
}
</style>
