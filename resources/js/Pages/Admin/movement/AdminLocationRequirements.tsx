import React, { useState, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import axios from "axios";
import AdminLayout from "../AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";

// Определение типов
interface Location {
    id: number;
    name: string;
    description: string;
    image_url: string;
    danger_level: number;
}

interface LocationRequirement {
    id: number;
    location_id: number;
    type: string;
    parameter: string;
    value: string | number;
    description: string;
    location?: Location;
}

const requirementTypes = [
    { value: "level", label: "Уровень персонажа", icon: "⭐" },
    { value: "strength", label: "Сила", icon: "💪" },
    { value: "agility", label: "Ловкость", icon: "🏃" },
    { value: "intelligence", label: "Интеллект", icon: "🧠" },
    { value: "vitality", label: "Выносливость", icon: "❤️" },
    { value: "luck", label: "Удача", icon: "🍀" },
    { value: "charisma", label: "Харизма", icon: "👄" },
    { value: "wisdom", label: "Мудрость", icon: "📚" },
    { value: "dexterity", label: "Проворство", icon: "✋" },
    { value: "constitution", label: "Телосложение", icon: "🛡️" },
    { value: "item", label: "Предмет в инвентаре", icon: "🔰" },
    { value: "quest", label: "Выполненный квест", icon: "📜" },
    { value: "achievement", label: "Достижение", icon: "🏆" },
];

// Функции для запросов данных
const fetchLocationsAPI = async () => {
    const response = await axios.get("/api/admin/locations");
    return response.data;
};

const fetchRequirementsAPI = async (locationId: number | null) => {
    if (!locationId) return [];
    const response = await axios.get(
        `/api/admin/location-requirements/${locationId}`
    );
    return response.data;
};

const AdminLocationRequirements: React.FC = observer(() => {
    // Получаем query параметры из URL
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const locationIdParam = queryParams.get("locationId");

    // Используем React Query для управления состоянием запросов
    const queryClient = useQueryClient();
    const [requirements, setRequirements] = useState<LocationRequirement[]>([]);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [editingRequirement, setEditingRequirement] =
        useState<LocationRequirement | null>(null);
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
        null
    );
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [requirementToDelete, setRequirementToDelete] = useState<
        number | null
    >(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [requirementPreset, setRequirementPreset] = useState<{
        type: string;
        value: string;
        description: string;
    } | null>(null);

    // Состояние для данных формы, инициализируем его пустыми значениями
    const [formData, setFormData] = useState({
        location_id: 0,
        type: "level",
        parameter: "",
        value: "",
        description: "",
    });

    // Мемоизируем атрибуты персонажа, которым не нужен дополнительный параметр
    const attributeTypes = useMemo(
        () => [
            "level",
            "strength",
            "agility",
            "intelligence",
            "vitality",
            "luck",
            "charisma",
            "wisdom",
            "dexterity",
            "constitution",
        ],
        []
    );

    // Запрос на получение локаций
    const {
        data: locations = [],
        isLoading: isLocationsLoading,
        error: locationsError,
    } = useQuery({
        queryKey: ["locations"],
        queryFn: fetchLocationsAPI,
        staleTime: 5 * 60 * 1000, // 5 минут
    });

    // Запрос на получение требований для выбранной локации
    const {
        data: fetchedRequirements = [],
        isLoading: isRequirementsLoading,
        error: requirementsError,
        refetch: refetchRequirements,
    } = useQuery({
        queryKey: ["locationRequirements", selectedLocationId],
        queryFn: () => fetchRequirementsAPI(selectedLocationId),
        enabled: !!selectedLocationId, // Запрос будет выполнен только при наличии выбранной локации
        staleTime: 5 * 60 * 1000, // 5 минут
    });

    // Обновление локального состояния при изменении данных из запроса
    useEffect(() => {
        if (
            fetchedRequirements &&
            JSON.stringify(fetchedRequirements) !== JSON.stringify(requirements)
        ) {
            setRequirements(fetchedRequirements);
        }
    }, [fetchedRequirements]);

    // Устанавливаем ID локации из URL при монтировании компонента
    useEffect(() => {
        if (locationIdParam) {
            setSelectedLocationId(parseInt(locationIdParam));
        }
    }, [locationIdParam]);

    // Мутация для создания требования
    const createRequirementMutation = useMutation({
        mutationFn: (formData: any) =>
            axios.post("/api/admin/location-requirements", formData),
        onSuccess: () => {
            setSuccessMessage("Требование успешно создано");
            queryClient.invalidateQueries({
                queryKey: ["locationRequirements", selectedLocationId],
            });
            setShowForm(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
            console.error("Ошибка при создании требования:", error);
            handleMutationError(error);
        },
    });

    // Мутация для обновления требования
    const updateRequirementMutation = useMutation({
        mutationFn: ({ id, formData }: { id: number; formData: any }) =>
            axios.put(`/api/admin/location-requirements/${id}`, formData),
        onSuccess: () => {
            setSuccessMessage("Требование успешно обновлено");
            queryClient.invalidateQueries({
                queryKey: ["locationRequirements", selectedLocationId],
            });
            setShowForm(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
            console.error("Ошибка при обновлении требования:", error);
            handleMutationError(error);
        },
    });

    // Мутация для удаления требования
    const deleteRequirementMutation = useMutation({
        mutationFn: (requirementId: number) =>
            axios.delete(`/api/admin/location-requirements/${requirementId}`),
        onSuccess: () => {
            setSuccessMessage("Требование успешно удалено");
            queryClient.invalidateQueries({
                queryKey: ["locationRequirements", selectedLocationId],
            });
            setShowDeleteModal(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
            console.error("Ошибка при удалении требования:", error);
            handleMutationError(error);
        },
    });

    // Обработка ошибок для мутаций
    const handleMutationError = (error: any) => {
        if (error.response) {
            if (error.response.status === 422 && error.response.data.errors) {
                const validationErrors = Object.values(
                    error.response.data.errors
                )
                    .flat()
                    .join("\n");
                setSuccessMessage(null);
                return validationErrors;
            } else {
                setSuccessMessage(null);
                return error.response.data.message || "Произошла ошибка";
            }
        } else {
            setSuccessMessage(null);
            return "Ошибка соединения с сервером";
        }
    };

    // Фильтрация локаций по поиску
    const filteredLocations = locations.filter(
        (location: Location) =>
            location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(location.danger_level).includes(searchTerm)
    );

    // Обработчики событий для CRUD операций
    const handleAddRequirement = () => {
        setEditingRequirement(null);
        setShowForm(true);
    };

    const handleEditRequirement = (requirement: LocationRequirement) => {
        setEditingRequirement(requirement);
        setShowForm(true);
    };

    const handleSaveRequirement = async (formData: any) => {
        if (editingRequirement) {
            updateRequirementMutation.mutate({
                id: editingRequirement.id,
                formData,
            });
        } else {
            createRequirementMutation.mutate(formData);
        }
    };

    const handleDeleteRequirement = async () => {
        if (!requirementToDelete) return;
        deleteRequirementMutation.mutate(requirementToDelete);
    };

    // Определяем общее состояние загрузки
    const isLoading =
        isLocationsLoading ||
        isRequirementsLoading ||
        createRequirementMutation.isPending ||
        updateRequirementMutation.isPending ||
        deleteRequirementMutation.isPending;

    // Определяем общее состояние ошибки
    const error =
        locationsError ||
        requirementsError ||
        (createRequirementMutation.error
            ? handleMutationError(createRequirementMutation.error)
            : null) ||
        (updateRequirementMutation.error
            ? handleMutationError(updateRequirementMutation.error)
            : null) ||
        (deleteRequirementMutation.error
            ? handleMutationError(deleteRequirementMutation.error)
            : null);

    const getRequirementTypeLabel = (type: string): string => {
        const requirementType = requirementTypes.find((t) => t.value === type);
        return requirementType ? requirementType.label : type;
    };

    const getRequirementTypeIcon = (type: string): string => {
        const requirementType = requirementTypes.find((t) => t.value === type);
        return requirementType ? requirementType.icon : "❓";
    };

    // Компонент карточки локации
    const LocationCard = ({ location }: { location: Location }) => {
        const isSelected = location.id === selectedLocationId;

        return (
            <div
                className={`p-3 rounded-md cursor-pointer transition-all duration-200 flex items-center border mb-2 ${
                    isSelected
                        ? "bg-red-900/30 border-red-600"
                        : "bg-gray-800 border-gray-700 hover:bg-gray-750"
                }`}
                onClick={() => setSelectedLocationId(location.id)}
            >
                <div className="flex-grow min-w-0">
                    <h3 className="text-md font-bold text-gray-200 truncate">
                        {location.name}
                    </h3>
                    <div className="flex items-center">
                        <span className="text-xs px-2 py-0.5 bg-red-900/50 rounded-full text-red-300 mr-2">
                            Опасность: {location.danger_level}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // Компактная карточка требования
    const RequirementCard = ({
        requirement,
    }: {
        requirement: LocationRequirement;
    }) => {
        return (
            <div className="bg-gray-800/60 rounded-md p-2 border border-gray-700 shadow-sm">
                <div className="flex justify-between items-start">
                    <div className="flex-grow">
                        <div className="flex items-center">
                            <span className="text-red-400 font-medium">
                                {requirement.value}
                            </span>
                            {requirement.parameter &&
                                requirement.parameter !== requirement.type && (
                                    <span className="ml-2 text-sm text-gray-400">
                                        ({requirement.parameter})
                                    </span>
                                )}
                        </div>
                        {requirement.description && (
                            <div className="mt-1 text-sm text-gray-400">
                                {requirement.description}
                            </div>
                        )}
                    </div>
                    <div className="flex space-x-1 ml-2">
                        <button
                            onClick={() => handleEditRequirement(requirement)}
                            className="text-blue-400 hover:text-blue-300 p-1 rounded-md hover:bg-blue-900/20"
                            title="Редактировать"
                        >
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </button>
                        <button
                            onClick={() => {
                                setRequirementToDelete(requirement.id);
                                setShowDeleteModal(true);
                            }}
                            className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-red-900/20"
                            title="Удалить"
                        >
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Компонент формы создания/редактирования требования с предустановленными значениями
    const QuickRequirementForm = ({
        presetType,
        presetValue,
        presetDescription,
    }: {
        presetType: string;
        presetValue: string;
        presetDescription: string;
    }) => {
        const [type, setType] = useState<string>(presetType);
        const [parameter, setParameter] = useState<string>(presetType);
        const [value, setValue] = useState<string>(presetValue);
        const [description, setDescription] =
            useState<string>(presetDescription);
        const [locationId, setLocationId] = useState<number>(
            selectedLocationId || 0
        );

        useEffect(() => {
            if (selectedLocationId) {
                setLocationId(selectedLocationId);
            }
        }, [selectedLocationId]);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();

            if (!locationId) {
                setSuccessMessage("Необходимо выбрать локацию");
                return;
            }

            if (!type) {
                setSuccessMessage("Необходимо указать тип требования");
                return;
            }

            if (!value) {
                setSuccessMessage("Необходимо указать значение требования");
                return;
            }

            const formData = {
                location_id: locationId,
                type,
                parameter,
                value,
                description,
            };

            handleSaveRequirement(formData);
        };

        // Динамический ввод в зависимости от типа требования
        const needsParameterInput = !attributeTypes.includes(type);

        // Возвращаем категорию требования для группировки в select
        const getRequirementCategory = (type: string): string => {
            if (attributeTypes.includes(type)) {
                return "Характеристики персонажа";
            }
            if (type === "item") return "Предметы";
            if (type === "quest") return "Квесты";
            if (type === "achievement") return "Достижения";
            return "Прочее";
        };

        return (
            <div className="bg-gray-900/50 p-4 rounded-lg border border-red-900/30 shadow-md mb-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medieval text-red-400">
                        Новое требование - {getRequirementCategory(type)}
                    </h3>
                    <button
                        onClick={() => setShowForm(false)}
                        className="text-gray-400 hover:text-red-400"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
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

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                htmlFor="type"
                                className="block text-gray-300 text-sm font-medium mb-1"
                            >
                                Тип требования
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={type}
                                onChange={(e) => {
                                    setType(e.target.value);
                                    // Если выбран атрибут, сразу устанавливаем и параметр
                                    if (
                                        attributeTypes.includes(e.target.value)
                                    ) {
                                        setParameter(e.target.value);
                                    }
                                }}
                                className="w-full px-3 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                            >
                                {/* Группировка типов требований по категориям */}
                                {Array.from(
                                    new Set(
                                        requirementTypes.map((t) =>
                                            getRequirementCategory(t.value)
                                        )
                                    )
                                ).map((category) => (
                                    <optgroup key={category} label={category}>
                                        {requirementTypes
                                            .filter(
                                                (t) =>
                                                    getRequirementCategory(
                                                        t.value
                                                    ) === category
                                            )
                                            .map((type) => (
                                                <option
                                                    key={type.value}
                                                    value={type.value}
                                                >
                                                    {type.icon} {type.label}
                                                </option>
                                            ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="value"
                                className="block text-gray-300 text-sm font-medium mb-1"
                            >
                                Значение
                            </label>
                            <input
                                type={
                                    attributeTypes.includes(type)
                                        ? "number"
                                        : "text"
                                }
                                id="value"
                                name="value"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                                min={
                                    attributeTypes.includes(type)
                                        ? 1
                                        : undefined
                                }
                                placeholder="Требуемое значение"
                            />
                        </div>
                    </div>

                    {needsParameterInput && (
                        <div>
                            <label
                                htmlFor="parameter"
                                className="block text-gray-300 text-sm font-medium mb-1"
                            >
                                Параметр требования
                            </label>
                            <input
                                type="text"
                                id="parameter"
                                name="parameter"
                                value={parameter}
                                onChange={(e) => setParameter(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                                placeholder={
                                    type === "item"
                                        ? "ID предмета или название"
                                        : type === "quest"
                                        ? "ID квеста или название"
                                        : "Название параметра"
                                }
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {type === "item" &&
                                    "Укажите ID предмета или его уникальное название"}
                                {type === "quest" &&
                                    "Укажите ID квеста или его уникальное название"}
                                {type === "achievement" &&
                                    "Укажите ID достижения или его уникальное название"}
                            </p>
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="description"
                            className="block text-gray-300 text-sm font-medium mb-1"
                        >
                            Описание (отображается игроку)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                            placeholder="Например: Для входа требуется уровень 10"
                        ></textarea>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md shadow-sm border border-gray-700 text-sm"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-1.5 bg-red-900/70 hover:bg-red-800 text-gray-200 rounded-md shadow-sm border border-red-900/70 flex items-center text-sm"
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
                                        className="h-4 w-4 mr-1"
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
                                    Создать
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    // Компонент формы создания/редактирования требования
    const RequirementForm = () => {
        // Используем отдельные состояния для каждого поля вместо общего объекта
        const [type, setType] = useState<string>(
            editingRequirement?.type || "level"
        );
        const [parameter, setParameter] = useState<string>(
            editingRequirement?.parameter || ""
        );
        const [value, setValue] = useState<string>(
            editingRequirement?.value?.toString() || ""
        );
        const [description, setDescription] = useState<string>(
            editingRequirement?.description || ""
        );
        const [locationId, setLocationId] = useState<number>(
            editingRequirement?.location_id || selectedLocationId || 0
        );

        // Обновляем состояние при изменении редактируемого требования или выбранной локации
        useEffect(() => {
            if (editingRequirement) {
                setType(editingRequirement.type);
                setParameter(editingRequirement.parameter || "");
                setValue(editingRequirement.value.toString());
                setDescription(editingRequirement.description || "");
                setLocationId(editingRequirement.location_id);
            } else if (selectedLocationId && !locationId) {
                setLocationId(selectedLocationId);
            }
        }, [editingRequirement, selectedLocationId]);

        // Обновляем параметр при изменении типа, но только если не в фокусе
        useEffect(() => {
            if (
                attributeTypes.includes(type) &&
                parameter !== type &&
                document.activeElement?.tagName !== "INPUT" &&
                document.activeElement?.tagName !== "TEXTAREA" &&
                document.activeElement?.tagName !== "SELECT"
            ) {
                setParameter(type);
            }
        }, [type, attributeTypes]);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();

            if (!locationId) {
                setSuccessMessage("Необходимо выбрать локацию");
                return;
            }

            if (!type) {
                setSuccessMessage("Необходимо указать тип требования");
                return;
            }

            if (!value) {
                setSuccessMessage("Необходимо указать значение требования");
                return;
            }

            const formData = {
                location_id: locationId,
                type,
                parameter,
                value,
                description,
            };

            handleSaveRequirement(formData);
        };

        // Динамический ввод в зависимости от типа требования
        const needsParameterInput = !attributeTypes.includes(type);

        // Возвращаем категорию требования для группировки в select
        const getRequirementCategory = (type: string): string => {
            if (attributeTypes.includes(type)) {
                return "Характеристики персонажа";
            }
            if (type === "item") return "Предметы";
            if (type === "quest") return "Квесты";
            if (type === "achievement") return "Достижения";
            return "Прочее";
        };

        return (
            <div className="bg-gray-900/50 p-4 rounded-lg border border-red-900/30 shadow-md mb-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medieval text-red-400">
                        {editingRequirement
                            ? "Редактирование требования"
                            : "Новое требование"}
                    </h3>
                    <button
                        onClick={() => setShowForm(false)}
                        className="text-gray-400 hover:text-red-400"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
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

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                htmlFor="type"
                                className="block text-gray-300 text-sm font-medium mb-1"
                            >
                                Тип требования
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={type}
                                onChange={(e) => {
                                    setType(e.target.value);
                                    // Если выбран атрибут, сразу устанавливаем и параметр
                                    if (
                                        attributeTypes.includes(e.target.value)
                                    ) {
                                        setParameter(e.target.value);
                                    }
                                }}
                                className="w-full px-3 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                            >
                                {/* Группировка типов требований по категориям */}
                                {Array.from(
                                    new Set(
                                        requirementTypes.map((t) =>
                                            getRequirementCategory(t.value)
                                        )
                                    )
                                ).map((category) => (
                                    <optgroup key={category} label={category}>
                                        {requirementTypes
                                            .filter(
                                                (t) =>
                                                    getRequirementCategory(
                                                        t.value
                                                    ) === category
                                            )
                                            .map((type) => (
                                                <option
                                                    key={type.value}
                                                    value={type.value}
                                                >
                                                    {type.icon} {type.label}
                                                </option>
                                            ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="value"
                                className="block text-gray-300 text-sm font-medium mb-1"
                            >
                                Значение
                            </label>
                            <input
                                type={
                                    attributeTypes.includes(type)
                                        ? "number"
                                        : "text"
                                }
                                id="value"
                                name="value"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                                min={
                                    attributeTypes.includes(type)
                                        ? 1
                                        : undefined
                                }
                                placeholder="Требуемое значение"
                            />
                        </div>
                    </div>

                    {needsParameterInput && (
                        <div>
                            <label
                                htmlFor="parameter"
                                className="block text-gray-300 text-sm font-medium mb-1"
                            >
                                Параметр требования
                            </label>
                            <input
                                type="text"
                                id="parameter"
                                name="parameter"
                                value={parameter}
                                onChange={(e) => setParameter(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                                placeholder={
                                    type === "item"
                                        ? "ID предмета или название"
                                        : type === "quest"
                                        ? "ID квеста или название"
                                        : "Название параметра"
                                }
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {type === "item" &&
                                    "Укажите ID предмета или его уникальное название"}
                                {type === "quest" &&
                                    "Укажите ID квеста или его уникальное название"}
                                {type === "achievement" &&
                                    "Укажите ID достижения или его уникальное название"}
                            </p>
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="description"
                            className="block text-gray-300 text-sm font-medium mb-1"
                        >
                            Описание (отображается игроку)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                            placeholder="Например: Для входа требуется уровень 10"
                        ></textarea>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md shadow-sm border border-gray-700 text-sm"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-1.5 bg-red-900/70 hover:bg-red-800 text-gray-200 rounded-md shadow-sm border border-red-900/70 flex items-center text-sm"
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
                                        className="h-4 w-4 mr-1"
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
                                    {editingRequirement
                                        ? "Обновить"
                                        : "Создать"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    // Функция группировки требований по типам
    const groupRequirementsByType = (reqs: LocationRequirement[]) => {
        const groups: Record<string, LocationRequirement[]> = {};

        reqs.forEach((req) => {
            if (!groups[req.type]) {
                groups[req.type] = [];
            }
            groups[req.type].push(req);
        });

        return groups;
    };

    return (
        <AdminLayout pageTitle="Требования для локаций">
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                        {selectedLocationId && (
                            <Link
                                to={`/admin/locations`}
                                state={{ editLocationId: selectedLocationId }}
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
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                                К локации
                            </Link>
                        )}
                        {selectedLocationId && (
                            <button
                                onClick={handleAddRequirement}
                                className="px-3 py-1.5 rounded bg-red-900/60 hover:bg-red-800 text-gray-200 flex items-center text-sm transition-colors font-medium border border-red-900/70 shadow-sm"
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
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                </svg>
                                Добавить требование
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Уведомления */}
            {successMessage && (
                <div className="mb-4 p-3 bg-green-900/20 border border-green-900/40 text-green-400 rounded-md flex items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                    {successMessage}
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-900/40 text-red-400 rounded-md flex items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    {error}
                </div>
            )}

            {/* Форма для добавления/редактирования */}
            {showForm &&
                (editingRequirement ? (
                    <RequirementForm />
                ) : requirementPreset ? (
                    <QuickRequirementForm
                        presetType={requirementPreset.type}
                        presetValue={requirementPreset.value}
                        presetDescription={requirementPreset.description}
                    />
                ) : (
                    <RequirementForm />
                ))}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Панель локаций */}
                <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-800 shadow-md">
                    <div className="mb-4">
                        <h2 className="text-lg font-medieval text-red-400 mb-2">
                            Выберите локацию
                        </h2>
                        <div className="relative mb-3">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-gray-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Поиск локаций..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full px-3 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                            />
                        </div>
                    </div>

                    {/* Сводная статистика */}
                    {!isLocationsLoading && (
                        <div className="mb-3 flex flex-wrap gap-2">
                            <div className="text-xs px-2 py-1 bg-gray-800 rounded-md text-gray-400">
                                Всего локаций: {locations.length}
                            </div>
                            {selectedLocationId && (
                                <div className="text-xs px-2 py-1 bg-red-900/30 rounded-md text-red-300">
                                    Требований: {requirements.length}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="overflow-y-auto max-h-[60vh] pr-1 custom-scrollbar">
                        {isLocationsLoading && locations.length === 0 ? (
                            <div className="flex justify-center items-center p-4">
                                <div className="h-6 w-6 border-2 border-t-red-500 rounded-full animate-spin"></div>
                                <span className="ml-2 text-gray-400">
                                    Загрузка локаций...
                                </span>
                            </div>
                        ) : filteredLocations.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                {searchTerm
                                    ? "Локации не найдены"
                                    : "Локации отсутствуют"}
                            </div>
                        ) : (
                            filteredLocations.map((location: Location) => (
                                <LocationCard
                                    key={location.id}
                                    location={location}
                                />
                            ))
                        )}
                    </div>

                    {/* Навигация между локациями */}
                    {selectedLocationId && locations.length > 0 && (
                        <div className="mt-3 flex space-x-2 justify-center">
                            <button
                                onClick={() => {
                                    const index = locations.findIndex(
                                        (l: Location) =>
                                            l.id === selectedLocationId
                                    );
                                    if (index > 0) {
                                        setSelectedLocationId(
                                            locations[index - 1].id
                                        );
                                    }
                                }}
                                disabled={
                                    locations.findIndex(
                                        (l: Location) =>
                                            l.id === selectedLocationId
                                    ) <= 0
                                }
                                className="px-2 py-1 bg-gray-800 text-gray-300 rounded-md disabled:opacity-50"
                                title="Предыдущая локация"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
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
                            </button>
                            <button
                                onClick={() => {
                                    const index = locations.findIndex(
                                        (l: Location) =>
                                            l.id === selectedLocationId
                                    );
                                    if (index < locations.length - 1) {
                                        setSelectedLocationId(
                                            locations[index + 1].id
                                        );
                                    }
                                }}
                                disabled={
                                    locations.findIndex(
                                        (l: Location) =>
                                            l.id === selectedLocationId
                                    ) >=
                                    locations.length - 1
                                }
                                className="px-2 py-1 bg-gray-800 text-gray-300 rounded-md disabled:opacity-50"
                                title="Следующая локация"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
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
                            </button>
                        </div>
                    )}
                </div>

                {/* Панель требований */}
                <div className="lg:col-span-2 bg-gray-900/30 p-4 rounded-lg border border-gray-800 shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medieval text-red-400">
                            {selectedLocationId
                                ? `Требования для локации: ${
                                      locations.find(
                                          (l: Location) =>
                                              l.id === selectedLocationId
                                      )?.name || "Выбранная локация"
                                  }`
                                : "Требования"}
                        </h2>

                        {selectedLocationId && (
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleAddRequirement}
                                    className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-md flex items-center text-sm"
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
                                            d="M12 4v16m8-8H4"
                                        />
                                    </svg>
                                    Добавить требование
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Панель быстрых действий */}
                    {selectedLocationId && !showForm && (
                        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-300 mb-2">
                                Быстрое добавление требований:
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => {
                                        setEditingRequirement(null);
                                        setRequirementPreset({
                                            type: "level",
                                            value: "10",
                                            description:
                                                "Для входа требуется уровень 10",
                                        });
                                        setShowForm(true);
                                    }}
                                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs flex items-center"
                                >
                                    ⭐ Уровень 10
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingRequirement(null);
                                        setRequirementPreset({
                                            type: "strength",
                                            value: "15",
                                            description:
                                                "Для входа требуется сила 15",
                                        });
                                        setShowForm(true);
                                    }}
                                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs flex items-center"
                                >
                                    💪 Сила 15
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingRequirement(null);
                                        setRequirementPreset({
                                            type: "item",
                                            value: "1",
                                            description: "Требуется ключ",
                                        });
                                        setShowForm(true);
                                    }}
                                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs flex items-center"
                                >
                                    🔰 Предмет
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingRequirement(null);
                                        setRequirementPreset({
                                            type: "quest",
                                            value: "completed",
                                            description:
                                                "Требуется выполнение квеста",
                                        });
                                        setShowForm(true);
                                    }}
                                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded text-xs flex items-center"
                                >
                                    📜 Квест
                                </button>
                            </div>
                        </div>
                    )}

                    {!selectedLocationId ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 mb-2 text-gray-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <p>Выберите локацию, чтобы увидеть её требования</p>
                        </div>
                    ) : isRequirementsLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="h-8 w-8 animate-spin rounded-full border-t-4 border-red-600"></div>
                            <span className="ml-2 text-gray-400">
                                Загрузка требований...
                            </span>
                        </div>
                    ) : requirements.length === 0 ? (
                        <div className="bg-gray-800/50 rounded-lg p-6 text-center flex flex-col items-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 text-gray-600 mb-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <p className="text-gray-400 mb-3">
                                Для этой локации нет требований
                            </p>
                            <button
                                onClick={handleAddRequirement}
                                className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-gray-200 rounded-md flex items-center text-sm"
                            >
                                Добавить первое требование
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-y-auto max-h-[60vh] pr-1 custom-scrollbar">
                            {Object.entries(
                                groupRequirementsByType(requirements)
                            ).map(([type, typeRequirements]) => (
                                <div key={type} className="mb-5">
                                    <div className="flex items-center mb-2 pb-1 border-b border-gray-700">
                                        <span
                                            className="text-xl mr-2"
                                            role="img"
                                            aria-label="Тип требования"
                                        >
                                            {getRequirementTypeIcon(type)}
                                        </span>
                                        <h3 className="text-md font-semibold text-gray-200">
                                            {getRequirementTypeLabel(type)}
                                        </h3>
                                        <span className="ml-2 text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">
                                            {typeRequirements.length}
                                        </span>
                                    </div>
                                    <div className="space-y-3 pl-2">
                                        {typeRequirements.map((requirement) => (
                                            <RequirementCard
                                                key={requirement.id}
                                                requirement={requirement}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Модальное окно подтверждения удаления */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-4 max-w-md w-full mx-4 border border-red-900/30">
                        <h3 className="text-lg font-medieval text-red-400 mb-3">
                            Подтверждение удаления
                        </h3>
                        <p className="text-gray-300 mb-4">
                            Вы уверены, что хотите удалить это требование?
                            Персонажи, не соответствующие требованиям, не смогут
                            попасть в локацию.
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleDeleteRequirement}
                                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-md text-sm flex items-center"
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
                                        Удаление...
                                    </>
                                ) : (
                                    <>
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                        Удалить
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Стили для кастомного скроллбара */}
            <style>
                {`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(31, 41, 55, 0.5);
                    border-radius: 6px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(127, 29, 29, 0.5);
                    border-radius: 6px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(127, 29, 29, 0.7);
                }
                `}
            </style>
        </AdminLayout>
    );
});

export default AdminLocationRequirements;
