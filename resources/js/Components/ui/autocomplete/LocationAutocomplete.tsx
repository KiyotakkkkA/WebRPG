import React, { useState, useRef, useEffect } from "react";
import Spinner from "../Spinner";
import { Link } from "react-router-dom";

// Тип для локации
interface Location {
    id: number;
    name: string;
}

// Тип для настроек локации
interface LocationSettings {
    spawn_chance: number;
    min_amount: number;
    max_amount: number;
}

// Интерфейс для локации с настройками в формате для новой структуры
interface LocationWithSettings {
    id: number;
    spawn_chance: number;
    min_amount: number;
    max_amount: number;
}

interface LocationAutocompleteProps {
    locations: Location[];
    selectedLocationIds: number[]; // Для обратной совместимости
    locationSettings: Record<number, LocationSettings>; // Для обратной совместимости
    onLocationToggle: (locationId: number) => void;
    onLocationSettingChange: (
        locationId: number,
        setting: string,
        value: number
    ) => void;
    className?: string;
    formLocations?: LocationWithSettings[]; // Новое свойство для работы с новой структурой
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
    locations,
    selectedLocationIds,
    locationSettings,
    onLocationToggle,
    onLocationSettingChange,
    className = "",
    formLocations = [],
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    // Используем выбранные ID локаций из обоих источников
    const actualSelectedLocationIds =
        formLocations.length > 0
            ? formLocations.map((loc) => loc.id)
            : selectedLocationIds;

    // Функция получения настроек локации из обоих источников данных
    const getLocationSettings = (locationId: number) => {
        // Сначала смотрим в новой структуре
        const locationInForm = formLocations.find(
            (loc) => loc.id === locationId
        );
        if (locationInForm) {
            return {
                spawn_chance: locationInForm.spawn_chance,
                min_amount: locationInForm.min_amount,
                max_amount: locationInForm.max_amount,
            };
        }

        // Затем в старой структуре для обратной совместимости
        return (
            locationSettings[locationId] || {
                spawn_chance: 0.5,
                min_amount: 1,
                max_amount: 3,
            }
        );
    };

    // Фильтрация локаций на основе поискового запроса
    const filteredLocations = locations.filter((location) =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Отслеживаем клики вне выпадающего списка
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

    // Отслеживаем клики вне окна настроек
    useEffect(() => {
        const handleClickOutsideSettings = (event: MouseEvent) => {
            if (
                settingsRef.current &&
                !settingsRef.current.contains(event.target as Node)
            ) {
                setSettingsOpen(null);
            }
        };

        if (settingsOpen !== null) {
            document.addEventListener("mousedown", handleClickOutsideSettings);
        }

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutsideSettings
            );
        };
    }, [settingsOpen]);

    // Обработчик выбора локации
    const handleLocationSelect = (locationId: number) => {
        onLocationToggle(locationId);
    };

    // Обработчик открытия/закрытия настроек локации
    const toggleSettings = (locationId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSettingsOpen(settingsOpen === locationId ? null : locationId);
    };

    // Отображение выбранных локаций
    const renderSelectedLocations = () => {
        if (actualSelectedLocationIds.length === 0) {
            return (
                <div className="text-gray-500 italic text-sm my-2">
                    Локации не выбраны
                </div>
            );
        }

        return (
            <div className="mt-2 space-y-2">
                {actualSelectedLocationIds.map((id) => {
                    const location = locations.find((loc) => loc.id === id);
                    if (!location) return null;

                    // Получаем настройки из комбинированного источника
                    const settings = getLocationSettings(id);

                    return (
                        <div
                            key={id}
                            className="flex items-center justify-between bg-gray-800 rounded-md p-2 group"
                        >
                            <div className="flex items-center">
                                <button
                                    type="button"
                                    className="text-red-400 mr-2 hover:text-red-300"
                                    onClick={() => onLocationToggle(id)}
                                    title="Удалить локацию"
                                >
                                    ✕
                                </button>
                                <Link
                                    to={`/admin/locations`}
                                    state={{ editLocationId: id }}
                                    className="text-white hover:text-red-300 hover:underline cursor-pointer transition-colors"
                                    title="Редактировать локацию"
                                >
                                    {location.name}
                                </Link>
                            </div>
                            <button
                                type="button"
                                className={`text-gray-400 hover:text-gray-300 transition ${
                                    settingsOpen === id ? "text-blue-400" : ""
                                }`}
                                onClick={(e) => toggleSettings(id, e)}
                                title="Настроить параметры"
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
                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </button>

                            {/* Параметры локации */}
                            {settingsOpen === id && (
                                <div
                                    ref={settingsRef}
                                    className="absolute right-0 mt-2 w-full bg-gray-900 border border-gray-700 rounded-md p-3 shadow-lg z-20"
                                >
                                    <div className="flex items-center justify-between mb-2 group">
                                        <div className="text-xs text-white font-medium">
                                            НАСТРОЙКИ ЛОКАЦИИ
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">
                                                ШАНС ПОЯВЛЕНИЯ
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.spawn_chance}
                                                onChange={(e) =>
                                                    onLocationSettingChange(
                                                        id,
                                                        "spawn_chance",
                                                        parseFloat(
                                                            e.target.value
                                                        )
                                                    )
                                                }
                                                className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-white text-sm"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">
                                                МИН КОЛ-ВО
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.min_amount}
                                                onChange={(e) =>
                                                    onLocationSettingChange(
                                                        id,
                                                        "min_amount",
                                                        parseInt(e.target.value)
                                                    )
                                                }
                                                className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-white text-sm"
                                                min="1"
                                                max={settings.max_amount}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">
                                                МАКС КОЛ-ВО
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.max_amount}
                                                onChange={(e) =>
                                                    onLocationSettingChange(
                                                        id,
                                                        "max_amount",
                                                        parseInt(e.target.value)
                                                    )
                                                }
                                                className="w-full bg-gray-800 border border-gray-700 rounded p-1 text-white text-sm"
                                                min={settings.min_amount}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Поиск локаций..."
                    className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsDropdownOpen(true)}
                />
                <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    onClick={() => {
                        setSearchTerm("");
                        inputRef.current?.focus();
                    }}
                >
                    {searchTerm && "✕"}
                </button>
            </div>

            {/* Список выбранных локаций */}
            <div className="mt-2 relative">{renderSelectedLocations()}</div>

            {/* Выпадающий список локаций */}
            {isDropdownOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute left-0 right-0 z-10 mt-1 max-h-48 overflow-auto bg-gray-900 border border-gray-700 rounded-md shadow-lg"
                >
                    {filteredLocations.length === 0 ? (
                        <div className="p-2 text-gray-400 text-sm">
                            Локации не найдены
                        </div>
                    ) : (
                        filteredLocations.map((location) => (
                            <div
                                key={location.id}
                                className={`flex items-center justify-between p-2 hover:bg-gray-800 cursor-pointer ${
                                    actualSelectedLocationIds.includes(
                                        location.id
                                    )
                                        ? "bg-red-900/30 hover:bg-red-900/40"
                                        : ""
                                }`}
                                onClick={() =>
                                    handleLocationSelect(location.id)
                                }
                            >
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={actualSelectedLocationIds.includes(
                                            location.id
                                        )}
                                        onChange={() =>
                                            handleLocationSelect(location.id)
                                        }
                                        className="mr-2"
                                    />
                                    <span className="text-white">
                                        {location.name}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationAutocomplete;
