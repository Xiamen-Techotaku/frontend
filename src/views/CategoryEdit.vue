<template>
    <div class="category-edit">
        <h1>分類管理</h1>
        <!-- 分類列表 -->
        <div class="category-list">
            <h2>分類列表</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>分類名稱</th>
                        <th>描述</th>
                        <th>上層分類</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="category in categories" :key="category.id">
                        <td>{{ category.id }}</td>
                        <td>{{ category.name }}</td>
                        <td>{{ category.description }}</td>
                        <td>{{ getParentName(category.parent_id) }}</td>
                        <td>
                            <button @click="editCategoryItem(category)">編輯</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 編輯分類表單 (當正在編輯時顯示) -->
        <div class="edit-form" v-if="editing">
            <h2>編輯分類</h2>
            <form @submit.prevent="updateCategory">
                <div class="form-group">
                    <label for="edit-name">分類名稱:</label>
                    <input type="text" id="edit-name" v-model="editCategory.name" required />
                </div>
                <div class="form-group">
                    <label for="edit-description">描述:</label>
                    <textarea id="edit-description" v-model="editCategory.description"></textarea>
                </div>
                <div class="form-group">
                    <label for="edit-parent">上層分類:</label>
                    <select id="edit-parent" v-model="editCategory.parent_id">
                        <option value="">無上層分類</option>
                        <!-- 這裡排除正在編輯的分類本身 -->
                        <option v-for="cat in parentOptions" :key="cat.id" :value="cat.id">
                            {{ cat.name }}
                        </option>
                    </select>
                </div>
                <button type="submit">儲存修改</button>
                <button type="button" @click="cancelEdit">取消</button>
            </form>
        </div>

        <!-- 新增分類表單 -->
        <div class="add-form">
            <h2>新增分類</h2>
            <form @submit.prevent="addCategory">
                <div class="form-group">
                    <label for="new-name">分類名稱:</label>
                    <input type="text" id="new-name" v-model="newCategory.name" required />
                </div>
                <div class="form-group">
                    <label for="new-description">描述:</label>
                    <textarea id="new-description" v-model="newCategory.description"></textarea>
                </div>
                <div class="form-group">
                    <label for="new-parent">上層分類:</label>
                    <select id="new-parent" v-model="newCategory.parent_id">
                        <option value="">無上層分類</option>
                        <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                            {{ cat.name }}
                        </option>
                    </select>
                </div>
                <button type="submit">新增分類</button>
            </form>
        </div>
    </div>
</template>

<script>
import axios from "axios";

export default {
    name: "CategoryEdit",
    data() {
        return {
            categories: [],
            editing: false,
            editCategory: {
                id: null,
                name: "",
                description: "",
                parent_id: "",
            },
            newCategory: {
                name: "",
                description: "",
                parent_id: "",
            },
        };
    },
    computed: {
        // 當正在編輯分類時，父分類選項不包含正在編輯的分類本身
        parentOptions() {
            return this.categories.filter((cat) => cat.id !== this.editCategory.id);
        },
    },
    methods: {
        async fetchCategories() {
            try {
                const response = await axios.get(`${this.$backendUrl}/api/categories`);
                // 假設 API 回傳格式為 { categories: [...] }
                this.categories = response.data.categories;
            } catch (error) {
                console.error("取得分類資料失敗：", error);
            }
        },
        getParentName(parent_id) {
            if (!parent_id) return "無";
            const parent = this.categories.find((cat) => cat.id === parent_id);
            return parent ? parent.name : "未知";
        },
        // 點擊編輯按鈕，將選取的分類資料複製到編輯表單中
        editCategoryItem(category) {
            this.editing = true;
            this.editCategory = { ...category };
        },
        cancelEdit() {
            this.editing = false;
            this.editCategory = { id: null, name: "", description: "", parent_id: "" };
        },
        async updateCategory() {
            try {
                const { id, name, description, parent_id } = this.editCategory;
                // 呼叫後端 API 更新分類資料 (PUT /api/categories/:id)
                await axios.put(`${this.$backendUrl}/api/categories/${id}`, {
                    name,
                    description,
                    parent_id: parent_id || null, // 如果 parent_id 為空字串，轉換為 null
                });
                alert("分類更新成功");
                await this.fetchCategories();
                this.cancelEdit();
            } catch (error) {
                console.error("更新分類失敗：", error);
                alert("更新分類失敗");
            }
        },
        async addCategory() {
            try {
                const { name, description, parent_id } = this.newCategory;
                // 呼叫後端 API 建立新分類 (POST /api/categories)
                await axios.post(`${this.$backendUrl}/api/categories`, {
                    name,
                    description,
                    parent_id: parent_id || null,
                });
                alert("新增分類成功");
                await this.fetchCategories();
                // 重置新增分類表單
                this.newCategory = { name: "", description: "", parent_id: "" };
            } catch (error) {
                console.error("新增分類失敗：", error);
                alert("新增分類失敗");
            }
        },
    },
    mounted() {
        this.fetchCategories();
    },
};
</script>

<style scoped>
.category-edit {
    max-width: 800px;
    margin: 2em auto;
    padding: 1em;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
}

.category-edit h1 {
    text-align: center;
    margin-bottom: 1em;
}

.category-list {
    margin-bottom: 2em;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1em;
}

th,
td {
    border: 1px solid #ccc;
    padding: 0.5em;
    text-align: left;
}

.edit-form,
.add-form {
    margin-bottom: 2em;
    padding: 1em;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.form-group {
    margin-bottom: 1em;
}

.form-group label {
    display: block;
    margin-bottom: 0.3em;
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: 0.5em;
    border: 1px solid #ccc;
    border-radius: 4px;
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
</style>
