import React from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import characterStore from "../stores/CharacterStore";

// Компонент ресурсной полосы (здоровье, мана, выносливость)
const ResourceBar: React.FC<{
    current: number;
    max: number;
    color: string;
    label: string;
    className?: string;
}> = ({ current, max, color, label, className = "" }) => {
    const percentage = Math.floor((current / max) * 100);

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <span className="text-xs text-gray-400 w-10">{label}:</span>
            <div className="flex-1 bg-gray-800 h-4 rounded-sm border border-gray-700 overflow-hidden">
                <div
                    className={`h-full rounded-sm ${color}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <span className="text-xs text-gray-300 w-16 text-right">
                {current}/{max}
            </span>
        </div>
    );
};

interface GameHeaderProps {
    activeLocationName?: string;
}

const GameHeader: React.FC<GameHeaderProps> = observer(
    ({ activeLocationName }) => {
        const navigate = useNavigate();

        // Проверяем состояние загрузки и наличие персонажа
        if (characterStore.isLoading) {
            return (
                <div className="h-24 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-red-900/60 flex items-center justify-center px-6 py-3 shadow-lg">
                    <div className="text-red-400 font-medieval animate-pulse">
                        Загрузка данных персонажа...
                    </div>
                </div>
            );
        }

        if (!characterStore.selectedCharacter) {
            return (
                <div className="h-24 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-red-900/60 flex items-center justify-center px-6 py-3 shadow-lg">
                    <div className="text-red-400 font-medieval">
                        Персонаж не загружен.
                        <button
                            className="ml-2 text-red-300 underline hover:text-red-200"
                            onClick={() => navigate("/characters")}
                        >
                            Вернуться к выбору персонажа
                        </button>
                    </div>
                </div>
            );
        }

        const character = characterStore.selectedCharacter;

        return (
            <div className="h-24 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-red-900/60 flex items-center px-6 py-3 justify-between shadow-lg">
                {/* Аватар и имя персонажа */}
                <div className="flex items-center bg-gray-900/60 p-2 rounded-lg border border-red-900/40 shadow-md">
                    <div className="relative mr-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-red-800 shadow-lg">
                            <img
                                src={`/images/classes/${character.class}.jpg`}
                                alt={character.class}
                                className="w-full h-full object-cover"
                                onError={(
                                    e: React.SyntheticEvent<HTMLImageElement>
                                ) => {
                                    (e.target as HTMLImageElement).src =
                                        "/images/fallback-hero.jpg";
                                }}
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-red-900 text-xs text-white px-1 rounded-sm border border-red-700 shadow">
                            {character.level}
                        </div>
                    </div>

                    <div>
                        <div className="text-sm text-red-400 font-medieval">
                            {character.name}
                        </div>
                        <div className="text-xs text-gray-500">
                            {activeLocationName || "Неизвестное место"}
                        </div>
                    </div>
                </div>

                {/* Основной блок ресурсов (здоровье, мана, выносливость) */}
                <div className="flex-1 max-w-md mx-6 space-y-1 bg-gray-900/60 p-3 rounded-lg border border-red-900/40 shadow-md">
                    <ResourceBar
                        current={character.health}
                        max={character.max_health}
                        color="bg-gradient-to-r from-red-800 to-red-600"
                        label="ЗДР"
                    />
                    <ResourceBar
                        current={character.mana}
                        max={character.max_mana}
                        color="bg-gradient-to-r from-blue-800 to-blue-600"
                        label="МАН"
                    />
                    <ResourceBar
                        current={character.stamina}
                        max={character.max_stamina}
                        color="bg-gradient-to-r from-green-800 to-green-600"
                        label="ВЫН"
                    />
                </div>

                {/* Дополнительные характеристики (скорость, опыт) */}
                <div className="w-48 mx-4 space-y-2">
                    {/* Блок скорости */}
                    <div
                        className="bg-gray-900/60 px-3 py-1 rounded text-xs text-gray-300 border border-gray-700 flex items-center justify-between shadow-md"
                        title="Скорость перемещения влияет на время путешествия между локациями"
                    >
                        <span className="flex items-center">
                            <span className="text-lime-500 mr-2">🏃</span>{" "}
                            Скорость
                        </span>
                        <span className="text-lime-400 font-bold">
                            {character.speed}
                        </span>
                    </div>

                    {/* Полоса опыта (использует метод из CharacterStore) */}
                    <div className="bg-gray-900/60 px-2 py-1 rounded border border-gray-700 shadow-md">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Опыт:</span>
                            <span className="text-yellow-400">
                                {character.experience}/
                                {character.exp_to_next_level}
                            </span>
                        </div>
                        <div className="h-2 relative w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-700 to-yellow-500 transition-all duration-300"
                                style={{
                                    width: `${characterStore.getExpPercentage()}%`,
                                }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Кнопки быстрого доступа */}
                <div className="flex space-x-3 mx-4">
                    <button
                        className="bg-gradient-to-b from-gray-800 to-gray-900 border border-red-900/40 rounded-md p-2 hover:from-gray-700 hover:to-gray-800 transition-all shadow-md group"
                        title="Локация"
                        onClick={() => navigate(`/game`)}
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-xl text-red-500 group-hover:text-red-400">
                                🏠
                            </span>
                            <span className="text-xs text-gray-400 mt-1 group-hover:text-gray-300">
                                Локация
                            </span>
                        </div>
                    </button>
                    <button
                        className="bg-gradient-to-b from-gray-800 to-gray-900 border border-red-900/40 rounded-md p-2 hover:from-gray-700 hover:to-gray-800 transition-all shadow-md group"
                        title="Инвентарь"
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-xl text-red-500 group-hover:text-red-400">
                                🎒
                            </span>
                            <span className="text-xs text-gray-400 mt-1 group-hover:text-gray-300">
                                Инвентарь
                            </span>
                        </div>
                    </button>
                    <button
                        className="bg-gradient-to-b from-gray-800 to-gray-900 border border-red-900/40 rounded-md p-2 hover:from-gray-700 hover:to-gray-800 transition-all shadow-md group"
                        title="Способности и навыки"
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-xl text-red-500 group-hover:text-red-400">
                                ⚔️
                            </span>
                            <span className="text-xs text-gray-400 mt-1 group-hover:text-gray-300">
                                Навыки
                            </span>
                        </div>
                    </button>
                    <button
                        className="bg-gradient-to-b from-gray-800 to-gray-900 border border-red-900/40 rounded-md p-2 hover:from-gray-700 hover:to-gray-800 transition-all shadow-md group"
                        title="Карта мира"
                        onClick={() => navigate(`/world-map/${character.id}`)}
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-xl text-red-500 group-hover:text-red-400">
                                🌍
                            </span>
                            <span className="text-xs text-gray-400 mt-1 group-hover:text-gray-300">
                                Карта мира
                            </span>
                        </div>
                    </button>
                </div>

                {/* Валюта */}
                <div className="grid grid-cols-2 gap-2 ml-4 w-32">
                    {/* Блок золота */}
                    <div className="bg-gray-900/60 px-3 py-1 rounded text-xs text-gray-300 border border-gray-700 flex items-center shadow-md">
                        <span className="text-yellow-500 mr-2">💰</span> 0
                    </div>
                    {/* Блок алмазов */}
                    <div className="bg-gray-900/60 px-3 py-1 rounded text-xs text-gray-300 border border-gray-700 flex items-center shadow-md">
                        <span className="text-red-500 mr-2">💎</span> 0
                    </div>
                </div>
            </div>
        );
    }
);

export default GameHeader;
