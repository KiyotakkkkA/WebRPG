import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import authStore from "../stores/AuthStore";

interface SupportRouteProps {
    children: React.ReactNode;
}

const SupportRoute: React.FC<SupportRouteProps> = observer(({ children }) => {
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
                        Открываем систему поддержки...
                    </p>
                </div>
            </div>
        );
    }

    // Если пользователь не авторизован, перенаправляем на страницу входа
    if (!authStore.isAuthenticated) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Если пользователь не имеет прав доступа к системе поддержки, перенаправляем на главную
    if (!authStore.isSupportOrAdmin) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Если пользователь авторизован и имеет права доступа, отображаем защищенный контент
    return <>{children}</>;
});

export default SupportRoute;
