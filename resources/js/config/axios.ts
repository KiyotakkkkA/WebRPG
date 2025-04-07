import axios from "axios";

// Настраиваем базовый URL для API
axios.defaults.baseURL = window.location.origin;

// Настраиваем заголовки для запросов
axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
axios.defaults.headers.common["Accept"] = "application/json";

// Включаем отправку куки для поддержки сессий Laravel
axios.defaults.withCredentials = true;

// Получаем CSRF-токен из мета-тега
const csrfToken =
    document.head
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content") || "";
if (csrfToken) {
    axios.defaults.headers.common["X-CSRF-TOKEN"] = csrfToken;
}

// Обработка ответов и ошибок
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Если статус 401 (Unauthorized), пользователь не аутентифицирован
        if (error.response?.status === 401) {
            console.log("Пользователь не аутентифицирован");
            // Здесь можно добавить логику для перенаправления на страницу входа
        }

        // Если статус 419 (CSRF токен истек), обновляем страницу для получения нового токена
        if (error.response?.status === 419) {
            console.log("CSRF токен истек, обновите страницу");
            // window.location.reload();
        }

        return Promise.reject(error);
    }
);

export default axios;
