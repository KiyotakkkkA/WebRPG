import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../Layouts/MainLayout";
import Button from "../../Components/ui/Button";
import HeroCard from "../../Components/ui/HeroCard";
import { observer } from "mobx-react-lite";
import characterStore from "../../stores/CharacterStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Интерфейс для класса персонажа
interface CharacterClass {
    id: string;
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
}

// Определяем типы для данных API
interface Character {
    id: number;
    name: string;
    class: string;
    level: number;
    experience: number;
    exp_to_next_level: number;
    health: number;
    max_health: number;
    mana: number;
    max_mana: number;
    stamina: number;
    max_stamina: number;
    strength: number;
    agility: number;
    intelligence: number;
    speed: number;
    vitality: number;
    luck: number;
    charisma: number;
    wisdom: number;
    dexterity: number;
    constitution: number;
    is_active: boolean;
    is_new: boolean;
    created_at: string;
    updated_at: string;
}

interface CharactersResponse {
    characters: Character[];
    max_characters: number;
    remaining_slots: number;
    can_create_more: boolean;
}

interface CreateCharacterResponse {
    character: Character;
    remaining_slots: number;
}

// API функции для использования с React Query
const fetchCharactersAPI = async (): Promise<CharactersResponse> => {
    const response = await axios.get("/api/characters");
    return response.data;
};

const createCharacterAPI = async ({
    name,
    characterClass,
}: {
    name: string;
    characterClass: string;
}): Promise<CreateCharacterResponse> => {
    // Попытка обновить CSRF-токен перед созданием персонажа
    try {
        await axios.get("/sanctum/csrf-cookie");
    } catch (error) {
        console.warn("Не удалось обновить CSRF-токен:", error);
    }

    const response = await axios.post("/api/characters", {
        name,
        class: characterClass,
    });

    return response.data;
};

