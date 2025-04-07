import axios from "axios";

// Расширяем типы AxiosRequestConfig для поддержки нашего кастомного свойства _retry
declare module "axios" {
    export interface AxiosRequestConfig {
        _retry?: boolean;
    }
}

// Настраиваем базовый URL для API
axios.defaults.baseURL = window.location.origin;

// Настраиваем заголовки для запросов
axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
axios.defaults.headers.common["Accept"] = "application/json";

// Включаем отправку куки для поддержки сессий Laravel
axios.defaults.withCredentials = true;

// Получаем CSRF-токен из мета-тега
const getCsrfToken = () => {
    return (
        document.head
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content") || ""
    );
};

// Устанавливаем начальный CSRF-токен
axios.defaults.headers.common["X-CSRF-TOKEN"] = getCsrfToken();

// Функция для обновления CSRF-токена
const refreshCsrfToken = async () => {
    try {
        await axios.get("/sanctum/csrf-cookie", {
            // Отключаем перехватчик для этого запроса, чтобы избежать бесконечного цикла
            _retry: true,
        });

        // Обновляем CSRF-токен в заголовках
        const newToken = getCsrfToken();
        if (newToken) {
            axios.defaults.headers.common["X-CSRF-TOKEN"] = newToken;
        }

        return true;
    } catch (error) {
        console.error("Не удалось обновить CSRF-токен:", error);
        return false;
    }
};

// Обработка ответов и ошибок
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Если запрос уже повторялся после обновления токена, не пытаемся снова
        if (error.config?._retry === true) {
            return Promise.reject(error);
        }

        // Если статус 401 (Unauthorized), пользователь не аутентифицирован
        if (error.response?.status === 401) {
            // Здесь можно добавить логику для перенаправления на страницу входа
        }

        // Если статус 419 (CSRF токен истек), обновляем токен и повторяем запрос
        if (error.response?.status === 419) {
            const refreshSuccess = await refreshCsrfToken();

            if (refreshSuccess && error.config) {
                // Помечаем запрос как повторяющийся
                error.config._retry = true;

                // Обновляем CSRF-токен в заголовках запроса
                error.config.headers["X-CSRF-TOKEN"] = getCsrfToken();

                // Повторяем исходный запрос с обновленным токеном
                return axios(error.config);
            }
        }

        return Promise.reject(error);
    }
);

export default axios;
