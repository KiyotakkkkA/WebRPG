import { makeAutoObservable, runInAction } from "mobx";
import axios from "../config/axios";

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    is_root?: boolean;
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

    // Проверка, является ли пользователь администратором
    get isAdmin(): boolean {
        return this.user?.role === "admin";
    }

    // Проверка, является ли пользователь главным администратором
    get isRootAdmin(): boolean {
        return this.user?.role === "admin" && this.user?.is_root === true;
    }

    // Проверка, является ли пользователь сотрудником поддержки
    get isSupport(): boolean {
        return this.user?.role === "support";
    }

    // Проверка, имеет ли пользователь права для доступа к системе поддержки
    get isSupportOrAdmin(): boolean {
        return this.isAdmin || this.isSupport;
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

            // Если сервер вернул новый CSRF-токен, обновляем его в заголовках axios
            if (response.data.csrf_token) {
                axios.defaults.headers.common["X-CSRF-TOKEN"] =
                    response.data.csrf_token;

                // Обновляем также мета-тег, чтобы новый токен был доступен для будущих запросов
                const metaTag = document.head.querySelector(
                    'meta[name="csrf-token"]'
                );
                if (metaTag) {
                    metaTag.setAttribute("content", response.data.csrf_token);
                }
            }

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

            // Если сервер вернул новый CSRF-токен, обновляем его в заголовках axios
            if (response.data.csrf_token) {
                axios.defaults.headers.common["X-CSRF-TOKEN"] =
                    response.data.csrf_token;

                // Обновляем также мета-тег, чтобы новый токен был доступен для будущих запросов
                const metaTag = document.head.querySelector(
                    'meta[name="csrf-token"]'
                );
                if (metaTag) {
                    metaTag.setAttribute("content", response.data.csrf_token);
                }
            }

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
            const response = await axios.post("/api/logout");
            if (response.data.csrf_token) {
                axios.defaults.headers.common["X-CSRF-TOKEN"] =
                    response.data.csrf_token;

                const csrfMeta = document.querySelector(
                    'meta[name="csrf-token"]'
                );
                if (csrfMeta) {
                    csrfMeta.setAttribute("content", response.data.csrf_token);
                }
            }
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
