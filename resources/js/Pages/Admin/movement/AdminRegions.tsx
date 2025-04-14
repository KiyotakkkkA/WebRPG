import React, { useState, useEffect } from "react";
import AdminLayout from "../AdminLayout";
import axios from "../../../config/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Типы данных
interface Region {
    id: number;
    name: string;
    description: string | null;
    is_accessible: boolean;
    icon: string | null;
    created_at: string;
    updated_at: string;
    locations_count?: number;
}

interface RegionFormData {
    name: string;
    description: string;
    is_accessible: boolean;
}

const AdminRegions: React.FC = () => {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingRegion, setEditingRegion] = useState<Region | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Загрузка списка регионов
    const {
        data: regions,
        isLoading,
        error: fetchError,
    } = useQuery({
        queryKey: ["regions"],
        queryFn: async () => {
            try {
                const response = await axios.get("/api/admin/regions");
                // Добавляем количество локаций для каждого региона (виртуальное поле)
                const regionsWithCounts = await Promise.all(
                    response.data.map(async (region: Region) => {
                        try {
                            const regionDetails = await axios.get(
                                `/api/admin/regions/${region.id}`
                            );
                            return {
                                ...region,
                                locations_count: regionDetails.data.locations
                                    ? regionDetails.data.locations.length
                                    : 0,
                            };
                        } catch (error) {
                            console.error(
                                `Ошибка при получении данных для региона ${region.id}:`,
                                error
                            );
                            return { ...region, locations_count: 0 };
                        }
                    })
                );
                return regionsWithCounts;
            } catch (error) {
                console.error("Ошибка при загрузке регионов:", error);
                throw new Error("Не удалось загрузить регионы");
            }
        },
    });

    // Мутация для создания нового региона
    const createRegionMutation = useMutation({
        mutationFn: async (data: RegionFormData) => {
            const response = await axios.post("/api/admin/regions", data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["regions"] });
            setSuccessMessage("Регион успешно создан");
            setShowForm(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error) => {
            console.error("Ошибка при создании региона:", error);
            setError("Не удалось создать регион");
        },
    });

    // Мутация для обновления региона
    const updateRegionMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: RegionFormData;
        }) => {
            const response = await axios.put(`/api/admin/regions/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["regions"] });
            setSuccessMessage("Регион успешно обновлен");
            setShowForm(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error) => {
            console.error("Ошибка при обновлении региона:", error);
            setError("Не удалось обновить регион");
        },
    });

    // Мутация для удаления региона
    const deleteRegionMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await axios.delete(`/api/admin/regions/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["regions"] });
            setSuccessMessage("Регион успешно удален");
            setIsDeleteModalOpen(false);
            setSelectedRegion(null);
            setTimeout(() => setSuccessMessage(null), 3000);
        },
        onError: (error: any) => {
            console.error("Ошибка при удалении региона:", error);
            if (error.response?.status === 422) {
                setError("Невозможно удалить регион, содержащий локации");
            } else {
                setError("Не удалось удалить регион");
            }
        },
    });

    // Открытие формы для создания нового региона
    const handleAddRegion = () => {
        setEditingRegion(null);
        setShowForm(true);
    };

    // Открытие формы для редактирования региона
    const handleEditRegion = (region: Region) => {
        setEditingRegion(region);
        setShowForm(true);
    };

    // Открытие диалога подтверждения удаления
    const openDeleteModal = (region: Region) => {
        setSelectedRegion(region);
        setIsDeleteModalOpen(true);
    };

    // Определяем общее состояние загрузки на основе всех мутаций
    const isMutating =
        createRegionMutation.isPending ||
        updateRegionMutation.isPending ||
        deleteRegionMutation.isPending;

    // Компонент формы создания/редактирования региона
    const RegionForm = () => {
        const [name, setName] = useState(editingRegion?.name || "");
        const [description, setDescription] = useState(
            editingRegion?.description || ""
        );
        const [isAccessible, setIsAccessible] = useState(
            editingRegion?.is_accessible !== undefined
                ? editingRegion.is_accessible
                : true
        );

        useEffect(() => {
            // Если редактируем регион, заполняем форму его данными
            if (editingRegion) {
                setName(editingRegion.name);
                setDescription(editingRegion.description || "");
                setIsAccessible(editingRegion.is_accessible);
            } else {
                // Если создаём новый регион, сбрасываем форму
                resetForm();
            }
        }, [editingRegion]);

        const resetForm = () => {
            setName("");
            setDescription("");
            setIsAccessible(true);
            setError("");
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();

            // Валидация формы
            if (!name.trim()) {
                setError("Название региона не может быть пустым");
                return;
            }

            // Сбрасываем ошибку, если все в порядке
            setError(null);

            const formData: RegionFormData = {
                name: name.trim(),
                description: description.trim(),
                is_accessible: isAccessible,
            };

            if (editingRegion) {
                updateRegionMutation.mutate({
                    id: editingRegion.id,
                    data: formData,
                });
            } else {
                createRegionMutation.mutate(formData);
            }
        };

        return (
            <div className="bg-gray-800 p-6 rounded-lg border border-red-900/30 shadow-md mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medieval text-red-400">
                        {editingRegion
                            ? "РЕДАКТИРОВАНИЕ РЕГИОНА"
                            : "СОЗДАНИЕ НОВОГО РЕГИОНА"}
                    </h3>
                    <button
                        onClick={() => {
                            setShowForm(false);
                            setEditingRegion(null);
                        }}
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

                {error && (
                    <div className="mb-4 p-4 bg-red-900/20 border border-red-900/40 text-red-400 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="mb-4">
                        <label
                            htmlFor="name"
                            className="block text-gray-300 font-medieval mb-2"
                        >
                            НАЗВАНИЕ РЕГИОНА
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

                    <div className="flex items-center pt-4">
                        <input
                            type="checkbox"
                            id="is_accessible"
                            checked={isAccessible}
                            onChange={(e) => setIsAccessible(e.target.checked)}
                            className="h-5 w-5 text-red-700 bg-gray-900 border-red-900/40 rounded focus:ring-red-700/50 focus:ring-offset-gray-900"
                        />
                        <label
                            htmlFor="is_accessible"
                            className="ml-2 block text-gray-300 font-medieval"
                        >
                            ДОСТУПЕН ДЛЯ ИГРОКОВ
                        </label>
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className="block text-gray-300 font-medieval mb-2"
                        >
                            ОПИСАНИЕ РЕГИОНА
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 bg-gray-900 text-gray-300 border border-red-900/40 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-700/50 focus:border-red-700/50"
                        ></textarea>
                    </div>

                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditingRegion(null);
                            }}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md shadow-sm border border-gray-700"
                        >
                            ОТМЕНА
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
                                    СОХРАНЕНИЕ...
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
                                    {editingRegion ? "ОБНОВИТЬ" : "СОЗДАТЬ"}{" "}
                                    РЕГИОН
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    return (
        <AdminLayout pageTitle="Управление регионами">
            <div className="p-4">
                <button
                    onClick={handleAddRegion}
                    className="bg-red-700 hover:bg-red-800 text-white py-2 px-4 rounded mb-4"
                >
                    + ДОБАВИТЬ РЕГИОН
                </button>

                {/* Сообщения */}
                {successMessage && (
                    <div className="mb-4 p-4 bg-green-900/20 border border-green-900/40 text-green-400 rounded-md">
                        {successMessage}
                    </div>
                )}

                {fetchError && (
                    <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded mb-4">
                        Ошибка при загрузке регионов
                    </div>
                )}

                {/* Форма */}
                {showForm && <RegionForm />}

                {isLoading && (
                    <div className="flex justify-center my-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
                    </div>
                )}

                {regions && regions.length === 0 && !isLoading && (
                    <div className="bg-gray-800 border border-gray-700 text-gray-400 px-4 py-3 rounded mb-4">
                        Нет созданных регионов. Создайте первый регион, нажав на
                        кнопку "ДОБАВИТЬ РЕГИОН".
                    </div>
                )}

                {regions && regions.length > 0 && (
                    <div className="bg-gray-800 rounded-lg border border-red-900/30 shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            РЕГИОН
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            СТАТУС
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                                            ЛОКАЦИЙ
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                                            ДЕЙСТВИЯ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {regions.map((region: Region) => (
                                        <tr
                                            key={region.id}
                                            className="hover:bg-gray-750"
                                        >
                                            <td className="px-4 py-4 text-gray-100">
                                                <div className="font-bold">
                                                    {region.name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {region.is_accessible ? (
                                                    <div className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-xs inline-block">
                                                        ДОСТУПЕН
                                                    </div>
                                                ) : (
                                                    <div className="bg-red-900/30 text-red-400 px-3 py-1 rounded-full text-xs inline-block">
                                                        ЗАКРЫТ
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-gray-300">
                                                {region.locations_count || 0}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button
                                                    onClick={() =>
                                                        handleEditRegion(region)
                                                    }
                                                    className="text-indigo-400 hover:text-indigo-300 mr-3"
                                                >
                                                    РЕДАКТИРОВАТЬ
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        openDeleteModal(region)
                                                    }
                                                    className="text-red-400 hover:text-red-300"
                                                    disabled={Boolean(
                                                        region.locations_count &&
                                                            region.locations_count >
                                                                0
                                                    )}
                                                >
                                                    УДАЛИТЬ
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Модальное окно подтверждения удаления */}
                {isDeleteModalOpen && selectedRegion && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md border border-red-900/30">
                            <h3 className="text-lg font-medieval text-red-400 mb-4">
                                Подтверждение удаления
                            </h3>
                            <p className="text-gray-300 mb-4">
                                Вы уверены, что хотите удалить регион "
                                {selectedRegion.name}"?
                            </p>
                            {selectedRegion.locations_count &&
                                selectedRegion.locations_count > 0 && (
                                    <div className="bg-yellow-900/30 border border-yellow-800 text-yellow-400 px-4 py-2 rounded mb-4">
                                        <p>
                                            Этот регион содержит{" "}
                                            {selectedRegion.locations_count}{" "}
                                            локаций.
                                        </p>
                                        <p>
                                            Сначала необходимо удалить или
                                            переместить эти локации в другой
                                            регион.
                                        </p>
                                    </div>
                                )}
                            <div className="flex justify-between">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md shadow-sm border border-gray-700"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={() =>
                                        deleteRegionMutation.mutate(
                                            selectedRegion.id
                                        )
                                    }
                                    className="px-4 py-2 bg-red-900/60 hover:bg-red-800 text-gray-200 rounded-md shadow-sm border border-red-900/70 flex items-center"
                                    disabled={
                                        deleteRegionMutation.isPending ||
                                        Boolean(
                                            selectedRegion.locations_count &&
                                                selectedRegion.locations_count >
                                                    0
                                        )
                                    }
                                >
                                    {deleteRegionMutation.isPending ? (
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
                                        "Удалить"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminRegions;
