import React from "react";
import { LocationObject } from "../../../stores/LocationStore";
import { objectTypeIcons, objectIconMap } from "../../ui/GameIcons";

// Компонент для отображения отдельного объекта
export const GameObjectItem: React.FC<{
    object: LocationObject;
    onClick: (object: LocationObject) => void;
}> = ({ object, onClick }) => {
    // Получаем иконку для объекта из предопределенных иконок или используем стандартную для типа
    const icon =
        objectIconMap[object.id as keyof typeof objectIconMap] ||
        objectTypeIcons[object.type as keyof typeof objectTypeIcons];

    return (
        <div
            className="flex items-center space-x-2 p-2 hover:bg-gray-800/60 rounded-md cursor-pointer border border-transparent hover:border-red-900/30 transition-colors"
            onClick={() => onClick(object)}
        >
            <span className="text-gray-400 w-6">
                {icon || <span className="text-xl">{object.icon}</span>}
            </span>
            <span className="text-sm text-gray-300">{object.name}</span>
        </div>
    );
};

// Компонент для списка объектов
const LocationObjects: React.FC<{
    objects: LocationObject[] | undefined;
    onObjectSelect: (object: LocationObject) => void;
}> = ({ objects, onObjectSelect }) => {
    // Группируем объекты по типу для более удобного отображения
    const groupedObjects = React.useMemo(() => {
        if (!objects || objects.length === 0) return {};

        return objects.reduce((groups, obj) => {
            const type = obj.type;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(obj);
            return groups;
        }, {} as Record<string, LocationObject[]>);
    }, [objects]);

    // Заголовки для групп объектов
    const typeLabels: Record<string, string> = {
        building: "Строения",
        npc: "Персонажи",
        monster: "Существа",
        resource: "Ресурсы",
    };

    // Если нет объектов, показываем сообщение
    if (!objects || objects.length === 0) {
        return (
            <div className="text-sm text-gray-500 text-center p-4">
                В этой локации нет объектов
            </div>
        );
    }

    // Если мы не группируем объекты, просто отображаем все в одном списке
    if (Object.keys(groupedObjects).length === 0) {
        return (
            <div className="space-y-1">
                {objects.map((object, index) => (
                    <GameObjectItem
                        key={`${object.id}-${index}`}
                        object={object}
                        onClick={onObjectSelect}
                    />
                ))}
            </div>
        );
    }

    // Отображаем сгруппированные объекты
    return (
        <div className="space-y-4">
            {Object.entries(groupedObjects).map(([type, objectsList]) => (
                <div key={type}>
                    <h4 className="text-xs text-gray-400 mb-1 font-medium border-b border-gray-800 pb-1">
                        {typeLabels[type] || type}
                    </h4>
                    <div className="space-y-1">
                        {objectsList.map((object, index) => (
                            <GameObjectItem
                                key={`${object.id}-${index}`}
                                object={object}
                                onClick={onObjectSelect}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LocationObjects;
