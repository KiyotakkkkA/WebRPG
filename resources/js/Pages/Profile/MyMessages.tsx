import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import MainLayout from "../../Layouts/MainLayout";
import authStore from "../../stores/AuthStore";
import axios from "../../config/axios";

// Интерфейс для сообщения поддержки
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
    on_moderation: boolean;
    created_at: string;
    updated_at: string;
    rating?: number | null;
    feedback_comment?: string | null;
    archived?: boolean;
    rated_at?: string | null;
}

// Функция получения сообщений пользователя
const fetchUserMessages = async (): Promise<SupportMessage[]> => {
    try {
        const response = await axios.get("/api/my-support-messages");
        return response.data.messages;
    } catch (error) {
        console.error("Ошибка при получении сообщений:", error);
        return [];
    }
};

// Компонент для отображения статуса сообщения
const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = "";
    let textColor = "";
    let label = "";

    switch (status) {
        case "new":
            bgColor = "bg-yellow-900/50";
            textColor = "text-yellow-400";
            label = "Новое";
            break;
        case "in_progress":
            bgColor = "bg-blue-900/50";
            textColor = "text-blue-400";
            label = "В обработке";
            break;
        case "closed":
            bgColor = "bg-green-900/50";
            textColor = "text-green-400";
            label = "Решено";
            break;
        default:
            bgColor = "bg-gray-900/50";
            textColor = "text-gray-400";
            label = "Неизвестно";
    }

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor} border border-${textColor.replace(
                "text",
                "border"
            )}/40`}
        >
            {label}
        </span>
    );
};

// Компонент для отображения типа сообщения
const TypeBadge = ({ type }: { type: string }) => {
    let bgColor = "";
    let textColor = "";
    let label = "";

    switch (type) {
        case "question":
            bgColor = "bg-indigo-900/50";
            textColor = "text-indigo-400";
            label = "Вопрос";
            break;
        case "bug":
            bgColor = "bg-red-900/50";
            textColor = "text-red-400";
            label = "Ошибка";
            break;
        case "suggestion":
            bgColor = "bg-purple-900/50";
            textColor = "text-purple-400";
            label = "Предложение";
            break;
        case "account":
            bgColor = "bg-orange-900/50";
            textColor = "text-orange-400";
            label = "Аккаунт";
            break;
        default:
            bgColor = "bg-gray-900/50";
            textColor = "text-gray-400";
            label = "Другое";
    }

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor} border border-${textColor.replace(
                "text",
                "border"
            )}/40`}
        >
            {label}
        </span>
    );
};

// Компонент для отображения модерации
const ModerationBadge = ({ isOnModeration }: { isOnModeration: boolean }) => {
    if (!isOnModeration) return null;

    return (
        <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-400/40"
            title="Сообщение находится на рассмотрении у модератора"
        >
            На модерации
        </span>
    );
};

