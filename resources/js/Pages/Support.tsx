import React, { useState, useEffect } from "react";
import MainLayout from "../Layouts/MainLayout";
import { Link } from "react-router-dom";
import axios from "axios";
import authStore from "../stores/AuthStore";
import characterStore from "../stores/CharacterStore";

// Декоративный разделитель
const Divider = () => (
    <div className="flex items-center justify-center my-6">
        <div className="w-1/4 h-0.5 bg-gradient-to-r from-transparent to-red-800/30"></div>
        <div className="mx-4 text-red-600">❖</div>
        <div className="w-1/4 h-0.5 bg-gradient-to-l from-transparent to-red-800/30"></div>
    </div>
);

// Декоративный заголовок секции
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="text-center mb-8">
        <h2 className="text-red-500 text-2xl font-medieval tracking-wider inline-block relative">
            {children}
        </h2>
        <div className="h-0.5 w-3/4 mx-auto mt-2 bg-gradient-to-r from-transparent via-red-700/40 to-transparent"></div>
    </div>
);

// Типы запросов поддержки
const supportTypes = [
    {
        value: "question",
        label: "Вопрос",
        icon: "❓",
        description: "Задать вопрос администрации",
    },
    {
        value: "bug",
        label: "Баг-репорт",
        icon: "🐞",
        description: "Сообщить о найденном баге или ошибке",
    },
    {
        value: "suggestion",
        label: "Предложение",
        icon: "💡",
        description: "Предложить улучшение или новую функцию",
    },
    {
        value: "account",
        label: "Проблемы с аккаунтом",
        icon: "🔒",
        description: "Проблемы с входом, безопасностью",
    },
    {
        value: "other",
        label: "Другое",
        icon: "📝",
        description: "Иное обращение",
    },
];

// Стилизованное текстовое поле
const FormInput = ({
    id,
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    required = false,
    error = null,
    hint = null,
    readOnly = false,
}: {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    value: string;
    onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void;
    required?: boolean;
    error?: string | null;
    hint?: string | null;
    readOnly?: boolean;
}) => (
    <div className="mb-5">
        <label htmlFor={id} className="block text-gray-300 mb-2 font-medieval">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === "textarea" ? (
            <textarea
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full bg-gray-900/70 border ${
                    error ? "border-red-500" : "border-gray-700"
                } rounded-md p-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/50 focus:border-red-800/50 transition-all shadow-inner ${
                    readOnly ? "opacity-70 cursor-not-allowed" : ""
                }`}
                rows={5}
                required={required}
                readOnly={readOnly}
            />
        ) : (
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full bg-gray-900/70 border ${
                    error ? "border-red-500" : "border-gray-700"
                } rounded-md p-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/50 focus:border-red-800/50 transition-all shadow-inner ${
                    readOnly ? "opacity-70 cursor-not-allowed" : ""
                }`}
                required={required}
                readOnly={readOnly}
            />
        )}
        {error && <p className="mt-1 text-red-500 text-sm">{error}</p>}
        {hint && <p className="mt-1 text-gray-500 text-xs">{hint}</p>}
    </div>
);

// Компонент выбора персонажа
const CharacterSelector = ({
    id,
    label,
    value,
    onChange,
    characters,
    required = false,
    error = null,
    hint = null,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    characters: Array<{ id: number; name: string }>;
    required?: boolean;
    error?: string | null;
    hint?: string | null;
}) => (
    <div className="mb-5">
        <label htmlFor={id} className="block text-gray-300 mb-2 font-medieval">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            id={id}
            value={value}
            onChange={onChange}
            className={`w-full bg-gray-900/70 border ${
                error ? "border-red-500" : "border-gray-700"
            } rounded-md p-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/50 focus:border-red-800/50 transition-all shadow-inner appearance-none`}
            required={required}
        >
            <option value="">Выберите персонажа</option>
            {characters.map((char) => (
                <option key={char.id} value={char.name}>
                    {char.name}
                </option>
            ))}
        </select>
        {error && <p className="mt-1 text-red-500 text-sm">{error}</p>}
        {hint && <p className="mt-1 text-gray-500 text-xs">{hint}</p>}
    </div>
);

