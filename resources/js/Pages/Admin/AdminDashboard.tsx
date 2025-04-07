import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import axios from "../../config/axios";

interface Statistics {
    total_users: number;
    total_characters: number;
    total_locations: number;
    active_characters: number;
}

interface RecentUser {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

interface PopularLocation {
    id: number;
    name: string;
    description: string;
    danger_level: number;
    visitors_count: number;
}

interface DashboardData {
    statistics: Statistics;
    recent_users: RecentUser[];
    popular_locations: PopularLocation[];
}

const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
}> = ({ title, value, icon }) => (
    <div className="bg-gray-800 p-4 rounded-lg border border-red-900/30 shadow-md flex items-center">
        <div className="bg-red-900/20 rounded-full p-3 mr-4">{icon}</div>
        <div>
            <h3 className="text-gray-400 text-sm">{title}</h3>
            <p className="text-2xl font-medieval text-red-400">{value}</p>
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(
        null
    );
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await axios.get("/api/admin/dashboard");
                setDashboardData(response.data);
            } catch (err: any) {
                setError(
                    err.response?.data?.message || "Ошибка загрузки данных"
                );
                console.error("Ошибка загрузки данных дэшборда:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (isLoading) {
        return (
            <AdminLayout pageTitle="Панель управления">
                <div className="flex justify-center items-center h-64">
                    <div className="relative">
                        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-red-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-gray-900"></div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout pageTitle="Панель управления">
                <div className="bg-red-900/20 border border-red-900/30 p-4 rounded-md text-red-400">
                    {error}
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout pageTitle="Панель управления">
            {dashboardData && (
                <>
                    {/* Статистика */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            title="Пользователей"
                            value={dashboardData?.statistics?.total_users || 0}
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-red-400"
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
                            }
                        />
                        <StatCard
                            title="Персонажей"
                            value={
                                dashboardData?.statistics?.total_characters || 0
                            }
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-red-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Активных персонажей"
                            value={
                                dashboardData?.statistics?.active_characters ||
                                0
                            }
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-red-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Локаций"
                            value={
                                dashboardData?.statistics?.total_locations || 0
                            }
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-red-400"
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
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Последние зарегистрированные пользователи */}
                        <div className="bg-gray-800 rounded-lg border border-red-900/30 shadow-md">
                            <div className="p-4 border-b border-red-900/30">
                                <h2 className="text-xl font-medieval text-red-400">
                                    Новые пользователи
                                </h2>
                            </div>
                            <div className="p-4">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-400 uppercase">
                                                Имя
                                            </th>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-400 uppercase">
                                                Email
                                            </th>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-400 uppercase">
                                                Роль
                                            </th>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-400 uppercase">
                                                Дата регистрации
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {dashboardData?.recent_users?.map(
                                            (user) => (
                                                <tr key={user.id}>
                                                    <td className="px-4 py-3 text-gray-300">
                                                        {user.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-300">
                                                        {user.email}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs ${
                                                                user.role ===
                                                                "admin"
                                                                    ? "bg-red-900/30 text-red-300"
                                                                    : "bg-gray-700 text-gray-300"
                                                            }`}
                                                        >
                                                            {user.role ===
                                                            "admin"
                                                                ? "Администратор"
                                                                : "Пользователь"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-300">
                                                        {new Date(
                                                            user.created_at
                                                        ).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Популярные локации */}
                        <div className="bg-gray-800 rounded-lg border border-red-900/30 shadow-md">
                            <div className="p-4 border-b border-red-900/30">
                                <h2 className="text-xl font-medieval text-red-400">
                                    Популярные локации
                                </h2>
                            </div>
                            <div className="p-4">
                                <table className="min-w-full divide-y divide-gray-700">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-400 uppercase">
                                                Название
                                            </th>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-400 uppercase">
                                                Уровень опасности
                                            </th>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-400 uppercase">
                                                Посетителей
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {dashboardData?.popular_locations?.map(
                                            (location) => (
                                                <tr key={location.id}>
                                                    <td className="px-4 py-3 text-gray-300">
                                                        {location.name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center">
                                                            <span
                                                                className={`px-2 py-1 rounded-full text-xs ${
                                                                    location.danger_level >
                                                                    7
                                                                        ? "bg-red-900/30 text-red-300"
                                                                        : location.danger_level >
                                                                          4
                                                                        ? "bg-orange-900/30 text-orange-300"
                                                                        : "bg-green-900/30 text-green-300"
                                                                }`}
                                                            >
                                                                {
                                                                    location.danger_level
                                                                }
                                                                /10
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-300">
                                                        {
                                                            location.visitors_count
                                                        }
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    );
};

export default AdminDashboard;
