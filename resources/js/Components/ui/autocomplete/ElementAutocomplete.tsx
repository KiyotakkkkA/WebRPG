import React, { useState, useRef, useEffect } from "react";
import { styling } from "../../../utils/methods";

// Интерфейс элемента
interface Element {
    id: number;
    name: string;
    icon: string;
    color: string;
    description: string | null;
    is_active: boolean;
}

interface ElementAutocompleteProps {
    elements: Element[];
    selectedElementIds: number[];
    onElementToggle: (elementId: number) => void;
    maxElements?: number;
    className?: string;
}

const ElementAutocomplete: React.FC<ElementAutocompleteProps> = ({
    elements,
    selectedElementIds,
    onElementToggle,
    maxElements = 5,
    className = "",
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [filteredElements, setFilteredElements] =
        useState<Element[]>(elements);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Фильтрация элементов при изменении поискового запроса
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredElements(elements);
        } else {
            const filtered = elements.filter((element) =>
                element.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredElements(filtered);
        }
    }, [searchTerm, elements]);

    // Обработка клика вне компонента для закрытия выпадающего списка
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Обработчик выбора элемента
    const handleElementSelect = (elementId: number) => {
        // Проверяем, не превышен ли лимит выбранных элементов
        if (
            !selectedElementIds.includes(elementId) &&
            selectedElementIds.length >= maxElements
        ) {
            alert(`Вы не можете выбрать больше ${maxElements} элементов`);
            return;
        }
        onElementToggle(elementId);
    };

    // Используем React Router для навигации вместо window.location
    const handleNavigateToElement = (elementId: number) => {
        // Перенаправляем на редактирование элемента в текущей вкладке
        window.location.href = `/admin/elements?editElementId=${elementId}`;
    };

    // Отображение выбранных элементов
    const renderSelectedElements = () => {
        if (selectedElementIds.length === 0) {
            return (
                <div className="text-gray-500 italic text-sm my-2">
                    Элементы не выбраны
                </div>
            );
        }

        return (
            <div className="mt-2 space-y-2">
                {selectedElementIds.map((id) => {
                    const element = elements.find((elem) => elem.id === id);
                    if (!element) return null;

                    return (
                        <div
                            key={id}
                            className="flex items-center justify-between bg-gray-800 rounded-md p-2 group"
                        >
                            <div className="flex items-center">
                                <button
                                    type="button"
                                    className="text-red-400 mr-2 hover:text-red-300"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onElementToggle(id);
                                    }}
                                    title="Удалить элемент"
                                >
                                    ✕
                                </button>
                                <span className="mr-2">{element.icon}</span>
                                <span
                                    className="hover:underline cursor-pointer transition-colors"
                                    style={styling.getColorStyle(element.color)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNavigateToElement(id);
                                    }}
                                    title="Редактировать элемент"
                                >
                                    {element.name}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={`relative ${className}`}>
            <div className="mb-1 text-sm font-medium text-gray-300">
                Выберите элементы (максимум {maxElements}):
            </div>

            {/* Поле поиска */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={() => setIsDropdownOpen(true)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    placeholder="Поиск элементов..."
                />

                {/* Выпадающий список */}
                {isDropdownOpen && (
                    <div
                        ref={dropdownRef}
                        className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
                    >
                        {filteredElements.length > 0 ? (
                            filteredElements.map((element) => (
                                <div
                                    key={element.id}
                                    className={`px-4 py-2 cursor-pointer hover:bg-gray-800 flex items-center justify-between ${
                                        selectedElementIds.includes(element.id)
                                            ? "bg-gray-700"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        handleElementSelect(element.id)
                                    }
                                >
                                    <div className="flex items-center">
                                        <span className="mr-2">
                                            {element.icon}
                                        </span>
                                        <span
                                            style={styling.getColorStyle(
                                                element.color
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNavigateToElement(
                                                    element.id
                                                );
                                            }}
                                            className="hover:underline cursor-pointer"
                                        >
                                            {element.name}
                                        </span>
                                    </div>
                                    {selectedElementIds.includes(
                                        element.id
                                    ) && (
                                        <span className="text-green-500">
                                            ✓
                                        </span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-2 text-gray-400">
                                Элементы не найдены
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Выбранные элементы */}
            <div className="flex flex-wrap gap-2 mb-2">
                {renderSelectedElements()}
            </div>
        </div>
    );
};

export default ElementAutocomplete;
