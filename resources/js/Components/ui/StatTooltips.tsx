import React from "react";

// Объект с описаниями всех характеристик
export const statDescriptions = {
    // Базовые характеристики
    strength: {
        title: "Сила",
        description:
            "Увеличивает физический урон, грузоподъемность и позволяет использовать тяжелое оружие и доспехи",
        icon: "💪",
    },
    agility: {
        title: "Ловкость",
        description: "Влияет на скорость атаки, уклонение и инициативу в бою",
        icon: "🏃",
    },
    intelligence: {
        title: "Интеллект",
        description:
            "Усиливает магические способности, урон от заклинаний и увеличивает максимальное количество маны",
        icon: "🧠",
    },
    vitality: {
        title: "Выносливость",
        description:
            "Увеличивает максимальное здоровье и физическую стойкость к урону",
        icon: "❤️",
    },

    // Дополнительные характеристики
    luck: {
        title: "Удача",
        description:
            "Повышает шанс критического удара, нахождения редких предметов и благоприятных событий",
        icon: "🍀",
    },
    charisma: {
        title: "Харизма",
        description:
            "Улучшает отношения с NPC, снижает цены у торговцев и расширяет диалоговые возможности",
        icon: "🗣️",
    },
    wisdom: {
        title: "Мудрость",
        description:
            "Ускоряет восстановление маны, увеличивает сопротивление магии и улучшает обучение навыкам",
        icon: "📚",
    },
    dexterity: {
        title: "Проворство",
        description:
            "Повышает точность атак, шанс уклонения и скорость перезарядки навыков",
        icon: "🎯",
    },
    constitution: {
        title: "Телосложение",
        description:
            "Усиливает защиту от физического урона и сопротивление негативным эффектам",
        icon: "🛡️",
    },
};

// Компонент для отображения иконки вопроса с описанием
interface StatQuestionIconProps {
    statKey: keyof typeof statDescriptions;
}

export const StatQuestionIcon: React.FC<StatQuestionIconProps> = ({
    statKey,
}) => {
    const stat = statDescriptions[statKey];

    return (
        <span className="text-gray-500 text-xs ml-1 cursor-help inline-block">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M12 21a9 9 0 100-18 9 9 0 000 18z"
                />
            </svg>
        </span>
    );
};

// Компонент для отображения содержимого подсказки
interface StatTooltipContentProps {
    statKey: keyof typeof statDescriptions;
}

export const StatTooltipContent: React.FC<StatTooltipContentProps> = ({
    statKey,
}) => {
    const stat = statDescriptions[statKey];

    return (
        <div className="w-60">
            <div className="flex items-center mb-1">
                <span className="mr-1">{stat.icon}</span>
                <span className="text-red-400 font-medieval">{stat.title}</span>
            </div>
            <p className="text-xs">{stat.description}</p>
        </div>
    );
};

export default { statDescriptions, StatQuestionIcon, StatTooltipContent };
