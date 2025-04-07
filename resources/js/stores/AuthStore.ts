import { makeAutoObservable, runInAction } from "mobx";
import axios from "../config/axios";

interface User {
    id: number;
    name: string;
    email: string;
}

class AuthStore {
    user: User | null = null;
    isAuthenticated: boolean = false;
    isLoading: boolean = true;
    error: string | null = null;

    constructor() {
        makeAutoObservable(this);
        this.checkAuth();
    }

    // Проверка статуса аутентификации при загрузке
    async checkAuth() {
        this.isLoading = true;
        try {
            const response = await axios.get("/api/user");
            runInAction(() => {
                this.user = response.data.user;
                this.isAuthenticated = response.data.isAuthenticated;
                this.error = null;
            });
        } catch (error) {
            runInAction(() => {
                this.user = null;
                this.isAuthenticated = false;
                this.error = "Ошибка аутентификации";
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Вход в систему
    async login(email: string, password: string, remember: boolean = false) {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await axios.post("/api/login", {
                email,
                password,
                remember,
            });
            runInAction(() => {
                this.user = response.data.user;
                this.isAuthenticated = true;
                this.error = null;
            });
            return true;
        } catch (error: any) {
            runInAction(() => {
                this.user = null;
                this.isAuthenticated = false;
                this.error =
                    error.response?.data?.message || "Ошибка входа в систему";
            });
            return false;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Регистрация
    async register(
        name: string,
        email: string,
        password: string,
        password_confirmation: string
    ) {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await axios.post("/api/register", {
                name,
                email,
                password,
                password_confirmation,
            });
            runInAction(() => {
                this.user = response.data.user;
                this.isAuthenticated = true;
                this.error = null;
            });
            return true;
        } catch (error: any) {
            runInAction(() => {
                this.user = null;
                this.isAuthenticated = false;
                this.error =
                    error.response?.data?.message || "Ошибка регистрации";
            });
            return false;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Выход из системы
    async logout() {
        this.isLoading = true;
        try {
            await axios.post("/api/logout");
            runInAction(() => {
                this.user = null;
                this.isAuthenticated = false;
                this.error = null;
            });
        } catch (error) {
            runInAction(() => {
                this.error = "Ошибка выхода из системы";
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Сброс состояния ошибки
    resetError() {
        this.error = null;
    }
}

// Создаем и экспортируем экземпляр store
const authStore = new AuthStore();
export default authStore;
