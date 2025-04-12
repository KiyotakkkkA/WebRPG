import React from "react";
import { Location } from "../../../stores/LocationStore";

// Компонент для отображения отдельной локации в списке
export const LocationItem: React.FC<{
    location: Location;
    onClick: (location: Location) => void;
    isActive: boolean;
    onShowRequirements: (location: Location) => void;
}> = ({ location, onClick, isActive, onShowRequirements }) => {
    return (
        <div
            className={`p-2 rounded-md cursor-pointer hover:bg-gray-700 border transition-colors duration-200 ${
                location.is_current
                    ? "bg-red-900/30 border-red-800/50"
                    : isActive
                    ? "bg-yellow-900/20 border-yellow-800/40"
                    : "border-transparent hover:border-red-900/30"
            }`}
            onClick={() => onClick(location)}
        >
            <div className="flex items-center justify-between">
                <span
                    className={`text-sm ${
                        location.is_accessible
                            ? "text-red-400"
                            : "text-gray-500"
                    }`}
                >
                    {location.name}
                </span>
                <div className="flex items-center space-x-1">
                    {location.is_current && (
                        <span title="Вы здесь" className="text-xs text-red-300">
                            ⚑
                        </span>
                    )}
                    {!location.is_accessible && (
                        <button
                            title="Показать требования"
                            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onShowRequirements(location);
                            }}
                        >
                            🔒
                        </button>
                    )}
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                {location.description.length > 50
                    ? `${location.description.slice(0, 50)}...`
                    : location.description}
            </p>
            <div className="mt-1.5 flex justify-between items-center">
                <div className="flex">
                    {[...Array(5)].map((_, i) => (
                        <span
                            key={i}
                            className={`w-2 h-2 rounded-full mx-0.5 ${
                                i < (location.danger_level || 0)
                                    ? "bg-red-600"
                                    : "bg-gray-600"
                            }`}
                            title={`Уровень опасности: ${location.danger_level}/5`}
                        ></span>
                    ))}
                </div>
                {location.is_accessible && !location.is_current && (
                    <span
                        className="text-xs text-green-500"
                        title="Локация доступна для перехода"
                    >
                        ✓
                    </span>
                )}
            </div>
        </div>
    );
};

// Компонент списка локаций
const LocationsList: React.FC<{
    availableLocations: Location[];
    activeLocationId: number | null;
    onLocationSelect: (location: Location) => void;
    onShowRequirements: (location: Location) => void;
    showAccessibleOnly?: boolean;
}> = ({
    availableLocations,
    activeLocationId,
    onLocationSelect,
    onShowRequirements,
    showAccessibleOnly = true,
}) => {
    // Фильтрация локаций по доступности
    const filteredLocations = showAccessibleOnly
        ? availableLocations.filter(
              (location) =>
                  location.is_accessible_from_current && !location.is_current
          )
        : availableLocations.filter((location) => !location.is_current);

    return (
        <div className="space-y-2">
            {filteredLocations.map((location) => (
                <LocationItem
                    key={location.id}
                    location={location}
                    onClick={onLocationSelect}
                    isActive={activeLocationId === location.id}
                    onShowRequirements={onShowRequirements}
                />
            ))}
            {filteredLocations.length === 0 && (
                <div className="text-sm text-gray-500 text-center p-4">
                    <div className="font-medieval text-red-500">
                        Нет доступных локаций для перехода
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                        Пожалуйста, исследуйте текущую локацию, чтобы открыть
                        путь в новые области
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationsList;