// Компонент для оценки ответа администрации
const RatingForm = ({
    messageId,
    currentRating,
    onRatingSubmitted,
}: {
    messageId: number;
    currentRating?: number | null;
    onRatingSubmitted: () => void;
}) => {
    const [rating, setRating] = useState<number | null>(currentRating || null);
    const [comment, setComment] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRatingChange = (newRating: number) => {
        setRating(newRating);
    };

    const handleSubmit = async () => {
        if (!rating) {
            setError("Пожалуйста, выберите оценку");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await axios.post(`/api/support-messages/${messageId}/rate`, {
                rating,
                feedback_comment: comment.trim() || null,
            });

            // После успешной отправки вызываем колбэк для обновления данных
            onRatingSubmitted();
        } catch (err) {
            console.error("Ошибка при отправке оценки:", err);
            setError(
                "Не удалось отправить оценку. Пожалуйста, попробуйте позже."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Если оценка уже поставлена, показываем информацию об этом
    if (currentRating) {
        return (
            <div className="mt-4 bg-green-900/20 rounded-lg p-3 border border-green-700/30">
                <div className="flex items-center mb-2">
                    <span className="text-green-400 mr-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </span>
                    <span className="text-gray-300">
                        Вы уже оценили ответ администрации
                    </span>
                </div>
                <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                            key={star}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 ${
                                star <= currentRating
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
            </div>
        );
    }

    return (
        <div className="mt-6 bg-gray-800/70 rounded-lg p-4 border border-red-900/20">
            <h3 className="text-lg text-gray-200 mb-3 font-medieval">
                Оценить ответ администрации
            </h3>
            <p className="text-sm text-gray-400 mb-4">
                Ваша оценка поможет нам улучшить качество поддержки. После
                оценки заявка будет перемещена в архив.
            </p>

            <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Ваша оценка:</div>
                <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingChange(star)}
                            className="focus:outline-none"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-8 w-8 ${
                                    star <= (rating || 0)
                                        ? "text-yellow-400"
                                        : "text-gray-600"
                                } hover:text-yellow-400 transition-colors`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-4">
                <label
                    htmlFor="feedback-comment"
                    className="block text-sm text-gray-400 mb-2"
                >
                    Комментарий (не обязательно):
                </label>
                <textarea
                    id="feedback-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-md p-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/50 focus:border-red-800/50 transition-all shadow-inner"
                    rows={3}
                    placeholder="Оставьте комментарий к вашей оценке..."
                />
            </div>

            {error && (
                <div className="mb-4 p-2 bg-red-900/20 border border-red-600/30 rounded text-red-400 text-sm">
                    {error}
                </div>
            )}

            <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !rating}
                className={`px-4 py-2 bg-gradient-to-r from-red-900/80 to-red-700/80 rounded-md text-white font-medieval tracking-wide shadow-lg hover:from-red-800/80 hover:to-red-600/80 transition-colors ${
                    submitting || !rating ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
                {submitting ? (
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
                        Отправка...
                    </span>
                ) : (
                    "Отправить оценку"
                )}
            </button>
        </div>
    );
};

// Компонент для детального просмотра сообщения
const MessageDetail = ({ message }: { message: SupportMessage | null }) => {
    if (!message) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 text-center">
                    <svg
                        className="w-12 h-12 mx-auto mb-2 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1"
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        ></path>
                    </svg>
                    <p className="text-lg font-medieval">
                        Выберите сообщение из списка
                    </p>
                </div>
            </div>
        );
    }

    // Форматирование даты
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Добавляем функцию для обновления сообщений после оценки
    const handleRatingSubmitted = () => {
        // Здесь будем обновлять список сообщений после успешной оценки
        window.location.reload(); // Временное решение, в идеале использовать контекст или пропсы
    };

    return (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-red-900/20 shadow-inner h-full">
            <div className="mb-4 flex flex-wrap gap-2 items-center">
                <h2 className="text-xl font-medieval text-red-400 mr-2">
                    Сообщение #{message.id}
                </h2>
                <div className="flex flex-wrap gap-2">
                    <StatusBadge status={message.status} />
                    <TypeBadge type={message.type} />
                    <ModerationBadge isOnModeration={message.on_moderation} />
                </div>
                <span className="ml-auto text-sm text-gray-500">
                    {formatDate(message.created_at)}
                </span>
            </div>

            <div className="mb-6">
                <h3 className="text-sm text-gray-400 mb-1">Ваше сообщение:</h3>
                <div className="bg-gray-900/50 rounded p-3 text-gray-300 whitespace-pre-wrap">
                    {message.message}
                </div>
            </div>

            {message.response && (
                <div className="mb-6">
                    <h3 className="text-sm text-gray-400 mb-1">
                        Ответ поддержки:
                    </h3>
                    <div className="bg-gray-900/50 rounded p-3 text-gray-300 whitespace-pre-wrap border-l-2 border-green-700">
                        {message.response}
                    </div>
                </div>
            )}

            {/* Отображаем информацию о выставленной оценке, если сообщение заархивировано и имеет оценку */}
            {message.response &&
                message.status === "closed" &&
                message.archived &&
                message.rating && (
                    <div className="mb-6 bg-gray-800/70 rounded-lg p-4 border border-yellow-900/20">
                        <h3 className="text-lg text-gray-200 mb-2 font-medieval flex items-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2 text-yellow-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                            </svg>
                            Ваша оценка
                        </h3>
                        <div className="flex mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                    key={star}
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`h-6 w-6 ${
                                        star <= (message.rating || 0)
                                            ? "text-yellow-400"
                                            : "text-gray-600"
                                    }`}
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                            <span className="ml-2 text-gray-400 text-sm">
                                {message.rated_at
                                    ? formatDate(message.rated_at)
                                    : ""}
                            </span>
                        </div>
                        {message.feedback_comment && (
                            <div className="bg-gray-900/50 rounded p-3 text-gray-300 whitespace-pre-wrap border-l-2 border-yellow-700">
                                {message.feedback_comment}
                            </div>
                        )}
                    </div>
                )}

            {/* Добавляем форму для оценки, только если сообщение закрыто и еще не оценено */}
            {message.response &&
                message.status === "closed" &&
                !message.archived && (
                    <RatingForm
                        messageId={message.id}
                        currentRating={message.rating}
                        onRatingSubmitted={handleRatingSubmitted}
                    />
                )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-900/30 rounded p-3">
                    <span className="text-gray-500">Имя:</span>{" "}
                    <span className="text-gray-300">{message.name}</span>
                </div>
                <div className="bg-gray-900/30 rounded p-3">
                    <span className="text-gray-500">Email:</span>{" "}
                    <span className="text-gray-300">{message.email}</span>
                </div>
                {message.character_name && (
                    <div className="bg-gray-900/30 rounded p-3 md:col-span-2">
                        <span className="text-gray-500">Персонаж:</span>{" "}
                        <span className="text-gray-300">
                            {message.character_name}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Основной компонент страницы
const MyMessages: React.FC = observer(() => {
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] =
        useState<SupportMessage | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Загрузка сообщений при монтировании компонента
    useEffect(() => {
        const loadMessages = async () => {
            setLoading(true);
            try {
                const userMessages = await fetchUserMessages();
                setMessages(userMessages);
                if (userMessages.length > 0) {
                    setSelectedMessage(userMessages[0]);
                }
            } catch (err) {
                setError("Не удалось загрузить сообщения");
            } finally {
                setLoading(false);
            }
        };

        if (authStore.isAuthenticated) {
            loadMessages();
        }
    }, [authStore.isAuthenticated]);

    // Форматирование даты
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
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

                <div className="container mx-auto px-4 py-8 relative z-10">
                    <div className="bg-gray-900/80 backdrop-blur-sm border border-red-900/30 rounded-lg shadow-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl text-red-500 font-medieval">
                                Мои сообщения в поддержку
                            </h1>
                            <Link
                                to="/profile"
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md text-sm flex items-center transition-colors"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                                Назад в профиль
                            </Link>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                                <span className="ml-3 text-red-500">
                                    Загрузка сообщений...
                                </span>
                            </div>
                        ) : error ? (
                            <div className="text-center py-10">
                                <div className="text-red-500 text-xl">
                                    {error}
                                </div>
                                <p className="text-gray-400 mt-2">
                                    Пожалуйста, попробуйте позже
                                </p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-10">
                                <svg
                                    className="w-16 h-16 mx-auto mb-4 text-gray-700"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1"
                                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                    ></path>
                                </svg>
                                <div className="text-gray-400 text-xl mb-4">
                                    У вас пока нет сообщений в поддержку
                                </div>
                                <Link
                                    to="/support"
                                    className="px-4 py-2 bg-red-900/80 hover:bg-red-800 text-white rounded-md inline-flex items-center"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    Создать обращение
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Список сообщений */}
                                <div className="lg:col-span-1 overflow-hidden">
                                    <div className="bg-gray-800/50 rounded-lg p-3 border border-red-900/20 shadow-inner">
                                        <h2 className="text-lg font-medieval text-red-400 mb-3 border-b border-gray-700 pb-2">
                                            Список заявок
                                        </h2>
                                        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                                            {messages.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={`${
                                                        selectedMessage?.id ===
                                                        msg.id
                                                            ? "bg-gray-700/70 border-red-800"
                                                            : "bg-gray-800/30 hover:bg-gray-800/50 border-transparent"
                                                    } p-3 rounded-md cursor-pointer transition-colors border`}
                                                    onClick={() =>
                                                        setSelectedMessage(msg)
                                                    }
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-medieval text-gray-200">
                                                            #{msg.id}:{" "}
                                                            <TypeBadge
                                                                type={msg.type}
                                                            />
                                                        </span>
                                                        <StatusBadge
                                                            status={msg.status}
                                                        />
                                                    </div>
                                                    <div className="text-gray-400 text-sm truncate">
                                                        {msg.message.length > 70
                                                            ? msg.message.substring(
                                                                  0,
                                                                  70
                                                              ) + "..."
                                                            : msg.message}
                                                    </div>
                                                    <div className="mt-2 flex justify-between items-center text-xs">
                                                        <span className="text-gray-500">
                                                            {formatDate(
                                                                msg.created_at
                                                            )}
                                                        </span>
                                                        {msg.on_moderation ? (
                                                            <ModerationBadge
                                                                isOnModeration={
                                                                    true
                                                                }
                                                            />
                                                        ) : null}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Детали сообщения */}
                                <div className="lg:col-span-2">
                                    <MessageDetail message={selectedMessage} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
});

export default MyMessages;
