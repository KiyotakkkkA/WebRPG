import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import axios from "axios";
import AdminLayout from "../AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Определение типов
interface Location {
    id: number;
    name: string;
    description: string;
    image_url: string;
    danger_level: number;
}

interface LocationConnection {
    id: number;
    from_location_id: number;
    to_location_id: number;
    is_bidirectional: boolean;
    travel_time: number;
    from_location?: Location;
    to_location?: Location;
}

// Вспомогательная функция для формирования правильного URL изображения
const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "";

    // Если путь уже начинается с http или https, оставляем как есть
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
    }

    // Если путь начинается с /, добавляем только origin
    if (imagePath.startsWith("/")) {
        return window.location.origin + imagePath;
    }

    // Иначе добавляем origin и /
    return window.location.origin + "/" + imagePath;
};

// API функции для React Query
const fetchLocationsAPI = async () => {
    const response = await axios.get("/api/admin/locations");
    return response.data;
};

const fetchConnectionsAPI = async () => {
    const response = await axios.get("/api/admin/location-connections");
    return response.data;
};

const createConnectionAPI = async (formData: any) => {
    const response = await axios.post(
        "/api/admin/location-connections",
        formData
    );
    return response.data;
};

const updateConnectionAPI = async ({
    id,
    formData,
}: {
    id: number;
    formData: any;
}) => {
    const response = await axios.put(
        `/api/admin/location-connections/${id}`,
        formData
    );
    return response.data;
};

const deleteConnectionAPI = async (id: number) => {
    const response = await axios.delete(
        `/api/admin/location-connections/${id}`
    );
    return response.data;
};

