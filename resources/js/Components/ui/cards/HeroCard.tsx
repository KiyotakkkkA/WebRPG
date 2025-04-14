import React from "react";
import Button from "../Button";
import Tooltip from "../Tooltip";
import { StatTooltipContent } from "../StatTooltips";

interface HeroCardProps {
    title: string;
    description: string;
    imageSrc: string;
    stats: {
        strength: number;
        agility: number;
        intelligence: number;
        vitality: number;
        luck: number;
        charisma: number;
        wisdom: number;
        dexterity: number;
        constitution: number;
    };
    specialAbility: string;
    onClick?: () => void;
    isSelected?: boolean;
}

const HeroCard: React.FC<HeroCardProps> = ({
    title,
    description,
    imageSrc,
    stats,
    specialAbility,
    onClick,
    isSelected = false,
}) => {
    // Группируем характеристики для отображения в две колонки
    const primaryStats = [
        {
            key: "strength",
            name: "Сила",
            value: stats.strength,
            color: "red",
        },
        {
            key: "agility",
            name: "Ловкость",
            value: stats.agility,
            color: "green",
        },
        {
            key: "intelligence",
            name: "Интеллект",
            value: stats.intelligence,
            color: "blue",
        },
        {
            key: "vitality",
            name: "Выносливость",
            value: stats.vitality,
            color: "yellow",
        },
    ];

    const secondaryStats = [
        {
            key: "luck",
            name: "Удача",
            value: stats.luck,
            color: "purple",
        },
        {
            key: "charisma",
            name: "Харизма",
            value: stats.charisma,
            color: "pink",
        },
        {
            key: "wisdom",
            name: "Мудрость",
            value: stats.wisdom,
            color: "indigo",
        },
        {
            key: "dexterity",
            name: "Проворство",
            value: stats.dexterity,
            color: "emerald",
        },
        {
            key: "constitution",
            name: "Телосложение",
            value: stats.constitution,
            color: "amber",
        },
    ];

    // Функция для получения цвета полосы прогресса характеристики
    const getStatBarColor = (key: string, value: number) => {
        // Базовые цвета для разных статов
        const colors: { [key: string]: string } = {
            strength: "from-red-600 to-red-400",
            agility: "from-green-600 to-green-400",
            intelligence: "from-blue-600 to-blue-400",
            vitality: "from-yellow-600 to-yellow-400",
            luck: "from-purple-600 to-purple-400",
            charisma: "from-pink-600 to-pink-400",
            wisdom: "from-indigo-600 to-indigo-400",
            dexterity: "from-emerald-600 to-emerald-400",
            constitution: "from-amber-600 to-amber-400",
        };

        return colors[key] || "from-gray-600 to-gray-400";
    };

    // Функция для получения цвета текста значения характеристики
    const getStatValueColor = (value: number) => {
        if (value <= 3) return "text-red-400";
        if (value <= 5) return "text-yellow-400";
        if (value <= 7) return "text-blue-400";
        return "text-green-400";
    };

    return (
        <div
            className={`
                relative overflow-hidden flex flex-col
                bg-gradient-to-b from-gray-700 to-gray-800
                border border-gray-600 rounded-lg shadow-lg
                transition-all duration-300 h-full
                ${isSelected ? "ring-2 ring-red-500 shadow-red-500/30" : ""}
                hover:shadow-red-500/20 hover:translate-y-[-2px]
            `}
        >
            {/* Огненная рамка для выбранного героя */}
            {isSelected && (
                <>
                    <div className="absolute inset-0 z-0 rounded-lg overflow-hidden pointer-events-none">
                        <div className="absolute inset-x-0 -top-1 h-2 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 animate-pulse"></div>
                        <div className="absolute inset-x-0 -bottom-1 h-2 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 animate-pulse"></div>
                        <div className="absolute inset-y-0 -left-1 w-2 bg-gradient-to-b from-orange-600 via-red-600 to-orange-600 animate-pulse"></div>
                        <div className="absolute inset-y-0 -right-1 w-2 bg-gradient-to-b from-orange-600 via-red-600 to-orange-600 animate-pulse"></div>

                        {/* Угловые эффекты огня */}
                        <div className="absolute -top-2 -left-2 w-8 h-8">
                            <div
                                className="w-4 h-4 bg-red-500 rounded-full blur-[3px] absolute animate-ping"
                                style={{ animationDuration: "1.5s" }}
                            ></div>
                            <div
                                className="w-3 h-3 bg-orange-500 rounded-full blur-[2px] absolute animate-ping"
                                style={{
                                    animationDuration: "1.8s",
                                    animationDelay: "0.1s",
                                }}
                            ></div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8">
                            <div
                                className="w-4 h-4 bg-red-500 rounded-full blur-[3px] absolute animate-ping"
                                style={{ animationDuration: "1.7s" }}
                            ></div>
                            <div
                                className="w-3 h-3 bg-orange-500 rounded-full blur-[2px] absolute animate-ping"
                                style={{
                                    animationDuration: "2s",
                                    animationDelay: "0.2s",
                                }}
                            ></div>
                        </div>
                        <div className="absolute -bottom-2 -left-2 w-8 h-8">
                            <div
                                className="w-4 h-4 bg-red-500 rounded-full blur-[3px] absolute animate-ping"
                                style={{ animationDuration: "1.6s" }}
                            ></div>
                            <div
                                className="w-3 h-3 bg-orange-500 rounded-full blur-[2px] absolute animate-ping"
                                style={{
                                    animationDuration: "1.9s",
                                    animationDelay: "0.3s",
                                }}
                            ></div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8">
                            <div
                                className="w-4 h-4 bg-red-500 rounded-full blur-[3px] absolute animate-ping"
                                style={{ animationDuration: "1.8s" }}
                            ></div>
                            <div
                                className="w-3 h-3 bg-orange-500 rounded-full blur-[2px] absolute animate-ping"
                                style={{
                                    animationDuration: "2.1s",
                                    animationDelay: "0.4s",
                                }}
                            ></div>
                        </div>
                    </div>
                </>
            )}

            {/* Декоративные элементы */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500/60"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500/60"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500/60"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500/60"></div>

            {/* Заголовок */}
            <div className="bg-gradient-to-r from-red-700 to-red-800 text-white text-center py-3 uppercase tracking-wider font-bold relative">
                <div className="absolute inset-0 bg-[url('/images/parchment-texture.png')] opacity-10"></div>
                <h3 className="relative z-10">{title}</h3>
            </div>

            {/* Изображение */}
            <div
                className="h-48 relative overflow-hidden"
                style={{
                    backgroundImage: `url(${imageSrc})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                }}
            >
                {/* Градиент затемнения снизу */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
            </div>

            {/* Описание персонажа */}
            <div className="p-4 text-xs text-gray-300 uppercase tracking-wider">
                {description}
            </div>

            {/* Характеристики */}
            <div className="grid grid-cols-2 gap-3 px-4 mt-2">
                {/* Левая колонка - основные характеристики */}
                <div className="space-y-3">
                    <p className="text-center text-xs text-red-400 uppercase tracking-widest mb-1">
                        Основные
                    </p>
                    {primaryStats.map((stat) => (
                        <div key={stat.key} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                                <Tooltip
                                    content={
                                        <StatTooltipContent
                                            statKey={
                                                stat.key as
                                                    | "strength"
                                                    | "agility"
                                                    | "intelligence"
                                                    | "vitality"
                                                    | "luck"
                                                    | "charisma"
                                                    | "wisdom"
                                                    | "dexterity"
                                                    | "constitution"
                                            }
                                        />
                                    }
                                >
                                    <span className="text-gray-400 flex items-center">
                                        {stat.name}
                                    </span>
                                </Tooltip>
                                <span
                                    className={`font-bold ${getStatValueColor(
                                        stat.value
                                    )}`}
                                >
                                    {stat.value}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r ${getStatBarColor(
                                        stat.key,
                                        stat.value
                                    )} rounded-full transition-all duration-500`}
                                    style={{
                                        width: `${(stat.value / 10) * 100}%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Правая колонка - дополнительные характеристики */}
                <div className="space-y-3">
                    <p className="text-center text-xs text-red-400 uppercase tracking-widest mb-1">
                        Дополнительные
                    </p>
                    {secondaryStats.map((stat) => (
                        <div key={stat.key} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                                <Tooltip
                                    content={
                                        <StatTooltipContent
                                            statKey={
                                                stat.key as
                                                    | "strength"
                                                    | "agility"
                                                    | "intelligence"
                                                    | "vitality"
                                                    | "luck"
                                                    | "charisma"
                                                    | "wisdom"
                                                    | "dexterity"
                                                    | "constitution"
                                            }
                                        />
                                    }
                                >
                                    <span className="text-gray-400 flex items-center">
                                        {stat.name}
                                    </span>
                                </Tooltip>
                                <span
                                    className={`font-bold ${getStatValueColor(
                                        stat.value
                                    )}`}
                                >
                                    {stat.value}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-gradient-to-r ${getStatBarColor(
                                        stat.key,
                                        stat.value
                                    )} rounded-full transition-all duration-500`}
                                    style={{
                                        width: `${(stat.value / 10) * 100}%`,
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Специальная способность */}
            <div className="p-4 mt-auto">
                <div className="bg-gray-800 border border-red-800/40 rounded-md p-3 text-sm">
                    <p className="text-red-400 uppercase tracking-wider text-xs mb-1 font-bold">
                        Особая способность:
                    </p>
                    <p className="text-gray-300 text-xs">{specialAbility}</p>
                </div>
            </div>

            {/* Кнопка выбора */}
            <div className="p-4 pt-2">
                <Button
                    variant="primary"
                    onClick={onClick}
                    fullWidth
                    className="uppercase text-xs tracking-wider"
                >
                    {isSelected ? "Выбрано ✓" : "Выбрать героя"}
                </Button>
            </div>
        </div>
    );
};

export default HeroCard;
