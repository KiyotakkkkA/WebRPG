import { QueryClient } from "@tanstack/react-query";
import characterStore from "../stores/CharacterStore";
import { LocationObject } from "../stores/LocationStore";
import journalStore from "../stores/JournalStore";

// Интерфейс для результата исследования локации
export interface ExplorationResult {
    type: "enemy" | "item" | "resource" | "place" | "nothing";
    data?: any;
    message: string;
}

// Интерфейс для врага
export interface Enemy {
    id: string;
    name: string;
    image?: string;
    health: number;
    maxHealth: number;
    level: number;
    damage: number;
    defense: number;
    experience: number;
    gold: number;
    drops?: {
        id: string;
        name: string;
        chance: number;
    }[];
}

// Нужно ли восстановить ресурсы для исследования
export const canExplore = (staminaRequired: number = 5): boolean => {
    if (!characterStore.selectedCharacter) return false;

    return characterStore.selectedCharacter.stamina >= staminaRequired;
};

/**
 * Исследование локации - шанс найти предметы, врагов или особые места
 * @param locationDangerLevel Уровень опасности локации (от 1 до 5)
 * @param enemies Массив возможных врагов в локации
 * @param queryClient QueryClient для инвалидации запросов после изменений
 * @param staminaCost Количество выносливости, необходимое для исследования
 * @returns Результат исследования с данными о найденном
 */
export const exploreLocation = (
    locationDangerLevel: number = 1,
    enemies: Enemy[] = [],
    queryClient: QueryClient,
    staminaCost: number = 5
): ExplorationResult => {
    if (!characterStore.selectedCharacter) {
        return {
            type: "nothing",
            message: "Персонаж не выбран",
        };
    }

    // Проверка на достаточное количество выносливости
    if (!canExplore(staminaCost)) {
        return {
            type: "nothing",
            message: "Недостаточно выносливости для исследования",
        };
    }

    // Расходуем выносливость при исследовании
    characterStore.useResource("stamina", staminaCost);

    // Инвалидируем данные персонажа после изменения состояния
    if (characterStore.selectedCharacter) {
        queryClient.invalidateQueries({
            queryKey: ["character", characterStore.selectedCharacter.id],
        });
    }

    // Шанс встретить врага зависит от локации
    const encounterChance = locationDangerLevel * 0.1; // 0.1 - 0.5 в зависимости от уровня опасности (1-5)

    // Шанс найти предмет
    const itemChance = 0.35;

    // Шанс найти ресурс
    const resourceChance = 0.25;

    // Шанс найти особое место
    const specialPlaceChance = 0.15;

    // Генерируем случайное число для определения типа события
    const roll = Math.random();

    if (roll < encounterChance) {
        // Выбираем случайного врага из списка для данной локации
        if (enemies.length > 0) {
            const randomEnemy =
                enemies[Math.floor(Math.random() * enemies.length)];

            return {
                type: "enemy",
                data: randomEnemy,
                message: `Вы столкнулись с ${randomEnemy.name}!`,
            };
        } else {
            // Нет врагов в этой локации - находим случайный предмет
            const randomItem = characterStore.getRandomItem();

            return {
                type: "item",
                data: randomItem,
                message: `Вы нашли предмет: ${randomItem}`,
            };
        }
    } else if (roll < encounterChance + itemChance) {
        // Находим предмет
        const randomItem = characterStore.getRandomItem();

        return {
            type: "item",
            data: randomItem,
            message: `Вы нашли предмет: ${randomItem}`,
        };
    } else if (roll < encounterChance + itemChance + resourceChance) {
        // Находим ресурс
        const randomResource = characterStore.getRandomResource();

        return {
            type: "resource",
            data: randomResource,
            message: `Вы обнаружили ресурс: ${randomResource}`,
        };
    } else if (
        roll <
        encounterChance + itemChance + resourceChance + specialPlaceChance
    ) {
        // Находим особое место
        const places = [
            "древний алтарь",
            "заброшенный лагерь",
            "тайник контрабандистов",
            "небольшую пещеру",
            "разрушенную башню",
            "странный монолит",
        ];
        const randomPlace = places[Math.floor(Math.random() * places.length)];

        return {
            type: "place",
            data: randomPlace,
            message: `Вы обнаружили ${randomPlace}`,
        };
    } else {
        // Ничего не находим
        const messages = [
            "Вы ничего не нашли в этой части локации",
            "Здесь нет ничего интересного",
            "Ваши поиски не увенчались успехом",
            "Эта область кажется пустой",
            "Вы осмотрелись вокруг, но ничего не обнаружили",
        ];
        const randomMessage =
            messages[Math.floor(Math.random() * messages.length)];

        return {
            type: "nothing",
            message: randomMessage,
        };
    }
};

