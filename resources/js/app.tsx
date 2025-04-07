import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./config/queryClient";
import MRouter from "./router";
import axios from "axios";
import { useEffect } from "react";

// Функция для обновления CSRF-токена каждые 25 минут
const refreshCsrfToken = async () => {
    try {
        // Запрос к endpoint для обновления CSRF-токена
        const response = await axios.get("/sanctum/csrf-cookie");

        // Получаем обновленный токен из мета-тега
        const csrfToken =
            document.head
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute("content") || "";

        if (csrfToken) {
            // Обновляем CSRF-токен в заголовках axios
            axios.defaults.headers.common["X-CSRF-TOKEN"] = csrfToken;
        }

        return true;
    } catch (error) {
        console.error("Ошибка при обновлении CSRF-токена:", error);
        return false;
    }
};

// Компонент для периодического обновления токена
const CsrfTokenRefresher = () => {
    useEffect(() => {
        // Обновляем токен при монтировании компонента
        refreshCsrfToken();

        // Устанавливаем интервал для обновления токена каждые 25 минут
        const intervalId = setInterval(() => {
            refreshCsrfToken();
        }, 25 * 60 * 1000); // 25 минут вместо 30

        // Очищаем интервал при размонтировании
        return () => clearInterval(intervalId);
    }, []);

    return null; // Этот компонент не рендерит ничего
};

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <CsrfTokenRefresher />
            <MRouter />
        </QueryClientProvider>
    );
};

createInertiaApp({
    title: (title) => `${title} - WebRPG`,
    resolve: () => App,
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: "#4B5563",
    },
});
