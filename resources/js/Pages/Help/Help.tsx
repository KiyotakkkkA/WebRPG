import React, { useState, useEffect } from "react";
import MainLayout from "../../Layouts/MainLayout";
import NavGroup from "../../Components/NavGroup";
import NavItem from "../../Components/NavItem";
import ModerationGuide from "./ModerationGuide";
import authStore from "../../stores/AuthStore";
import { observer } from "mobx-react-lite";

// Тип для секции справки
type HelpSection = {
    id: string;
    title: string;
    content: React.ReactNode;
    roles?: string[]; // Роли, которым доступна секция
};

const Help: React.FC = observer(() => {
    // Список всех разделов справки
    const helpSections: HelpSection[] = [
        {
            id: "moderation",
            title: "Руководство по модерации",
            content: <ModerationGuide />,
            roles: ["admin", "support"],
        },
        // В будущем сюда можно добавить дополнительные разделы
    ];

    // Получаем доступные для текущего пользователя разделы
    const getAvailableSections = () => {
        return helpSections.filter((section) => {
            // Если у секции нет ограничений по ролям, она доступна всем
            if (!section.roles || section.roles.length === 0) {
                return true;
            }

            // Для авторизованных пользователей проверяем роли
            if (authStore.isAuthenticated) {
                if (section.roles.includes("admin") && authStore.isAdmin) {
                    return true;
                }
                if (section.roles.includes("support") && authStore.isSupport) {
                    return true;
                }
            }

            return false;
        });
    };

    // Определяем, есть ли разделы для администраторов/модераторов
    const hasAdminSections = helpSections.some(
        (section) =>
            (section.roles?.includes("admin") && authStore.isAdmin) ||
            (section.roles?.includes("support") && authStore.isSupport)
    );

    // Состояние для отслеживания активного раздела
    const [activeSection, setActiveSection] = useState<string>("");

    // Обновляем активный раздел при изменении доступных разделов или загрузке данных аутентификации
    useEffect(() => {
        const availableSections = getAvailableSections();
        if (availableSections.length > 0 && activeSection === "") {
            setActiveSection(availableSections[0].id);
        }
    }, [authStore.isAuthenticated, authStore.isAdmin, authStore.isSupport]);

    // Получаем содержимое активного раздела
    const activeContent = helpSections.find(
        (section) => section.id === activeSection
    )?.content;

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
                    <div className="bg-gray-900/80 backdrop-blur-sm border border-red-900/30 rounded-lg shadow-xl">
                        <div className="flex flex-col lg:flex-row">
                            {/* Боковое меню */}
                            <div className="lg:w-1/4 p-6 border-r border-gray-800">
                                <h2 className="text-xl text-red-500 font-medieval mb-6 border-b border-red-900/30 pb-2">
                                    Справочный центр
                                </h2>

                                {/* Меню общего доступа */}
                                <NavGroup
                                    title="Общая информация"
                                    defaultOpen={true}
                                    icon={
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    }
                                >
                                    <div className="bg-gray-800/30 p-3 rounded-md text-gray-400 text-sm">
                                        Скоро здесь появятся полезные
                                        руководства и справочная информация по
                                        игре.
                                    </div>
                                </NavGroup>

                                {/* Состояние загрузки аутентификации */}
                                {authStore.isLoading && (
                                    <div className="mt-4 bg-gray-800/30 p-3 rounded-md text-gray-400 text-sm">
                                        <div className="flex items-center">
                                            <svg
                                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500"
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
                                            Загрузка информации о
                                            пользователе...
                                        </div>
                                    </div>
                                )}

                                {/* Меню для администраторов и поддержки */}
                                {!authStore.isLoading && hasAdminSections && (
                                    <NavGroup
                                        title="Администрирование"
                                        defaultOpen={true}
                                        icon={
                                            <svg
                                                className="w-5 h-5"
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
                                        }
                                    >
                                        {getAvailableSections()
                                            .filter(
                                                (section) =>
                                                    section.roles?.includes(
                                                        "admin"
                                                    ) ||
                                                    section.roles?.includes(
                                                        "support"
                                                    )
                                            )
                                            .map((section) => (
                                                <NavItem
                                                    key={section.id}
                                                    title={section.title}
                                                    active={
                                                        activeSection ===
                                                        section.id
                                                    }
                                                    onClick={() =>
                                                        setActiveSection(
                                                            section.id
                                                        )
                                                    }
                                                />
                                            ))}
                                    </NavGroup>
                                )}
                            </div>

                            {/* Основной контент */}
                            <div className="lg:w-3/4 p-6">
                                {activeContent ? (
                                    activeContent
                                ) : (
                                    <div className="text-center py-20 text-gray-400">
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
                                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                            />
                                        </svg>
                                        <p className="text-xl font-medieval">
                                            {authStore.isLoading
                                                ? "Загрузка данных..."
                                                : "Выберите раздел справки из меню слева"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
});

export default Help;