/**
 * Взаимодействие с объектом на локации
 * @param object Объект, с которым взаимодействует персонаж
 * @returns Результат взаимодействия
 */
export const interactWithObject = (
    object: LocationObject
): { success: boolean; message: string; data?: any } => {
    // Разные типы взаимодействия в зависимости от типа объекта
    switch (object.type) {
        case "building":
            return {
                success: true,
                message: `Вы входите в ${object.name}`,
                data: {
                    type: "building",
                    name: object.name,
                },
            };
        case "npc":
            return {
                success: true,
                message: `Вы начинаете разговор с ${object.name}`,
                data: {
                    type: "npc",
                    name: object.name,
                    id: object.id,
                },
            };
        case "monster":
            // Для монстров возвращаем данные для боя
            return {
                success: true,
                message: `Вы атакуете ${object.name}!`,
                data: {
                    type: "combat",
                    enemy: {
                        id: object.id,
                        name: object.name,
                        image: object.image_url,
                        // Уровень и другие характеристики можно сгенерировать случайно
                        // или подгрузить по ID, если они хранятся в другом месте
                        level: 1,
                        health: 100,
                        maxHealth: 100,
                        damage: 10,
                        defense: 5,
                        experience: 50,
                        gold: 25,
                    },
                },
            };
        case "resource":
            return {
                success: true,
                message: `Вы собираете ${object.name}`,
                data: {
                    type: "resource",
                    name: object.name,
                },
            };
        default:
            return {
                success: true,
                message: `Вы взаимодействуете с ${object.name}`,
                data: {
                    type: "unknown",
                    name: object.name,
                },
            };
    }
};

/**
 * Обработка получения награды после боя
 * @param rewards Награды за бой (опыт, золото, предметы)
 * @param queryClient QueryClient для инвалидации запросов после изменений
 */
export const processCombatRewards = (
    rewards: {
        experience: number;
        gold: number;
        items: string[];
    },
    queryClient: QueryClient
): void => {
    // Применяем награды к персонажу
    characterStore.applyBattleRewards(rewards);

    // Добавляем запись в журнал о полученной награде
    journalStore.addEntry(
        `Вы победили в бою и получили ${rewards.experience} опыта и ${rewards.gold} золота!`,
        "combat"
    );

    // Если были получены предметы, отображаем их
    if (rewards.items.length > 0) {
        journalStore.addEntry(
            `Получены предметы: ${rewards.items.join(", ")}`,
            "item"
        );
    }

    // Инвалидируем данные персонажа после боя
    if (characterStore.selectedCharacter) {
        queryClient.invalidateQueries({
            queryKey: ["character", characterStore.selectedCharacter.id],
        });
    }
};

/**
 * Обработка поражения в бою
 * @param queryClient QueryClient для инвалидации запросов после изменений
 */
export const processCombatDefeat = (queryClient: QueryClient): void => {
    if (!characterStore.selectedCharacter) return;

    // Записываем в журнал о поражении
    journalStore.addEntry("Вы проиграли бой и потеряли сознание...", "combat");

    // Восстанавливаем минимальное здоровье персонажа
    if (characterStore.selectedCharacter.health <= 0) {
        characterStore.restoreResources(
            Math.ceil(characterStore.selectedCharacter.max_health * 0.1), // 10% от максимального здоровья
            0,
            0
        );
    }

    // Инвалидируем данные персонажа после боя
    queryClient.invalidateQueries({
        queryKey: ["character", characterStore.selectedCharacter.id],
    });
};
