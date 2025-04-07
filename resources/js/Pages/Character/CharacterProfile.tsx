import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import MainLayout from "../../Layouts/MainLayout";
import Button from "../../Components/ui/Button";
import characterStore from "../../stores/CharacterStore";
import DeleteConfirmModal from "../../Components/ui/DeleteConfirmModal";

const CharacterProfile: React.FC = observer(() => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const loadCharacter = async () => {
            setLoading(true);
            setError(null);

            try {
                if (id) {
                    await characterStore.loadCharacter(parseInt(id));
                    if (!characterStore.selectedCharacter) {
                        setError("Персонаж не найден");
                    }
                } else {
                    setError("Идентификатор персонажа не указан");
                }
            } catch (err) {
                setError("Ошибка при загрузке персонажа");
            } finally {
                setLoading(false);
            }
        };

        loadCharacter();
    }, [id]);

    if (loading) {
        return (
            <MainLayout>
                <div className="flex min-h-screen items-center justify-center">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-red-600"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-10 w-10 rounded-full bg-gray-900"></div>
                            </div>
                        </div>
                        <p className="mt-4 text-xl font-medieval text-red-600">
                            Загрузка персонажа...
                        </p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const character = characterStore.selectedCharacter;

    if (error || !character) {
        return (
            <MainLayout>
                <div className="container mx-auto px-4 py-12">
                    <div className="mb-8 text-center">
                        <h1 className="echoes-title mb-4">Ошибка</h1>
                        <div className="h-0.5 w-1/4 mx-auto bg-gradient-to-r from-transparent via-red-700/40 to-transparent"></div>
                    </div>
                    <div className="max-w-2xl mx-auto p-6 bg-gradient-to-b from-gray-800 to-gray-900 border border-red-900/30 rounded-lg shadow-xl">
                        <p className="text-red-500 text-center text-lg mb-6">
                            {error || "Персонаж не найден"}
                        </p>
                        <div className="flex justify-center">
                            <Button
                                variant="primary"
                                onClick={() => navigate("/")}
                            >
                                <span className="mr-2">🏰</span> Вернуться на
                                главную
                            </Button>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const getCharacterClass = (className: string): string => {
        switch (className) {
            case "paladin":
                return "Паладин";
            case "berserker":
                return "Берсерк";
            case "crossbowman":
                return "Арбалетчик";
            case "elementalist":
                return "Элементалист";
            case "necromancer":
                return "Некромант";
            case "priest":
                return "Жрец";
            case "warrior":
                return "Воин Тьмы";
            case "mage":
                return "Темный маг";
            case "rogue":
                return "Ассасин Теней";
            default:
                return "Неизвестный класс";
        }
    };

    const getClassImageSrc = (className: string): string => {
        switch (className) {
            case "paladin":
                return "/images/classes/paladin.jpg";
            case "berserker":
                return "/images/classes/berserker.jpg";
            case "crossbowman":
                return "/images/classes/crossbowman.jpg";
            case "elementalist":
                return "/images/classes/elementalist.jpg";
            case "necromancer":
                return "/images/classes/necromancer.jpg";
            case "priest":
                return "/images/classes/priest.jpg";
            case "warrior":
                return "/images/classes/berserker.jpg";
            case "mage":
                return "/images/classes/necromancer.jpg";
            case "rogue":
                return "/images/classes/crossbowman.jpg";
            default:
                return "/images/fallback-hero.jpg";
        }
    };

    // Группируем характеристики для удобного отображения
    const statGroups = [
        {
            title: "Основные характеристики",
            stats: [
                {
                    name: "Сила",
                    value: character.strength,
                    color: "rgb(220, 38, 38)",
                },
                {
                    name: "Ловкость",
                    value: character.agility,
                    color: "rgb(22, 163, 74)",
                },
                {
                    name: "Интеллект",
                    value: character.intelligence,
                    color: "rgb(37, 99, 235)",
                },
                {
                    name: "Скорость",
                    value: character.speed,
                    color: "rgb(132, 204, 22)",
                },
                {
                    name: "Выносливость",
                    value: character.vitality,
                    color: "rgb(202, 138, 4)",
                },
            ],
        },
        {
            title: "Дополнительные характеристики",
            stats: [
                {
                    name: "Удача",
                    value: character.luck,
                    color: "rgb(124, 58, 237)",
                },
                {
                    name: "Харизма",
                    value: character.charisma,
                    color: "rgb(219, 39, 119)",
                },
                {
                    name: "Мудрость",
                    value: character.wisdom,
                    color: "rgb(79, 70, 229)",
                },
                {
                    name: "Проворство",
                    value: character.dexterity,
                    color: "rgb(5, 150, 105)",
                },
                {
                    name: "Телосложение",
                    value: character.constitution,
                    color: "rgb(217, 119, 6)",
                },
            ],
        },
    ];

    // Функция для удаления персонажа
    const handleDeleteCharacter = async () => {
        if (!character || isDeleting) return;

        setIsDeleting(true);
        try {
            const success = await characterStore.deleteCharacter(character.id);
            if (success) {
                navigate("/", { replace: true });
            } else {
                // Если возникла ошибка при удалении
                setError(
                    characterStore.error || "Ошибка при удалении персонажа"
                );
                setIsDeleteModalOpen(false);
            }
        } catch (err) {
            setError("Ошибка при удалении персонажа");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <MainLayout>
            {/* Секция профиля с фоновым изображением */}
            <div className="relative min-h-screen">
                {/* Фоновые слои */}
                <div className="absolute inset-0 bg-[url('/images/backgrounds/character_profile_bg.jpg')] bg-cover bg-center bg-fixed opacity-30"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/70 to-gray-900/90 backdrop-blur-sm"></div>

                {/* Декоративные элементы */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-800/40 to-transparent"></div>
                <div className="absolute top-10 left-1/4 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-800/30 to-transparent"></div>

                {/* Мистические частицы */}
                <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-lighten">
                    <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-red-600 rounded-full blur-sm animate-ping"></div>
                    <div className="absolute top-2/3 left-1/2 w-1 h-1 bg-red-400 rounded-full blur-sm animate-ping animation-delay-300"></div>
                    <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-red-500 rounded-full blur-sm animate-ping animation-delay-700"></div>
                </div>

                {/* Основное содержимое */}
                <div className="container mx-auto px-4 py-12 relative z-10">
                    <div className="mb-8 text-center">
                        <h1 className="echoes-title mb-4 text-4xl">
                            {character.name}
                        </h1>
                        <div className="h-0.5 w-1/4 mx-auto bg-gradient-to-r from-transparent via-red-700/60 to-transparent mb-2"></div>
                        <p className="text-red-400 text-xl">
                            {getCharacterClass(character.class)}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* Левая колонка - аватар и основная информация */}
                        <div className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 border border-red-900/40 rounded-lg p-6 shadow-lg backdrop-blur-sm">
                            <div className="relative mb-6">
                                <div className="w-full aspect-square overflow-hidden rounded-lg mb-4 border-2 border-red-900/30">
                                    <img
                                        src={getClassImageSrc(character.class)}
                                        alt={getCharacterClass(character.class)}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-red-700 px-4 py-1 rounded-full shadow-lg">
                                    <p className="text-sm font-medium text-gray-100">
                                        Уровень {character.level}
                                    </p>
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <p className="text-gray-400 text-sm">
                                    Присоединился{" "}
                                    {new Date(
                                        character.created_at
                                    ).toLocaleDateString("ru-RU")}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">
                                        Опыт
                                    </p>
                                    <div className="w-full bg-gray-700/70 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-yellow-600 h-2.5 rounded-full"
                                            style={{
                                                width: `${
                                                    (character.experience /
                                                        character.exp_to_next_level) *
                                                    100
                                                }%`,
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-right text-xs text-gray-500 mt-1">
                                        {character.experience} /{" "}
                                        {character.exp_to_next_level}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-400 text-sm mb-1">
                                        Здоровье
                                    </p>
                                    <div className="w-full bg-gray-700/70 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-red-700 to-red-500 h-2.5 rounded-full"
                                            style={{
                                                width: `${
                                                    (character.health /
                                                        character.max_health) *
                                                    100
                                                }%`,
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-right text-xs text-gray-500 mt-1">
                                        {character.health} /{" "}
                                        {character.max_health}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-400 text-sm mb-1">
                                        Мана
                                    </p>
                                    <div className="w-full bg-gray-700/70 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-700 to-blue-500 h-2.5 rounded-full"
                                            style={{
                                                width: `${
                                                    (character.mana /
                                                        character.max_mana) *
                                                    100
                                                }%`,
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-right text-xs text-gray-500 mt-1">
                                        {character.mana} / {character.max_mana}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-400 text-sm mb-1">
                                        Выносливость
                                    </p>
                                    <div className="w-full bg-gray-700/70 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-green-700 to-green-500 h-2.5 rounded-full"
                                            style={{
                                                width: `${
                                                    (character.stamina /
                                                        character.max_stamina) *
                                                    100
                                                }%`,
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-right text-xs text-gray-500 mt-1">
                                        {character.stamina} /{" "}
                                        {character.max_stamina}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Средняя колонка - характеристики */}
                        <div className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 border border-red-900/40 rounded-lg p-6 shadow-lg backdrop-blur-sm">
                            {statGroups.map((group, groupIndex) => (
                                <div
                                    key={groupIndex}
                                    className={groupIndex > 0 ? "mt-8" : ""}
                                >
                                    <h2 className="text-xl text-red-500 mb-4 text-center">
                                        {group.title}
                                    </h2>
                                    <div className="space-y-4">
                                        {group.stats.map((stat, statIndex) => {
                                            return (
                                                <div key={statIndex}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <p className="text-gray-300">
                                                            {stat.name}
                                                        </p>
                                                        <p className="text-lg font-medieval text-red-500">
                                                            {stat.value}
                                                        </p>
                                                    </div>
                                                    <div className="w-full bg-gray-700/70 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className="h-1.5 rounded-full"
                                                            style={{
                                                                width: `${
                                                                    (stat.value /
                                                                        10) *
                                                                    100
                                                                }%`,
                                                                backgroundColor:
                                                                    stat.color,
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Правая колонка - действия и специальные возможности */}
                        <div className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 border border-red-900/40 rounded-lg p-6 shadow-lg backdrop-blur-sm">
                            <h2 className="text-xl text-red-500 mb-6 text-center">
                                Действия
                            </h2>

                            <div className="space-y-4 mb-8">
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={() => navigate("/game")}
                                >
                                    <span className="mr-2">⚔️</span> Начать
                                    приключение
                                </Button>

                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() =>
                                        navigate("/inventory/" + character.id)
                                    }
                                >
                                    <span className="mr-2">🎒</span> Инвентарь
                                </Button>

                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() =>
                                        navigate("/skills/" + character.id)
                                    }
                                >
                                    <span className="mr-2">📚</span> Умения
                                </Button>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-700">
                                <h3 className="text-lg text-red-500 mb-4 text-center">
                                    Особые способности
                                </h3>

                                <div className="bg-gray-900/80 p-4 rounded-lg border border-red-900/40 relative">
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-red-700 px-3 py-0.5 rounded-full">
                                        <p className="text-xs text-gray-100">
                                            Класс
                                        </p>
                                    </div>

                                    {character.class === "berserker" && (
                                        <p className="text-gray-300">
                                            Берсерк: впадает в боевое безумие,
                                            увеличивая силу атак, но снижая
                                            защиту
                                        </p>
                                    )}

                                    {character.class === "paladin" && (
                                        <p className="text-gray-300">
                                            Божественный щит: создает защитный
                                            барьер, отражающий часть входящего
                                            урона
                                        </p>
                                    )}

                                    {character.class === "crossbowman" && (
                                        <p className="text-gray-300">
                                            Меткий выстрел: прицельный выстрел с
                                            высоким шансом критического урона и
                                            игнорированием части брони цели
                                        </p>
                                    )}

                                    {character.class === "elementalist" && (
                                        <p className="text-gray-300">
                                            Власть стихий: призывает
                                            разрушительный шторм элементальной
                                            энергии, наносящий урон всем врагам
                                            в области
                                        </p>
                                    )}

                                    {character.class === "necromancer" && (
                                        <p className="text-gray-300">
                                            Призыв мертвых: призывает
                                            прислужников из мира мёртвых,
                                            которые сражаются на стороне
                                            некроманта
                                        </p>
                                    )}

                                    {character.class === "priest" && (
                                        <p className="text-gray-300">
                                            Темное благословение: ритуал,
                                            усиливающий все характеристики
                                            союзников и восстанавливающий
                                            здоровье
                                        </p>
                                    )}

                                    {character.class === "warrior" && (
                                        <p className="text-gray-300">
                                            Боевая ярость: впадает в боевое
                                            безумие, увеличивая силу атак, но
                                            снижая защиту
                                        </p>
                                    )}

                                    {character.class === "mage" && (
                                        <p className="text-gray-300">
                                            Тёмное призвание: призывает
                                            прислужников из мира мёртвых,
                                            которые сражаются на стороне мага
                                        </p>
                                    )}

                                    {character.class === "rogue" && (
                                        <p className="text-gray-300">
                                            Удар из тени: наносит критический
                                            урон с дополнительным отравлением
                                            цели
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Дополнительная информация о параметрах */}
                    <div className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 border border-red-900/40 rounded-lg p-6 shadow-lg mb-8 backdrop-blur-sm">
                        <h2 className="text-xl text-red-500 mb-6 text-center">
                            Описание характеристик
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-gray-900/70 p-4 rounded-lg border border-red-900/40">
                                <h3 className="text-red-400 font-medieval mb-2">
                                    Основные характеристики
                                </h3>
                                <ul className="space-y-2 text-sm">
                                    <li>
                                        <span className="text-red-500 font-semibold">
                                            Сила:
                                        </span>{" "}
                                        Увеличивает физический урон и
                                        грузоподъемность
                                    </li>
                                    <li>
                                        <span className="text-green-500 font-semibold">
                                            Ловкость:
                                        </span>{" "}
                                        Влияет на уклонение и скорость атаки
                                    </li>
                                    <li>
                                        <span className="text-blue-500 font-semibold">
                                            Интеллект:
                                        </span>{" "}
                                        Усиливает магические способности и урон
                                    </li>
                                    <li>
                                        <span className="text-yellow-500 font-semibold">
                                            Скорость:
                                        </span>{" "}
                                        Влияет на скорость передвижения и
                                        реакции
                                    </li>
                                    <li>
                                        <span className="text-red-500 font-semibold">
                                            Выносливость:
                                        </span>{" "}
                                        Увеличивает максимальное здоровье
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gray-900/70 p-4 rounded-lg border border-red-900/40">
                                <h3 className="text-red-400 font-medieval mb-2">
                                    Дополнительные характеристики
                                </h3>
                                <ul className="space-y-2 text-sm">
                                    <li>
                                        <span className="text-purple-500 font-semibold">
                                            Удача:
                                        </span>{" "}
                                        Влияет на шанс критического удара и
                                        поиск редких предметов
                                    </li>
                                    <li>
                                        <span className="text-pink-500 font-semibold">
                                            Харизма:
                                        </span>{" "}
                                        Улучшает взаимодействие с NPC и цены у
                                        торговцев
                                    </li>
                                    <li>
                                        <span className="text-indigo-500 font-semibold">
                                            Мудрость:
                                        </span>{" "}
                                        Увеличивает скорость получения опыта и
                                        восстановление маны
                                    </li>
                                    <li>
                                        <span className="text-emerald-500 font-semibold">
                                            Проворство:
                                        </span>{" "}
                                        Повышает точность атак и шанс уклонения
                                    </li>
                                    <li>
                                        <span className="text-amber-500 font-semibold">
                                            Телосложение:
                                        </span>{" "}
                                        Усиливает защиту и сопротивление
                                        статусным эффектам
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gray-900/70 p-4 rounded-lg border border-red-900/40">
                                <h3 className="text-red-400 font-medieval mb-2">
                                    Ресурсы
                                </h3>
                                <ul className="space-y-2 text-sm">
                                    <li>
                                        <span className="text-red-500 font-semibold">
                                            Здоровье:
                                        </span>{" "}
                                        Показывает жизненную силу. При нуле
                                        персонаж погибает
                                    </li>
                                    <li>
                                        <span className="text-blue-500 font-semibold">
                                            Мана:
                                        </span>{" "}
                                        Позволяет использовать магические навыки
                                        и заклинания
                                    </li>
                                    <li>
                                        <span className="text-green-500 font-semibold">
                                            Выносливость:
                                        </span>{" "}
                                        Расходуется при физических действиях и
                                        специальных приемах
                                    </li>
                                    <li>
                                        <span className="text-yellow-500 font-semibold">
                                            Опыт:
                                        </span>{" "}
                                        Накапливается за убийство врагов и
                                        выполнение заданий. При заполнении
                                        персонаж получает новый уровень
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center flex flex-col md:flex-row justify-center items-center gap-4">
                        <Button
                            variant="danger"
                            onClick={() => setIsDeleteModalOpen(true)}
                        >
                            <span className="mr-2">🗑️</span> Удалить персонажа
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={() => {
                                characterStore.resetSelectedCharacter();
                                navigate("/");
                            }}
                        >
                            <span className="mr-2">↩️</span> Вернуться на
                            главную
                        </Button>
                    </div>
                </div>
            </div>

            {/* Модальное окно подтверждения удаления */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteCharacter}
                title="Удаление персонажа"
                message={`Вы уверены, что хотите удалить персонажа "${character?.name}"? Это действие нельзя отменить.`}
            />
        </MainLayout>
    );
});

export default CharacterProfile;