const AdminLocationConnections: React.FC = observer(() => {
    // React Query клиент
    const queryClient = useQueryClient();

    // Состояния для управления интерфейсом (не связанные с данными API)
    const [showForm, setShowForm] = useState<boolean>(false);
    const [editingConnection, setEditingConnection] =
        useState<LocationConnection | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [connectionToDelete, setConnectionToDelete] = useState<number | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);

    // Запрос на получение локаций
    const {
        data: locations = [],
        isLoading: isLocationsLoading,
        error: locationsError,
    } = useQuery({
        queryKey: ["locations"],
        queryFn: fetchLocationsAPI,
        staleTime: 5 * 60 * 1000, // 5 минут кэширования
    });

    // Запрос на получение соединений
    const {
        data: connections = [],
        isLoading: isConnectionsLoading,
        error: connectionsError,
    } = useQuery({
        queryKey: ["locationConnections"],
        queryFn: fetchConnectionsAPI,
        staleTime: 5 * 60 * 1000, // 5 минут кэширования
    });

    // Обрабатываем ошибки запросов
    useEffect(() => {
        const fetchErrorMessage = locationsError
            ? (locationsError as any).response?.data?.message ||
              "Ошибка загрузки локаций"
            : connectionsError
            ? (connectionsError as any).response?.data?.message ||
              "Ошибка загрузки соединений"
            : null;

        if (fetchErrorMessage) {
            setError(fetchErrorMessage);
        }
    }, [locationsError, connectionsError]);

    // Мутация для создания соединения
    const createConnectionMutation = useMutation({
        mutationFn: createConnectionAPI,
        onSuccess: () => {
            setSuccessMessage("Соединение успешно создано");
            queryClient.invalidateQueries({
                queryKey: ["locationConnections"],
            });
            setShowForm(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
            console.error("Ошибка при создании соединения:", error);
            setError(handleMutationError(error));
        },
    });

    // Мутация для обновления соединения
    const updateConnectionMutation = useMutation({
        mutationFn: updateConnectionAPI,
        onSuccess: () => {
            setSuccessMessage("Соединение успешно обновлено");
            queryClient.invalidateQueries({
                queryKey: ["locationConnections"],
            });
            setShowForm(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
            console.error("Ошибка при обновлении соединения:", error);
            setError(handleMutationError(error));
        },
    });

    // Мутация для удаления соединения
    const deleteConnectionMutation = useMutation({
        mutationFn: deleteConnectionAPI,
        onSuccess: () => {
            setSuccessMessage("Соединение успешно удалено");
            queryClient.invalidateQueries({
                queryKey: ["locationConnections"],
            });
            setShowDeleteModal(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
            console.error("Ошибка при удалении соединения:", error);
            setError(handleMutationError(error));
        },
    });

    // Обработчик ошибок для мутаций
    const handleMutationError = (error: any) => {
        if (error.response) {
            // Обработка ошибок валидации
            if (error.response.status === 422 && error.response.data.errors) {
                const validationErrors = Object.values(
                    error.response.data.errors
                )
                    .flat()
                    .join("\n");
                return `Ошибка валидации: ${validationErrors}`;
            } else {
                return (
                    error.response.data.message ||
                    "Ошибка при выполнении операции"
                );
            }
        } else {
            return "Ошибка соединения с сервером";
        }
    };

    // Определяем общее состояние загрузки
    const isLoading =
        isLocationsLoading ||
        isConnectionsLoading ||
        createConnectionMutation.isPending ||
        updateConnectionMutation.isPending ||
        deleteConnectionMutation.isPending;

    // Обработка добавления нового соединения
    const handleAddConnection = () => {
        setEditingConnection(null);
        setShowForm(true);
    };

    // Обработка редактирования соединения
    const handleEditConnection = (connection: LocationConnection) => {
        setEditingConnection(connection);
        setShowForm(true);
    };

    // Обработка сохранения соединения
    const handleSaveConnection = async (formData: any) => {
        try {
            if (editingConnection) {
                updateConnectionMutation.mutate({
                    id: editingConnection.id,
                    formData,
                });
            } else {
                createConnectionMutation.mutate(formData);
            }
        } catch (err: any) {
            console.error("Ошибка при сохранении соединения:", err);
        }
    };

    // Обработка удаления соединения
    const handleDeleteConnection = async () => {
        if (!connectionToDelete) return;
        deleteConnectionMutation.mutate(connectionToDelete);
    };

    // Компонент формы создания/редактирования соединения
    const ConnectionForm = () => {
        const [fromLocationId, setFromLocationId] = useState<number>(
            editingConnection?.from_location_id || 0
        );
        const [toLocationId, setToLocationId] = useState<number>(
            editingConnection?.to_location_id || 0
        );
        const [isBidirectional, setIsBidirectional] = useState<boolean>(
            editingConnection?.is_bidirectional || false
        );
        const [travelTime, setTravelTime] = useState<number>(
            editingConnection?.travel_time || 10
        );

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();

            // Проверка корректности данных
            if (fromLocationId === toLocationId) {
                setError("Начальная и конечная локации должны быть разными");
                return;
            }

            if (!fromLocationId || !toLocationId) {
                setError("Необходимо выбрать обе локации");
                return;
            }

            if (travelTime <= 0) {
                setError("Время перемещения должно быть положительным числом");
                return;
            }

            const formData = {
                from_location_id: fromLocationId,
                to_location_id: toLocationId,
                is_bidirectional: isBidirectional,
                travel_time: travelTime,
            };

            handleSaveConnection(formData);
        };

        return (
            <div className="bg-gray-800 p-6 rounded-lg border border-red-900/30 shadow-md mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medieval text-red-400">
                        {editingConnection
                            ? "Редактирование соединения"
                            : "Создание нового соединения"}
                    </h3>
                    <button
                        onClick={() => setShowForm(false)}
                        className="text-gray-400 hover:text-red-400"
                    >
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
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="fromLocation"
                                className="block text-gray-300 font-medieval mb-2"
                            >
                                ИСХОДНАЯ ЛОКАЦИЯ
                            </label>
                            <select
                                id="fromLocation"
                                value={fromLocationId}
                                onChange={(e) =>
                                    setFromLocationId(Number(e.target.value))
                                }
                                className="w-full px-3 py-2 bg-gray-900 text-gray-300 border border-red-900/40 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                                required
                            >
                                <option value="">-- Выберите локацию --</option>
                                {locations.map((location: Location) => (
                                    <option
                                        key={`from-${location.id}`}
                                        value={location.id}
                                    >
                                        {location.name} (Опасность:{" "}
                                        {location.danger_level})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="toLocation"
                                className="block text-gray-300 font-medieval mb-2"
                            >
                                ЦЕЛЕВАЯ ЛОКАЦИЯ
                            </label>
                            <select
                                id="toLocation"
                                value={toLocationId}
                                onChange={(e) =>
                                    setToLocationId(Number(e.target.value))
                                }
                                className="w-full px-3 py-2 bg-gray-900 text-gray-300 border border-red-900/40 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                                required
                            >
                                <option value="">-- Выберите локацию --</option>
                                {locations.map((location: Location) => (
                                    <option
                                        key={`to-${location.id}`}
                                        value={location.id}
                                    >
                                        {location.name} (Опасность:{" "}
                                        {location.danger_level})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="travelTime"
                                className="block text-gray-300 font-medieval mb-2"
                            >
                                ВРЕМЯ ПЕРЕМЕЩЕНИЯ (СЕКУНД)
                            </label>
                            <input
                                type="number"
                                id="travelTime"
                                value={travelTime}
                                onChange={(e) =>
                                    setTravelTime(Number(e.target.value))
                                }
                                min="1"
                                max="3600"
                                className="w-full px-3 py-2 bg-gray-900 text-gray-300 border border-red-900/40 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Базовое время в секундах для путешествия между
                                локациями. Скорость персонажа может снизить это
                                время.
                            </p>
                        </div>
                        <div className="flex items-center h-full">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isBidirectional"
                                    checked={isBidirectional}
                                    onChange={(e) =>
                                        setIsBidirectional(e.target.checked)
                                    }
                                    className="h-5 w-5 text-red-700 bg-gray-900 border-red-900/40 rounded focus:ring-red-700/50 focus:ring-offset-gray-900"
                                />
                                <label
                                    htmlFor="isBidirectional"
                                    className="ml-2 block text-gray-300 font-medieval"
                                >
                                    ДВУНАПРАВЛЕННОЕ СОЕДИНЕНИЕ
                                </label>
                            </div>
                            <div className="ml-2 text-xs text-gray-500">
                                Если включено, персонажи смогут перемещаться в
                                обоих направлениях
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditingConnection(null);
                            }}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md shadow-sm border border-gray-700"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-red-900/60 hover:bg-red-800 text-gray-200 rounded-md shadow-sm border border-red-900/70 flex items-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
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
                                    Сохранение...
                                </>
                            ) : (
                                <>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    {editingConnection ? "Обновить" : "Создать"}{" "}
                                    соединение
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    // Визуализация карты соединений (базовая версия)
    const ConnectionsMap = () => {
        if (connections.length === 0 || locations.length === 0) {
            return (
                <div className="bg-gray-800 p-4 rounded-lg border border-red-900/30 text-gray-400 text-center">
                    Нет соединений для отображения на карте
                </div>
            );
        }

        return (
            <div className="bg-gray-900 p-4 rounded-lg border border-red-900/30 mb-6 overflow-auto">
                <h3 className="text-lg font-medieval text-red-400 mb-4">
                    Карта соединений
                </h3>
                <div className="relative h-96 border border-red-900/20 bg-gray-800 rounded">
                    {/* Здесь будет реализована визуальная карта соединений */}
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        <p>
                            Расширенная визуализация карты будет добавлена в
                            следующем обновлении
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AdminLayout pageTitle="Соединения между локациями">
            <div className="mb-6 flex justify-between items-center">
                <button
                    onClick={handleAddConnection}
                    className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md flex items-center"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Добавить соединение
                </button>
            </div>

            {/* Сообщения */}
            {successMessage && (
                <div className="mb-4 p-4 bg-green-900/20 border border-green-900/40 text-green-400 rounded-md">
                    {successMessage}
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-900/20 border border-red-900/40 text-red-400 rounded-md">
                    {error}
                </div>
            )}

            {/* Форма */}
            {showForm && <ConnectionForm />}

            {/* Карта соединений (базовая версия) */}
            <ConnectionsMap />

            {/* Таблица соединений */}
            <div className="bg-gray-800 rounded-lg border border-red-900/30 shadow-md overflow-hidden">
                {isLoading && connections.length === 0 ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="h-8 w-8 animate-spin rounded-full border-t-4 border-red-600"></div>
                        <span className="ml-2 text-gray-400">Загрузка...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                        От локации
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                        К локации
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                        Тип соединения
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                        Время пути (сек)
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                                        Действия
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {connections.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-4 text-center text-gray-400"
                                        >
                                            Соединения не найдены. Создайте
                                            первое соединение между локациями!
                                        </td>
                                    </tr>
                                ) : (
                                    connections.map(
                                        (connection: LocationConnection) => (
                                            <tr
                                                key={connection.id}
                                                className="hover:bg-gray-750"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center">
                                                        {connection.from_location && (
                                                            <>
                                                                <img
                                                                    src={getImageUrl(
                                                                        connection
                                                                            .from_location
                                                                            .image_url ||
                                                                            "/images/locations/default.jpg"
                                                                    )}
                                                                    alt={
                                                                        connection
                                                                            .from_location
                                                                            .name
                                                                    }
                                                                    className="w-12 h-8 object-cover rounded mr-3"
                                                                />
                                                                <div className="font-medium text-gray-300">
                                                                    {
                                                                        connection
                                                                            .from_location
                                                                            .name
                                                                    }
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center">
                                                        {connection.to_location && (
                                                            <>
                                                                <img
                                                                    src={getImageUrl(
                                                                        connection
                                                                            .to_location
                                                                            .image_url ||
                                                                            "/images/locations/default.jpg"
                                                                    )}
                                                                    alt={
                                                                        connection
                                                                            .to_location
                                                                            .name
                                                                    }
                                                                    className="w-12 h-8 object-cover rounded mr-3"
                                                                />
                                                                <div className="font-medium text-gray-300">
                                                                    {
                                                                        connection
                                                                            .to_location
                                                                            .name
                                                                    }
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`
                                                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${
                                                        connection.is_bidirectional
                                                            ? "bg-green-900/20 text-green-400"
                                                            : "bg-yellow-900/20 text-yellow-400"
                                                    }
                                                `}
                                                    >
                                                        {connection.is_bidirectional
                                                            ? "Двунаправленное"
                                                            : "Однонаправленное"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-300">
                                                    {connection.travel_time} сек
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-medium">
                                                    <button
                                                        onClick={() =>
                                                            handleEditConnection(
                                                                connection
                                                            )
                                                        }
                                                        className="text-indigo-400 hover:text-indigo-300 mr-3"
                                                    >
                                                        Редактировать
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setConnectionToDelete(
                                                                connection.id
                                                            );
                                                            setShowDeleteModal(
                                                                true
                                                            );
                                                        }}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        Удалить
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Модальное окно подтверждения удаления */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-red-900/30">
                        <h3 className="text-lg font-medieval text-red-400 mb-4">
                            Подтверждение удаления
                        </h3>
                        <p className="text-gray-300 mb-6">
                            Вы уверены, что хотите удалить это соединение между
                            локациями? Это действие нельзя отменить.
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleDeleteConnection}
                                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md"
                                disabled={isLoading}
                            >
                                {isLoading ? "Удаление..." : "Удалить"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
});

export default AdminLocationConnections;
