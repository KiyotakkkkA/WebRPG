import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import axios from "../../../config/axios";
import AdminLayout from "../AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Компоненты UI
import Spinner from "../../../Components/ui/Spinner";
import { useLocation } from "react-router-dom";

// Типы данных
interface Element {
    id: number;
    name: string;
    icon: string;
    color: string;
    description: string | null;
    is_active: boolean;
}

// Цветовая палитра Tailwind с реальными цветовыми значениями
const tailwindColors = [
    { name: "red", shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
    {
        name: "orange",
        shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
    {
        name: "amber",
        shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
    {
        name: "yellow",
        shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
    { name: "lime", shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
    {
        name: "green",
        shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
    {
        name: "emerald",
        shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
    { name: "teal", shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
    { name: "cyan", shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
    { name: "sky", shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
    { name: "blue", shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
    {
        name: "indigo",
        shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
    {
        name: "violet",
        shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
    {
        name: "purple",
        shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
    {
        name: "fuchsia",
        shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
    { name: "pink", shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
    { name: "rose", shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
    { name: "gray", shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] },
];

// Hex-значения цветов Tailwind
const tailwindColorValues: Record<string, Record<number, string>> = {
    red: {
        50: "#fef2f2",
        100: "#fee2e2",
        200: "#fecaca",
        300: "#fca5a5",
        400: "#f87171",
        500: "#ef4444",
        600: "#dc2626",
        700: "#b91c1c",
        800: "#991b1b",
        900: "#7f1d1d",
    },
    orange: {
        50: "#fff7ed",
        100: "#ffedd5",
        200: "#fed7aa",
        300: "#fdba74",
        400: "#fb923c",
        500: "#f97316",
        600: "#ea580c",
        700: "#c2410c",
        800: "#9a3412",
        900: "#7c2d12",
    },
    amber: {
        50: "#fffbeb",
        100: "#fef3c7",
        200: "#fde68a",
        300: "#fcd34d",
        400: "#fbbf24",
        500: "#f59e0b",
        600: "#d97706",
        700: "#b45309",
        800: "#92400e",
        900: "#78350f",
    },
    yellow: {
        50: "#fefce8",
        100: "#fef9c3",
        200: "#fef08a",
        300: "#fde047",
        400: "#facc15",
        500: "#eab308",
        600: "#ca8a04",
        700: "#a16207",
        800: "#854d0e",
        900: "#713f12",
    },
    lime: {
        50: "#f7fee7",
        100: "#ecfccb",
        200: "#d9f99d",
        300: "#bef264",
        400: "#a3e635",
        500: "#84cc16",
        600: "#65a30d",
        700: "#4d7c0f",
        800: "#3f6212",
        900: "#365314",
    },
    green: {
        50: "#f0fdf4",
        100: "#dcfce7",
        200: "#bbf7d0",
        300: "#86efac",
        400: "#4ade80",
        500: "#22c55e",
        600: "#16a34a",
        700: "#15803d",
        800: "#166534",
        900: "#14532d",
    },
    emerald: {
        50: "#ecfdf5",
        100: "#d1fae5",
        200: "#a7f3d0",
        300: "#6ee7b7",
        400: "#34d399",
        500: "#10b981",
        600: "#059669",
        700: "#047857",
        800: "#065f46",
        900: "#064e3b",
    },
    teal: {
        50: "#f0fdfa",
        100: "#ccfbf1",
        200: "#99f6e4",
        300: "#5eead4",
        400: "#2dd4bf",
        500: "#14b8a6",
        600: "#0d9488",
        700: "#0f766e",
        800: "#115e59",
        900: "#134e4a",
    },
    cyan: {
        50: "#ecfeff",
        100: "#cffafe",
        200: "#a5f3fc",
        300: "#67e8f9",
        400: "#22d3ee",
        500: "#06b6d4",
        600: "#0891b2",
        700: "#0e7490",
        800: "#155e75",
        900: "#164e63",
    },
    sky: {
        50: "#f0f9ff",
        100: "#e0f2fe",
        200: "#bae6fd",
        300: "#7dd3fc",
        400: "#38bdf8",
        500: "#0ea5e9",
        600: "#0284c7",
        700: "#0369a1",
        800: "#075985",
        900: "#0c4a6e",
    },
    blue: {
        50: "#eff6ff",
        100: "#dbeafe",
        200: "#bfdbfe",
        300: "#93c5fd",
        400: "#60a5fa",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
        800: "#1e40af",
        900: "#1e3a8a",
    },
    indigo: {
        50: "#eef2ff",
        100: "#e0e7ff",
        200: "#c7d2fe",
        300: "#a5b4fc",
        400: "#818cf8",
        500: "#6366f1",
        600: "#4f46e5",
        700: "#4338ca",
        800: "#3730a3",
        900: "#312e81",
    },
    violet: {
        50: "#f5f3ff",
        100: "#ede9fe",
        200: "#ddd6fe",
        300: "#c4b5fd",
        400: "#a78bfa",
        500: "#8b5cf6",
        600: "#7c3aed",
        700: "#6d28d9",
        800: "#5b21b6",
        900: "#4c1d95",
    },
    purple: {
        50: "#faf5ff",
        100: "#f3e8ff",
        200: "#e9d5ff",
        300: "#d8b4fe",
        400: "#c084fc",
        500: "#a855f7",
        600: "#9333ea",
        700: "#7e22ce",
        800: "#6b21a8",
        900: "#581c87",
    },
    fuchsia: {
        50: "#fdf4ff",
        100: "#fae8ff",
        200: "#f5d0fe",
        300: "#f0abfc",
        400: "#e879f9",
        500: "#d946ef",
        600: "#c026d3",
        700: "#a21caf",
        800: "#86198f",
        900: "#701a75",
    },
    pink: {
        50: "#fdf2f8",
        100: "#fce7f3",
        200: "#fbcfe8",
        300: "#f9a8d4",
        400: "#f472b6",
        500: "#ec4899",
        600: "#db2777",
        700: "#be185d",
        800: "#9d174d",
        900: "#831843",
    },
    rose: {
        50: "#fff1f2",
        100: "#ffe4e6",
        200: "#fecdd3",
        300: "#fda4af",
        400: "#fb7185",
        500: "#f43f5e",
        600: "#e11d48",
        700: "#be123c",
        800: "#9f1239",
        900: "#881337",
    },
    gray: {
        50: "#f9fafb",
        100: "#f3f4f6",
        200: "#e5e7eb",
        300: "#d1d5db",
        400: "#9ca3af",
        500: "#6b7280",
        600: "#4b5563",
        700: "#374151",
        800: "#1f2937",
        900: "#111827",
    },
};

// API функции для работы с элементами
const elementsApi = {
    // Получение всех элементов
    getElements: async (): Promise<Element[]> => {
        try {
            const response = await axios.get("/api/admin/elements");
            return response.data.elements || [];
        } catch (error) {
            console.error("Ошибка загрузки элементов:", error);
            throw error;
        }
    },

    // Создание нового элемента
    createElement: async (element: Partial<Element>): Promise<Element> => {
        const response = await axios.post("/api/admin/elements", element);
        return response.data.element;
    },

    // Обновление существующего элемента
    updateElement: async (
        element: Partial<Element> & { id: number }
    ): Promise<Element> => {
        const response = await axios.put(
            `/api/admin/elements/${element.id}`,
            element
        );
        return response.data.element;
    },

    // Удаление элемента
    deleteElement: async (id: number): Promise<any> => {
        const response = await axios.delete(`/api/admin/elements/${id}`);
        return response.data;
    },
};

// Главный компонент
const AdminElements = observer(() => {
    const location = useLocation();
    const { editElementId: stateEditElementId } = location.state || {};

    // Также проверяем URL параметры для обратной совместимости
    const urlParams = new URLSearchParams(location.search);
    const queryEditElementId = urlParams.get("editElementId")
        ? parseInt(urlParams.get("editElementId")!)
        : null;

    // Используем ID из state или из URL параметров
    const editElementId = stateEditElementId || queryEditElementId;

    // Инициализация QueryClient
    const queryClient = useQueryClient();

    // Состояния интерфейса
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Состояния для создания/редактирования элемента
    const [showElementForm, setShowElementForm] = useState(false);
    const [editingElement, setEditingElement] = useState<Element | null>(null);
    const [formElement, setFormElement] = useState<Partial<Element>>({
        name: "",
        icon: "",
        color: "",
        description: "",
        is_active: true,
    });

    // Состояние для палитры цветов
    const [showColorPalette, setShowColorPalette] = useState(false);
    const [selectedColor, setSelectedColor] = useState("");
    const [selectedShade, setSelectedShade] = useState(500);

    // Состояния для модальных окон
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [elementToDelete, setElementToDelete] = useState<number | null>(null);

    // React Query хук для получения элементов
    const {
        data: elements = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["elements"],
        queryFn: elementsApi.getElements,
        staleTime: 1000 * 60 * 5, // 5 минут кэширования
    });

    // React Query мутации
    const createElementMutation = useMutation({
        mutationFn: elementsApi.createElement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["elements"] });
            setSuccessMessage("Элемент успешно создан");
            setShowElementForm(false);
        },
        onError: (error: any) => {
            setSuccessMessage(null);
        },
    });

    const updateElementMutation = useMutation({
        mutationFn: elementsApi.updateElement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["elements"] });
            setSuccessMessage("Элемент успешно обновлен");
            setShowElementForm(false);
        },
        onError: (error: any) => {
            setSuccessMessage(null);
        },
    });

    const deleteElementMutation = useMutation({
        mutationFn: elementsApi.deleteElement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["elements"] });
            setSuccessMessage("Элемент успешно удален");
            setShowDeleteModal(false);
            setElementToDelete(null);
        },
        onError: (error: any) => {
            setSuccessMessage(null);
        },
    });

    useEffect(() => {
        if (editElementId && elements.length > 0) {
            // Строгое сравнение с преобразованием типов
            const elementToEdit = elements.find(
                (el: Element) => Number(el.id) === Number(editElementId)
            );

            if (elementToEdit) {
                setEditingElement(elementToEdit);
                setFormElement({
                    name: elementToEdit.name,
                    icon: elementToEdit.icon,
                    color: elementToEdit.color,
                    description: elementToEdit.description,
                    is_active: elementToEdit.is_active,
                });

                // Обновляем выбранный цвет и оттенок для палитры цветов
                if (elementToEdit.color) {
                    const match = elementToEdit.color.match(
                        /^text-([a-z]+)-([0-9]+)$/i
                    );
                    if (match) {
                        setSelectedColor(match[1].toLowerCase());
                        setSelectedShade(parseInt(match[2]));
                    } else {
                        console.error(
                            "Не удалось распарсить цвет:",
                            elementToEdit.color
                        );
                    }
                }

                setShowElementForm(true);
            }
        }
    }, [editElementId, elements]);

    // Получение hex-цвета из класса цвета Tailwind
    const getColorFromTailwindClass = (
        textColorClass: string | undefined | null
    ): string => {
        if (!textColorClass) return tailwindColorValues.gray[500];

        const match = textColorClass.match(/^text-([a-z]+)-([0-9]+)$/);
        if (match) {
            const colorName = match[1];
            const shade = parseInt(match[2]);
            return (
                tailwindColorValues[colorName]?.[shade] ||
                tailwindColorValues.gray[500]
            );
        }

        return tailwindColorValues.gray[500];
    };

    // Обработчик выбора цвета из палитры
    const handleColorSelect = (color: string, shade: number) => {
        const textColorClass = `text-${color}-${shade}`;
        setFormElement((prev) => ({ ...prev, color: textColorClass }));
        setSelectedColor(color);
        setSelectedShade(shade);
        setShowColorPalette(false);
    };

    // Установка выбранного цвета при загрузке формы
    useEffect(() => {
        if (formElement.color) {
            const match = formElement.color.match(/^text-([a-z]+)-([0-9]+)$/);
            if (match) {
                setSelectedColor(match[1]);
                setSelectedShade(parseInt(match[2]));
            }
        }
    }, [formElement.color]);

    // Обработчики для создания/редактирования элемента
    const handleCreateElement = () => {
        setEditingElement(null);
        setFormElement({
            name: "",
            icon: "",
            color: "",
            description: "",
            is_active: true,
        });
        setSelectedColor("");
        setSelectedShade(500);
        setShowElementForm(true);
    };

    const handleEditElement = (element: Element) => {
        setEditingElement(element);
        setFormElement({
            name: element.name,
            icon: element.icon,
            color: element.color,
            description: element.description,
            is_active: element.is_active,
        });

        // Устанавливаем выбранный цвет и оттенок для палитры
        const match = element.color.match(/^text-([a-z]+)-([0-9]+)$/);
        if (match) {
            setSelectedColor(match[1]);
            setSelectedShade(parseInt(match[2]));
        }

        setShowElementForm(true);
    };

    // Обработка изменений в форме элемента
    const handleFormChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value, type } = e.target;

        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setFormElement((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormElement((prev) => ({ ...prev, [name]: value }));
        }
    };

    // Сохранение элемента
    const handleSaveElement = () => {
        const data = {
            name: formElement.name || "",
            icon: formElement.icon || "",
            color: formElement.color || "",
            description: formElement.description || "",
            is_active: formElement.is_active === true,
        };

        if (editingElement) {
            // Обновление существующего элемента
            updateElementMutation.mutate({
                ...data,
                id: editingElement.id,
            });
        } else {
            // Создание нового элемента
            createElementMutation.mutate(data);
        }
    };

    // Открытие модального окна подтверждения удаления элемента
    const handleDeleteElement = (elementId: number) => {
        setElementToDelete(elementId);
        setShowDeleteModal(true);
    };

    // Удаление элемента
    const confirmDelete = () => {
        if (elementToDelete === null) return;
        deleteElementMutation.mutate(elementToDelete);
    };

    // Проверка наличия ошибок в мутациях
    const errorMessage = error
        ? (error as any)?.response?.data?.message ||
          "Произошла ошибка при загрузке элементов"
        : createElementMutation.error
        ? (createElementMutation.error as any)?.response?.data?.message ||
          "Произошла ошибка при создании элемента"
        : updateElementMutation.error
        ? (updateElementMutation.error as any)?.response?.data?.message ||
          "Произошла ошибка при обновлении элемента"
        : deleteElementMutation.error
        ? (deleteElementMutation.error as any)?.response?.data?.message ||
          "Ошибка при удалении элемента. Возможно, элемент используется в ресурсах."
        : null;

    // Проверка состояния загрузки в мутациях
    const isMutationLoading =
        createElementMutation.isPending ||
        updateElementMutation.isPending ||
        deleteElementMutation.isPending;

    return (
        <AdminLayout pageTitle="Управление элементами">
            <div className="p-4">
                <button
                    onClick={handleCreateElement}
                    className="bg-red-700 hover:bg-red-800 text-white py-2 px-4 rounded mb-4"
                >
                    + ДОБАВИТЬ ЭЛЕМЕНТ
                </button>

                {/* Сообщения */}
                {successMessage && (
                    <div className="mb-4 p-4 bg-green-900/20 border border-green-900/40 text-green-400 rounded-md">
                        {successMessage}
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-4 p-4 bg-red-900/20 border border-red-900/40 text-red-400 rounded-md">
                        {errorMessage}
                    </div>
                )}

                {/* Форма создания/редактирования элемента */}
                {showElementForm && (
                    <div className="bg-gray-800 rounded-lg border border-gray-700 mb-6 animate-fadeIn">
                        <div className="flex justify-between items-center p-4 border-b border-gray-700">
                            <h2 className="text-lg font-medieval text-red-400">
                                {editingElement
                                    ? "РЕДАКТИРОВАНИЕ ЭЛЕМЕНТА"
                                    : "СОЗДАНИЕ НОВОГО ЭЛЕМЕНТА"}
                            </h2>
                            <button
                                onClick={() => setShowElementForm(false)}
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
                                handleSaveElement();
                            }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                                {/* Основная информация об элементе */}
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-gray-300 mb-2">
                                            НАЗВАНИЕ ЭЛЕМЕНТА
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                                            value={formElement.name || ""}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-300 mb-2">
                                            ИКОНКА
                                        </label>
                                        <input
                                            type="text"
                                            name="icon"
                                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                                            value={formElement.icon || ""}
                                            onChange={handleFormChange}
                                            placeholder="Эмодзи или символ"
                                        />
                                    </div>
                                </div>

                                {/* Дополнительная информация */}
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-gray-300 mb-2">
                                            ЦВЕТ
                                        </label>
                                        <div className="relative">
                                            <div
                                                className="flex items-center cursor-pointer p-2 border border-gray-700 rounded bg-gray-900"
                                                onClick={() =>
                                                    setShowColorPalette(
                                                        !showColorPalette
                                                    )
                                                }
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-md mr-3"
                                                    style={{
                                                        backgroundColor:
                                                            getColorFromTailwindClass(
                                                                formElement.color
                                                            ),
                                                    }}
                                                ></div>
                                                <span className="text-white">
                                                    {formElement.color ||
                                                        "Выберите цвет"}
                                                </span>
                                            </div>

                                            {showColorPalette && (
                                                <div className="absolute z-20 mt-1 p-3 bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-[400px] overflow-y-auto">
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {tailwindColors.map(
                                                            (colorGroup) => (
                                                                <div
                                                                    key={
                                                                        colorGroup.name
                                                                    }
                                                                    className="mb-3"
                                                                >
                                                                    <div className="text-xs text-gray-400 mb-1 capitalize">
                                                                        {
                                                                            colorGroup.name
                                                                        }
                                                                    </div>
                                                                    <div className="grid grid-cols-10 gap-1">
                                                                        {colorGroup.shades.map(
                                                                            (
                                                                                shade
                                                                            ) => (
                                                                                <div
                                                                                    key={`${colorGroup.name}-${shade}`}
                                                                                    className={`w-6 h-6 rounded-md cursor-pointer hover:ring-2 hover:ring-white ${
                                                                                        selectedColor ===
                                                                                            colorGroup.name &&
                                                                                        selectedShade ===
                                                                                            shade
                                                                                            ? "ring-2 ring-white"
                                                                                            : ""
                                                                                    }`}
                                                                                    style={{
                                                                                        backgroundColor:
                                                                                            tailwindColorValues[
                                                                                                colorGroup
                                                                                                    .name
                                                                                            ][
                                                                                                shade
                                                                                            ],
                                                                                    }}
                                                                                    title={`${colorGroup.name}-${shade}`}
                                                                                    onClick={() =>
                                                                                        handleColorSelect(
                                                                                            colorGroup.name,
                                                                                            shade
                                                                                        )
                                                                                    }
                                                                                ></div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-300 mb-2">
                                            ОПИСАНИЕ
                                        </label>
                                        <textarea
                                            name="description"
                                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white h-32"
                                            value={
                                                formElement.description || ""
                                            }
                                            onChange={handleFormChange}
                                        ></textarea>
                                    </div>

                                    <div className="mb-4 flex items-center">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            name="is_active"
                                            className="mr-2"
                                            checked={
                                                formElement.is_active === true
                                            }
                                            onChange={handleFormChange}
                                        />
                                        <label
                                            htmlFor="is_active"
                                            className="text-gray-300"
                                        >
                                            ЭЛЕМЕНТ АКТИВЕН
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between p-4 border-t border-gray-700">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
                                    onClick={() => setShowElementForm(false)}
                                >
                                    ОТМЕНА
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700 flex items-center"
                                    disabled={isMutationLoading}
                                >
                                    {isMutationLoading && (
                                        <Spinner size="sm" className="mr-2" />
                                    )}
                                    {editingElement
                                        ? "СОХРАНИТЬ ЭЛЕМЕНТ"
                                        : "СОЗДАТЬ ЭЛЕМЕНТ"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Таблица элементов */}
                <div className="bg-gray-800 rounded-lg border border-red-900/30 shadow-md overflow-hidden">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="h-8 w-8 animate-spin rounded-full border-t-4 border-red-600"></div>
                            <span className="ml-2 text-gray-400">
                                Загрузка...
                            </span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            ЭЛЕМЕНТ
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            ЦВЕТ
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            СТАТУС
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                                            ДЕЙСТВИЯ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {elements.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-4 py-4 text-center text-gray-400"
                                            >
                                                Элементы не найдены. Создайте
                                                первый элемент!
                                            </td>
                                        </tr>
                                    ) : (
                                        elements.map((element) => (
                                            <tr
                                                key={element.id}
                                                className="hover:bg-gray-750"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center">
                                                        <div
                                                            className="w-10 h-10 mr-3 flex items-center justify-center text-xl"
                                                            style={{
                                                                color: element.color
                                                                    ? getColorFromTailwindClass(
                                                                          element.color
                                                                      )
                                                                    : "#9ca3af",
                                                            }}
                                                        >
                                                            {element.icon ||
                                                                "❓"}
                                                        </div>
                                                        <div className="font-medium text-gray-300">
                                                            {element.name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div
                                                        className="w-10 h-6 rounded-md"
                                                        style={{
                                                            backgroundColor:
                                                                getColorFromTailwindClass(
                                                                    element.color
                                                                ),
                                                        }}
                                                        title={
                                                            element.color ||
                                                            "Цвет не указан"
                                                        }
                                                    ></div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            element.is_active
                                                                ? "bg-blue-900/20 text-blue-400"
                                                                : "bg-red-900/20 text-red-400"
                                                        }`}
                                                    >
                                                        {element.is_active
                                                            ? "АКТИВЕН"
                                                            : "НЕАКТИВЕН"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-medium">
                                                    <button
                                                        onClick={() =>
                                                            handleEditElement(
                                                                element
                                                            )
                                                        }
                                                        className="text-indigo-400 hover:text-indigo-300 mr-3"
                                                    >
                                                        Редактировать
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteElement(
                                                                element.id
                                                            )
                                                        }
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
                                Вы уверены, что хотите удалить этот элемент? Это
                                действие нельзя отменить.
                                <br />
                                <br />
                                <strong>Примечание:</strong> Элемент не может
                                быть удален, если он используется в ресурсах.
                            </p>
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-md"
                                    disabled={deleteElementMutation.isPending}
                                >
                                    {deleteElementMutation.isPending
                                        ? "Удаление..."
                                        : "Удалить"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
});

export default AdminElements;
