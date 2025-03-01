<template>
    <v-container class="my-8">
        <v-card class="pa-4 mx-auto" max-width="600">
            <v-card-title>個人資料</v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <v-form ref="form" v-model="valid" lazy-validation>
                    <!-- 姓名 -->
                    <v-text-field
                        v-model="user.name"
                        :rules="nameRules"
                        label="姓名"
                        required
                    ></v-text-field>

                    <!-- 電子郵件 (預設不可編輯) -->
                    <v-text-field
                        v-model="user.email"
                        :rules="emailRules"
                        label="電子郵件"
                        disabled
                    ></v-text-field>

                    <!-- 取貨名稱 -->
                    <v-text-field v-model="user.pickup_name" label="取貨名稱"></v-text-field>

                    <!-- 取貨電話 -->
                    <v-text-field v-model="user.pickup_phone" label="取貨電話"></v-text-field>
                </v-form>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" :disabled="!valid" @click="updateProfile"> 更新 </v-btn>
            </v-card-actions>
        </v-card>
    </v-container>
</template>

<script>
import axios from "axios";

export default {
    name: "Profile",
    data() {
        return {
            user: {
                name: "",
                email: "",
                pickup_name: "",
                pickup_phone: "",
            },
            valid: false,
            // 驗證規則 (可依需求調整)
            nameRules: [
                (v) => !!v || "姓名不能為空",
                (v) => (v && v.length <= 50) || "姓名必須在50字以內",
            ],
            emailRules: [
                (v) => !!v || "電子郵件不能為空",
                (v) => /.+@.+\..+/.test(v) || "必須是有效的電子郵件",
            ],
        };
    },
    methods: {
        // 取得目前登入使用者資料
        async fetchUser() {
            try {
                const response = await axios.get(`${this.$backendUrl}/api/auth/me`, {
                    withCredentials: true,
                });
                if (response.data && response.data.user) {
                    // 將後端回傳的使用者資料合併到 this.user
                    this.user = {
                        ...this.user,
                        ...response.data.user,
                    };
                }
            } catch (error) {
                console.error("取得個人資料失敗：", error);
                alert("請先登入！");
                this.$router.push("/login");
            }
        },
        // 更新個人資料
        async updateProfile() {
            try {
                const payload = {
                    name: this.user.name,
                    pickup_name: this.user.pickup_name,
                    pickup_phone: this.user.pickup_phone,
                    // 若要允許修改 email，請一併傳給後端
                    // email: this.user.email,
                };
                await axios.put(`${this.$backendUrl}/api/auth/profile`, payload, {
                    withCredentials: true,
                });
                alert("更新成功");
            } catch (error) {
                console.error("更新個人資料失敗：", error);
                alert("更新失敗，請稍後再試");
            }
        },
    },
    mounted() {
        this.fetchUser();
    },
};
</script>

<style scoped>
/* 根據需要調整樣式 */
</style>
