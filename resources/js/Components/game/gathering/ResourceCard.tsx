import React, { useState, useEffect } from "react";
import { Resource } from "../../../stores/ResourceStore";

interface ResourceCardProps {
    resource: Resource;
    isSelected: boolean;
    isDiscovered: boolean;
    onSelect: (resourceId: string) => void;
    gatherProgress?: number; // от 0 до 100
    isSelectedForAutoGathering?: boolean;
    onToggleAutoGathering?: () => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
    resource,
    isSelected,
    isDiscovered,
    onSelect,
    gatherProgress = 0,
    isSelectedForAutoGathering = false,
    onToggleAutoGathering = () => {},
}) => {
    // Эффект сбора ресурса (свечение)
    const [isGathering, setIsGathering] = useState(false);

    useEffect(() => {
        setIsGathering(gatherProgress > 0 && gatherProgress < 100);
    }, [gatherProgress]);

    // Цвета в зависимости от редкости ресурса
    const rarityColors = {
        common: "from-green-900/50 to-green-800/30 border-green-800/60",
        uncommon: "from-blue-900/50 to-blue-800/30 border-blue-800/60",
        rare: "from-purple-900/50 to-purple-800/30 border-purple-800/60",
        epic: "from-pink-900/50 to-pink-800/30 border-pink-800/60",
        legendary: "from-yellow-900/50 to-amber-800/30 border-amber-800/60",
    };

    // Ярлык редкости
    const rarityLabels = {
        common: "Обычный",
        uncommon: "Необычный",
        rare: "Редкий",
        epic: "Эпический",
        legendary: "Легендарный",
    };

    return (
        <div
            className={`relative flex flex-col rounded-md p-2 transition-all cursor-pointer hover:scale-[1.02]
                     ${
                         isSelected
                             ? "ring-2 ring-offset-1 ring-red-500 ring-offset-gray-900 bg-gradient-to-br from-gray-800/80 to-gray-900/80"
                             : "bg-gradient-to-br from-gray-800/50 to-gray-900/50"
                     }
                     ${isGathering ? "animate-pulse" : ""}`}
            style={{ borderWidth: "1px", borderStyle: "solid" }}
            onClick={() => onSelect(resource.id)}
        >
            {/* Индикатор процесса сбора */}
            {gatherProgress > 0 && (
                <div
                    className="absolute bottom-0 left-0 h-1 bg-red-500 rounded-b-md"
                    style={{
                        width: `${gatherProgress}%`,
                        transition: "width 0.1s linear",
                    }}
                ></div>
            )}

            {/* Кнопка выбора для автодобычи (только для открытых ресурсов) */}
            {isDiscovered && (
                <button
                    className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center z-10
                    ${
                        isSelectedForAutoGathering
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleAutoGathering();
                    }}
                    title={
                        isSelectedForAutoGathering
                            ? "Убрать из автодобычи"
                            : "Добавить в автодобычу"
                    }
                >
                    <span className="text-xs">
                        {isSelectedForAutoGathering ? "⛔" : "✓"}
                    </span>
                </button>
            )}

            <div className="flex items-start mb-1.5 gap-2">
                {/* Иконка ресурса */}
                <div
                    className={`flex items-center justify-center w-10 h-10 rounded-md bg-gradient-to-br ${
                        rarityColors[resource.rarity]
                    } border text-xl shadow-sm`}
                >
                    {resource.icon}
                </div>

                <div className="flex-1 overflow-hidden">
                    {/* Название ресурса */}
                    <div className="text-sm font-medium text-white truncate">
                        {resource.name}
                    </div>

                    {/* Ярлык редкости */}
                    <div
                        className={`text-xs ${
                            resource.rarity === "legendary"
                                ? "text-amber-400"
                                : resource.rarity === "epic"
                                ? "text-pink-400"
                                : resource.rarity === "rare"
                                ? "text-purple-400"
                                : resource.rarity === "uncommon"
                                ? "text-blue-400"
                                : "text-green-400"
                        }`}
                    >
                        {rarityLabels[resource.rarity]}
                    </div>
                </div>
            </div>

            {/* Описание и информация о ресурсе */}
            <div className="text-xs text-gray-400 line-clamp-2 mb-2">
                {isDiscovered ? (
                    resource.description
                ) : (
                    <span className="text-gray-500 italic">
                        {resource.description.replace(/[а-яА-Яa-zA-Z]/g, "?")}
                    </span>
                )}
            </div>

            {/* Индикатор элементов для подсказки (только если ресурс открыт) */}
            {isDiscovered && (
                <div className="flex space-x-1 mt-auto">
                    {resource.elementCombination.map((element, index) => (
                        <div
                            key={index}
                            className="w-4 h-4 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center"
                        >
                            <div className="w-2 h-2 rounded-full bg-red-900"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Статус открытия */}
            {!isDiscovered && (
                <div className="mt-auto text-xs text-gray-500 italic">
                    Состав не изучен
                </div>
            )}
        </div>
    );
};

export default ResourceCard;
