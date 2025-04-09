import React, { useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../Layouts/MainLayout";
import axios from "../../config/axios";
import authStore from "../../stores/AuthStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Типы для работы с сообщениями поддержки
interface SupportMessage {
    id: number;
    user_id: number;
    name: string;
    email: string;
    type: string;
    character_name: string | null;
    message: string;
    status: "new" | "in_progress" | "closed";
    response: string | null;
    responder_id: number | null;
    responder_name: string | null;
    on_moderation: boolean;
    moderator_id: number | null;
    created_at: string;
    updated_at: string;
    rating?: number | null;
    feedback_comment?: string | null;
    archived?: boolean;
    rated_at?: string | null;
}

// API функции для работы с сообщениями поддержки
const supportApi = {
    // Получение списка сообщений
    getMessages: async (filters?: {
        status?: string;
        type?: string;
        archived?: boolean;
    }) => {
        try {
            const queryParams = new URLSearchParams();
            if (filters?.status && filters.status !== "all") {
                queryParams.append("status", filters.status);
            }
            if (filters?.type && filters.type !== "all") {
                queryParams.append("type", filters.type);
            }
            if (filters?.archived !== undefined) {
                queryParams.append("archived", filters.archived ? "1" : "0");
            }

            const url = `/api/support-messages${
                queryParams.toString() ? `?${queryParams.toString()}` : ""
            }`;
            const response = await axios.get(url);
            return response.data.data || response.data;
        } catch (error) {
            console.error("Error fetching support messages:", error);
            throw new Error("Не удалось загрузить сообщения поддержки");
        }
    },

    // Обновление ответа на сообщение
    updateResponse: async (
        id: number,
        data: { response?: string; status?: string }
    ) => {
        try {
            const response = await axios.put(
                `/api/support-messages/${id}`,
                data
            );
            return response.data.support_message || response.data;
        } catch (error) {
            console.error("Error updating support message:", error);
            throw new Error("Не удалось обновить сообщение");
        }
    },

    // Взять вопрос на модерацию
    takeForModeration: async (id: number) => {
        try {
            const response = await axios.put(
                `/api/support-messages/${id}/take-for-moderation`
            );
            return response.data.support_message || response.data;
        } catch (error) {
            console.error("Error taking message for moderation:", error);
            throw new Error("Не удалось взять сообщение на модерацию");
        }
    },

    // Освобождение вопроса от модерации
    releaseFromModeration: async (id: number) => {
        try {
            const response = await axios.put(
                `/api/support-messages/${id}/release-from-moderation`
            );
            return response.data.support_message || response.data;
        } catch (error) {
            console.error("Error releasing message from moderation:", error);
            throw new Error("Не удалось освободить сообщение от модерации");
        }
    },

    // Получение статистики
    getStatistics: async () => {
        try {
            const response = await axios.get(
                "/api/support-messages-statistics"
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching support statistics:", error);
            throw new Error("Не удалось загрузить статистику");
        }
    },
};

// Компонент заголовка секции
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="border-b border-red-900/30 pb-2 mb-6 flex items-center">
        <div className="w-1 h-8 bg-red-700 mr-3"></div>
        <h2 className="text-xl font-medieval text-red-500">{children}</h2>
    </div>
);

// Компонент статуса сообщения
const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = "";
    let textColor = "";
    let label = "";

    switch (status) {
        case "new":
            bgColor = "bg-blue-900/20";
            textColor = "text-blue-400";
            label = "Новое";
            break;
        case "in_progress":
            bgColor = "bg-yellow-900/20";
            textColor = "text-yellow-400";
            label = "В обработке";
            break;
        case "closed":
            bgColor = "bg-green-900/20";
            textColor = "text-green-400";
            label = "Решено";
            break;
        default:
            bgColor = "bg-gray-800";
            textColor = "text-gray-400";
            label = "Неизвестно";
    }

    return (
        <span
            className={`px-2 py-1 rounded text-xs ${bgColor} ${textColor} border border-gray-700`}
        >
            {label}
        </span>
    );
};

