import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";

// Определение типов для локаций
interface Location {
    id: number;
    name: string;
    description: string;
    image_url: string;
    danger_level: number;
    is_default: boolean;
    is_discoverable: boolean;
    position_x: number;
    position_y: number;
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

const createLocationAPI = async (formData: FormData) => {
    // Добавим CSRF-токен из meta-тега
    const token = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");

    // Настраиваем заголовки запроса
    const config = {
        headers: {
            "Content-Type": "multipart/form-data",
            "X-CSRF-TOKEN": token || "",
            Accept: "application/json",
        },
    };

    const response = await axios.post("/api/admin/locations", formData, config);
    return response.data;
};

const updateLocationAPI = async ({
    id,
    formData,
}: {
    id: number;
    formData: FormData;
}) => {
    // Добавим CSRF-токен из meta-тега
    const token = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");

    // Настраиваем заголовки запроса
    const config = {
        headers: {
            "Content-Type": "multipart/form-data",
            "X-CSRF-TOKEN": token || "",
            Accept: "application/json",
        },
    };

    const response = await axios.post(
        `/api/admin/locations/${id}?_method=PUT`,
        formData,
        config
    );
    return response.data;
};

const deleteLocationAPI = async (id: number) => {
    const response = await axios.delete(`/api/admin/locations/${id}`);
    return response.data;
};

const AdminLocations: React.FC = observer(() => {
    // Получаем state из навигации
    const location = useLocation();
    const { editLocationId } = location.state || {};

    // React Query клиент
    const queryClient = useQueryClient();

    // Состояния для управления интерфейсом (не связанные с данными API)
    const [showForm, setShowForm] = useState<boolean>(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(
        null
    );
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [locationToDelete, setLocationToDelete] = useState<number | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);

    // Используем React Query для загрузки локаций
    const {
        data: locations = [],
        isLoading,
        error: fetchError,
        refetch: refetchLocations,
    } = useQuery({
        queryKey: ["locations"],
        queryFn: fetchLocationsAPI,
        staleTime: 5 * 60 * 1000, // 5 минут кэширования
    });

    // Если передан ID для редактирования, находим локацию и открываем форму редактирования
    useEffect(() => {
        if (editLocationId && locations.length > 0) {
            const locationToEdit = locations.find(
                (loc: Location) => loc.id === editLocationId
            );
            if (locationToEdit) {
                setEditingLocation(locationToEdit);
                setShowForm(true);
            }
        }
    }, [editLocationId, locations]);

    // Обрабатываем ошибки запроса
    const fetchErrorMessage = fetchError
        ? (fetchError as any).response?.data?.message ||
          "Ошибка загрузки локаций"
        : null;

    // Устанавливаем сообщение об ошибке, если оно есть
    useEffect(() => {
        if (fetchErrorMessage) {
            setError(fetchErrorMessage);
        }
    }, [fetchErrorMessage]);

    // Мутация для создания локации
    const createLocationMutation = useMutation({
        mutationFn: createLocationAPI,
        onSuccess: () => {
            setSuccessMessage("Локация успешно создана");
            queryClient.invalidateQueries({ queryKey: ["locations"] });
            setShowForm(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
            console.error("Ошибка при создании локации:", error);
            setError(handleMutationError(error));
        },
    });

    // Мутация для обновления локации
    const updateLocationMutation = useMutation({
        mutationFn: updateLocationAPI,
        onSuccess: () => {
            setSuccessMessage("Локация успешно обновлена");
            queryClient.invalidateQueries({ queryKey: ["locations"] });
            setShowForm(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
            console.error("Ошибка при обновлении локации:", error);
            setError(handleMutationError(error));
        },
    });

    // Мутация для удаления локации
    const deleteLocationMutation = useMutation({
        mutationFn: deleteLocationAPI,
        onSuccess: () => {
            setSuccessMessage("Локация успешно удалена");
            queryClient.invalidateQueries({ queryKey: ["locations"] });
            setShowDeleteModal(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
            console.error("Ошибка при удалении локации:", error);
            setError(handleMutationError(error));
        },
    });

    // Обработчик ошибок для мутаций
    const handleMutationError = (error: any) => {
        if (error.response) {
            console.error("Статус ошибки:", error.response.status);
            console.error("Данные ошибки:", error.response.data);

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

    // Определяем общее состояние загрузки на основе всех мутаций
    const isMutating =
        createLocationMutation.isPending ||
        updateLocationMutation.isPending ||
        deleteLocationMutation.isPending;

    // Обработка добавления новой локации
    const handleAddLocation = () => {
        setEditingLocation(null);
        setShowForm(true);
    };

    // Обработка редактирования локации
    const handleEditLocation = (location: Location) => {
        setEditingLocation(location);
        setShowForm(true);
    };

    // Обработка сохранения локации
    const handleSaveLocation = async (formData: FormData) => {
        try {
            if (editingLocation) {
                updateLocationMutation.mutate({
                    id: editingLocation.id,
                    formData,
                });
            } else {
                createLocationMutation.mutate(formData);
            }
        } catch (err: any) {
            console.error("Ошибка при сохранении локации:", err);
        }
    };

    // Обработка удаления локации
    const handleDeleteLocation = async () => {
        if (!locationToDelete) return;
        deleteLocationMutation.mutate(locationToDelete);
    };

    // Компонент формы создания/редактирования локации
    const LocationForm = () => {
        const [name, setName] = useState(editingLocation?.name || "");
        const [description, setDescription] = useState(
            editingLocation?.description || ""
        );
        const [dangerLevel, setDangerLevel] = useState(
            editingLocation?.danger_level || 1
        );
        const [isDefault, setIsDefault] = useState(
            editingLocation?.is_default || false
        );
        const [isDiscoverable, setIsDiscoverable] = useState<boolean>(
            editingLocation?.is_discoverable !== undefined
                ? editingLocation.is_discoverable
                : true
        );
        const [positionX, setPositionX] = useState(
            editingLocation?.position_x || 0
        );
        const [positionY, setPositionY] = useState(
            editingLocation?.position_y || 0
        );
        const [imageFile, setImageFile] = useState<File | null>(null);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();

            // Проверка корректности данных
            if (!name.trim()) {
                setError("Название локации не может быть пустым");
                return;
            }

            if (!description.trim()) {
                setError("Описание локации не может быть пустым");
                return;
            }

            if (dangerLevel < 1 || dangerLevel > 10) {
                setError("Уровень опасности должен быть от 1 до 10");
                return;
            }

            const formData = new FormData();
            formData.append("name", name.trim());
            formData.append("description", description.trim());
            formData.append("danger_level", dangerLevel.toString());
            formData.append("is_default", isDefault.toString());
            formData.append("is_discoverable", isDiscoverable.toString());
            formData.append("position_x", positionX.toString());
            formData.append("position_y", positionY.toString());

            // Проверка для изображения
            if (imageFile) {
                // Проверяем тип файла
                const validImageTypes = [
                    "image/jpeg",
                    "image/png",
                    "image/jpg",
                    "image/webp",
                ];
                if (!validImageTypes.includes(imageFile.type)) {
                    setError(
                        "Пожалуйста, выберите изображение в формате JPEG, PNG или WEBP"
                    );
                    return;
                }

                // Проверяем размер файла (макс. 5MB)
                if (imageFile.size > 5 * 1024 * 1024) {
                    setError("Размер изображения не должен превышать 5MB");
                    return;
                }

                formData.append("image", imageFile);
            }

            // Если нет изображения и создаём новую локацию, добавляем предупреждение
            if (!imageFile && !editingLocation) {
                if (
                    !confirm(
                        "Вы не выбрали изображение для локации. Продолжить без изображения?"
                    )
                ) {
                    return;
                }
            }

            handleSaveLocation(formData);
        };

        const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
                setImageFile(e.target.files[0]);
            }
        };

        return (
            <div className="bg-gray-800 p-6 rounded-lg border border-red-900/30 shadow-md mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medieval text-red-400">
                        {editingLocation
                            ? "Редактирование локации"
                            : "Создание новой локации"}
                    </h3>
                    <div className="flex items-center">
                        {editingLocation && (
                            <div className="flex mr-4 space-x-2">
                                <Link
                                    to={`/admin/location-requirements?locationId=${editingLocation.id}`}
                                    className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 flex items-center text-sm transition-colors font-medium border border-gray-600 shadow-sm"
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
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                        />
                                    </svg>
                                    Требования
                                </Link>
                            </div>
                        )}
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
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="mb-4">
                        <label
                            htmlFor="name"
                            className="block text-gray-300 font-medieval mb-2"
                        >
                            НАЗВАНИЕ ЛОКАЦИИ
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-900 text-gray-300 border border-red-900/40 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="dangerLevel"
                                className="block text-gray-300 font-medieval mb-2"
                            >
                                УРОВЕНЬ ОПАСНОСТИ (1-10)
                            </label>
                            <input
                                type="number"
                                id="dangerLevel"
                                min="1"
                                max="10"
                                value={dangerLevel}
                                onChange={(e) =>
                                    setDangerLevel(parseInt(e.target.value))
                                }
                                className="w-full px-3 py-2 bg-gray-900 text-gray-300 border border-red-900/40 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="positionX"
                                className="block text-gray-300 font-medieval mb-2"
                            >
                                ПОЗИЦИЯ X
                            </label>
                            <input
                                type="number"
                                id="positionX"
                                value={positionX}
                                onChange={(e) =>
                                    setPositionX(parseInt(e.target.value))
                                }
                                className="w-full px-3 py-2 bg-gray-900 text-gray-300 border border-red-900/40 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                                required
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="positionY"
                                className="block text-gray-300 font-medieval mb-2"
                            >
                                ПОЗИЦИЯ Y
                            </label>
                            <input
                                type="number"
                                id="positionY"
                                value={positionY}
                                onChange={(e) =>
                                    setPositionY(parseInt(e.target.value))
                                }
                                className="w-full px-3 py-2 bg-gray-900 text-gray-300 border border-red-900/40 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={isDefault}
                                onChange={(e) => setIsDefault(e.target.checked)}
                                className="h-5 w-5 text-red-700 bg-gray-900 border-red-900/40 rounded focus:ring-red-700/50 focus:ring-offset-gray-900"
                            />
                            <label
                                htmlFor="isDefault"
                                className="ml-2 block text-gray-300 font-medieval"
                            >
                                ЛОКАЦИЯ ПО УМОЛЧАНИЮ
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isDiscoverable"
                                checked={isDiscoverable}
                                onChange={(e) =>
                                    setIsDiscoverable(e.target.checked)
                                }
                                className="h-5 w-5 text-red-700 bg-gray-900 border-red-900/40 rounded focus:ring-red-700/50 focus:ring-offset-gray-900"
                            />
                            <label
                                htmlFor="isDiscoverable"
                                className="ml-2 block text-gray-300 font-medieval"
                            >
                                МОЖНО ОБНАРУЖИТЬ
                            </label>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className="block text-gray-300 font-medieval mb-2"
                        >
                            ОПИСАНИЕ ЛОКАЦИИ
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 bg-gray-900 text-gray-300 border border-red-900/40 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                            required
                        ></textarea>
                    </div>

                    <div>
                        <label
                            htmlFor="imageUpload"
                            className="block text-gray-300 font-medieval mb-2"
                        >
                            ИЗОБРАЖЕНИЕ ЛОКАЦИИ
                        </label>
                        <div className="flex flex-col space-y-2">
                            <label
                                htmlFor="imageUpload"
                                className="cursor-pointer border border-red-900/40 bg-gray-900 hover:bg-red-900/20 transition duration-200 text-gray-300 py-2 px-4 rounded-md shadow-sm inline-flex items-center justify-center group"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-2 text-red-400 group-hover:text-red-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <span>ВЫБЕРИТЕ ФАЙЛ</span>
                                <span className="ml-2 text-gray-500 text-sm">
                                    {imageFile
                                        ? imageFile.name
                                        : "ФАЙЛ НЕ ВЫБРАН"}
                                </span>
                            </label>
                            <input
                                type="file"
                                id="imageUpload"
                                onChange={handleImageChange}
                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                className="hidden"
                            />
                        </div>
                        {imageFile && (
                            <div className="mt-4">
                                <span className="text-sm text-gray-400">
                                    Предпросмотр:
                                </span>
                                <div className="mt-2 border border-red-900/30 rounded-md overflow-hidden bg-gray-800 p-1">
                                    <img
                                        src={URL.createObjectURL(imageFile)}
                                        alt="Предпросмотр"
                                        className="max-h-60 object-contain mx-auto"
                                    />
                                </div>
                            </div>
                        )}
                        {editingLocation && !imageFile && (
                            <div className="mt-4">
                                <span className="text-sm text-gray-400">
                                    Текущее изображение:
                                </span>
                                <div className="mt-2 border border-red-900/30 rounded-md overflow-hidden bg-gray-800 p-1">
                                    <img
                                        src={getImageUrl(
                                            editingLocation.image_url
                                        )}
                                        alt="Текущее изображение"
                                        className="max-h-60 object-contain mx-auto"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditingLocation(null);
                            }}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md shadow-sm border border-gray-700"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-red-900/60 hover:bg-red-800 text-gray-200 rounded-md shadow-sm border border-red-900/70 flex items-center"
                            disabled={isMutating}
                        >
                            {isMutating ? (
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
                                    {editingLocation ? "Обновить" : "Создать"}{" "}
                                    локацию
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    return (
        <AdminLayout pageTitle="Управление локациями">
            <div className="mb-6 flex justify-between items-center">
                <button
                    onClick={handleAddLocation}
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
                    Добавить локацию
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
            {showForm && <LocationForm />}

            {/* Таблица локаций */}
            <div className="bg-gray-800 rounded-lg border border-red-900/30 shadow-md overflow-hidden">
                {isLoading && locations.length === 0 ? (
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
                                        Локация
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                        Опасность
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                        Статус
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                        Координаты
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                                        Действия
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {locations.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-4 text-center text-gray-400"
                                        >
                                            Локации не найдены. Создайте первую
                                            локацию!
                                        </td>
                                    </tr>
                                ) : (
                                    locations.map((location: Location) => (
                                        <tr
                                            key={location.id}
                                            className="hover:bg-gray-750"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <img
                                                        src={getImageUrl(
                                                            location.image_url ||
                                                                "/images/locations/default.jpg"
                                                        )}
                                                        alt={location.name}
                                                        className="w-12 h-8 object-cover rounded mr-3"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-gray-300">
                                                            {location.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                                                            {
                                                                location.description
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`
                                                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${
                                                        location.danger_level <=
                                                        3
                                                            ? "bg-green-900/20 text-green-400"
                                                            : location.danger_level <=
                                                              6
                                                            ? "bg-yellow-900/20 text-yellow-400"
                                                            : "bg-red-900/20 text-red-400"
                                                    }
                                                `}
                                                >
                                                    {location.danger_level} / 10
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col space-y-1">
                                                    {location.is_default && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/20 text-blue-400">
                                                            Стартовая
                                                        </span>
                                                    )}
                                                    {location.is_discoverable && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900/20 text-purple-400">
                                                            Обнаруживаемая
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-400">
                                                X: {location.position_x}, Y:{" "}
                                                {location.position_y}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm font-medium">
                                                <button
                                                    onClick={() =>
                                                        handleEditLocation(
                                                            location
                                                        )
                                                    }
                                                    className="text-indigo-400 hover:text-indigo-300 mr-3"
                                                >
                                                    Редактировать
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setLocationToDelete(
                                                            location.id
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
                                    ))
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
                            Вы уверены, что хотите удалить эту локацию? Это
                            действие нельзя отменить.
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleDeleteLocation}
                                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md"
                                disabled={isMutating}
                            >
                                {isMutating ? "Удаление..." : "Удалить"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
});

export default AdminLocations;
