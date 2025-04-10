import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../Components/ui/Button";
import authStore from "../../stores/AuthStore";
import { observer } from "mobx-react-lite";

interface AdminLayoutProps {
    children: React.ReactNode;
    pageTitle: string;
}

interface MovementNavGroupProps {
    isSidebarOpen: boolean;
    isActive: (path: string) => boolean;
}

const MovementNavGroup: React.FC<MovementNavGroupProps> = ({
    isSidebarOpen,
    isActive,
}) => {
    const [isExpanded, setIsExpanded] = useState(
        isActive("/admin/locations") ||
            isActive("/admin/location-connections") ||
            isActive("/admin/location-requirements")
    );

    // Автоматически раскрывать меню, если пользователь находится на одной из страниц
    useEffect(() => {
        if (
            isActive("/admin/locations") ||
            isActive("/admin/location-connections") ||
            isActive("/admin/location-requirements")
        ) {
            setIsExpanded(true);
        }
    }, [isActive]);

    return (
        <li>
            <div
                className={`flex items-center p-2 rounded-md hover:bg-gray-700 cursor-pointer ${
                    isActive("/admin/locations") ||
                    isActive("/admin/location-connections") ||
                    isActive("/admin/location-requirements")
                        ? "bg-red-900/30 text-red-300"
                        : ""
                }`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                </svg>
                {isSidebarOpen && (
                    <div className="flex justify-between items-center w-full">
                        <span>Перемещение</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                            }`}
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
                    </div>
                )}
            </div>

            {isSidebarOpen && (
                <ul
                    className={`ml-8 border-l border-gray-700 pl-2 overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded
                            ? "max-h-96 opacity-100 mt-2 py-2 space-y-2"
                            : "max-h-0 opacity-0 mt-0 py-0 space-y-0"
                    }`}
                >
                    <li>
                        <Link
                            to="/admin/regions"
                            className={`flex items-center p-2 rounded-md ${
                                isActive("/admin/regions")
                                    ? "bg-red-900/30 text-red-300"
                                    : "hover:bg-gray-700"
                            }`}
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
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                            <span>Регионы</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/admin/locations"
                            className={`flex items-center p-2 rounded-md ${
                                isActive("/admin/locations")
                                    ? "bg-red-900/30 text-red-300"
                                    : "hover:bg-gray-700"
                            }`}
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
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                            <span>Локации</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/admin/location-connections"
                            className={`flex items-center p-2 rounded-md ${
                                isActive("/admin/location-connections")
                                    ? "bg-red-900/30 text-red-300"
                                    : "hover:bg-gray-700"
                            }`}
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
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"
                                />
                            </svg>
                            <span>Соединения</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/admin/location-requirements"
                            className={`flex items-center p-2 rounded-md ${
                                isActive("/admin/location-requirements")
                                    ? "bg-red-900/30 text-red-300"
                                    : "hover:bg-gray-700"
                            }`}
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
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                            </svg>
                            <span>Требования</span>
                        </Link>
                    </li>
                </ul>
            )}
        </li>
    );
};

const AdminLayout: React.FC<AdminLayoutProps> = observer(
    ({ children, pageTitle }) => {
        const location = useLocation();
        const navigate = useNavigate();
        const [isSidebarOpen, setIsSidebarOpen] = useState(true);

        const toggleSidebar = () => {
            setIsSidebarOpen(!isSidebarOpen);
        };

        const handleLogout = async () => {
            await authStore.logout();
            navigate("/");
        };

        const isActive = (path: string) => {
            return location.pathname === path;
        };

        return (
            <div className="min-h-screen bg-gray-900 text-gray-200 flex">
                {/* Боковая панель */}
                <div
                    className={`fixed inset-y-0 left-0 z-50 bg-gray-800 border-r border-red-900/30 transition-all transform ${
                        isSidebarOpen ? "w-64" : "w-16"
                    }`}
                >
                    <div className="p-4 flex items-center justify-between">
                        {isSidebarOpen ? (
                            <h1 className="text-xl font-medieval text-red-500">
                                Админ-панель
                            </h1>
                        ) : null}
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-md hover:bg-gray-700"
                        >
                            {isSidebarOpen ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
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
                            )}
                        </button>
                    </div>

                    <div className="p-2">
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/admin/dashboard"
                                    className={`flex items-center p-2 rounded-md ${
                                        isActive("/admin/dashboard")
                                            ? "bg-red-900/30 text-red-300"
                                            : "hover:bg-gray-700"
                                    }`}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                        />
                                    </svg>
                                    {isSidebarOpen && <span>Дэшборд</span>}
                                </Link>
                            </li>
                            <MovementNavGroup
                                isSidebarOpen={isSidebarOpen}
                                isActive={isActive}
                            />
                            <li>
                                <Link
                                    to="/"
                                    className="flex items-center p-2 rounded-md hover:bg-gray-700"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                                        />
                                    </svg>
                                    {isSidebarOpen && <span>К игре</span>}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Основной контент */}
                <div
                    className={`flex-1 ${
                        isSidebarOpen ? "ml-64" : "ml-16"
                    } transition-all`}
                >
                    {/* Верхняя панель */}
                    <header className="bg-gray-800 border-b border-red-900/30 p-4 flex justify-between items-center">
                        <h1 className="text-xl font-medieval text-red-400">
                            {pageTitle}
                        </h1>

                        <div className="flex items-center space-x-4">
                            <div className="text-sm">
                                <div className="text-gray-400">
                                    Пользователь:
                                </div>
                                <div className="text-white">
                                    {authStore.user?.name || "Администратор"}
                                </div>
                            </div>

                            <Button
                                variant="danger"
                                size="sm"
                                onClick={handleLogout}
                            >
                                Выйти
                            </Button>
                        </div>
                    </header>

                    {/* Содержимое страницы */}
                    <main className="p-6">{children}</main>
                </div>
            </div>
        );
    }
);

export default AdminLayout;
