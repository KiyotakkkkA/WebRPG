import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Button from "../ui/Button";

interface CombatAction {
    id: string;
    name: string;
    type: "attack" | "spell" | "skill" | "item" | "flee";
    damage?: number;
    manaCost?: number;
    staminaCost?: number;
    description: string;
}

interface Enemy {
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

interface CombatLog {
    type: "player" | "enemy" | "system" | "reward";
    message: string;
}

interface CombatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVictory?: (rewards: {
        experience: number;
        gold: number;
        items: string[];
    }) => void;
    onDefeat?: () => void;
    enemy: Enemy;
    character: {
        id: number;
        name: string;
        health: number;
        maxHealth: number;
        mana: number;
        maxMana: number;
        stamina: number;
        maxStamina: number;
        strength: number;
        agility: number;
        intelligence: number;
    };
}

const CombatModal: React.FC<CombatModalProps> = ({
    isOpen,
    onClose,
    onVictory,
    onDefeat,
    enemy,
    character,
}) => {
    // Состояние боя
    const [playerHealth, setPlayerHealth] = useState(character.health);
    const [playerMana, setPlayerMana] = useState(character.mana);
    const [playerStamina, setPlayerStamina] = useState(character.stamina);
    const [enemyHealth, setEnemyHealth] = useState(enemy.health);
    const [isCombatActive, setIsCombatActive] = useState(true);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [log, setLog] = useState<CombatLog[]>([]);
    const [rewards, setRewards] = useState<{
        experience: number;
        gold: number;
        items: string[];
    }>({
        experience: 0,
        gold: 0,
        items: [],
    });

    // Инициализация боя
    useEffect(() => {
        if (isOpen) {
            setPlayerHealth(character.health);
            setPlayerMana(character.mana);
            setPlayerStamina(character.stamina);
            setEnemyHealth(enemy.health);
            setIsCombatActive(true);
            setIsPlayerTurn(true);
            setLog([
                { type: "system", message: `Начался бой с ${enemy.name}!` },
                { type: "system", message: "Ваш ход. Выберите действие." },
            ]);
            setRewards({
                experience: enemy.experience,
                gold: enemy.gold,
                items: [],
            });
        }
    }, [isOpen, character, enemy]);

    // Список доступных боевых действий
    const combatActions: CombatAction[] = [
        {
            id: "basic-attack",
            name: "Обычная атака",
            type: "attack",
            damage: Math.floor(character.strength * 0.8),
            staminaCost: 5,
            description: "Атака оружием, наносящая физический урон",
        },
        {
            id: "heavy-attack",
            name: "Сильная атака",
            type: "attack",
            damage: Math.floor(character.strength * 1.5),
            staminaCost: 15,
            description:
                "Мощный удар, наносящий значительный урон, но требующий больше выносливости",
        },
        {
            id: "fireball",
            name: "Огненный шар",
            type: "spell",
            damage: Math.floor(character.intelligence * 1.2),
            manaCost: 20,
            description: "Магическая атака огнем, наносящая урон от интеллекта",
        },
        {
            id: "healing",
            name: "Лечение",
            type: "spell",
            damage: -Math.floor(character.intelligence * 0.8), // Отрицательный урон = лечение
            manaCost: 25,
            description:
                "Восстанавливает здоровье, основываясь на вашем интеллекте",
        },
        {
            id: "flee",
            name: "Побег",
            type: "flee",
            staminaCost: 10,
            description:
                "Попытка сбежать из боя. Шанс зависит от вашей ловкости",
        },
    ];

    // Функция для обработки действия игрока
    const handlePlayerAction = (action: CombatAction) => {
        if (!isCombatActive || !isPlayerTurn) return;

        // Проверка на достаточность ресурсов
        if (action.manaCost && playerMana < action.manaCost) {
            addToLog("system", "Недостаточно маны для этого действия!");
            return;
        }

        if (action.staminaCost && playerStamina < action.staminaCost) {
            addToLog("system", "Недостаточно выносливости для этого действия!");
            return;
        }

        // Обработка попытки побега
        if (action.type === "flee") {
            const fleeChance = 0.3 + character.agility * 0.02; // Базовый шанс 30% + 2% за каждую единицу ловкости
            const isSuccessful = Math.random() < fleeChance;

            if (isSuccessful) {
                addToLog("system", "Вы успешно сбежали из боя!");
                setPlayerStamina(
                    Math.max(0, playerStamina - (action.staminaCost || 0))
                );
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                addToLog("system", "Побег не удался!");
                setPlayerStamina(
                    Math.max(0, playerStamina - (action.staminaCost || 0))
                );
                // Ход переходит к противнику
                setIsPlayerTurn(false);
                setTimeout(() => {
                    enemyTurn();
                }, 1000);
            }
            return;
        }

        // Обработка атаки или заклинания
        let message = "";

        if (action.type === "attack") {
            message = `Вы использовали ${action.name} и нанесли ${action.damage} урона!`;
            if (action.damage) {
                const newEnemyHealth = Math.max(0, enemyHealth - action.damage);
                setEnemyHealth(newEnemyHealth);

                // Проверка на победу
                if (newEnemyHealth <= 0) {
                    handleVictory();
                    return;
                }
            }
        } else if (action.type === "spell") {
            if (action.damage && action.damage < 0) {
                // Лечение
                const healAmount = Math.abs(action.damage);
                const newPlayerHealth = Math.min(
                    character.maxHealth,
                    playerHealth + healAmount
                );
                setPlayerHealth(newPlayerHealth);
                message = `Вы использовали ${action.name} и восстановили ${healAmount} здоровья!`;
            } else if (action.damage && action.damage > 0) {
                // Урон от заклинания
                const newEnemyHealth = Math.max(0, enemyHealth - action.damage);
                setEnemyHealth(newEnemyHealth);
                message = `Вы использовали ${action.name} и нанесли ${action.damage} урона!`;

                // Проверка на победу
                if (newEnemyHealth <= 0) {
                    handleVictory();
                    return;
                }
            }
        }

        // Расход ресурсов
        if (action.manaCost) {
            setPlayerMana(Math.max(0, playerMana - action.manaCost));
        }
        if (action.staminaCost) {
            setPlayerStamina(Math.max(0, playerStamina - action.staminaCost));
        }

        // Добавление в лог
        addToLog("player", message);

        // Передача хода противнику
        setIsPlayerTurn(false);
        setTimeout(() => {
            enemyTurn();
        }, 1000);
    };

    // Функция для хода противника
    const enemyTurn = () => {
        if (!isCombatActive) return;

        const damage = enemy.damage;
        const newPlayerHealth = Math.max(0, playerHealth - damage);
        setPlayerHealth(newPlayerHealth);

        addToLog("enemy", `${enemy.name} атакует и наносит ${damage} урона!`);

        // Проверка на поражение
        if (newPlayerHealth <= 0) {
            handleDefeat();
            return;
        }

        // Небольшое восстановление ресурсов игрока каждый ход
        setPlayerMana(Math.min(character.maxMana, playerMana + 5));
        setPlayerStamina(Math.min(character.maxStamina, playerStamina + 7));

        // Передача хода игроку
        setIsPlayerTurn(true);
        addToLog("system", "Ваш ход. Выберите действие.");
    };

    // Обработка победы
    const handleVictory = () => {
        setIsCombatActive(false);

        // Проверка на выпадение предметов
        const droppedItems: string[] = [];
        if (enemy.drops) {
            enemy.drops.forEach((drop) => {
                if (Math.random() < drop.chance) {
                    droppedItems.push(drop.name);
                }
            });
        }

        setRewards({
            experience: enemy.experience,
            gold: enemy.gold,
            items: droppedItems,
        });

        addToLog("system", `Вы победили ${enemy.name}!`);
        addToLog("reward", `Получено опыта: ${enemy.experience}`);
        addToLog("reward", `Получено золота: ${enemy.gold}`);

        if (droppedItems.length > 0) {
            droppedItems.forEach((item) => {
                addToLog("reward", `Получен предмет: ${item}`);
            });
        }
    };

    // Обработка поражения
    const handleDefeat = () => {
        setIsCombatActive(false);
        addToLog("system", "Вы потерпели поражение...");
    };

    // Добавление записи в лог
    const addToLog = (
        type: "player" | "enemy" | "system" | "reward",
        message: string
    ) => {
        setLog((prev) => [...prev, { type, message }]);
    };

    // Получение изображения противника
    const getEnemyImage = () => {
        if (enemy.image) {
            return enemy.image;
        }

        if (enemy.id === "wounded-wolf") {
            return "/images/enemies/wounded-wolf.jpg";
        }

        return "/images/enemies/fallback-enemy.jpg";
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => {}}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-70" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-gradient-to-b from-gray-800 to-gray-900 border border-red-900/40 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medieval text-red-500 text-center border-b border-red-900/30 pb-2 mb-4"
                                >
                                    {isCombatActive
                                        ? "Бой"
                                        : enemyHealth <= 0
                                        ? "Победа!"
                                        : "Поражение!"}
                                </Dialog.Title>

                                <div className="grid grid-cols-2 gap-6 mb-4">
                                    {/* Игрок */}
                                    <div className="bg-gray-900/70 p-4 rounded-lg border border-red-900/30">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-gray-300">
                                                {character.name}
                                            </h4>
                                            <span className="text-xs text-gray-500">
                                                Уровень 1
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-400">
                                                        Здоровье
                                                    </span>
                                                    <span className="text-gray-400">
                                                        {playerHealth}/
                                                        {character.maxHealth}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-800 h-2 rounded-sm overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-red-800 to-red-600 h-full"
                                                        style={{
                                                            width: `${
                                                                (playerHealth /
                                                                    character.maxHealth) *
                                                                100
                                                            }%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-400">
                                                        Мана
                                                    </span>
                                                    <span className="text-gray-400">
                                                        {playerMana}/
                                                        {character.maxMana}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-800 h-2 rounded-sm overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-800 to-blue-600 h-full"
                                                        style={{
                                                            width: `${
                                                                (playerMana /
                                                                    character.maxMana) *
                                                                100
                                                            }%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-400">
                                                        Выносливость
                                                    </span>
                                                    <span className="text-gray-400">
                                                        {playerStamina}/
                                                        {character.maxStamina}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-800 h-2 rounded-sm overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-green-800 to-green-600 h-full"
                                                        style={{
                                                            width: `${
                                                                (playerStamina /
                                                                    character.maxStamina) *
                                                                100
                                                            }%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Враг */}
                                    <div className="bg-gray-900/70 p-4 rounded-lg border border-red-900/30">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-gray-300">
                                                {enemy.name}
                                            </h4>
                                            <span className="text-xs text-gray-500">
                                                Уровень {enemy.level}
                                            </span>
                                        </div>

                                        <div className="flex space-x-3">
                                            <div className="w-16 h-16 flex-shrink-0">
                                                <img
                                                    src={getEnemyImage()}
                                                    alt={enemy.name}
                                                    className="w-full h-full object-cover rounded-md border border-red-900/40"
                                                    onError={(e) => {
                                                        (
                                                            e.target as HTMLImageElement
                                                        ).src =
                                                            "/images/enemies/fallback-enemy.jpg";
                                                    }}
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-400">
                                                        Здоровье
                                                    </span>
                                                    <span className="text-gray-400">
                                                        {enemyHealth}/
                                                        {enemy.maxHealth}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-800 h-2 rounded-sm overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-red-800 to-red-600 h-full"
                                                        style={{
                                                            width: `${
                                                                (enemyHealth /
                                                                    enemy.maxHealth) *
                                                                100
                                                            }%`,
                                                        }}
                                                    ></div>
                                                </div>

                                                <div className="mt-3 text-xs text-gray-500">
                                                    <div>
                                                        Атака: {enemy.damage}
                                                    </div>
                                                    <div>
                                                        Защита: {enemy.defense}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Боевой журнал */}
                                <div className="bg-gray-900/70 p-4 rounded-lg border border-red-900/30 mb-4 h-32 overflow-y-auto">
                                    <h4 className="text-xs text-gray-400 mb-2">
                                        Боевой журнал:
                                    </h4>
                                    <div className="space-y-1 text-xs">
                                        {log.map((entry, index) => (
                                            <div
                                                key={index}
                                                className={`${
                                                    entry.type === "player"
                                                        ? "text-blue-400"
                                                        : entry.type === "enemy"
                                                        ? "text-red-400"
                                                        : entry.type ===
                                                          "reward"
                                                        ? "text-yellow-400"
                                                        : "text-gray-400"
                                                }`}
                                            >
                                                {entry.message}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Боевые действия */}
                                {isCombatActive ? (
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        {combatActions.map((action) => (
                                            <button
                                                key={action.id}
                                                className={`text-left p-2 rounded-md transition-colors ${
                                                    isPlayerTurn
                                                        ? "bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-red-900/30"
                                                        : "bg-gray-900 border border-gray-800 opacity-50 cursor-not-allowed"
                                                }`}
                                                onClick={() =>
                                                    isPlayerTurn &&
                                                    handlePlayerAction(action)
                                                }
                                                disabled={!isPlayerTurn}
                                            >
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-medium text-gray-300">
                                                        {action.name}
                                                    </span>
                                                    <div className="flex space-x-1">
                                                        {action.manaCost && (
                                                            <span
                                                                className={`text-xs ${
                                                                    playerMana <
                                                                    action.manaCost
                                                                        ? "text-red-500"
                                                                        : "text-blue-400"
                                                                }`}
                                                            >
                                                                {
                                                                    action.manaCost
                                                                }{" "}
                                                                M
                                                            </span>
                                                        )}
                                                        {action.staminaCost && (
                                                            <span
                                                                className={`text-xs ${
                                                                    playerStamina <
                                                                    action.staminaCost
                                                                        ? "text-red-500"
                                                                        : "text-green-400"
                                                                }`}
                                                            >
                                                                {
                                                                    action.staminaCost
                                                                }{" "}
                                                                В
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {action.description}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mb-4">
                                        {enemyHealth <= 0 ? (
                                            <div className="text-center p-3 bg-gray-900/70 rounded-lg border border-red-900/30">
                                                <h4 className="text-yellow-500 mb-2">
                                                    Награды:
                                                </h4>
                                                <div className="text-sm">
                                                    <p className="text-gray-300">
                                                        Опыт:{" "}
                                                        <span className="text-yellow-400">
                                                            {rewards.experience}
                                                        </span>
                                                    </p>
                                                    <p className="text-gray-300">
                                                        Золото:{" "}
                                                        <span className="text-yellow-400">
                                                            {rewards.gold}
                                                        </span>
                                                    </p>
                                                    {rewards.items.length >
                                                        0 && (
                                                        <div className="mt-1">
                                                            <p className="text-gray-300">
                                                                Предметы:
                                                            </p>
                                                            <ul className="text-green-400">
                                                                {rewards.items.map(
                                                                    (
                                                                        item,
                                                                        index
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                index
                                                                            }
                                                                        >
                                                                            {
                                                                                item
                                                                            }
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-3 bg-gray-900/70 rounded-lg border border-red-900/30">
                                                <h4 className="text-red-500 mb-2">
                                                    Вы проиграли!
                                                </h4>
                                                <p className="text-gray-300 text-sm">
                                                    Вам не удалось победить{" "}
                                                    {enemy.name}. Вы теряете 10%
                                                    опыта.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    {!isCombatActive && (
                                        <Button
                                            variant={
                                                enemyHealth <= 0
                                                    ? "primary"
                                                    : "secondary"
                                            }
                                            onClick={() => {
                                                if (
                                                    enemyHealth <= 0 &&
                                                    onVictory
                                                ) {
                                                    onVictory(rewards);
                                                } else if (
                                                    playerHealth <= 0 &&
                                                    onDefeat
                                                ) {
                                                    onDefeat();
                                                }
                                                onClose();
                                            }}
                                        >
                                            {enemyHealth <= 0
                                                ? "Забрать награду"
                                                : "Вернуться в лагерь"}
                                        </Button>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CombatModal;
