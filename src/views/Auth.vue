<template>
    <v-container class="pa-4" max-width="400">
        <v-card>
            <!-- 使用 v-tabs 切換登入與註冊 -->
            <v-tabs v-model="tab" background-color="grey lighten-4" grow>
                <v-tab key="login">登入</v-tab>
                <v-tab key="register">註冊</v-tab>
            </v-tabs>
            <v-divider></v-divider>
            <v-card-text>
                <!-- 登入畫面 -->
                <div v-if="mode === 'login'">
                    <v-btn color="red darken-1" block class="mb-4" @click="handleGoogleLogin">
                        <v-icon left>mdi-google</v-icon> 使用 Google 登入
                    </v-btn>
                    <v-divider class="my-4">或</v-divider>
                    <v-form ref="loginForm" @submit.prevent="handleLocalLogin">
                        <v-text-field
                            v-model="loginForm.email"
                            label="電子信箱"
                            type="email"
                            required
                        ></v-text-field>
                        <v-text-field
                            v-model="loginForm.password"
                            label="密碼"
                            type="password"
                            required
                        ></v-text-field>
                        <v-btn type="submit" color="primary" block>登入</v-btn>
                    </v-form>
                </div>

                <!-- 註冊畫面 -->
                <div v-else>
                    <v-form ref="registerForm" @submit.prevent="handleRegister">
                        <v-text-field
                            v-model="registerForm.name"
                            label="使用者名稱"
                            required
                        ></v-text-field>
                        <v-text-field
                            v-model="registerForm.email"
                            label="電子信箱"
                            type="email"
                            required
                        ></v-text-field>
                        <v-text-field
                            v-model="registerForm.password"
                            label="密碼"
                            type="password"
                            required
                        ></v-text-field>
                        <v-text-field
                            v-model="registerForm.confirmPassword"
                            label="確認密碼"
                            type="password"
                            required
                        ></v-text-field>
                        <v-btn type="submit" color="primary" block>註冊</v-btn>
                    </v-form>
                </div>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script>
import axios from "axios";
export default {
    name: "Auth",
    data() {
        return {
            tab: 0, // 0 表示登入, 1 表示註冊
            loginForm: {
                email: "",
                password: "",
            },
            registerForm: {
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
            },
        };
    },
    computed: {
        mode() {
            return this.tab === 0 ? "login" : "register";
        },
    },
    methods: {
        async handleLocalLogin() {
            try {
                const response = await axios.post(
                    `${this.$backendUrl}/api/auth/login`,
                    {
                        email: this.loginForm.email,
                        password: this.loginForm.password,
                    },
                    { withCredentials: true }
                );
                alert("登入成功");
                // 登入成功後導到根目錄
                this.$router.push("/");
            } catch (error) {
                console.error("登入失敗：", error);
                alert(
                    (error.response && error.response.data && error.response.data.message) ||
                        "登入失敗"
                );
            }
        },
        handleGoogleLogin() {
            window.location.href = `${this.$backendUrl}/api/auth/google`;
        },
        async handleLocalLogin() {
            try {
                const response = await axios.post(
                    `${this.$backendUrl}/api/auth/login`,
                    {
                        email: this.loginForm.email,
                        password: this.loginForm.password,
                    },
                    { withCredentials: true }
                );
                alert("登入成功");
                // 導向根目錄後再重整頁面
                this.$router.push("/").then(() => window.location.reload());
            } catch (error) {
                console.error("登入失敗：", error);
                alert(
                    (error.response && error.response.data && error.response.data.message) ||
                        "登入失敗"
                );
            }
        },
    },
};
</script>

<style scoped>
/* 你可以根據需求調整樣式 */
</style>
