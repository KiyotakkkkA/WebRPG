import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { Link } from "react-router-dom";
import MainLayout from "../../Layouts/MainLayout";
import authStore from "../../stores/AuthStore";

// Расширяем интерфейс User для нашего компонента
interface ExtendedUser {
    id: number;
    name: string;
    email: string;
    role: string;
    is_root?: boolean;
    max_characters?: number;
}

// Компонент для раздела профиля
const ProfileSection = ({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) => (
    <div className="mb-8">
        <h2 className="text-xl text-red-500 font-medieval mb-4 border-b border-red-900/30 pb-2">
            {title}
        </h2>
        <div className="space-y-4 text-gray-300">{children}</div>
    </div>
);

// Компонент для отображения информации о пользователе
const UserInfoItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col md:flex-row md:items-center py-2 border-b border-gray-800/50">
        <div className="w-full md:w-1/3 font-medium text-gray-400">{label}</div>
        <div className="w-full md:w-2/3 text-gray-300">{value}</div>
    </div>
);

const Profile: React.FC = observer(() => {
    // Получаем данные о пользователе из authStore
    const { user, isLoading } = authStore;
    // Приводим user к расширенному типу для доступа к max_characters
    const extendedUser = user as ExtendedUser | null;

    // Определяем роль пользователя для отображения на странице
    const getUserRole = (role: string, isRoot?: boolean): string => {
        if (role === "admin" && isRoot) {
            return "Главный администратор";
        }

        switch (role) {
            case "admin":
                return "Администратор";
            case "support":
                return "Сотрудник поддержки";
            default:
                return "Пользователь";
        }
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
                        <h1 className="text-2xl text-red-500 font-medieval mb-6 text-center">
                            Личный кабинет
                        </h1>

                        {isLoading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                                <span className="ml-3 text-red-500">
                                    Загрузка данных...
                                </span>
                            </div>
                        ) : extendedUser ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Левая колонка - аватар и основная информация */}
                                <div className="md:col-span-1">
                                    <div className="bg-gray-800/50 rounded-lg p-6 border border-red-900/20 shadow-inner">
                                        <div className="flex justify-center mb-4">
                                            <div className="relative">
                                                <div className="absolute -inset-1 bg-red-700/30 rounded-full blur-sm"></div>
                                                <div className="w-32 h-32 rounded-full bg-gray-700 border-2 border-red-900/50 overflow-hidden relative flex items-center justify-center text-5xl text-gray-300 font-medieval">
                                                    {extendedUser.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <h2 className="text-xl font-medieval text-red-400">
                                                {extendedUser.name}
                                            </h2>
                                            <p className="text-gray-400 mt-1">
                                                {getUserRole(
                                                    extendedUser.role,
                                                    extendedUser.is_root
                                                )}
                                            </p>
                                            <div className="mt-4 text-sm text-gray-500">
                                                ID: {extendedUser.id}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ссылки профиля */}
                                    <div className="mt-4 space-y-2">
                                        <Link
                                            to="/profile/messages"
                                            className="flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-lg border border-red-900/20 text-gray-300 transition-colors"
                                        >
                                            <span className="flex items-center">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 mr-2 text-red-500"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                                    />
                                                </svg>
                                                Мои обращения в поддержку
                                            </span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>

                                {/* Правая колонка - детальная информация */}
                                <div className="md:col-span-2">
                                    <ProfileSection title="Информация об аккаунте">
                                        <div className="bg-gray-800/30 rounded-lg p-4">
                                            <UserInfoItem
                                                label="Имя пользователя"
                                                value={extendedUser.name}
                                            />
                                            <UserInfoItem
                                                label="Email"
                                                value={extendedUser.email}
                                            />
                                            <UserInfoItem
                                                label="Роль"
                                                value={getUserRole(
                                                    extendedUser.role,
                                                    extendedUser.is_root
                                                )}
                                            />
                                            <UserInfoItem
                                                label="Максимум персонажей"
                                                value={
                                                    extendedUser.max_characters?.toString() ||
                                                    "3"
                                                }
                                            />
                                        </div>
                                    </ProfileSection>

                                    <ProfileSection title="Безопасность">
                                        <div className="bg-gray-800/30 rounded-lg p-4">
                                            <p className="text-gray-400 text-sm mb-4">
                                                Для смены пароля обратитесь в
                                                службу поддержки через форму
                                                обратной связи.
                                            </p>
                                            <div className="flex justify-end">
                                                <Link
                                                    to="/support"
                                                    className="px-4 py-2 bg-red-900/80 hover:bg-red-800 text-white rounded-md shadow-md transition-colors flex items-center"
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
                                                            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
                                                        />
                                                    </svg>
                                                    Служба поддержки
                                                </Link>
                                            </div>
                                        </div>
                                    </ProfileSection>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <div className="text-red-500 text-xl">
                                    Не удалось загрузить данные профиля
                                </div>
                                <p className="text-gray-400 mt-2">
                                    Пожалуйста, авторизуйтесь или обновите
                                    страницу
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
});

export default Profile;
