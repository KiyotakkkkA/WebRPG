import React from "react";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import authStore from "../stores/AuthStore";
import Button from "../Components/ui/Button";

const Header: React.FC = observer(() => {
    const handleLogout = async () => {
        await authStore.logout();
    };

    return (
        <header className="relative z-20">
            {/* Фон с градиентом и узорами */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-b border-red-900/40 shadow-lg"></div>

            {/* Декоративные элементы */}
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-700/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-700/30 to-transparent"></div>

            <div className="container mx-auto px-4 py-4 relative">
                <div className="flex justify-between items-center">
                    {/* Логотип и название */}
                    <div className="flex items-center">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-red-700/30 rounded-full blur-sm animate-pulse"></div>
                            {/*
                              ОПТИМИЗАЦИЯ: Для максимальной производительности можно заменить обычное изображение
                              на инлайн SVG или Data URL для мгновенной загрузки:

                              Пример SVG:
                              <svg className="w-12 h-12 relative" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="..." fill="#fff" />
                              </svg>
                            */}
                            <img
                                src="/images/logo.png"
                                alt="Логотип игры"
                                className="w-12 h-12 relative"
                                onError={(e) => {
                                    e.currentTarget.src =
                                        "/images/fallback-logo.png";
                                    e.currentTarget.onerror = null;
                                }}
                            />
                        </div>
                        <div className="ml-3">
                            <h1 className="echoes-title text-3xl font-size-stable">
                                ECHOES OF OBLIVION
                            </h1>
                            <div className="h-0.5 w-3/4 bg-gradient-to-r from-transparent via-red-700/60 to-transparent"></div>
                        </div>
                    </div>

                    {/* Навигация */}
                    <nav className="hidden md:flex">
                        <ul className="flex space-x-6 text-stone-300 font-medium">
                            <li>
                                <Link
                                    to="/"
                                    className="py-2 px-3 hover:text-red-400 transition-colors duration-200 relative group flex items-center"
                                >
                                    <span className="absolute -left-1 h-6 w-0.5 bg-red-700/50 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></span>
                                    На Главную
                                    <span className="absolute -right-1 h-6 w-0.5 bg-red-700/50 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom"></span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/about"
                                    className="py-2 px-3 hover:text-red-400 transition-colors duration-200 relative group flex items-center"
                                >
                                    <span className="absolute -left-1 h-6 w-0.5 bg-red-700/50 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></span>
                                    Об игре
                                    <span className="absolute -right-1 h-6 w-0.5 bg-red-700/50 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom"></span>
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    {/* Кнопки авторизации или выхода */}
                    <div className="flex space-x-3">
                        {authStore.isAuthenticated ? (
                            // Кнопка выхода для авторизованных пользователей
                            <Button
                                variant="secondary"
                                onClick={handleLogout}
                                className="py-2 px-5 text-sm"
                            >
                                <span className="mr-1">🚪</span> Выйти
                            </Button>
                        ) : (
                            // Кнопки входа и регистрации для неавторизованных пользователей
                            <>
                                <Link
                                    to="/auth"
                                    className="py-2 px-5 bg-gradient-to-r from-red-800 to-red-900 text-stone-200 rounded-md border border-red-700 hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-red-900/40 font-medium text-sm flex items-center"
                                >
                                    <span className="mr-1">⚔️</span> Вход
                                </Link>
                                <Link
                                    to="/register"
                                    className="py-2 px-5 bg-gradient-to-r from-gray-800 to-gray-900 text-red-400 rounded-md border border-red-800/50 hover:border-red-700 transition-all shadow-md hover:shadow-red-800/20 font-medium text-sm flex items-center"
                                >
                                    <span className="mr-1">📜</span> Регистрация
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
});

export default Header;
