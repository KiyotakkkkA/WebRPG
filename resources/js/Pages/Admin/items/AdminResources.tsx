import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import axios from "../../../config/axios";
import AdminLayout from "../AdminLayout";
import { styling } from "../../../utils/methods";
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
} from "@tanstack/react-query";

// Компоненты UI
import Spinner from "../../../Components/ui/Spinner";
import Modal from "../../../Components/ui/Modal";
import Alert from "../../../Components/ui/Alert";
import LocationAutocomplete from "../../../Components/ui/autocomplete/LocationAutocomplete";
import ElementAutocomplete from "../../../Components/ui/autocomplete/ElementAutocomplete";

// API функции для работы с ресурсами
const resourcesApi = {
    // Получение списка ресурсов, элементов и локаций
    getResources: async (): Promise<ResourcesApiResponse> => {
        try {
            const response = await axios.get("/api/admin/resources");

            // Убедимся, что поля имеют значения по умолчанию
            const data: ResourcesApiResponse = {
                resources: response.data.resources || [],
                elements: response.data.elements || [],
                locations: response.data.locations || [],
            };

            return data;
        } catch (error) {
            console.error("Error fetching resources:", error);
            throw error;
        }
    },

    // Получение одного ресурса по ID
    getResource: async (id: number) => {
        const response = await axios.get(`/api/admin/resources/${id}`);
        return response.data;
    },

    // Создание нового ресурса
    createResource: async (resourceData: any) => {
        // Если resourceData содержит file, нужно использовать FormData
        if (resourceData.image instanceof File) {
            const formData = new FormData();

            // Добавляем все обычные поля
            Object.keys(resourceData).forEach((key) => {
                if (key !== "image" && key !== "locations") {
                    // Специальная обработка для массивов
                    if (Array.isArray(resourceData[key])) {
                        resourceData[key].forEach(
                            (value: any, index: number) => {
                                formData.append(`${key}[${index}]`, value);
                            }
                        );
                    } else {
                        formData.append(key, String(resourceData[key]));
                    }
                }
            });

            // Добавляем изображение
            formData.append("image", resourceData.image);

            // Обрабатываем настройки локаций
            if (resourceData.locations) {
                resourceData.locations.forEach((location: any) => {
                    formData.append("location_ids[]", String(location.id));
                    formData.append(
                        `spawn_chance[${location.id}]`,
                        String(location.spawn_chance)
                    );
                    formData.append(
                        `min_amount[${location.id}]`,
                        String(location.min_amount)
                    );
                    formData.append(
                        `max_amount[${location.id}]`,
                        String(location.max_amount)
                    );
                });
            }

            const response = await axios.post("/api/admin/resources", formData);
            return response.data;
        } else {
            // Если нет файла, отправляем JSON, но преобразуем формат локаций для сервера
            const dataToSend = { ...resourceData };

            // Удаляем поле locations и создаем поля в формате, который ожидает сервер
            if (dataToSend.locations && dataToSend.locations.length > 0) {
                // Формируем массив location_ids
                dataToSend.location_ids = dataToSend.locations.map(
                    (loc: any) => loc.id
                );

                // Формируем объекты настроек
                dataToSend.spawn_chance = {};
                dataToSend.min_amount = {};
                dataToSend.max_amount = {};

                dataToSend.locations.forEach((location: any) => {
                    dataToSend.spawn_chance[location.id] =
                        location.spawn_chance;
                    dataToSend.min_amount[location.id] = location.min_amount;
                    dataToSend.max_amount[location.id] = location.max_amount;
                });
            }

            // Удаляем оригинальное поле locations
            delete dataToSend.locations;

            const response = await axios.post(
                "/api/admin/resources",
                dataToSend
            );
            return response.data;
        }
    },

    // Обновление существующего ресурса
    updateResource: async ({ id, data }: { id: number; data: any }) => {
        // Если data содержит file, нужно использовать FormData
        if (data.image instanceof File) {
            const formData = new FormData();

            // Добавляем все обычные поля
            Object.keys(data).forEach((key) => {
                if (key !== "image" && key !== "locations") {
                    // Специальная обработка для массивов
                    if (Array.isArray(data[key])) {
                        data[key].forEach((value: any, index: number) => {
                            formData.append(`${key}[${index}]`, value);
                        });
                    } else {
                        formData.append(key, String(data[key]));
                    }
                }
            });

            // Добавляем изображение
            formData.append("image", data.image);

            // Обрабатываем настройки локаций
            if (data.locations) {
                data.locations.forEach((location: any) => {
                    formData.append("location_ids[]", String(location.id));
                    formData.append(
                        `spawn_chance[${location.id}]`,
                        String(location.spawn_chance)
                    );
                    formData.append(
                        `min_amount[${location.id}]`,
                        String(location.min_amount)
                    );
                    formData.append(
                        `max_amount[${location.id}]`,
                        String(location.max_amount)
                    );
                });
            }

            const response = await axios.put(
                `/api/admin/resources/${id}`,
                formData
            );
            return response.data;
        } else {
            // Если нет файла, отправляем JSON, но преобразуем формат локаций для сервера
            const dataToSend = { ...data };

            // Удаляем поле locations и создаем поля в формате, который ожидает сервер
            if (dataToSend.locations && dataToSend.locations.length > 0) {
                // Формируем массив location_ids
                dataToSend.location_ids = dataToSend.locations.map(
                    (loc: any) => loc.id
                );

                // Формируем объекты настроек
                dataToSend.spawn_chance = {};
                dataToSend.min_amount = {};
                dataToSend.max_amount = {};

                dataToSend.locations.forEach((location: any) => {
                    dataToSend.spawn_chance[location.id] =
                        location.spawn_chance;
                    dataToSend.min_amount[location.id] = location.min_amount;
                    dataToSend.max_amount[location.id] = location.max_amount;
                });
            }

            // Удаляем оригинальное поле locations
            delete dataToSend.locations;

            const response = await axios.put(
                `/api/admin/resources/${id}`,
                dataToSend
            );
            return response.data;
        }
    },

    // Удаление ресурса
    deleteResource: async (id: number) => {
        const response = await axios.delete(`/api/admin/resources/${id}`);
        return response.data;
    },
};

