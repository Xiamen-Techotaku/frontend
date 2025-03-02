<template>
    <v-app>
        <v-container>
            <!-- 返回按鈕 -->
            <v-row>
                <v-col cols="12">
                    <v-btn color="primary" @click="$router.go(-1)" class="mb-4"> 返回 </v-btn>
                </v-col>
            </v-row>

            <!-- 分類管理標題 -->
            <v-row>
                <v-col cols="12">
                    <h1 class="text-center">分類管理</h1>
                </v-col>
            </v-row>

            <!-- 分類列表 -->
            <v-row>
                <v-col cols="12">
                    <v-card outlined>
                        <v-card-title>分類列表</v-card-title>
                        <v-card-text>
                            <v-simple-table>
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
                                            <v-btn
                                                color="secondary"
                                                small
                                                @click="editCategoryItem(category)"
                                            >
                                                編輯
                                            </v-btn>
                                        </td>
                                    </tr>
                                </tbody>
                            </v-simple-table>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <!-- 編輯分類表單 (僅在編輯模式時顯示) -->
            <v-row v-if="editing" class="mt-4">
                <v-col cols="12">
                    <v-card outlined>
                        <v-card-title>編輯分類</v-card-title>
                        <v-card-text>
                            <v-form @submit.prevent="updateCategory">
                                <v-text-field
                                    label="分類名稱"
                                    v-model="editCategory.name"
                                    required
                                ></v-text-field>
                                <v-textarea
                                    label="描述"
                                    v-model="editCategory.description"
                                ></v-textarea>
                                <v-select
                                    label="上層分類"
                                    :items="parentOptions"
                                    v-model="editCategory.parent_id"
                                    item-title="name"
                                    item-value="id"
                                    clearable
                                ></v-select>
                                <v-btn type="submit" color="primary" class="mr-2"> 儲存修改 </v-btn>
                                <v-btn type="button" color="error" @click="cancelEdit">
                                    取消
                                </v-btn>
                            </v-form>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <!-- 新增分類表單 -->
            <v-row class="mt-4">
                <v-col cols="12">
                    <v-card outlined>
                        <v-card-title>新增分類</v-card-title>
                        <v-card-text>
                            <v-form @submit.prevent="addCategory">
                                <v-text-field
                                    label="分類名稱"
                                    v-model="newCategory.name"
                                    required
                                ></v-text-field>
                                <v-textarea
                                    label="描述"
                                    v-model="newCategory.description"
                                ></v-textarea>
                                <v-select
                                    label="上層分類"
                                    :items="categories"
                                    v-model="newCategory.parent_id"
                                    item-text="name"
                                    item-value="id"
                                    clearable
                                ></v-select>
                                <v-btn type="submit" color="primary"> 新增分類 </v-btn>
                            </v-form>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </v-app>
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
/* 若需要額外客製化，可再加入調整 */
</style>