// Компонент для выбора типа поддержки
const SupportTypeSelection = ({
    selectedType,
    onSelect,
}: {
    selectedType: string;
    onSelect: (type: string) => void;
}) => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {supportTypes.map((type) => (
            <div
                key={type.value}
                className={`p-2 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedType === type.value
                        ? "bg-red-900/20 border-red-800/50 shadow-inner shadow-red-900/10"
                        : "bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/80"
                }`}
                onClick={() => onSelect(type.value)}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900/80 flex items-center justify-center mb-1 shadow">
                        <span className="text-sm">{type.icon}</span>
                    </div>
                    <h3
                        className={`font-medieval text-xs ${
                            selectedType === type.value
                                ? "text-red-400"
                                : "text-gray-300"
                        }`}
                    >
                        {type.label}
                    </h3>
                    <p className="text-gray-500 text-xs hidden md:block">
                        {type.description}
                    </p>
                </div>
            </div>
        ))}
    </div>
);

const Support: React.FC = () => {
    const [selectedType, setSelectedType] = useState<string>("question");
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [character, setCharacter] = useState<string>("");

    // Состояние отправки
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Состояние валидации
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Загружаем данные пользователя при монтировании компонента
    // и при изменении статуса авторизации или окончании загрузки
    useEffect(() => {
        // Заполняем имя и email пользователя из authStore (если пользователь авторизован)
        if (
            !authStore.isLoading &&
            authStore.isAuthenticated &&
            authStore.user
        ) {
            setName(authStore.user.name || "");
            setEmail(authStore.user.email || "");
        }
    }, [authStore.isLoading, authStore.isAuthenticated, authStore.user]);

    // Загружаем список персонажей при изменении статуса авторизации или окончании загрузки
    useEffect(() => {
        // Загружаем список персонажей пользователя только когда авторизация подтверждена и загрузка завершена
        if (!authStore.isLoading && authStore.isAuthenticated) {
            const loadCharacters = async () => {
                try {
                    await characterStore.loadCharacters();
                } catch (error) {
                    console.error("Ошибка при загрузке персонажей:", error);
                }
            };

            loadCharacters();
        }
    }, [authStore.isLoading, authStore.isAuthenticated]);

    // Обработчик отправки формы
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Очистка предыдущих ошибок
        setErrors({});
        setSubmitError(null);

        // Валидация
        let hasErrors = false;
        const newErrors: { [key: string]: string } = {};

        if (!name.trim()) {
            newErrors.name = "Пожалуйста, укажите ваше имя";
            hasErrors = true;
        }

        if (!email.trim()) {
            newErrors.email = "Пожалуйста, укажите ваш email";
            hasErrors = true;
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            newErrors.email = "Пожалуйста, укажите корректный email";
            hasErrors = true;
        }

        if (!message.trim()) {
            newErrors.message = "Пожалуйста, напишите ваше сообщение";
            hasErrors = true;
        }

        if (
            (selectedType === "bug" || selectedType === "account") &&
            !character.trim()
        ) {
            newErrors.character = "Пожалуйста, выберите персонажа";
            hasErrors = true;
        }

        if (hasErrors) {
            setErrors(newErrors);
            return;
        }

        // Отправка формы
        setIsSubmitting(true);

        try {
            // Формируем данные для отправки
            const formData = {
                name,
                email,
                type: selectedType,
                character_name: character || null,
                message,
            };

            // Отправляем запрос к API
            const response = await axios.post(
                "/api/support-messages",
                formData
            );

            // Успешная отправка
            setSubmitSuccess(true);

            // Очистка формы
            setSelectedType("question");
            // Не очищаем имя и email, так как они берутся из данных пользователя
            setMessage("");
            setCharacter("");
        } catch (error) {
            console.error("Ошибка при отправке сообщения:", error);

            // Проверяем, есть ли ответ от сервера с ошибками валидации
            if (axios.isAxiosError(error) && error.response?.data?.errors) {
                // Устанавливаем ошибки валидации
                setErrors(error.response.data.errors);
            } else {
                // Общая ошибка
                setSubmitError(
                    "Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте позже."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Проверяем, нужно ли отображать селектор персонажа
    const showCharacterSelector = ["bug", "account"].includes(selectedType);

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

                {/* Содержимое страницы */}
                <div className="container max-w-4xl mx-auto px-4 py-12 relative z-10">
                    <div className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 rounded-lg border border-red-900/30 shadow-xl p-8 backdrop-blur-sm relative">
                        {/* Декоративные углы */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-800/50"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-800/50"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-800/50"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-800/50"></div>

                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-medieval text-red-500 mb-2 tracking-wider">
                                ФОРМА ОБРАТНОЙ СВЯЗИ
                            </h1>
                            <p className="text-gray-400">
                                Мы готовы выслушать ваши вопросы и помочь решить
                                проблемы
                            </p>
                        </div>

                        <Divider />

                        {submitSuccess ? (
                            <div className="text-center py-8">
                                <div className="inline-block p-4 rounded-full bg-green-900/20 border border-green-800/30 mb-4">
                                    <svg
                                        className="w-12 h-12 text-green-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 13l4 4L19 7"
                                        ></path>
                                    </svg>
                                </div>
                                <h2 className="text-xl text-green-400 font-medieval mb-4">
                                    Сообщение успешно отправлено!
                                </h2>
                                <p className="text-gray-300 mb-6">
                                    Благодарим вас за обращение. Мы рассмотрим
                                    ваше сообщение и ответим вам в ближайшее
                                    время.
                                </p>
                                <button
                                    className="px-6 py-2 bg-gray-800 border border-red-900/30 rounded-md text-gray-300 hover:bg-red-900/20 transition-colors"
                                    onClick={() => setSubmitSuccess(false)}
                                >
                                    Отправить новое сообщение
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <SectionTitle>
                                    ВЫБЕРИТЕ ТИП ОБРАЩЕНИЯ
                                </SectionTitle>

                                <SupportTypeSelection
                                    selectedType={selectedType}
                                    onSelect={setSelectedType}
                                />

                                <SectionTitle>ВАШЕ СООБЩЕНИЕ</SectionTitle>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FormInput
                                        id="name"
                                        label="ВАШЕ ИМЯ"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="Введите ваше имя"
                                        required={true}
                                        error={errors.name}
                                        readOnly={authStore.isAuthenticated}
                                        hint="ИСПОЛЬЗУЕТСЯ ИМЯ ИЗ ВАШЕГО АККАУНТА"
                                    />

                                    <FormInput
                                        id="email"
                                        label="EMAIL"
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        placeholder="example@mail.com"
                                        required={true}
                                        error={errors.email}
                                        readOnly={authStore.isAuthenticated}
                                        hint="МЫ ИСПОЛЬЗУЕМ ВАШ EMAIL ТОЛЬКО ДЛЯ ОТВЕТА НА ЗАПРОС"
                                    />
                                </div>

                                {/* Контейнер с персонажем */}
                                <div className="min-h-[120px] mb-6">
                                    {/* Селектор персонажа */}
                                    <div
                                        className={`transition-opacity duration-300 ${
                                            showCharacterSelector
                                                ? "opacity-100"
                                                : "opacity-0 absolute -z-10"
                                        }`}
                                    >
                                        <CharacterSelector
                                            id="character"
                                            label="Выберите персонажа"
                                            value={character}
                                            onChange={(e) =>
                                                setCharacter(e.target.value)
                                            }
                                            characters={
                                                characterStore.characters || []
                                            }
                                            required={showCharacterSelector}
                                            error={errors.character}
                                            hint="Выберите персонажа, у которого возникла проблема"
                                        />
                                    </div>
                                </div>

                                <FormInput
                                    id="message"
                                    label="Сообщение"
                                    type="textarea"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Подробно опишите ваш вопрос или проблему..."
                                    required={true}
                                    error={errors.message}
                                />

                                {submitError && (
                                    <div className="p-4 bg-red-900/20 border border-red-900/40 rounded-lg mb-6 text-red-400">
                                        <div className="flex items-center">
                                            <svg
                                                className="w-6 h-6 mr-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                ></path>
                                            </svg>
                                            {submitError}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mt-8">
                                    <Link
                                        to="/"
                                        className="text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                        ← Вернуться на главную
                                    </Link>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`px-6 py-2 bg-gradient-to-r from-red-900/80 to-red-700/80 rounded-md text-white font-medieval tracking-wide shadow-lg hover:from-red-800/80 hover:to-red-600/80 transition-colors ${
                                            isSubmitting
                                                ? "opacity-70 cursor-not-allowed"
                                                : ""
                                        }`}
                                    >
                                        {isSubmitting ? (
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
                                            "Отправить сообщение"
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Support;
