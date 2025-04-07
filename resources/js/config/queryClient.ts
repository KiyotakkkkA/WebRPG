import { QueryClient } from "@tanstack/react-query";

// Создаем экземпляр QueryClient с настройками
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false, // Отключаем обновление при фокусе окна
            retry: 1, // Количество повторных попыток при ошибке
            staleTime: 5 * 60 * 1000, // Данные считаются устаревшими через 5 минут
        },
    },
});