// Компонент типа сообщения
const TypeBadge = ({ type }: { type: string }) => {
    let icon = "";
    let label = "";

    switch (type) {
        case "question":
            icon = "❓";
            label = "Вопрос";
            break;
        case "bug":
            icon = "🐞";
            label = "Баг";
            break;
        case "suggestion":
            icon = "💡";
            label = "Предложение";
            break;
        case "account":
            icon = "🔒";
            label = "Аккаунт";
            break;
        default:
            icon = "📝";
            label = "Другое";
    }

    return (
        <span className="inline-flex items-center gap-1">
            <span>{icon}</span>
            <span>{label}</span>
        </span>
    );
};

// Компонент статуса модерации
const ModerationBadge = ({
    message,
    isArchiveMode,
}: {
    message: SupportMessage;
    isArchiveMode: boolean;
}) => {
    const isTakenByCurrentUser =
        message.on_moderation && message.moderator_id === authStore.user?.id;
    const isTakenByOtherUser =
        message.on_moderation && message.moderator_id !== authStore.user?.id;

    // Для архивных сообщений показываем рейтинг
    if (isArchiveMode) {
        if (message.rating !== undefined && message.rating !== null) {
            const rating = message.rating as number;
            return (
                <span className="px-2 py-1 rounded text-xs bg-gray-800/50 text-yellow-400 border border-gray-700 flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                            key={star}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-3 w-3 ${
                                star <= rating
                                    ? "text-yellow-400"
                                    : "text-gray-600"
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </span>
            );
        } else {
            return (
                <span className="px-2 py-1 rounded text-xs bg-gray-800/50 text-gray-400 border border-gray-700">
                    Нет оценки
                </span>
            );
        }
    }

    if (isTakenByCurrentUser) {
        return (
            <span className="px-2 py-1 rounded text-xs bg-purple-900/20 text-purple-400 border border-purple-800/50">
                На модерации у вас
            </span>
        );
    }

    if (isTakenByOtherUser) {
        return (
            <span className="px-2 py-1 rounded text-xs bg-red-900/20 text-red-400 border border-red-800/50">
                Взят другим модератором
            </span>
        );
    }

    return (
        <span className="px-2 py-1 rounded text-xs bg-gray-800/50 text-gray-400 border border-gray-700">
            Доступен для модерации
        </span>
    );
};

// Компонент статистики
const SupportStats = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["supportStats"],
        queryFn: supportApi.getStatistics,
        staleTime: 5 * 60 * 1000, // 5 минут
    });

    if (isLoading || !stats) {
        return (
            <div className="bg-gray-800/50 rounded-lg border border-gray-800 p-4 flex gap-3 mb-6">
                <div className="h-4 w-20 bg-gray-700 animate-pulse rounded"></div>
                <div className="h-4 w-16 bg-gray-700 animate-pulse rounded"></div>
                <div className="h-4 w-24 bg-gray-700 animate-pulse rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 rounded-lg border border-gray-800 p-4 flex gap-4 mb-6">
            <div className="bg-blue-900/20 border border-blue-900/30 px-3 py-1 rounded-lg">
                <span className="text-blue-400 text-sm">
                    Новых: {stats.by_status.new}
                </span>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-900/30 px-3 py-1 rounded-lg">
                <span className="text-yellow-400 text-sm">
                    В обработке: {stats.by_status.in_progress}
                </span>
            </div>
            <div className="bg-green-900/20 border border-green-900/30 px-3 py-1 rounded-lg">
                <span className="text-green-400 text-sm">
                    Решено: {stats.by_status.closed}
                </span>
            </div>
            <div className="bg-gray-800 border border-gray-700 px-3 py-1 rounded-lg">
                <span className="text-gray-300 text-sm">
                    Всего: {stats.total}
                </span>
            </div>
        </div>
    );
};