const CreateCharacter: React.FC = observer(() => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Загружаем данные о персонажах с помощью React Query
    const {
        data: charactersData,
        isLoading: charactersLoading,
        error: charactersError,
    } = useQuery<CharactersResponse>({
        queryKey: ["characters"],
        queryFn: fetchCharactersAPI,
        staleTime: 5 * 60 * 1000, // 5 минут кэширования
    });

    // Мутация для создания персонажа
    const createCharacterMutation = useMutation({
        mutationFn: createCharacterAPI,
        onSuccess: (data) => {
            // Инвалидируем кэш персонажей, чтобы обновить данные
            queryClient.invalidateQueries({ queryKey: ["characters"] });

            // Обновляем данные в MobX хранилище для обратной совместимости
            characterStore.characters.push(data.character);
            characterStore.selectedCharacter = data.character;
            characterStore.remainingSlots = data.remaining_slots;
            characterStore.canCreateMore = data.remaining_slots > 0;

            // Перенаправляем на главную страницу
            navigate("/");
        },
        onError: (error: any) => {
            console.error("Ошибка при создании персонажа:", error);

            // Устанавливаем ошибку в state
            const errorMessage =
                error.response?.data?.message ||
                "Произошла ошибка при создании персонажа";
            setErrors({ general: errorMessage });
        },
    });

    // Синхронизируем данные с MobX хранилищем для обратной совместимости
    useEffect(() => {
        if (charactersData) {
            characterStore.characters = charactersData.characters;
            characterStore.maxCharacters = charactersData.max_characters;
            characterStore.remainingSlots = charactersData.remaining_slots;
            characterStore.canCreateMore = charactersData.can_create_more;
        }
    }, [charactersData]);

    // Логгируем ошибки, если они возникают
    useEffect(() => {
        if (charactersError) {
            console.error("Ошибка при загрузке персонажей:", charactersError);
            setErrors({ general: "Ошибка при загрузке данных о персонажах" });
        }
    }, [charactersError]);

    // Классы персонажей
    const characterClasses: CharacterClass[] = [
        {
            id: "paladin",
            title: "Палладин",
            description:
                "Священный воин, облаченный в тяжелые доспехи, владеющий как боевыми, так и светлыми магическими навыками. Защитник слабых и враг нежити.",
            imageSrc: "/images/classes/paladin.jpg",
            stats: {
                strength: 7,
                agility: 4,
                intelligence: 6,
                vitality: 8,
                luck: 5,
                charisma: 7,
                wisdom: 7,
                dexterity: 4,
                constitution: 7,
            },
            specialAbility:
                "Священный щит: Создает ауру защиты, снижающую получаемый урон и наносящую урон тёмным существам",
        },
        {
            id: "berserker",
            title: "Берсерк",
            description:
                "Неистовый воин, черпающий силу из ярости. Способен впадать в боевое безумие, игнорируя боль и усталость, нанося сокрушительный урон.",
            imageSrc: "/images/classes/berserker.jpg",
            stats: {
                strength: 9,
                agility: 6,
                intelligence: 2,
                vitality: 8,
                luck: 3,
                charisma: 3,
                wisdom: 2,
                dexterity: 6,
                constitution: 9,
            },
            specialAbility:
                "Ярость: Впадает в боевое безумие, значительно увеличивая урон, но снижая защиту",
        },
        {
            id: "crossbowman",
            title: "Арбалетчик",
            description:
                "Искусный стрелок, способный поражать цели на дальних дистанциях. Мастер точных выстрелов и смертоносных ловушек.",
            imageSrc: "/images/classes/crossbowman.jpg",
            stats: {
                strength: 5,
                agility: 8,
                intelligence: 5,
                vitality: 5,
                luck: 6,
                charisma: 4,
                wisdom: 5,
                dexterity: 9,
                constitution: 5,
            },
            specialAbility:
                "Меткий выстрел: Наносит критический урон с шансом оглушить цель",
        },
        {
            id: "elementalist",
            title: "Элементалист",
            description:
                "Маг, овладевший силами природных стихий. Способен призывать огонь, лёд, молнии и камни для уничтожения врагов.",
            imageSrc: "/images/classes/elementalist.jpg",
            stats: {
                strength: 3,
                agility: 5,
                intelligence: 9,
                vitality: 4,
                luck: 5,
                charisma: 6,
                wisdom: 8,
                dexterity: 6,
                constitution: 4,
            },
            specialAbility:
                "Взрыв стихий: Комбинирует силы всех стихий, создавая мощное заклинание массового поражения",
        },
        {
            id: "necromancer",
            title: "Некромант",
            description:
                "Тёмный маг, овладевший искусством оживления мёртвых. Управляет армией нежити и использует силы смерти для уничтожения врагов.",
            imageSrc: "/images/classes/necromancer.jpg",
            stats: {
                strength: 2,
                agility: 4,
                intelligence: 10,
                vitality: 3,
                luck: 5,
                charisma: 4,
                wisdom: 9,
                dexterity: 4,
                constitution: 3,
            },
            specialAbility:
                "Армия тьмы: Призывает нескольких сильных нежитей, которые сражаются на его стороне",
        },
        {
            id: "priest",
            title: "Жрец",
            description:
                "Служитель высших сил, обладающий мощными заклинаниями исцеления и защиты. Способен как восстанавливать здоровье союзников, так и наносить урон нежити.",
            imageSrc: "/images/classes/priest.jpg",
            stats: {
                strength: 3,
                agility: 3,
                intelligence: 8,
                vitality: 5,
                luck: 6,
                charisma: 8,
                wisdom: 10,
                dexterity: 3,
                constitution: 4,
            },
            specialAbility:
                "Божественное вмешательство: Призывает силу богов для массового исцеления союзников и нанесения урона нежити",
        },
    ];

    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [characterName, setCharacterName] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSelectClass = (classId: string) => {
        setSelectedClass(classId);
        setErrors((prev) => ({ ...prev, class: "" }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Проверяем, может ли пользователь создать еще персонажей
        if (charactersData && !charactersData.can_create_more) {
            setErrors({
                general: `Вы достигли максимального количества персонажей (${charactersData.max_characters}). Удалите существующего персонажа, чтобы создать нового.`,
            });
            return;
        }

        // Проверка на заполнение
        let newErrors: Record<string, string> = {};
        if (!characterName.trim()) {
            newErrors.name = "Необходимо указать имя персонажа";
        } else if (characterName.trim().length < 3) {
            newErrors.name = "Имя должно содержать не менее 3 символов";
        } else if (characterName.trim().length > 20) {
            newErrors.name = "Имя должно содержать не более 20 символов";
        }

        if (!selectedClass) {
            newErrors.class = "Необходимо выбрать класс персонажа";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Создание персонажа с использованием React Query
        createCharacterMutation.mutate({
            name: characterName.trim(),
            characterClass: selectedClass!,
        });
    };

    return (
        <MainLayout>
            <div className="relative min-h-screen">
                {/* Фоновые слои */}
                <div className="absolute inset-0 bg-gray-900 bg-opacity-95 z-0"></div>
                <div className="absolute inset-0 bg-[url('/images/backgrounds/character_creation_bg.jpg')] bg-cover bg-center bg-fixed opacity-20 z-0"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent z-0"></div>

                {/* Мистические элементы */}
                <div className="absolute inset-0 overflow-hidden z-0">
                    {/* Руны и символы */}
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-600 rounded-full blur-sm animate-ping"></div>
                    <div className="absolute top-3/4 left-2/3 w-1 h-1 bg-red-500 rounded-full blur-sm animate-ping animation-delay-700"></div>
                    <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-red-700 rounded-full blur-sm animate-ping animation-delay-1000"></div>

                    {/* Декоративные линии */}
                    <div className="absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-800/30 to-transparent"></div>
                    <div className="absolute bottom-20 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-800/30 to-transparent"></div>
                </div>

                {/* Основной контент */}
                <div className="container mx-auto px-4 py-8 relative z-10">
                    <div className="mb-8 text-center">
                        <h1 className="echoes-title mb-4 text-red-500">
                            Создание персонажа
                        </h1>
                        <div className="h-0.5 w-1/4 mx-auto bg-gradient-to-r from-transparent via-red-700/40 to-transparent"></div>
                    </div>

                    {/* Отображение индикатора загрузки */}
                    {charactersLoading && (
                        <div className="max-w-xl mx-auto mb-6 text-center">
                            <div className="flex justify-center items-center p-4">
                                <div className="relative">
                                    <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-red-600"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-6 w-6 rounded-full bg-gray-900"></div>
                                    </div>
                                </div>
                                <p className="ml-4 text-lg font-medieval text-red-600">
                                    Загрузка данных...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Информация о лимите персонажей */}
                    {!charactersLoading && charactersData && (
                        <div className="max-w-xl mx-auto mb-6 text-center">
                            <div
                                className={`p-4 rounded-md mb-4 ${
                                    charactersData.remaining_slots === 0
                                        ? "bg-red-900/50 border border-red-700"
                                        : "bg-gray-800/60 border border-gray-700"
                                }`}
                            >
                                <p className="text-gray-300">
                                    Доступные слоты персонажей:{" "}
                                    <span className="text-red-400 font-bold">
                                        {charactersData.remaining_slots}
                                    </span>{" "}
                                    из{" "}
                                    <span className="text-red-400 font-bold">
                                        {charactersData.max_characters}
                                    </span>
                                </p>
                            </div>

                            {/* Общая ошибка */}
                            {errors.general && (
                                <div className="bg-red-900/50 border border-red-700 p-4 rounded-md mb-4">
                                    <p className="text-red-300">
                                        {errors.general}
                                    </p>
                                    <Button
                                        variant="secondary"
                                        className="mt-2"
                                        onClick={() => navigate("/")}
                                    >
                                        Вернуться на главную
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Если пользователь еще не достиг лимита, показываем форму создания персонажа */}
                    {!charactersLoading &&
                        charactersData &&
                        charactersData.can_create_more &&
                        !errors.general && (
                            <form onSubmit={handleSubmit}>
                                {/* Имя персонажа */}
                                <div className="max-w-md mx-auto mb-8">
                                    <label
                                        className="block text-gray-300 text-sm mb-2"
                                        htmlFor="characterName"
                                    >
                                        Имя персонажа
                                    </label>
                                    <input
                                        id="characterName"
                                        type="text"
                                        className={`w-full p-3 bg-gray-800/80 backdrop-blur-sm border ${
                                            errors.name
                                                ? "border-red-500"
                                                : characterName.trim().length >=
                                                      3 &&
                                                  characterName.trim().length <=
                                                      20
                                                ? "border-green-500"
                                                : "border-gray-700"
                                        } rounded-md text-gray-300 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500`}
                                        value={characterName}
                                        onChange={(e) => {
                                            setCharacterName(e.target.value);
                                            if (errors.name) {
                                                setErrors((prev) => ({
                                                    ...prev,
                                                    name: "",
                                                }));
                                            }
                                        }}
                                        placeholder="Введите имя персонажа"
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.name}
                                        </p>
                                    )}
                                    {!errors.name &&
                                        characterName.trim().length >= 3 &&
                                        characterName.trim().length <= 20 && (
                                            <p className="text-green-500 text-xs mt-1">
                                                Корректное имя персонажа ✓
                                            </p>
                                        )}
                                </div>

                                {/* Заголовок для выбора класса */}
                                <div className="mb-6 text-center">
                                    <h2 className="text-red-500 text-2xl font-medieval">
                                        Выберите класс
                                    </h2>
                                    <p className="text-gray-400 mb-2">
                                        Каждый класс обладает уникальными
                                        способностями и стилем игры
                                    </p>
                                    {errors.class && (
                                        <p className="text-red-500 text-sm mt-2">
                                            {errors.class}
                                        </p>
                                    )}
                                    {selectedClass && (
                                        <div className="flex items-center justify-center text-green-500 text-sm mt-2">
                                            <span className="mr-2">✓</span>
                                            <span>
                                                Выбран класс:{" "}
                                                {
                                                    characterClasses.find(
                                                        (c) =>
                                                            c.id ===
                                                            selectedClass
                                                    )?.title
                                                }
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Сетка классов */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                                    {characterClasses.map((characterClass) => (
                                        <HeroCard
                                            key={characterClass.id}
                                            title={characterClass.title}
                                            description={
                                                characterClass.description
                                            }
                                            imageSrc={characterClass.imageSrc}
                                            stats={characterClass.stats}
                                            specialAbility={
                                                characterClass.specialAbility
                                            }
                                            onClick={() =>
                                                handleSelectClass(
                                                    characterClass.id
                                                )
                                            }
                                            isSelected={
                                                selectedClass ===
                                                characterClass.id
                                            }
                                        />
                                    ))}
                                </div>

                                {/* Создание персонажа */}
                                <div className="max-w-md mx-auto mt-10">
                                    {errors.general && (
                                        <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-md mb-4">
                                            {errors.general}
                                        </div>
                                    )}

                                    {/* Информация о готовности к созданию */}
                                    {selectedClass &&
                                        characterName.trim().length >= 3 &&
                                        characterName.trim().length <= 20 && (
                                            <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-3 rounded-md mb-4">
                                                <p className="flex items-center">
                                                    <span className="mr-2">
                                                        ✓
                                                    </span>
                                                    Все готово для создания
                                                    персонажа
                                                </p>
                                            </div>
                                        )}

                                    <div className="flex justify-between">
                                        <Button
                                            variant="secondary"
                                            type="button"
                                            onClick={() => navigate("/")}
                                        >
                                            Отмена
                                        </Button>
                                        <Button
                                            variant="primary"
                                            type="submit"
                                            disabled={
                                                createCharacterMutation.isPending ||
                                                !selectedClass ||
                                                !characterName.trim() ||
                                                characterName.trim().length <
                                                    3 ||
                                                characterName.trim().length > 20
                                            }
                                            className={`${
                                                selectedClass &&
                                                characterName.trim().length >=
                                                    3 &&
                                                characterName.trim().length <=
                                                    20
                                                    ? "animate-pulse"
                                                    : ""
                                            }`}
                                        >
                                            {createCharacterMutation.isPending ? (
                                                <span className="flex items-center">
                                                    <svg
                                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <circle
                                                            className="opacity-25"
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="4"
                                                        ></circle>
                                                        <path
                                                            className="opacity-75"
                                                            fill="currentColor"
                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        ></path>
                                                    </svg>
                                                    Создание...
                                                </span>
                                            ) : (
                                                "Создать персонажа"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}
                </div>
            </div>
        </MainLayout>
    );
});

export default CreateCharacter;
