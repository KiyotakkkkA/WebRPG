import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import authStore from "../stores/AuthStore";

interface AdminRouteProps {
    children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = observer(({ children }) => {
    const location = useLocation();

    // Если состояние аутентификации загружается, показываем индикатор загрузки
    if (authStore.isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900">
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-red-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-gray-900"></div>
                        </div>
                    </div>
                    <p className="mt-4 text-xl font-medieval text-red-600">
                        Открываем врата админ-панели...
                    </p>
                </div>
            </div>
        );
    }

    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (!authStore.isAuthenticated) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Если пользователь не является администратором, перенаправляем на главную
    if (!authStore.isAdmin) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Если пользователь авторизован и является администратором, отображаем защищенный контент
    return <>{children}</>;
});

export default AdminRoute;