// Интерфейс для ответа API
interface ResourcesApiResponse {
    resources: Resource[];
    elements: Element[];
    locations: Location[];
}

// Типы данных
interface Resource {
    id: number;
    name: string;
    description: string;
    icon: string;
    image_url: string | null;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
    element_combination: string[];
    base_gathering_time: number;
    is_active: boolean;
    properties: any;
    locations: Location[];
}

interface Location {
    id: number;
    name: string;
    pivot?: {
        spawn_chance: number;
        min_amount: number;
        max_amount: number;
    };
}

interface Element {
    id: number;
    name: string;
    icon: string;
    color: string;
    description: string | null;
    is_active: boolean;
}

// Определяем интерфейс для состояния формы ресурса
interface ResourceFormState {
    id?: number;
    name: string;
    description: string;
    icon: string;
    image_url: string;
    image?: File | null;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
    element_combination: string[];
    base_gathering_time: number;
    is_active: boolean;
    locations: {
        id: number;
        spawn_chance: number;
        min_amount: number;
        max_amount: number;
    }[];
}

// Главный компонент
const AdminResources = observer(() => {
    const queryClient = useQueryClient();

    // Состояния интерфейса
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [selectedResourceForLocations, setSelectedResourceForLocations] =
        useState<Resource | null>(null);

    // Состояния для создания/редактирования ресурса
    const [showResourceForm, setShowResourceForm] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(
        null
    );

    // Обновленное состояние формы ресурса
    const [formResource, setFormResource] = useState<ResourceFormState>({
        name: "",
        description: "",
        icon: "",
        image_url: "",
        image: null,
        rarity: "common",
        element_combination: [],
        base_gathering_time: 3000,
        is_active: true,
        locations: [],
    });

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>(
        []
    );
    const [locationSettings, setLocationSettings] = useState<{
        [locationId: number]: {
            spawn_chance: number;
            min_amount: number;
            max_amount: number;
        };
    }>({});

    // Состояния для модальных окон
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<number | null>(
        null
    );

    // Запрос на получение данных с помощью React Query
    const {
        data,
        isLoading: isLoadingResources,
        error: queryError,
    } = useQuery<ResourcesApiResponse>({
        queryKey: ["admin-resources"],
        queryFn: resourcesApi.getResources,
        staleTime: 1000 * 60 * 5, // кэш на 5 минут
    });

    // Реагируем на ошибку запроса, если она возникла
    useEffect(() => {
        if (queryError) {
            handleQueryError(queryError as Error);
        }
    }, [queryError]);

    // Деструктуризация данных после загрузки
    const resources = data?.resources || [];
    const elements = data?.elements || [];
    const locations = data?.locations || [];

    // Обработка ошибок при загрузке данных
    const handleQueryError = (err: Error) => {
        console.error("Query error details:", err);

        // Пытаемся извлечь максимум информации об ошибке
        const errorResponse = (err as any).response;
        if (errorResponse) {
            console.error("API Error Response:", {
                status: errorResponse.status,
                statusText: errorResponse.statusText,
                data: errorResponse.data,
            });
        }

        setError(
            (err as any).response?.data?.message ||
                "Произошла ошибка при загрузке данных"
        );
    };

    // Мутация для создания ресурса
    const createResourceMutation = useMutation({
        mutationFn: resourcesApi.createResource,
        onSuccess: () => {
            setSuccessMessage("Ресурс успешно создан");
            setShowResourceForm(false);
            queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
        },
        onError: (err: any) => {
            setError(
                err.response?.data?.message ||
                    "Произошла ошибка при создании ресурса"
            );
        },
    });

    // Мутация для обновления ресурса
    const updateResourceMutation = useMutation({
        mutationFn: resourcesApi.updateResource,
        onSuccess: () => {
            setSuccessMessage("Ресурс успешно обновлен");
            setShowResourceForm(false);
            queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
        },
        onError: (err: any) => {
            setError(
                err.response?.data?.message ||
                    "Произошла ошибка при обновлении ресурса"
            );
        },
    });

    // Мутация для удаления ресурса
    const deleteResourceMutation = useMutation({
        mutationFn: resourcesApi.deleteResource,
        onSuccess: () => {
            setSuccessMessage("Ресурс успешно удален");
            setShowDeleteModal(false);
            setResourceToDelete(null);
            queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
        },
        onError: (err: any) => {
            setError(
                err.response?.data?.message ||
                    "Произошла ошибка при удалении ресурса"
            );
        },
    });

    // Определяем общее состояние загрузки для мутаций
    const isMutationLoading =
        createResourceMutation.isPending ||
        updateResourceMutation.isPending ||
        deleteResourceMutation.isPending;

    // Общее состояние загрузки
    const isLoading = isLoadingResources || isMutationLoading;

    // Обработчики для создания/редактирования ресурса
    const handleCreateResource = () => {
        setEditingResource(null);
        setFormResource({
            name: "",
            description: "",
            icon: "",
            image_url: "",
            image: null,
            rarity: "common",
            element_combination: [],
            base_gathering_time: 3000,
            is_active: true,
            locations: [],
        });
        setImagePreview(null);
        setSelectedLocationIds([]);
        setLocationSettings({});
        setShowResourceForm(true);
    };

    const handleEditResource = (resource: Resource) => {
        setEditingResource(resource);

        // Создаем список локаций с настройками
        const resourceLocations = resource.locations.map((loc) => ({
            id: loc.id,
            spawn_chance: loc.pivot?.spawn_chance || 0.5,
            min_amount: loc.pivot?.min_amount || 1,
            max_amount: loc.pivot?.max_amount || 3,
        }));

        setFormResource({
            id: resource.id,
            name: resource.name,
            description: resource.description,
            icon: resource.icon,
            image_url: resource.image_url || "",
            image: null,
            rarity: resource.rarity,
            element_combination: resource.element_combination,
            base_gathering_time: resource.base_gathering_time,
            is_active: resource.is_active,
            locations: resourceLocations,
        });

        // Устанавливаем превью изображения, если оно есть
        setImagePreview(resource.image_url);

        // Устанавливаем выбранные локации и их настройки для обратной совместимости
        const locationIds = resource.locations.map((loc) => loc.id);
        setSelectedLocationIds(locationIds);

        const settings: {
            [locationId: number]: {
                spawn_chance: number;
                min_amount: number;
                max_amount: number;
            };
        } = {};

        resource.locations.forEach((loc) => {
            if (loc.pivot) {
                settings[loc.id] = {
                    spawn_chance: loc.pivot.spawn_chance,
                    min_amount: loc.pivot.min_amount,
                    max_amount: loc.pivot.max_amount,
                };
            }
        });

        setLocationSettings(settings);
        setShowResourceForm(true);
    };

    // Обработка изменений в форме ресурса
    const handleFormChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value, type } = e.target;
        setFormResource((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? (e.target as HTMLInputElement).checked
                    : value,
        }));
    };

    // Обработка изменения редкости
    const handleRarityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as
            | "common"
            | "uncommon"
            | "rare"
            | "epic"
            | "legendary";
        setFormResource((prev) => ({
            ...prev,
            rarity: value,
        }));
    };

    // Обработка выбора элемента
    const handleElementToggle = (elementId: number) => {
        const elementIdStr = String(elementId);
        setFormResource((prev) => {
            const currentElements = [...prev.element_combination];
            const elementIndex = currentElements.indexOf(elementIdStr);

            if (elementIndex === -1) {
                // Добавляем элемент, если его нет
                return {
                    ...prev,
                    element_combination: [...currentElements, elementIdStr],
                };
            } else {
                // Удаляем элемент, если он уже выбран
                currentElements.splice(elementIndex, 1);
                return {
                    ...prev,
                    element_combination: currentElements,
                };
            }
        });
    };

    // Получение ID выбранных элементов
    const getSelectedElementIds = (): number[] => {
        return formResource.element_combination
            .map((id) => Number(id))
            .filter((id) => !isNaN(id));
    };

    // Обработка выбора локации
    const handleLocationToggle = (locationId: number) => {
        setFormResource((prev) => {
            // Проверяем, есть ли уже эта локация в списке
            const locationIndex = prev.locations.findIndex(
                (loc) => loc.id === locationId
            );

            if (locationIndex === -1) {
                // Добавляем локацию, если её нет
                return {
                    ...prev,
                    locations: [
                        ...prev.locations,
                        {
                            id: locationId,
                            spawn_chance: 0.5,
                            min_amount: 1,
                            max_amount: 3,
                        },
                    ],
                };
            } else {
                // Удаляем локацию, если она уже выбрана
                const updatedLocations = [...prev.locations];
                updatedLocations.splice(locationIndex, 1);
                return {
                    ...prev,
                    locations: updatedLocations,
                };
            }
        });

        // Для обратной совместимости обновляем и старые состояния
        setSelectedLocationIds((prev) => {
            const index = prev.indexOf(locationId);
            if (index === -1) {
                return [...prev, locationId];
            } else {
                const newIds = [...prev];
                newIds.splice(index, 1);
                return newIds;
            }
        });
    };

    // Обработка изменения настроек локации
    const handleLocationSettingChange = (
        locationId: number,
        setting: string,
        value: string | number
    ) => {
        // Обновляем настройку в новой структуре состояния
        setFormResource((prev) => {
            const updatedLocations = prev.locations.map((loc) => {
                if (loc.id === locationId) {
                    return {
                        ...loc,
                        [setting]:
                            typeof value === "string"
                                ? parseFloat(value)
                                : value,
                    };
                }
                return loc;
            });

            return {
                ...prev,
                locations: updatedLocations,
            };
        });

        // Для обратной совместимости обновляем и старое состояние
        const numValue = typeof value === "string" ? parseFloat(value) : value;
        setLocationSettings((prev) => ({
            ...prev,
            [locationId]: {
                ...prev[locationId],
                [setting]: numValue,
            },
        }));
    };

    // Обработка выбора изображения
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (file) {
            // Сохраняем файл в состоянии
            setFormResource((prev) => ({
                ...prev,
                image: file,
                // Оставляем image_url пустым, чтобы использовать новый файл
                image_url: "",
            }));

            // Создаем превью изображения
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Функция сохранения ресурса
    const handleSaveResource = async () => {
        setError(null);

        try {
            if (editingResource) {
                // Обновление существующего ресурса
                updateResourceMutation.mutate({
                    id: editingResource.id,
                    data: formResource,
                });
            } else {
                // Создание нового ресурса
                createResourceMutation.mutate(formResource);
            }
        } catch (err: any) {
            setError("Произошла ошибка при подготовке данных формы");
            console.error("Ошибка при подготовке данных формы:", err);
        }
    };

    // Открытие модального окна подтверждения удаления ресурса
    const handleDeleteResource = (resourceId: number) => {
        setResourceToDelete(resourceId);
        setShowDeleteModal(true);
    };

    // Удаление ресурса
    const confirmDelete = () => {
        if (resourceToDelete === null) return;
        deleteResourceMutation.mutate(resourceToDelete);
    };

    // Вспомогательные функции для отображения
    const getRarityName = (rarity: string) => {
        switch (rarity) {
            case "common":
                return "ОБЫЧНЫЙ";
            case "uncommon":
                return "НЕОБЫЧНЫЙ";
            case "rare":
                return "РЕДКИЙ";
            case "epic":
                return "ЭПИЧЕСКИЙ";
            case "legendary":
                return "ЛЕГЕНДАРНЫЙ";
            default:
                return "НЕИЗВЕСТНО";
        }
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case "common":
                return "bg-gray-700 text-gray-200";
            case "uncommon":
                return "bg-green-700 text-green-200";
            case "rare":
                return "bg-blue-700 text-blue-200";
            case "epic":
                return "bg-purple-700 text-purple-200";
            case "legendary":
                return "bg-yellow-700 text-yellow-200";
            default:
                return "bg-gray-700 text-gray-200";
        }
    };

    return (
        <AdminLayout pageTitle="Управление ресурсами">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex justify-between items-center">
                    <button
                        onClick={handleCreateResource}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                    >
                        ДОБАВИТЬ РЕСУРС
                    </button>
                </div>

                {error && (
                    <Alert type="error" message={error} className="mb-4" />
                )}

                {successMessage && (
                    <Alert
                        type="success"
                        message={successMessage}
                        className="mb-4"
                    />
                )}

                {/* Форма создания/редактирования ресурса */}
                {showResourceForm && (
                    <div className="bg-gray-800 rounded-lg border border-gray-700 mb-6 animate-fadeIn">
                        <div className="flex justify-between items-center p-4 border-b border-gray-700">
                            <h2 className="text-lg font-medieval text-red-400">
                                {editingResource
                                    ? "РЕДАКТИРОВАНИЕ РЕСУРСА"
                                    : "СОЗДАНИЕ НОВОГО РЕСУРСА"}
                            </h2>
                            <button
                                onClick={() => setShowResourceForm(false)}
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

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSaveResource();
                            }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                                {/* Левая колонка с основной информацией */}
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-gray-300 mb-2">
                                            НАЗВАНИЕ РЕСУРСА
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                                            value={formResource.name || ""}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-300 mb-2">
                                            ОПИСАНИЕ РЕСУРСА
                                        </label>
                                        <textarea
                                            name="description"
                                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white h-32"
                                            value={
                                                formResource.description || ""
                                            }
                                            onChange={handleFormChange}
                                            required
                                        ></textarea>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="mb-4">
                                            <label className="block text-gray-300 mb-2">
                                                ИКОНКА
                                            </label>
                                            <input
                                                type="text"
                                                name="icon"
                                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                                                value={formResource.icon || ""}
                                                onChange={handleFormChange}
                                                placeholder="Эмодзи или символ"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-gray-300 mb-2">
                                                РЕДКОСТЬ
                                            </label>
                                            <select
                                                name="rarity"
                                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                                                value={
                                                    formResource.rarity ||
                                                    "common"
                                                }
                                                onChange={handleRarityChange}
                                            >
                                                <option value="common">
                                                    ОБЫЧНЫЙ
                                                </option>
                                                <option value="uncommon">
                                                    НЕОБЫЧНЫЙ
                                                </option>
                                                <option value="rare">
                                                    РЕДКИЙ
                                                </option>
                                                <option value="epic">
                                                    ЭПИЧЕСКИЙ
                                                </option>
                                                <option value="legendary">
                                                    ЛЕГЕНДАРНЫЙ
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-300 mb-2">
                                            ИЗОБРАЖЕНИЕ
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-red-900/50 file:text-white hover:file:bg-red-800/60"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">
                                                Рекомендуемое соотношение сторон
                                                1:1, прозрачный фон (PNG)
                                            </p>

                                            {/* Превью изображения */}
                                            {imagePreview && (
                                                <div className="mt-2 relative w-24 h-24 bg-gray-800 border border-gray-700 rounded overflow-hidden">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Превью"
                                                        className="w-full h-full object-contain"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setImagePreview(
                                                                null
                                                            );
                                                            setFormResource(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    image_url:
                                                                        "",
                                                                })
                                                            );
                                                        }}
                                                        className="absolute top-1 right-1 bg-red-900/80 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs"
                                                        title="Удалить изображение"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="mb-4">
                                            <label className="block text-gray-300 mb-2">
                                                ВРЕМЯ ДОБЫЧИ (МС)
                                            </label>
                                            <input
                                                type="number"
                                                name="base_gathering_time"
                                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                                                value={
                                                    formResource.base_gathering_time ||
                                                    3000
                                                }
                                                onChange={handleFormChange}
                                                min="500"
                                                max="10000"
                                                step="100"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-gray-300 mb-2">
                                                ДОСТУПЕН ДЛЯ ДОБЫЧИ
                                            </label>
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                name="is_active"
                                                className="mr-2"
                                                checked={
                                                    formResource.is_active ===
                                                    true
                                                }
                                                onChange={(e) =>
                                                    setFormResource((prev) => ({
                                                        ...prev,
                                                        is_active:
                                                            e.target.checked,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Правая колонка с элементами и локациями */}
                                <div>
                                    <div className="mb-6">
                                        <label className="block text-gray-300 mb-2">
                                            ЭЛЕМЕНТЫ ДЛЯ ДОБЫЧИ
                                        </label>
                                        <ElementAutocomplete
                                            elements={elements}
                                            selectedElementIds={getSelectedElementIds()}
                                            onElementToggle={
                                                handleElementToggle
                                            }
                                            maxElements={5}
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center mb-2 group">
                                            <label className="block text-gray-300">
                                                ДОСТУПНЫЕ ЛОКАЦИИ
                                            </label>
                                            <div className="inline-block ml-2 relative">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 text-red-400 cursor-help hover:text-red-300"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                <div
                                                    className="absolute transform hidden group-hover:block bg-gray-800 text-xs text-white p-3 rounded-md z-[100] w-52 shadow-lg border border-red-900/50 backdrop-blur-sm"
                                                    style={{
                                                        left: "calc(100% + 10px)",
                                                        top: "0",
                                                        bottom: "auto",
                                                        boxShadow:
                                                            "0 0 10px rgba(155, 40, 40, 0.4)",
                                                    }}
                                                >
                                                    <div className="font-bold text-red-400 mb-1 text-center uppercase text-xs tracking-wider">
                                                        НАСТРОЙКИ ШАНСА
                                                        ПОЯВЛЕНИЯ И КОЛИЧЕСТВА
                                                        РЕСУРСА В ЛОКАЦИИ
                                                    </div>
                                                    <div className="text-gray-300">
                                                        ЕЩЕ НЕ ИСПОЛЬЗУЮТСЯ В
                                                        ИГРЕ, НО БУДУТ
                                                        ИСПОЛЬЗОВАНЫ В БУДУЩИХ
                                                        ОБНОВЛЕНИЯХ.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <LocationAutocomplete
                                            locations={locations}
                                            selectedLocationIds={
                                                selectedLocationIds
                                            }
                                            locationSettings={locationSettings}
                                            onLocationToggle={
                                                handleLocationToggle
                                            }
                                            onLocationSettingChange={
                                                handleLocationSettingChange
                                            }
                                            formLocations={
                                                formResource.locations
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between p-4 border-t border-gray-700">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
                                    onClick={() => setShowResourceForm(false)}
                                >
                                    ОТМЕНА
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700 flex items-center"
                                    disabled={isLoading}
                                >
                                    {isLoading && (
                                        <Spinner size="sm" className="mr-2" />
                                    )}
                                    {editingResource
                                        ? "СОХРАНИТЬ РЕСУРС"
                                        : "СОЗДАТЬ РЕСУРС"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div>
                    {/* Таблица ресурсов */}
                    <div className="bg-[#121626] rounded-lg border border-gray-700 overflow-x-auto mb-8">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-32">
                                <Spinner />
                            </div>
                        ) : resources.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-medium text-gray-400 tracking-wider">
                                            РЕСУРС
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-medium text-gray-400 tracking-wider">
                                            РЕДКОСТЬ
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-medium text-gray-400 tracking-wider">
                                            СТАТУС
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-medium text-gray-400 tracking-wider">
                                            ЭЛЕМЕНТЫ
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-medium text-gray-400 tracking-wider">
                                            ЛОКАЦИИ
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs uppercase font-medium text-gray-400 tracking-wider">
                                            ДЕЙСТВИЯ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {resources.map((resource: Resource) => (
                                        <tr
                                            key={resource.id}
                                            className="bg-transparent hover:bg-gray-750 transition-colors"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    {resource.image_url ? (
                                                        <img
                                                            src={
                                                                resource.image_url
                                                            }
                                                            alt={resource.name}
                                                            className="w-8 h-8 mr-3 object-cover rounded"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-gray-700 rounded-full mr-3 flex items-center justify-center text-xs">
                                                            {resource.icon ||
                                                                resource.name.charAt(
                                                                    0
                                                                )}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-white">
                                                            {resource.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`px-3 py-1 rounded-md text-sm ${getRarityColor(
                                                        resource.rarity
                                                    )}`}
                                                >
                                                    {getRarityName(
                                                        resource.rarity
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`px-3 py-1 rounded-md text-sm ${
                                                        resource.is_active
                                                            ? "bg-blue-700 text-blue-200"
                                                            : "bg-red-700 text-red-200"
                                                    }`}
                                                >
                                                    {resource.is_active
                                                        ? "АКТИВЕН"
                                                        : "НЕАКТИВЕН"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {resource.element_combination.map(
                                                        (elementId) => (
                                                            <span
                                                                key={elementId}
                                                                className={`px-2 py-1 rounded-md text-md`}
                                                                style={styling.getColorStyle(
                                                                    elements.find(
                                                                        (e) =>
                                                                            e.id ===
                                                                            parseInt(
                                                                                elementId
                                                                            )
                                                                    )?.color ||
                                                                        ""
                                                                )}
                                                            >
                                                                {
                                                                    elements.find(
                                                                        (e) =>
                                                                            e.id ===
                                                                            parseInt(
                                                                                elementId
                                                                            )
                                                                    )?.name
                                                                }{" "}
                                                                {
                                                                    elements.find(
                                                                        (e) =>
                                                                            e.id ===
                                                                            parseInt(
                                                                                elementId
                                                                            )
                                                                    )?.icon
                                                                }
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() =>
                                                        setSelectedResourceForLocations(
                                                            resource
                                                        )
                                                    }
                                                    className="text-blue-400 hover:text-blue-300 transition font-medium text-sm bg-blue-900/20 hover:bg-blue-900/30 px-3 py-1 rounded-md"
                                                >
                                                    ПРОСМОТР
                                                    <span className="ml-1 text-sm">
                                                        (
                                                        {
                                                            resource.locations
                                                                .length
                                                        }
                                                        )
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-2">
                                                <button
                                                    onClick={() =>
                                                        handleEditResource(
                                                            resource
                                                        )
                                                    }
                                                    className="text-blue-400 hover:text-blue-300 transition font-medium text-sm"
                                                >
                                                    РЕДАКТИРОВАТЬ
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteResource(
                                                            resource.id
                                                        )
                                                    }
                                                    className="text-red-400 hover:text-red-300 transition font-medium text-sm"
                                                >
                                                    УДАЛИТЬ
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-medium text-gray-400 tracking-wider">
                                            РЕСУРС
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-medium text-gray-400 tracking-wider">
                                            РЕДКОСТЬ
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-medium text-gray-400 tracking-wider">
                                            ТИП
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-medium text-gray-400 tracking-wider">
                                            СТАТУС
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-medium text-gray-400 tracking-wider">
                                            ЭЛЕМЕНТЫ
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs uppercase font-medium text-gray-400 tracking-wider">
                                            ЛОКАЦИИ
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs uppercase font-medium text-gray-400 tracking-wider">
                                            ДЕЙСТВИЯ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center text-gray-400 py-4"
                                        >
                                            РЕСУРСЫ НЕ НАЙДЕНЫ. СОЗДАЙТЕ ПЕРВЫЙ
                                            РЕСУРС!
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Модальное окно подтверждения удаления */}
            <Modal
                isOpen={!!resourceToDelete}
                onClose={() => setResourceToDelete(null)}
                title="Подтверждение удаления"
                size="sm"
            >
                <div className="mb-4 text-gray-300">
                    Вы уверены, что хотите удалить ресурс{" "}
                    <span className="font-bold">
                        {
                            resources.find(
                                (res: Resource) => res.id === resourceToDelete
                            )?.name
                        }
                    </span>
                    ? Это действие нельзя отменить.
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
                        onClick={() => setResourceToDelete(null)}
                    >
                        Отмена
                    </button>
                    <button
                        className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-600 flex items-center"
                        onClick={confirmDelete}
                        disabled={isLoading}
                    >
                        {isLoading && <Spinner size="sm" className="mr-2" />}
                        Удалить
                    </button>
                </div>
            </Modal>

            {/* Модальное окно для отображения локаций ресурса */}
            <Modal
                isOpen={!!selectedResourceForLocations}
                onClose={() => setSelectedResourceForLocations(null)}
                title={`Локации ресурса "${selectedResourceForLocations?.name}"`}
                size="md"
            >
                <div className="max-h-96 overflow-y-auto">
                    {selectedResourceForLocations?.locations.length ? (
                        <div className="grid grid-cols-1 gap-3">
                            {selectedResourceForLocations.locations.map(
                                (location) => (
                                    <div
                                        key={location.id}
                                        className="bg-gray-700 rounded-md p-3 flex justify-between items-center"
                                    >
                                        <div className="flex flex-col">
                                            <div className="flex items-center group">
                                                <span className="text-white font-medium">
                                                    {location.name}
                                                </span>
                                            </div>
                                            {location.pivot && (
                                                <div className="text-xs text-gray-300 mt-1">
                                                    <div className="flex items-center">
                                                        Шанс появления:{" "}
                                                        <span className="text-blue-300 mx-1">
                                                            {(
                                                                location.pivot
                                                                    .spawn_chance *
                                                                100
                                                            ).toFixed(0)}
                                                            %
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        Количество:{" "}
                                                        <span className="text-blue-300 mx-1">
                                                            {
                                                                location.pivot
                                                                    .min_amount
                                                            }
                                                            -
                                                            {
                                                                location.pivot
                                                                    .max_amount
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-4">
                            Ресурс не привязан к локациям
                        </div>
                    )}
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
                        onClick={() => setSelectedResourceForLocations(null)}
                    >
                        Закрыть
                    </button>
                </div>
            </Modal>
        </AdminLayout>
    );
});

export default AdminResources;