const SupportMessages: React.FC = () => {
    const queryClient = useQueryClient();
    const [currentMessage, setCurrentMessage] = useState<SupportMessage | null>(
        null
    );
    const [responseText, setResponseText] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [isArchiveMode, setIsArchiveMode] = useState<boolean>(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Запрос на получение сообщений с фильтрацией
    const {
        data: messages,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["supportMessages", statusFilter, typeFilter, isArchiveMode],
        queryFn: () =>
            supportApi.getMessages({
                status: statusFilter,
                type: typeFilter,
                archived: isArchiveMode,
            }),
        refetchOnWindowFocus: false,
        staleTime: 60000, // Данные считаются "свежими" в течение 1 минуты
    });

    // Мутация для взятия вопроса на модерацию
    const takeForModerationMutation = useMutation({
        mutationFn: (id: number) => supportApi.takeForModeration(id),
        onSuccess: (updatedMessage) => {
            queryClient.invalidateQueries({ queryKey: ["supportMessages"] });
            setCurrentMessage(updatedMessage);
            toast.success("Вы взяли вопрос на модерацию");
        },
        onError: (error) => {
            toast.error("Не удалось взять вопрос на модерацию");
            console.error("Error taking message for moderation:", error);
        },
    });

    // Мутация для освобождения вопроса от модерации
    const releaseFromModerationMutation = useMutation({
        mutationFn: (id: number) => supportApi.releaseFromModeration(id),
        onSuccess: (updatedMessage) => {
            queryClient.invalidateQueries({ queryKey: ["supportMessages"] });
            setCurrentMessage(updatedMessage);
            toast.success("Вопрос освобожден от модерации");
        },
        onError: (error) => {
            toast.error("Не удалось освободить вопрос от модерации");
            console.error("Error releasing message from moderation:", error);
        },
    });

    // Мутация для обновления ответа
    const updateResponseMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: { response?: string; status?: string };
        }) => supportApi.updateResponse(id, data),
        onSuccess: (updatedMessage) => {
            // Инвалидируем кеш после успешного обновления
            queryClient.invalidateQueries({ queryKey: ["supportMessages"] });
            queryClient.invalidateQueries({ queryKey: ["supportStats"] });
            setCurrentMessage(updatedMessage);
            toast.success("Сообщение успешно обновлено");
        },
        onError: (error) => {
            toast.error("Ошибка при обновлении сообщения");
            console.error("Error updating message:", error);
        },
    });

    // Принудительное обновление данных
    const forceRefresh = () => {
        // Включаем анимацию
        setIsRefreshing(true);

        // Инвалидируем кеш для обоих запросов
        queryClient.invalidateQueries({ queryKey: ["supportMessages"] });
        queryClient.invalidateQueries({ queryKey: ["supportStats"] });

        // Принудительно запрашиваем новые данные
        refetch({
            throwOnError: true,
            cancelRefetch: true,
        });

        // Обновляем данные в текущем сообщении, если оно открыто
        if (currentMessage) {
            const updateCurrentMessage = async () => {
                try {
                    const response = await axios.get(
                        `/api/support-messages/${currentMessage.id}`
                    );
                    const updatedMessage = response.data;
                    setCurrentMessage(updatedMessage);
                    if (updatedMessage.response) {
                        setResponseText(updatedMessage.response);
                    }
                } catch (error) {
                    console.error(
                        "Ошибка при обновлении текущего сообщения:",
                        error
                    );
                }
            };
            updateCurrentMessage();
        }

        toast.info("Данные обновляются...");

        // Анимация должна отображаться минимум 1 секунду, даже если запрос завершится быстрее
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    // Открытие детального просмотра сообщения
    const openMessage = async (message: SupportMessage) => {
        try {
            // Запрашиваем свежие данные для этого сообщения
            const response = await axios.get(
                `/api/support-messages/${message.id}`
            );
            const updatedMessage = response.data;
            setCurrentMessage(updatedMessage);
            setResponseText(updatedMessage.response || "");
        } catch (error) {
            console.error("Ошибка при получении деталей сообщения:", error);
            // Если запрос не удался, используем переданные данные
            setCurrentMessage(message);
            setResponseText(message.response || "");
        }
    };

    // Сохранение ответа на сообщение
    const saveResponse = async () => {
        if (!currentMessage) return;

        // Проверяем, что вопрос на модерации у текущего пользователя
        if (
            !currentMessage.on_moderation ||
            currentMessage.moderator_id !== authStore.user?.id
        ) {
            toast.error(
                "Вы не можете ответить на этот вопрос. Сначала возьмите его на модерацию."
            );
            return;
        }

        // Сохраняем ответ
        updateResponseMutation.mutate({
            id: currentMessage.id,
            data: {
                response: responseText,
                status: currentMessage.status, // Сохраняем текущий статус
            },
        });

        // После сохранения ответа автоматически освобождаем вопрос
        setTimeout(() => {
            releaseFromModerationMutation.mutate(currentMessage.id);
        }, 500); // Небольшая задержка, чтобы сначала применилось обновление ответа
    };

    // Взятие вопроса на модерацию
    const takeMessage = async () => {
        if (!currentMessage) return;

        // Проверяем, что вопрос не на модерации или на модерации у текущего пользователя
        if (
            currentMessage.on_moderation &&
            currentMessage.moderator_id !== authStore.user?.id
        ) {
            toast.error("Этот вопрос уже взят на модерацию другим сотрудником");
            return;
        }

        takeForModerationMutation.mutate(currentMessage.id);
    };

    // Освобождение вопроса от модерации
    const releaseMessage = async () => {
        if (!currentMessage) return;

        // Проверяем, что вопрос на модерации у текущего пользователя
        if (
            !currentMessage.on_moderation ||
            currentMessage.moderator_id !== authStore.user?.id
        ) {
            toast.error("Вы не можете освободить этот вопрос");
            return;
        }

        releaseFromModerationMutation.mutate(currentMessage.id);
    };

    // Изменение статуса сообщения
    const changeStatus = async (status: "new" | "in_progress" | "closed") => {
        if (!currentMessage) return;

        // Проверяем, что вопрос на модерации у текущего пользователя
        if (
            !currentMessage.on_moderation ||
            currentMessage.moderator_id !== authStore.user?.id
        ) {
            toast.error(
                "Вы не можете изменить статус этого вопроса. Сначала возьмите его на модерацию."
            );
            return;
        }

        updateResponseMutation.mutate({
            id: currentMessage.id,
            data: { status },
        });

        // Обновляем локальное состояние до получения ответа от сервера
        setCurrentMessage((prev) => (prev ? { ...prev, status } : null));
    };

    // Форматирование даты
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    // Дополним компонент для отображения оценки в деталях сообщения
    const RatingDisplay = ({
        rating,
        comment,
    }: {
        rating?: number | null;
        comment?: string | null;
    }) => {
        if (!rating) return null;

        return (
            <div className="border-t border-gray-700 pt-4 mt-4">
                <h3 className="text-gray-400 mb-2 text-sm font-medieval">
                    Оценка пользователя:
                </h3>
                <div className="flex space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                            key={star}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 ${
                                star <= rating
                                    ? "text-yellow-400"
                                    : "text-gray-600"
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
                {comment && (
                    <div className="bg-gray-900/50 p-3 rounded-md border border-gray-800 mt-2">
                        <p className="text-sm text-gray-400">{comment}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <MainLayout>
            <div className="relative min-h-screen">
                {/* Фоновое изображение */}
                <div className="absolute inset-0 bg-[url('/images/backgrounds/menu_bg.jpg')] bg-cover bg-center opacity-30"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/60 backdrop-blur-[1px]"></div>

                {/* Декоративные элементы */}
                <div className="absolute top-10 left-10 w-20 h-20 border-t border-l border-red-700/50 animate-pulse"></div>
                <div className="absolute top-10 right-10 w-20 h-20 border-t border-r border-red-700/50 animate-pulse"></div>
                <div className="absolute bottom-10 left-10 w-20 h-20 border-b border-l border-red-700/50 animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r border-red-700/50 animate-pulse"></div>

                <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
                    <div className="bg-gray-900/80 backdrop-blur-sm border border-red-900/30 rounded-lg shadow-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl text-gray-200 font-medieval">
                                {isArchiveMode
                                    ? "Архив заявок поддержки"
                                    : "Сообщения поддержки"}
                            </h1>

                            {/* Переключатель между обычным режимом и архивом */}
                            <button
                                className={`px-4 py-2 rounded text-sm ${
                                    isArchiveMode
                                        ? "bg-gray-700 text-white"
                                        : "bg-green-900/70 text-white"
                                }`}
                                onClick={() => {
                                    setIsArchiveMode(!isArchiveMode);
                                    setCurrentMessage(null);
                                }}
                            >
                                {isArchiveMode
                                    ? "← Вернуться к обычным заявкам"
                                    : "Перейти в архив"}
                            </button>
                        </div>

                        <SectionTitle>
                            {isArchiveMode
                                ? "АРХИВИРОВАННЫЕ ЗАЯВКИ"
                                : "СООБЩЕНИЯ"}
                        </SectionTitle>

                        {!isArchiveMode && <SupportStats />}

                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Список сообщений */}
                            <div className="lg:w-1/2">
                                {/* Фильтры */}
                                <div className="flex flex-wrap gap-3 mb-4">
                                    <div>
                                        <label className="text-gray-400 text-xs block mb-1">
                                            СТАТУС
                                        </label>
                                        <select
                                            className="bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm p-1.5"
                                            value={statusFilter}
                                            onChange={(e) =>
                                                setStatusFilter(e.target.value)
                                            }
                                        >
                                            <option value="all">ВСЕ</option>
                                            <option value="new">НОВЫЕ</option>
                                            <option value="in_progress">
                                                В ОБРАБОТКЕ
                                            </option>
                                            <option value="closed">
                                                РЕШЕНО
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-gray-400 text-xs block mb-1">
                                            ТИП
                                        </label>
                                        <select
                                            className="bg-gray-800 border border-gray-700 rounded text-gray-200 text-sm p-1.5"
                                            value={typeFilter}
                                            onChange={(e) =>
                                                setTypeFilter(e.target.value)
                                            }
                                        >
                                            <option value="all">ВСЕ</option>
                                            <option value="question">
                                                ВОПРОСЫ
                                            </option>
                                            <option value="bug">БАГИ</option>
                                            <option value="suggestion">
                                                ПРЕДЛОЖЕНИЯ
                                            </option>
                                            <option value="account">
                                                АККАУНТ
                                            </option>
                                            <option value="other">
                                                ДРУГОЕ
                                            </option>
                                        </select>
                                    </div>

                                    <div className="ml-auto self-end">
                                        <button
                                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm py-1.5 px-3 rounded border border-gray-700 flex items-center gap-1"
                                            onClick={forceRefresh}
                                            disabled={isLoading || isRefreshing}
                                        >
                                            <svg
                                                className={`w-4 h-4 ${
                                                    isLoading || isRefreshing
                                                        ? "animate-spin"
                                                        : ""
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                ></path>
                                            </svg>
                                            ОБНОВИТЬ
                                        </button>
                                    </div>
                                </div>

                                {isLoading || isRefreshing ? (
                                    <div className="flex justify-center my-8">
                                        <div className="animate-spin h-8 w-8 border-4 border-red-600 rounded-full border-t-transparent"></div>
                                    </div>
                                ) : error ? (
                                    <div className="bg-red-900/20 text-red-400 p-4 rounded-lg border border-red-900/40 my-4">
                                        {error instanceof Error
                                            ? error.message
                                            : "Произошла ошибка при загрузке данных"}
                                    </div>
                                ) : !messages || messages.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        Нет сообщений, соответствующих фильтрам
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {messages.map(
                                            (message: SupportMessage) => (
                                                <div
                                                    key={message.id}
                                                    className={`border border-gray-800 rounded-lg p-4 transition-colors cursor-pointer ${
                                                        currentMessage?.id ===
                                                        message.id
                                                            ? "bg-red-900/10 border-red-900/30"
                                                            : "bg-gray-800/40 hover:bg-gray-800/80"
                                                    }`}
                                                    onClick={() =>
                                                        openMessage(message)
                                                    }
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="font-medieval text-red-400">
                                                            {message.name}
                                                        </h3>
                                                        <div className="flex gap-2">
                                                            <StatusBadge
                                                                status={
                                                                    message.status
                                                                }
                                                            />
                                                            <ModerationBadge
                                                                message={
                                                                    message
                                                                }
                                                                isArchiveMode={
                                                                    isArchiveMode
                                                                }
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                                                        <TypeBadge
                                                            type={message.type}
                                                        />
                                                        <span>
                                                            {formatDate(
                                                                message.created_at
                                                            )}
                                                        </span>
                                                        {message.character_name && (
                                                            <span className="text-gray-500">
                                                                Персонаж:{" "}
                                                                {
                                                                    message.character_name
                                                                }
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-gray-300 text-sm line-clamp-2 mb-1">
                                                        {message.message}
                                                    </p>

                                                    {message.response && (
                                                        <div className="text-xs text-gray-500 mt-2">
                                                            <span className="text-gray-400">
                                                                Ответ:
                                                            </span>{" "}
                                                            {message.response.substring(
                                                                0,
                                                                60
                                                            )}
                                                            {message.response
                                                                .length > 60 &&
                                                                "..."}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Детали сообщения */}
                            <div className="lg:w-1/2 bg-gray-800/50 rounded-lg border border-gray-800 p-5">
                                {!currentMessage ? (
                                    <div className="flex flex-col items-center justify-center h-full py-8 text-gray-400">
                                        <svg
                                            className="w-16 h-16 mb-4 text-gray-700"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1"
                                                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                                            ></path>
                                        </svg>
                                        <p className="text-center">
                                            ВЫБЕРИТЕ СООБЩЕНИЕ ДЛЯ ПРОСМОТРА
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="border-b border-gray-700 pb-4 mb-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h2 className="text-xl font-medieval text-red-400">
                                                    {currentMessage.name}
                                                </h2>
                                                <div className="flex gap-2">
                                                    <StatusBadge
                                                        status={
                                                            currentMessage.status
                                                        }
                                                    />
                                                    <ModerationBadge
                                                        message={currentMessage}
                                                        isArchiveMode={
                                                            isArchiveMode
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                <div>
                                                    <span className="text-gray-500">
                                                        Email:
                                                    </span>
                                                    <span className="ml-2 text-gray-300">
                                                        {currentMessage.email}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">
                                                        Тип:
                                                    </span>
                                                    <span className="ml-2 text-gray-300">
                                                        <TypeBadge
                                                            type={
                                                                currentMessage.type
                                                            }
                                                        />
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">
                                                        Дата:
                                                    </span>
                                                    <span className="ml-2 text-gray-300">
                                                        {formatDate(
                                                            currentMessage.created_at
                                                        )}
                                                    </span>
                                                </div>
                                                {currentMessage.character_name && (
                                                    <div>
                                                        <span className="text-gray-500">
                                                            Персонаж:
                                                        </span>
                                                        <span className="ml-2 text-gray-300">
                                                            {
                                                                currentMessage.character_name
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                                {currentMessage.responder_name && (
                                                    <div className="col-span-2">
                                                        <span className="text-gray-500">
                                                            Ответил:
                                                        </span>
                                                        <span className="ml-2 text-green-400">
                                                            {
                                                                currentMessage.responder_name
                                                            }
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Кнопки модерации */}
                                            <div className="border-t border-gray-700 py-3 mb-4">
                                                <div className="flex justify-between">
                                                    <div>
                                                        <h3 className="text-gray-400 text-sm font-medieval mb-2">
                                                            Модерация:
                                                        </h3>
                                                    </div>
                                                    <div className="space-x-2">
                                                        {/* Кнопка Взять на модерацию */}
                                                        {!isArchiveMode &&
                                                            (!currentMessage.on_moderation ||
                                                                currentMessage.moderator_id ===
                                                                    authStore
                                                                        .user
                                                                        ?.id) && (
                                                                <button
                                                                    className={`bg-purple-900 hover:bg-purple-800 text-white py-1.5 px-3 rounded shadow text-sm ${
                                                                        takeForModerationMutation.isPending
                                                                            ? "opacity-70 cursor-not-allowed"
                                                                            : ""
                                                                    }`}
                                                                    onClick={
                                                                        takeMessage
                                                                    }
                                                                    disabled={
                                                                        takeForModerationMutation.isPending ||
                                                                        (currentMessage.on_moderation &&
                                                                            currentMessage.moderator_id ===
                                                                                authStore
                                                                                    .user
                                                                                    ?.id)
                                                                    }
                                                                >
                                                                    {takeForModerationMutation.isPending ? (
                                                                        <span className="flex items-center">
                                                                            <svg
                                                                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <circle
                                                                                    className="opacity-25"
                                                                                    cx="12"
                                                                                    cy="12"
                                                                                    r="10"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="4"
                                                                                ></circle>
                                                                                <path
                                                                                    className="opacity-75"
                                                                                    fill="currentColor"
                                                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                                ></path>
                                                                            </svg>
                                                                            Обработка...
                                                                        </span>
                                                                    ) : currentMessage.on_moderation &&
                                                                      currentMessage.moderator_id ===
                                                                          authStore
                                                                              .user
                                                                              ?.id ? (
                                                                        "Уже на модерации у вас"
                                                                    ) : (
                                                                        "Взять на модерацию"
                                                                    )}
                                                                </button>
                                                            )}

                                                        {/* Кнопка Освободить от модерации */}
                                                        {!isArchiveMode &&
                                                            currentMessage.moderator_id ===
                                                                authStore.user
                                                                    ?.id &&
                                                            currentMessage.on_moderation && (
                                                                <button
                                                                    className={`bg-red-800 hover:bg-red-700 text-white py-1.5 px-3 rounded shadow text-sm ${
                                                                        releaseFromModerationMutation.isPending
                                                                            ? "opacity-70 cursor-not-allowed"
                                                                            : ""
                                                                    }`}
                                                                    onClick={
                                                                        releaseMessage
                                                                    }
                                                                    disabled={
                                                                        releaseFromModerationMutation.isPending
                                                                    }
                                                                >
                                                                    {releaseFromModerationMutation.isPending ? (
                                                                        <span className="flex items-center">
                                                                            <svg
                                                                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <circle
                                                                                    className="opacity-25"
                                                                                    cx="12"
                                                                                    cy="12"
                                                                                    r="10"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="4"
                                                                                ></circle>
                                                                                <path
                                                                                    className="opacity-75"
                                                                                    fill="currentColor"
                                                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                                ></path>
                                                                            </svg>
                                                                            Обработка...
                                                                        </span>
                                                                    ) : (
                                                                        "Освободить"
                                                                    )}
                                                                </button>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800 mb-4">
                                                <h3 className="text-gray-400 mb-2 text-sm font-medieval">
                                                    Сообщение:
                                                </h3>
                                                <p className="text-gray-300 whitespace-pre-line">
                                                    {currentMessage.message}
                                                </p>
                                            </div>

                                            {/* Добавляем отображение оценки в архивные заявки */}
                                            {isArchiveMode &&
                                                currentMessage.rating !==
                                                    undefined && (
                                                    <RatingDisplay
                                                        rating={
                                                            currentMessage.rating
                                                        }
                                                        comment={
                                                            currentMessage.feedback_comment
                                                        }
                                                    />
                                                )}
                                        </div>

                                        {/* Скрываем раздел ответа для архивных заявок */}
                                        {!isArchiveMode && (
                                            <div>
                                                <h3 className="text-gray-300 mb-2 font-medieval">
                                                    Ответ:
                                                </h3>
                                                <textarea
                                                    className="w-full bg-gray-900/70 border border-gray-700 rounded-md p-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/50 focus:border-red-800/50 transition-all shadow-inner mb-4"
                                                    rows={5}
                                                    value={responseText}
                                                    onChange={(e) =>
                                                        setResponseText(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={
                                                        !currentMessage.on_moderation ||
                                                        currentMessage.moderator_id !==
                                                            authStore.user?.id
                                                            ? "Сначала возьмите вопрос на модерацию..."
                                                            : "Введите ответ пользователю..."
                                                    }
                                                    disabled={
                                                        updateResponseMutation.isPending ||
                                                        !currentMessage.on_moderation ||
                                                        currentMessage.moderator_id !==
                                                            authStore.user?.id
                                                    }
                                                />

                                                <div className="flex flex-wrap justify-between gap-3">
                                                    <div className="space-x-2">
                                                        <button
                                                            className={`bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-4 rounded border border-gray-700 ${
                                                                currentMessage.status ===
                                                                    "new" ||
                                                                !currentMessage.on_moderation ||
                                                                currentMessage.moderator_id !==
                                                                    authStore
                                                                        .user
                                                                        ?.id
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                changeStatus(
                                                                    "new"
                                                                )
                                                            }
                                                            disabled={
                                                                currentMessage.status ===
                                                                    "new" ||
                                                                updateResponseMutation.isPending ||
                                                                !currentMessage.on_moderation ||
                                                                currentMessage.moderator_id !==
                                                                    authStore
                                                                        .user
                                                                        ?.id
                                                            }
                                                        >
                                                            ПОМЕТИТЬ КАК НОВОЕ
                                                        </button>
                                                        <button
                                                            className={`bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-4 rounded border border-gray-700 ${
                                                                currentMessage.status ===
                                                                    "in_progress" ||
                                                                !currentMessage.on_moderation ||
                                                                currentMessage.moderator_id !==
                                                                    authStore
                                                                        .user
                                                                        ?.id
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                changeStatus(
                                                                    "in_progress"
                                                                )
                                                            }
                                                            disabled={
                                                                currentMessage.status ===
                                                                    "in_progress" ||
                                                                updateResponseMutation.isPending ||
                                                                !currentMessage.on_moderation ||
                                                                currentMessage.moderator_id !==
                                                                    authStore
                                                                        .user
                                                                        ?.id
                                                            }
                                                        >
                                                            В ОБРАБОТКЕ
                                                        </button>
                                                        <button
                                                            className={`bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-4 rounded border border-gray-700 ${
                                                                currentMessage.status ===
                                                                    "closed" ||
                                                                !currentMessage.on_moderation ||
                                                                currentMessage.moderator_id !==
                                                                    authStore
                                                                        .user
                                                                        ?.id
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                changeStatus(
                                                                    "closed"
                                                                )
                                                            }
                                                            disabled={
                                                                currentMessage.status ===
                                                                    "closed" ||
                                                                updateResponseMutation.isPending ||
                                                                !currentMessage.on_moderation ||
                                                                currentMessage.moderator_id !==
                                                                    authStore
                                                                        .user
                                                                        ?.id
                                                            }
                                                        >
                                                            ЗАКРЫТЬ
                                                        </button>
                                                    </div>

                                                    <button
                                                        className="bg-red-900 hover:bg-red-800 text-white py-2 px-6 rounded shadow flex items-center gap-2"
                                                        onClick={saveResponse}
                                                        disabled={
                                                            !responseText.trim() ||
                                                            updateResponseMutation.isPending ||
                                                            !currentMessage.on_moderation ||
                                                            currentMessage.moderator_id !==
                                                                authStore.user
                                                                    ?.id
                                                        }
                                                    >
                                                        {updateResponseMutation.isPending && (
                                                            <svg
                                                                className="animate-spin h-4 w-4 text-white"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <circle
                                                                    className="opacity-25"
                                                                    cx="12"
                                                                    cy="12"
                                                                    r="10"
                                                                    stroke="currentColor"
                                                                    strokeWidth="4"
                                                                ></circle>
                                                                <path
                                                                    className="opacity-75"
                                                                    fill="currentColor"
                                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                ></path>
                                                            </svg>
                                                        )}
                                                        СОХРАНИТЬ ОТВЕТ
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default SupportMessages;
