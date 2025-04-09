import React, { useState } from "react";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import authStore from "../stores/AuthStore";
import Button from "../Components/ui/Button";

const Header: React.FC = observer(() => {
    const [showAdminMenu, setShowAdminMenu] = useState(false);

    const handleLogout = async () => {
        await authStore.logout();
    };

    // Функция для переключения меню админа
    const toggleAdminMenu = () => {
        setShowAdminMenu((prev) => !prev);
    };

    // Закрытие меню при клике вне его
    const closeAdminMenu = () => {
        setShowAdminMenu(false);
    };

    // Обработчик для закрытия меню при потере фокуса
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest(".admin-menu-container")) {
                closeAdminMenu();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
                            <li>
                                <Link
                                    to="/help"
                                    className="py-2 px-3 hover:text-red-400 transition-colors duration-200 relative group flex items-center"
                                >
                                    <span className="absolute -left-1 h-6 w-0.5 bg-red-700/50 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></span>
                                    Помощь
                                    <span className="absolute -right-1 h-6 w-0.5 bg-red-700/50 transform scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom"></span>
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    {/* Кнопки авторизации или выхода */}
                    <div className="flex items-center space-x-3">
                        {!authStore.isAuthenticated && (
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

                        {/* Шестерёнка доступна только для авторизованных пользователей */}
                        {authStore.isAuthenticated && (
                            <div className="relative admin-menu-container ml-4">
                                <button
                                    onClick={toggleAdminMenu}
                                    className="p-2 text-red-400 hover:text-red-300 transition-colors duration-200 relative flex items-center justify-center"
                                >
                                    <div className="absolute -inset-1 bg-gray-800/70 rounded-full blur-[1px] animate-pulse"></div>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-7 w-7 relative transition-transform duration-300 ${
                                            showAdminMenu ? "rotate-90" : ""
                                        }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                </button>

                                {/* Выпадающее меню */}
                                {showAdminMenu && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-900 border border-red-900/30 z-50 overflow-hidden">
                                        <div className="py-1">
                                            {/* Личный кабинет - доступен всем авторизованным пользователям */}
                                            <Link
                                                to="/profile"
                                                className="flex items-center px-4 py-2 text-sm text-stone-300 hover:bg-gray-800 hover:text-red-400"
                                                onClick={closeAdminMenu}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 mr-2"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                    />
                                                </svg>
                                                Личный кабинет
                                            </Link>

                                            {/* Админские функции - только для админов */}
                                            {authStore.isAdmin && (
                                                <Link
                                                    to="/admin/dashboard"
                                                    className="flex items-center px-4 py-2 text-sm text-stone-300 hover:bg-gray-800 hover:text-red-400"
                                                    onClick={closeAdminMenu}
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-4 w-4 mr-2"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4 6h16M4 12h16m-7 6h7"
                                                        />
                                                    </svg>
                                                    Админ-панель
                                                </Link>
                                            )}

                                            {/* Функции поддержки - для админов и поддержки */}
                                            {(authStore.isAdmin ||
                                                authStore.isSupport) && (
                                                <Link
                                                    to="/support-admin"
                                                    className="flex items-center px-4 py-2 text-sm text-stone-300 hover:bg-gray-800 hover:text-red-400"
                                                    onClick={closeAdminMenu}
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-4 w-4 mr-2"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                                                        />
                                                    </svg>
                                                    Панель поддержки
                                                </Link>
                                            )}

                                            {/* Разделительная линия */}
                                            <div className="border-t border-gray-800 my-1"></div>

                                            {/* Кнопка выхода - для всех авторизованных */}
                                            <button
                                                onClick={() => {
                                                    closeAdminMenu();
                                                    handleLogout();
                                                }}
                                                className="w-full text-left flex items-center px-4 py-2 text-sm text-stone-300 hover:bg-gray-800 hover:text-red-400"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 mr-2"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                    />
                                                </svg>
                                                Выйти
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
});

export default Header;
