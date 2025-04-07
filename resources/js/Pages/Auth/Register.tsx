import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../../Layouts/MainLayout";
import Button from "../../Components/ui/Button";
import StyledInput from "../../Components/ui/StyledInput";
import StyledCheckbox from "../../Components/ui/StyledCheckbox";
import { observer } from "mobx-react-lite";
import authStore from "../../stores/AuthStore";

const Register: React.FC = observer(() => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
        passwordConfirmation?: string;
        general?: string;
    }>({});
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    // Если пользователь уже авторизован, перенаправляем на главную
    useEffect(() => {
        if (authStore.isAuthenticated) {
            navigate("/");
        }
    }, [authStore.isAuthenticated, navigate]);

    // Обработчик отправки формы
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Сбрасываем ошибки
        setErrors({});

        // Базовая валидация
        const newErrors: any = {};
        if (!name) newErrors.name = "Введите имя";
        if (!email) newErrors.email = "Введите email";
        if (!password) newErrors.password = "Введите пароль";
        if (password !== passwordConfirmation) {
            newErrors.passwordConfirmation = "Печати не совпадают";
        }
        if (!agreeToTerms) {
            newErrors.general =
                "Для создания договора необходимо согласие с кровавым кодексом";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Вызываем метод из authStore
        const success = await authStore.register(
            name,
            email,
            password,
            passwordConfirmation
        );

        if (!success && authStore.error) {
            setErrors({ general: authStore.error });
        }
    };

    return (
        <MainLayout>
            <div className="relative min-h-[calc(100vh-200px)] flex items-center justify-center py-12">
                {/* Фоновое изображение */}
                <div className="absolute inset-0 bg-[url('/images/backgrounds/register_bg.jpg')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/60 backdrop-blur-[2px]"></div>

                {/* Декоративные элементы */}
                <div className="absolute top-10 left-10 w-20 h-20 border-t border-l border-red-700/40"></div>
                <div className="absolute top-10 right-10 w-20 h-20 border-t border-r border-red-700/40"></div>
                <div className="absolute bottom-10 left-10 w-20 h-20 border-b border-l border-red-700/40"></div>
                <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r border-red-700/40"></div>

                {/* Мистические частицы */}
                <div className="absolute inset-0 opacity-30 pointer-events-none mix-blend-lighten">
                    <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-red-600 rounded-full blur-sm animate-ping"></div>
                    <div className="absolute top-1/2 right-1/2 w-1 h-1 bg-red-400 rounded-full blur-sm animate-ping animation-delay-300"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-red-500 rounded-full blur-sm animate-ping animation-delay-700"></div>
                </div>

                <div className="w-full max-w-md z-10">
                    <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-8 shadow-2xl rounded-lg border border-red-900/30 relative overflow-hidden">
                        {/* Декоративные углы */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-700/60"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-700/60"></div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-700/60"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-700/60"></div>

                        {/* Заголовок формы */}
                        <div className="text-center mb-6">
                            <h2 className="echoes-title text-2xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-700">
                                КРОВАВЫЙ ЗАВЕТ
                            </h2>
                            <div className="h-0.5 w-3/4 mx-auto bg-gradient-to-r from-red-700/60 to-transparent mb-1"></div>
                            <p className="text-gray-400 text-sm mt-2">
                                Начните свой путь в мире теней и тайн
                            </p>
                        </div>

                        {/* Сообщение об ошибке */}
                        {(errors.general || authStore.error) && (
                            <div className="mb-4 p-3 bg-red-900/40 border border-red-700/50 rounded-md text-red-200 text-sm">
                                {errors.general || authStore.error}
                            </div>
                        )}

                        {/* Индикатор загрузки */}
                        {authStore.isLoading && (
                            <div className="mb-4 p-3 bg-gray-900/70 border border-red-700/40 rounded-md text-gray-200 text-sm flex items-center justify-center">
                                <svg
                                    className="animate-spin h-5 w-5 mr-2 text-red-500"
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
                                Создаем договор...
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <StyledInput
                                id="name"
                                type="text"
                                label="Истинное имя"
                                icon="👤"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                error={errors.name}
                                required
                                disabled={authStore.isLoading}
                            />

                            <StyledInput
                                id="email"
                                type="email"
                                label="Мистический адрес (Email)"
                                icon="✉"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={errors.email}
                                required
                                disabled={authStore.isLoading}
                            />

                            <StyledInput
                                id="password"
                                type="password"
                                label="Первая печать (Пароль)"
                                icon="🔒"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                error={errors.password}
                                required
                                disabled={authStore.isLoading}
                            />

                            <StyledInput
                                id="password-confirmation"
                                type="password"
                                label="Вторая печать (Подтверждение)"
                                icon="🔒"
                                value={passwordConfirmation}
                                onChange={(e) =>
                                    setPasswordConfirmation(e.target.value)
                                }
                                error={errors.passwordConfirmation}
                                required
                                disabled={authStore.isLoading}
                            />

                            <div className="mb-6">
                                <StyledCheckbox
                                    id="terms"
                                    checked={agreeToTerms}
                                    onChange={(e) =>
                                        setAgreeToTerms(e.target.checked)
                                    }
                                    required
                                    disabled={authStore.isLoading}
                                    label={
                                        <>
                                            Я согласен отдать свою душу и
                                            следовать{" "}
                                            <Link
                                                to="/terms"
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                кровавому кодексу
                                            </Link>
                                        </>
                                    }
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute -inset-1 bg-red-900/20 rounded-md blur-sm"></div>
                                <Button
                                    variant="danger"
                                    fullWidth
                                    disabled={
                                        authStore.isLoading || !agreeToTerms
                                    }
                                    type="submit"
                                >
                                    {authStore.isLoading ? (
                                        <span className="flex items-center justify-center">
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
                                            Скрепляем кровью...
                                        </span>
                                    ) : (
                                        <>
                                            <span className="mr-2">💀</span>{" "}
                                            Заключить договор
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-400">
                                Уже обрел свою тьму?{" "}
                                <Link
                                    to="/auth"
                                    className="text-red-400 hover:text-red-300 transition-colors font-medium"
                                >
                                    Вернуться во мрак
                                </Link>
                            </p>
                        </div>

                        {/* Декоративный элемент */}
                        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-red-900/30 to-transparent mt-6"></div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
});

export default Register;
