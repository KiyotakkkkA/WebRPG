import React, { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import characterStore from "../../stores/CharacterStore";
import locationStore, {
    Location,
    LocationObject,
    LocationsLoadResult,
    LocationConnection,
} from "../../stores/LocationStore";
import journalStore, { JournalEntry } from "../../stores/JournalStore";
import Button from "../../Components/ui/Button";
import {
    objectTypeIcons,
    objectIconMap,
    actionIcons,
    ProfileIcon,
    ExploreIcon,
    LeaveIcon,
} from "../../Components/ui/GameIcons";
import NpcInteractionModal from "../../Components/game/NpcInteractionModal";
import CombatModal from "../../Components/game/CombatModal";
import { Dialog, Transition } from "@headlessui/react";
import { runInAction } from "mobx";
import TravelModal from "../../Components/game/TravelModal";
import axios from "axios";
import GameHeader from "../../Layouts/GameHeader";
// Импортируем React Query
import {
    useQuery,
    useMutation,
    QueryClient,
    QueryClientProvider,
    UseMutationResult,
} from "@tanstack/react-query";

// Интерфейс для врага
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

// Компонент для отображения игрового объекта
const GameObjectItem: React.FC<{
    object: LocationObject;
    onClick: (object: LocationObject) => void;
}> = ({ object, onClick }) => {
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

// Компонент для отображения требований локации
const LocationRequirement: React.FC<{
    requirement: {
        type: string;
        parameter: string;
        value: number | string;
        description: string;
        fulfilled: boolean;
        current_value?: number | string;
    };
}> = ({ requirement }) => {
    // Иконки для различных типов требований
    const requirementIcons: Record<string, string> = {
        level: "⭐",
        quest: "📜",
        skill: "⚔️",
        gold: "💰",
        item: "🎒",
        attribute: "💪",
        strength: "💪",
        agility: "🏃",
        intelligence: "🧠",
        vitality: "❤️",
        luck: "🍀",
        charisma: "👄",
        wisdom: "📚",
        dexterity: "✋",
        constitution: "🛡️",
    };

    // Локализация названий атрибутов
    const getAttributeName = (attribute: string): string => {
        const attributeNames: Record<string, string> = {
            level: "Уровень",
            quest: "Квест",
            skill: "Навык",
            gold: "Золото",
            item: "Предмет",
            attribute: "Атрибут",
            strength: "Сила",
            agility: "Ловкость",
            intelligence: "Интеллект",
            vitality: "Выносливость",
            luck: "Удача",
            charisma: "Харизма",
            wisdom: "Мудрость",
            dexterity: "Проворство",
            constitution: "Телосложение",
        };

        return attributeNames[attribute] || attribute;
    };

    // Формирование читаемого текста требования
    const getRequirementText = (): string => {
        // Используем уже подготовленное описание, если оно есть
        if (requirement.description) {
            return requirement.description;
        }

        // Если описания нет, формируем его на основе типа требования и параметра
        if (requirement.type === "attribute") {
            const attributeName = getAttributeName(requirement.parameter);
            return `${attributeName} ${requirement.value}`;
        } else {
            // Для других типов требований
            return `${getAttributeName(requirement.type)} ${requirement.value}`;
        }
    };

    return (
        <div
            className={`text-xs flex items-center ${
                requirement.fulfilled ? "text-green-400" : "text-red-400"
            }`}
        >
            <span className="mr-1">
                {requirementIcons[requirement.type] ||
                    requirementIcons[requirement.parameter] ||
                    "❓"}
            </span>
            <span>{getRequirementText()}</span>
            {requirement.current_value !== undefined && (
                <span className="ml-1 font-medium">
                    ({requirement.current_value}/{requirement.value})
                </span>
            )}
        </div>
    );
};

// Модальное окно с требованиями локации
const LocationRequirementsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    location: Location | null;
}> = ({ isOpen, onClose, location }) => {
    if (!location) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-md bg-gray-900 border border-red-900/40 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medieval text-red-500 text-center mb-4"
                                >
                                    Локация недоступна: {location.name}
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-400 mb-4">
                                        Для доступа к этой локации необходимо
                                        выполнить следующие условия:
                                    </p>
                                    <div className="space-y-2 bg-gray-800/60 p-3 rounded-md border border-gray-700/60">
                                        {location.requirements &&
                                        location.requirements.length > 0 ? (
                                            location.requirements.map(
                                                (req, idx) => (
                                                    <LocationRequirement
                                                        key={idx}
                                                        requirement={req}
                                                    />
                                                )
                                            )
                                        ) : (
                                            <p className="text-xs text-gray-500">
                                                Нет доступных данных о
                                                требованиях
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-center">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={onClose}
                                    >
                                        Понятно
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

// Компонент для отображения локации
const LocationItem: React.FC<{
    location: Location;
    onClick: (location: Location) => void;
    isActive: boolean;
    onShowRequirements: (location: Location) => void;
}> = ({ location, onClick, isActive, onShowRequirements }) => {
    return (
        <div
            className={`p-2 rounded-md cursor-pointer transition-colors ${
                isActive
                    ? "bg-red-900/30 border border-red-800/50"
                    : "hover:bg-gray-800/60 border border-transparent hover:border-red-900/30"
            }`}
            onClick={() => {
                if (location.is_accessible) {
                    onClick(location);
                } else {
                    onShowRequirements(location);
                }
            }}
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
                {!location.is_accessible && (
                    <span className="text-xs text-red-500 ml-auto">⚠</span>
                )}
            </div>
            {location.region && (
                <div className="text-xs text-gray-500 mt-1">
                    <span className="opacity-70">{location.region.name}</span>
                </div>
            )}
        </div>
    );
};

// Компонент для отображения записи в журнале
const JournalEntryItem: React.FC<{ entry: JournalEntry }> = ({ entry }) => {
    // Определяем стиль и иконку в зависимости от типа записи
    const getEntryStyle = (type: JournalEntry["type"]) => {
        switch (type) {
            case "location":
                return { color: "text-blue-400", icon: "➤" };
            case "item":
                return { color: "text-green-400", icon: "✓" };
            case "combat":
                return { color: "text-red-400", icon: "⚔️" };
            case "quest":
                return { color: "text-yellow-400", icon: "📜" };
            case "error":
                return { color: "text-red-500", icon: "✗" };
            case "system":
            default:
                return { color: "text-gray-400", icon: "•" };
        }
    };

    const style = getEntryStyle(entry.type);
    const time = journalStore.formatEntryTime(entry.timestamp);

    return (
        <div className={`mb-1 ${style.color}`}>
            <span className="text-gray-600 mr-1">{style.icon}</span>
            <span className="text-gray-500 text-xs mr-1">[{time}]</span>
            {entry.text}
        </div>
    );
};

// Вспомогательная функция для формирования правильного URL изображения
const getImageUrl = (imagePath: string) => {
    if (!imagePath)
        return (
            window.location.origin + "/images/locations/fallback-location.jpg"
        );

    // Если путь уже начинается с http или https, оставляем как есть
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
    }

    // Если путь начинается с /, добавляем только origin
    if (imagePath.startsWith("/")) {
        return window.location.origin + imagePath;
    }

    // Иначе добавляем origin и /
    return window.location.origin + "/" + imagePath;
};

// Добавляем модальное окно для обучения выше определения компонента GameInterface
const TutorialModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    characterName: string;
    characterId: number;
}> = ({ isOpen, onClose, characterName, characterId }) => {
    const [currentStep, setCurrentStep] = React.useState(0);

    const tutorialSteps = [
        {
            title: "Добро пожаловать в Эхо Забвения!",
            content: `${characterName}, вы только что прибыли в этот мрачный и опасный мир. Ваше выживание зависит от ваших решений и действий.`,
            image: "/images/tutorial/welcome.jpg",
        },
        {
            title: "Исследование локаций",
            content:
                "Вы можете перемещаться между локациями, используя карту или список доступных переходов. Будьте осторожны - не все локации безопасны!",
            image: "/images/tutorial/locations.jpg",
        },
        {
            title: "Взаимодействие с объектами",
            content:
                "В каждой локации могут находиться различные объекты - от построек и NPC до ресурсов и монстров. Нажмите на объект, чтобы взаимодействовать с ним.",
            image: "/images/tutorial/objects.jpg",
        },
        {
            title: "Журнал приключений",
            content:
                "Все ваши действия и важные события записываются в журнал. Обращайтесь к нему, если забыли, что происходило ранее.",
            image: "/images/tutorial/journal.jpg",
        },
    ];

    const handleClose = async () => {
        try {
            // Отправляем запрос на сброс флага is_new
            await axios.post("/api/characters/tutorial-completed", {
                character_id: characterId,
            });
        } catch (error) {}
        onClose();
    };

    const nextStep = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const step = tutorialSteps[currentStep];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 transition-opacity"
                    aria-hidden="true"
                >
                    <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
                </div>

                <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-2xl leading-6 font-medieval text-red-500 mb-4">
                                    {step.title}
                                </h3>

                                <div className="my-4">
                                    <img
                                        src={step.image}
                                        alt={step.title}
                                        className="w-full h-64 object-cover rounded-md border border-gray-700"
                                        onError={(
                                            e: React.SyntheticEvent<HTMLImageElement>
                                        ) => {
                                            (e.target as HTMLImageElement).src =
                                                "/images/fallback-location.jpg";
                                        }}
                                    />
                                </div>

                                <div className="mt-2">
                                    <p className="text-gray-300 text-lg">
                                        {step.content}
                                    </p>
                                </div>

                                <div className="mt-5 flex justify-between">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        disabled={currentStep === 0}
                                        className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium focus:outline-none sm:text-sm ${
                                            currentStep === 0
                                                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                                : "bg-red-900 text-white hover:bg-red-800"
                                        }`}
                                    >
                                        Назад
                                    </button>

                                    <div className="flex space-x-2">
                                        {tutorialSteps.map((_, index) => (
                                            <div
                                                key={index}
                                                className={`w-2 h-2 rounded-full ${
                                                    index === currentStep
                                                        ? "bg-red-500"
                                                        : "bg-gray-600"
                                                }`}
                                            ></div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:text-sm"
                                    >
                                        {currentStep < tutorialSteps.length - 1
                                            ? "Далее"
                                            : "Начать игру"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Добавим иконку для карты
const WorldMapIcon = ({ size = 24, className = "" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 6l6-3l6 3l6-3v15l-6 3l-6-3l-6 3V6z" />
        <path d="M9 3v15" />
        <path d="M15 6v15" />
    </svg>
);

// Создаем клиент запросов для React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: false,
        },
    },
});

// Оборачиваем компонент в QueryClientProvider
const GameInterfaceWithQueryProvider = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <GameInterface />
        </QueryClientProvider>
    );
};

// Главный компонент игрового интерфейса
const GameInterface: React.FC = observer(() => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Состояние для текущей локации
    const [activeLocation, setActiveLocation] = useState<Location | null>(null);

    // Состояние для модального окна NPC
    const [isNpcModalOpen, setIsNpcModalOpen] = useState(false);
    const [selectedNpc, setSelectedNpc] = useState<LocationObject | null>(null);

    // Состояние для боевого модального окна
    const [isCombatModalOpen, setIsCombatModalOpen] = useState(false);
    const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);

    // Состояние для модального окна с требованиями локации
    const [isRequirementsModalOpen, setIsRequirementsModalOpen] =
        useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(
        null
    );

    // Состояние для модального окна путешествия
    const [isTravelModalOpen, setIsTravelModalOpen] = useState(false);
    const [selectedTargetLocation, setSelectedTargetLocation] =
        useState<Location | null>(null);
    const [travelTime, setTravelTime] = useState(0);
    const [baseTravelTime, setBaseTravelTime] = useState(0);
    const [savedTime, setSavedTime] = useState(0);
    const [isLocationPreloaded, setIsLocationPreloaded] = useState(false);

    // Состояние для соединений между локациями
    const [locationConnections, setLocationConnections] = useState<
        LocationConnection[]
    >([]);

    // Добавляем состояние для отображения туториала
    const [showTutorial, setShowTutorial] = React.useState(false);

    // Список возможных врагов для локаций
    const locationEnemies: Record<string, Enemy[]> = {
        1: [], // В лагере нет врагов
        2: [
            {
                id: "wounded-wolf",
                name: "Раненый теневой волк",
                health: 50,
                maxHealth: 50,
                level: 2,
                damage: 8,
                defense: 3,
                experience: 35,
                gold: 5,
                drops: [
                    {
                        id: "wolf-fang",
                        name: "Клык теневого волка",
                        chance: 0.7,
                    },
                    {
                        id: "shadow-essence",
                        name: "Эссенция тени",
                        chance: 0.3,
                    },
                ],
            },
            {
                id: "corrupted-tree",
                name: "Оскверненное древо",
                health: 80,
                maxHealth: 80,
                level: 3,
                damage: 5,
                defense: 8,
                experience: 45,
                gold: 3,
                drops: [
                    { id: "dark-bark", name: "Темная кора", chance: 0.8 },
                    {
                        id: "corrupted-sap",
                        name: "Оскверненный сок",
                        chance: 0.4,
                    },
                ],
            },
        ],
        3: [
            {
                id: "skeleton-warrior",
                name: "Скелет-воин",
                health: 60,
                maxHealth: 60,
                level: 4,
                damage: 10,
                defense: 5,
                experience: 50,
                gold: 8,
                drops: [
                    {
                        id: "rusted-sword",
                        name: "Проржавевший меч",
                        chance: 0.6,
                    },
                    { id: "bone-dust", name: "Костная пыль", chance: 0.5 },
                ],
            },
        ],
        4: [
            {
                id: "dark-mage",
                name: "Темный маг",
                health: 70,
                maxHealth: 70,
                level: 5,
                damage: 12,
                defense: 4,
                experience: 70,
                gold: 15,
                drops: [
                    {
                        id: "dark-crystal",
                        name: "Темный кристалл",
                        chance: 0.5,
                    },
                    {
                        id: "spell-scroll",
                        name: "Свиток заклинания",
                        chance: 0.4,
                    },
                    { id: "mage-robe", name: "Мантия мага", chance: 0.2 },
                ],
            },
        ],
    };

    // useQuery для загрузки персонажей
    const {
        data: charactersData,
        isLoading: charactersLoading,
        error: charactersError,
    } = useQuery({
        queryKey: ["characters"],
        queryFn: () => characterStore.loadCharacters(),
        enabled: !characterStore.selectedCharacter, // Запрос активен только если нет выбранного персонажа
    });

    // useQuery для загрузки локаций, активно только при наличии выбранного персонажа
    const {
        data: locationsData,
        isLoading: locationsLoading,
        error: locationsError,
    } = useQuery({
        queryKey: ["availableLocations", characterStore.selectedCharacter?.id],
        queryFn: () =>
            locationStore.loadAvailableLocations(
                characterStore.selectedCharacter!.id
            ),
        enabled: !!characterStore.selectedCharacter,
    });

    // useQuery для загрузки соединений между локациями
    const {
        data: connectionsData,
        isLoading: connectionsLoading,
        error: connectionsError,
    } = useQuery({
        queryKey: ["locationConnections"],
        queryFn: () => locationStore.loadLocationConnections(),
        enabled: !!characterStore.selectedCharacter,
    });

    // useMutation для перемещения к локации
    const { mutate: moveToLocation } = useMutation({
        mutationFn: ({
            characterId,
            locationId,
        }: {
            characterId: number;
            locationId: number;
        }) => locationStore.moveToLocation(characterId, locationId),
        onSuccess: (result) => {
            if (result.success) {
                // Добавляем запись о перемещении в журнал
                journalStore.addEntry(
                    `Вы прибыли в локацию ${selectedTargetLocation?.name}`,
                    "location"
                );
                setActiveLocation(result.location as Location | null);

                // Инвалидация запросов после перемещения
                queryClient.invalidateQueries({
                    queryKey: ["availableLocations"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["locationConnections"],
                });

                // Инвалидация данных персонажа
                if (characterStore.selectedCharacter) {
                    queryClient.invalidateQueries({
                        queryKey: [
                            "character",
                            characterStore.selectedCharacter.id,
                        ],
                    });
                }
            } else {
                console.error(
                    `Ошибка при перемещении в локацию: ${result.error}`,
                    result.debug
                );

                // Добавляем запись об ошибке
                journalStore.addEntry(
                    `Не удалось переместиться в локацию ${selectedTargetLocation?.name}: ${result.error}`,
                    "error"
                );

                setError(
                    result.error ||
                        "Не удалось переместиться в выбранную локацию"
                );
            }

            setSelectedTargetLocation(null);
            setIsTravelModalOpen(false);
            setLoading(false);
        },
        onError: (err) => {
            console.error("Исключение при перемещении в локацию:", err);
            journalStore.addEntry(
                `Произошла ошибка при перемещении в локацию`,
                "error"
            );
            setError("Ошибка при перемещении в локацию");

            setSelectedTargetLocation(null);
            setIsTravelModalOpen(false);
            setLoading(false);
        },
    });

    // useMutation для завершения туториала
    const { mutate: completeTutorial } = useMutation({
        mutationFn: ({ characterId }: { characterId: number }) =>
            axios.post("/api/characters/tutorial-completed", {
                character_id: characterId,
            }),
        onSettled: () => {
            setShowTutorial(false);
            // После закрытия туториала обновляем информацию о персонаже
            if (characterStore.selectedCharacter) {
                queryClient.invalidateQueries({
                    queryKey: [
                        "character",
                        characterStore.selectedCharacter.id,
                    ],
                });
            }
        },
    });

    // useQuery для получения деталей локации для предзагрузки
    const getLocationDetailsQuery = (locationId: number, characterId: number) =>
        useQuery({
            queryKey: ["locationDetails", locationId, characterId],
            queryFn: () =>
                locationStore.getLocationDetails(locationId, characterId),
            enabled: false, // Запрос не активен по умолчанию, вызываем вручную
        });

    // Загружаем персонажа игрока и доступные локации
    useEffect(() => {
        setLoading(true);
        setError(null);

        journalStore.addEntry("Начинаем загрузку игрового мира...", "system");

        if (!characterStore.selectedCharacter) {
            if (charactersData && characterStore.characters.length > 0) {
                // Если есть активный персонаж, выбираем его
                const activeCharacter = characterStore.characters.find(
                    (char) => char.is_active
                );
                if (activeCharacter) {
                    characterStore.selectCharacter(activeCharacter);
                } else {
                    // Иначе выбираем первого персонажа
                    characterStore.selectCharacter(
                        characterStore.characters[0]
                    );
                }
            } else if (charactersError) {
                journalStore.addEntry("Ошибка при загрузке персонажа", "error");
                setError("Ошибка при загрузке персонажа");
                setLoading(false);
            } else if (
                !charactersLoading &&
                characterStore.characters.length === 0
            ) {
                journalStore.addEntry(
                    "У вас нет персонажей. Создайте персонажа, чтобы начать игру."
                );
                setLoading(false);
            }
        }

        // Обработка данных локаций
        if (locationsData && characterStore.selectedCharacter) {
            if (
                locationsData.availableLocations &&
                locationsData.availableLocations.length > 0
            ) {
                setActiveLocation(
                    locationsData.currentLocation as Location | null
                );

                // Если нет текущей локации, но есть доступные, выбираем первую
                if (
                    !locationsData.currentLocation &&
                    locationStore.availableLocations.length > 0
                ) {
                    setActiveLocation(locationStore.availableLocations[0]);
                }

                // Добавляем запись в журнал о текущей локации
                if (locationsData.currentLocation) {
                    journalStore.addEntry(
                        `Вы находитесь в локации ${locationsData.currentLocation.name}`,
                        "location"
                    );
                }
            } else {
                console.warn("Сервер вернул пустой массив локаций");
                journalStore.addEntry(
                    "Не удалось загрузить доступные локации",
                    "error"
                );
            }
        } else if (locationsError) {
            console.error("Ошибка при загрузке локаций:", locationsError);
            setError("Ошибка при загрузке локаций");
        }

        // Обработка данных соединений
        if (connectionsData && connectionsData.length > 0) {
            setLocationConnections(connectionsData);
        } else if (connectionsError) {
            console.error("Ошибка при загрузке соединений:", connectionsError);
            journalStore.addEntry(
                "Ошибка при загрузке соединений между локациями",
                "error"
            );
        }

        // Проверка для новых персонажей
        if (characterStore.selectedCharacter?.is_new) {
            journalStore.addEntry(
                `Добро пожаловать в мир Эхо Забвения, ${characterStore.selectedCharacter.name}! Это ваше первое приключение.`,
                "system"
            );

            // Показываем обучающее модальное окно
            setShowTutorial(true);

            journalStore.addEntry(
                "Ваше путешествие только начинается. Исследуйте мир, выполняйте задания и остерегайтесь опасностей.",
                "system"
            );
        }

        // Установка загрузки в false, когда все данные получены или произошла ошибка
        if (!charactersLoading && !locationsLoading && !connectionsLoading) {
            setLoading(false);
        }
    }, [
        charactersData,
        charactersLoading,
        charactersError,
        locationsData,
        locationsLoading,
        locationsError,
        connectionsData,
        connectionsLoading,
        connectionsError,
    ]);

    // Обработчик выбора локации
    const handleLocationSelect = async (location: Location) => {
        // Убедимся, что у нас есть выбранный персонаж и текущая локация установлены
        if (
            !characterStore.selectedCharacter ||
            !locationStore.currentLocation
        ) {
            console.error(
                "Невозможно переместиться: нет выбранного персонажа или текущей локации"
            );
            return;
        }

        // Если локация недоступна, покажем модальное окно с требованиями
        if (!location.is_accessible) {
            setSelectedLocation(location);
            setIsRequirementsModalOpen(true);
            return;
        }

        // Если локация недоступна из текущей, покажем сообщение об ошибке
        if (!location.is_accessible_from_current) {
            return;
        }

        // Поиск соединения между локациями
        const connections = locationConnections;

        if (connections.length === 0) {
            console.warn("Массив соединений пуст! Загружаем соединения...");
            try {
                const loadedConnections =
                    await locationStore.loadLocationConnections();
                if (loadedConnections.length > 0) {
                    setLocationConnections(loadedConnections);
                    // Продолжаем с новыми соединениями
                    const newConnection = loadedConnections.find(
                        (conn) =>
                            (conn.from_location_id ===
                                locationStore.currentLocation?.id &&
                                conn.to_location_id === location.id) ||
                            (conn.is_bidirectional &&
                                conn.from_location_id === location.id &&
                                conn.to_location_id ===
                                    locationStore.currentLocation?.id)
                    );

                    if (newConnection) {
                        handleTravelSetup(newConnection, location);
                        return;
                    }
                }
            } catch (error) {
                console.error(
                    "Ошибка при динамической загрузке соединений:",
                    error
                );
            }
        }

        // Находим соответствующее соединение
        const connection = connections.find(
            (conn) =>
                (conn.from_location_id === locationStore.currentLocation?.id &&
                    conn.to_location_id === location.id) ||
                (conn.is_bidirectional &&
                    conn.from_location_id === location.id &&
                    conn.to_location_id === locationStore.currentLocation?.id)
        );

        if (!connection) {
            console.warn(
                `Соединение между локациями ${locationStore.currentLocation?.id} и ${location.id} не найдено.`,
                "Используем время по умолчанию: 10 секунд."
            );
        }

        handleTravelSetup(connection, location);
    };

    // Функция настройки путешествия
    const handleTravelSetup = (
        connection: LocationConnection | undefined,
        location: Location
    ) => {
        // Получаем скорость персонажа
        const characterSpeed = characterStore.selectedCharacter!.speed || 10;

        // Базовое время перемещения из соединения или по умолчанию
        let baseTravelTime = connection ? connection.travel_time : 10;

        // Расчет времени с учетом скорости персонажа
        // Новая формула: max(3, time - time*(1 - speed/100))
        const speedModifier = characterSpeed / 100;
        let calculatedTime = Math.round(
            baseTravelTime - baseTravelTime * speedModifier
        );

        // Минимальное время перемещения - 3 секунды
        const finalTravelTime = Math.max(3, calculatedTime);

        // Расчет сэкономленного времени
        const savedTime = baseTravelTime - finalTravelTime;

        // Начинаем предзагрузку локации
        setIsLocationPreloaded(false);
        setSelectedTargetLocation(location);
        setTravelTime(finalTravelTime);
        setBaseTravelTime(baseTravelTime);
        setSavedTime(savedTime);
        setIsTravelModalOpen(true);

        // Предзагружаем данные локации с использованием React Query
        if (characterStore.selectedCharacter) {
            queryClient
                .prefetchQuery({
                    queryKey: [
                        "locationDetails",
                        location.id,
                        characterStore.selectedCharacter.id,
                    ],
                    queryFn: () =>
                        locationStore.getLocationDetails(
                            location.id,
                            characterStore.selectedCharacter!.id
                        ),
                    staleTime: 5 * 60 * 1000, // Кэшируем на 5 минут
                })
                .then(() => {
                    setIsLocationPreloaded(true);
                })
                .catch((error: unknown) => {
                    console.error(
                        "Ошибка при предзагрузке данных локации:",
                        error
                    );
                });
        }
    };

    // Функция для завершения путешествия и фактического перемещения персонажа
    const completeTravelToLocation = async () => {
        if (!characterStore.selectedCharacter || !selectedTargetLocation) {
            setIsTravelModalOpen(false);
            return;
        }

        setLoading(true);
        moveToLocation({
            characterId: characterStore.selectedCharacter.id,
            locationId: selectedTargetLocation.id,
        });

        // Дополнительно инвалидируем данные персонажа
        queryClient.invalidateQueries({
            queryKey: ["character", characterStore.selectedCharacter.id],
        });
    };

    // Функция для отмены путешествия
    const cancelTravel = () => {
        setSelectedTargetLocation(null);
        setIsTravelModalOpen(false);
    };

    // Функция для запуска исследования локации
    const handleExplore = () => {
        if (!activeLocation) return;

        // Проверяем, достаточно ли выносливости
        if (
            characterStore.selectedCharacter &&
            characterStore.selectedCharacter.stamina < 5
        ) {
            journalStore.addEntry(
                "Вы слишком устали для исследования. Отдохните немного.",
                "system"
            );
            return;
        }

        // Добавляем запись о начале исследования
        journalStore.addEntry(
            `Вы исследуете локацию ${activeLocation.name}`,
            "location"
        );

        // Шанс встретить врага зависит от локации
        const encounterChance = activeLocation.danger_level * 0.1; // 0.1 - 0.5 в зависимости от уровня опасности (1-5)

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
            const locationId = activeLocation.id.toString();
            const enemies = locationEnemies[locationId] || [];

            if (enemies.length > 0) {
                const randomEnemy =
                    enemies[Math.floor(Math.random() * enemies.length)];
                journalStore.addEntry(
                    `Вы столкнулись с ${randomEnemy.name}!`,
                    "combat"
                );
                setCurrentEnemy(randomEnemy);
                setIsCombatModalOpen(true);
            } else {
                // Нет врагов в этой локации - находим случайный предмет
                handleFindRandomItem();
            }
        } else if (roll < encounterChance + itemChance) {
            // Находим предмет
            handleFindRandomItem();
        } else if (roll < encounterChance + itemChance + resourceChance) {
            // Находим ресурс с помощью CharacterStore
            const randomResource = characterStore.getRandomResource();
            journalStore.addEntry(
                `Вы обнаружили ресурс: ${randomResource}`,
                "item"
            );
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
            const randomPlace =
                places[Math.floor(Math.random() * places.length)];
            journalStore.addEntry(`Вы обнаружили ${randomPlace}`, "location");
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
            journalStore.addEntry(randomMessage, "system");
        }

        // Расходуем выносливость при исследовании
        characterStore.useResource("stamina", 5);

        // Инвалидируем данные персонажа после изменения состояния
        if (characterStore.selectedCharacter) {
            queryClient.invalidateQueries({
                queryKey: ["character", characterStore.selectedCharacter.id],
            });
        }
    };

    // Функция для генерации случайной находки
    const handleFindRandomItem = () => {
        // Используем метод из CharacterStore
        const randomItem = characterStore.getRandomItem();

        // Добавляем запись в журнал о находке
        journalStore.addEntry(`Вы нашли предмет: ${randomItem}`, "item");

        // Здесь можно добавить логику для добавления предмета в инвентарь
        alert(`Вы нашли: ${randomItem}`);
    };

    // Обработчик получения награды после боя
    const handleCombatVictory = (rewards: {
        experience: number;
        gold: number;
        items: string[];
    }) => {
        // Используем метод из CharacterStore для обновления персонажа
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

    // Обработчик поражения в бою
    const handleCombatDefeat = () => {
        if (!characterStore.selectedCharacter) return;

        // Записываем в журнал о поражении
        journalStore.addEntry(
            "Вы проиграли бой и потеряли сознание...",
            "combat"
        );

        // Сбрасываем текущий бой
        setIsCombatModalOpen(false);
        setTimeout(() => setCurrentEnemy(null), 300);

        // Восстанавливаем минимальное здоровье персонажа
        if (characterStore.selectedCharacter.health <= 0) {
            characterStore.restoreResources(
                Math.ceil(characterStore.selectedCharacter.max_health * 0.1), // 10% от максимального здоровья
                0,
                0
            );
        }

        // Можно добавить дополнительные штрафы или последствия поражения
        journalStore.addEntry(
            "Вы очнулись и можете продолжить приключение, но будьте осторожнее...",
            "system"
        );

        // Инвалидируем данные персонажа после боя
        queryClient.invalidateQueries({
            queryKey: ["character", characterStore.selectedCharacter.id],
        });
    };

    // Обработчик для показа требований локации
    const handleShowLocationRequirements = (location: Location) => {
        setSelectedLocation(location);
        setIsRequirementsModalOpen(true);
    };

    // Проверяет, соответствует ли персонаж требованиям локации
    const checkLocationRequirements = (location: Location): boolean => {
        if (!location.requirements || location.requirements.length === 0) {
            return true;
        }

        // Проверяем каждое требование с помощью CharacterStore
        return location.requirements.every((req) =>
            characterStore.meetsRequirement(req)
        );
    };

    // Обработчик выбора объекта
    const handleObjectSelect = (object: LocationObject) => {
        if (object.type === "npc") {
            journalStore.addEntry(`Вы встретили ${object.name}`, "location");
            setSelectedNpc(object);
            setIsNpcModalOpen(true);
        } else if (object.type === "monster") {
            // Запускаем бой при выборе монстра
            if (activeLocation) {
                const locationId = activeLocation.id.toString();
                const enemies = locationEnemies[locationId];

                if (enemies) {
                    const enemy = enemies.find((e) => e.id === object.id);
                    if (enemy) {
                        journalStore.addEntry(
                            `Вы вступили в бой с ${object.name}`,
                            "combat"
                        );
                        setCurrentEnemy(enemy);
                        setIsCombatModalOpen(true);
                    }
                }
            }
        } else {
            journalStore.addEntry(`Вы исследуете ${object.name}`, "location");
            // Здесь будет логика для других типов объектов
        }
    };

    // Функция для завершения туториала
    const handleTutorialComplete = () => {
        if (characterStore.selectedCharacter) {
            // Используем метод из CharacterStore с колбэком для инвалидации
            characterStore.completeTutorial(
                characterStore.selectedCharacter.id,
                () => {
                    // Инвалидируем данные персонажа после завершения туториала
                    queryClient.invalidateQueries({
                        queryKey: [
                            "character",
                            characterStore.selectedCharacter!.id,
                        ],
                    });
                    setShowTutorial(false);
                }
            );
        } else {
            setShowTutorial(false);
        }
    };

    // Отображаем загрузку
    if (loading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-red-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-black"></div>
                        </div>
                    </div>
                    <p className="mt-4 text-xl font-medieval text-red-600">
                        Загрузка мира...
                    </p>
                </div>
            </div>
        );
    }

    // Отображаем ошибку
    if (error || !characterStore.selectedCharacter) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <div className="max-w-md p-6 bg-gray-900 border border-red-900/40 rounded-lg shadow-xl">
                    <h2 className="text-xl text-red-500 mb-4">Ошибка</h2>
                    <p className="text-gray-400 mb-6">
                        {error ||
                            "Персонаж не найден. Вернитесь на главную страницу и создайте нового персонажа."}
                    </p>
                    <div className="flex justify-center">
                        <Button variant="primary" onClick={() => navigate("/")}>
                            <span className="mr-2">🏰</span> Вернуться на
                            главную
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const character = characterStore.selectedCharacter;

    return (
        <div className="fixed inset-0 bg-gray-900 flex flex-col overflow-hidden">
            {/* Верхняя панель с информацией о персонаже */}
            <GameHeader activeLocationName={activeLocation?.name} />

            {/* Основной контент */}
            <div className="flex-1 flex">
                {/* Левая панель - Список доступных локаций */}
                <div className="w-60 bg-gradient-to-b from-gray-800 to-gray-900 border-r border-red-900/50 overflow-y-auto flex flex-col shadow-lg">
                    <div className="p-3 border-b border-red-900/40 bg-gray-900">
                        <h3 className="text-red-500 text-sm font-medieval uppercase tracking-wider text-center">
                            Доступные переходы
                        </h3>

                        {activeLocation?.region && (
                            <div className="mt-2 flex items-center justify-center">
                                <div className="px-3 py-1 bg-gray-800/70 rounded-md border border-red-900/30">
                                    <div className="flex items-center">
                                        {activeLocation.region.icon && (
                                            <img
                                                src={getImageUrl(
                                                    activeLocation.region.icon
                                                )}
                                                alt={activeLocation.region.name}
                                                className="w-4 h-4 mr-2"
                                                onError={(
                                                    e: React.SyntheticEvent<HTMLImageElement>
                                                ) => {
                                                    (
                                                        e.target as HTMLImageElement
                                                    ).src =
                                                        window.location.origin +
                                                        "/images/icons/region-default.png";
                                                }}
                                            />
                                        )}
                                        <span className="text-xs text-gray-400">
                                            Текущий регион:{" "}
                                            <span className="text-red-400">
                                                {activeLocation.region.name}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-2 space-y-2 flex-1 game-panel overflow-y-auto">
                        {locationStore.availableLocations
                            .filter(
                                (location) =>
                                    location.is_accessible_from_current &&
                                    !location.is_current
                            )
                            .map((location) => (
                                <LocationItem
                                    key={location.id}
                                    location={location}
                                    onClick={handleLocationSelect}
                                    isActive={
                                        activeLocation?.id === location.id
                                    }
                                    onShowRequirements={
                                        handleShowLocationRequirements
                                    }
                                />
                            ))}
                        {locationStore.availableLocations.filter(
                            (location) =>
                                location.is_accessible_from_current &&
                                !location.is_current
                        ).length === 0 && (
                            <div className="text-sm text-gray-500 text-center p-4">
                                <div className="font-medieval text-red-500">
                                    Нет доступных локаций для перехода
                                </div>
                                <div className="mt-3 text-xs text-gray-500">
                                    Пожалуйста, исследуйте текущую локацию,
                                    чтобы открыть путь в новые области
                                </div>
                                {/* Отладочная информация - в продакшене можно убрать */}
                                <div className="mt-4 text-xs text-gray-600 border-t border-gray-800 pt-2">
                                    <div>
                                        Всего локаций:{" "}
                                        {
                                            locationStore.availableLocations
                                                .length
                                        }
                                    </div>
                                    <div>
                                        Текущая локация:{" "}
                                        {activeLocation?.name || "Нет"}
                                    </div>
                                    <div className="mt-1 text-left">
                                        <div className="text-xs font-bold text-gray-500 mb-1">
                                            Все локации:
                                        </div>
                                        {locationStore.availableLocations.map(
                                            (loc) => (
                                                <div
                                                    key={loc.id}
                                                    className="text-left px-2 text-xs text-gray-600 border-b border-gray-800 pb-1 mb-1"
                                                >
                                                    <div>
                                                        {loc.name} (ID: {loc.id}
                                                        )
                                                    </div>
                                                    <div className="ml-2">
                                                        {loc.is_current && (
                                                            <span className="text-blue-500">
                                                                Текущая
                                                            </span>
                                                        )}
                                                        {loc.is_accessible_from_current ? (
                                                            <span className="text-green-500 ml-2">
                                                                Доступна для
                                                                перехода
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-500 ml-2">
                                                                Недоступна для
                                                                перехода
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-red-900/40 mt-auto bg-gray-900/70">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full text-xs flex items-center justify-center"
                            onClick={() =>
                                navigate(`/character/${character.id}`)
                            }
                        >
                            <ProfileIcon
                                className="text-gray-400 mr-2"
                                size={16}
                            />
                            Профиль
                        </Button>
                    </div>
                </div>

                {/* Центральная область - Отображение локации */}
                <div className="flex-1 flex flex-col relative">
                    {/* Фон локации */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src={getImageUrl(
                                activeLocation?.image_url ||
                                    "/images/locations/fallback_location.jpg"
                            )}
                            alt={activeLocation?.name || "Локация"}
                            className="w-full h-full object-cover opacity-90"
                            onError={(
                                e: React.SyntheticEvent<HTMLImageElement>
                            ) => {
                                (e.target as HTMLImageElement).src =
                                    window.location.origin +
                                    "/images/locations/fallback_location.jpg";
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
                    </div>

                    {/* Название и описание локации в рамке */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-gray-900/70 px-6 py-4 rounded-lg border border-red-900/50 shadow-md max-w-2xl">
                        <h2 className="text-2xl text-red-400 font-medieval drop-shadow-lg text-center">
                            {activeLocation?.name || "Неизвестное место"}
                        </h2>
                        <p className="text-sm text-gray-300 mt-2 text-center">
                            {activeLocation?.description ||
                                "Описание недоступно"}
                        </p>
                    </div>

                    {/* Контроль локации */}
                    <div className="mt-auto p-4 z-10 bg-gray-900/40 border-t border-red-900/30">
                        <div className="flex justify-between max-w-md mx-auto">
                            <Button
                                variant="primary"
                                size="sm"
                                className="flex items-center"
                                onClick={handleExplore}
                            >
                                <ExploreIcon
                                    className="text-gray-300 mr-2"
                                    size={16}
                                />
                                Исследовать
                            </Button>

                            <Button
                                variant="secondary"
                                size="sm"
                                className="flex items-center"
                            >
                                <LeaveIcon
                                    className="text-gray-300 mr-2"
                                    size={16}
                                />
                                Покинуть локацию
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Правая панель - Объекты на локации */}
                <div className="w-64 bg-gradient-to-b from-gray-800 to-gray-900 border-l border-red-900/50 overflow-y-auto flex flex-col shadow-lg">
                    <div className="p-3 border-b border-red-900/40 bg-gray-900">
                        <h3 className="text-red-500 text-sm font-medieval uppercase tracking-wider text-center">
                            Объекты
                        </h3>
                    </div>
                    <div className="p-2 flex-1 space-y-1 game-panel overflow-y-auto">
                        {activeLocation?.objects ? (
                            activeLocation.objects.map((object, index) => (
                                <GameObjectItem
                                    key={`${object.id}-${index}`}
                                    object={object}
                                    onClick={handleObjectSelect}
                                />
                            ))
                        ) : (
                            <div className="text-sm text-gray-500 text-center p-4">
                                В этой локации нет объектов
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Нижняя панель - Чат и логи */}
            <div className="h-36 bg-gradient-to-t from-gray-900 to-gray-800 border-t border-red-900/60 flex shadow-inner">
                <div className="flex-1 border-r border-red-900/40 p-3 flex flex-col">
                    <div className="text-xs text-gray-400 mb-1 font-medieval">
                        Сообщения:
                    </div>
                    <div className="flex-1 overflow-y-auto text-xs space-y-1 pb-2 bg-gray-900/70 p-2 rounded-md border border-red-900/30 mb-1 game-panel">
                        <div className="text-red-500">
                            <strong>[Система]</strong> Добро пожаловать в мир
                            Echoes of Oblivion!
                        </div>
                        <div className="text-yellow-500">
                            <strong>[Предупреждение]</strong> Вы вошли в опасную
                            зону. Будьте осторожны.
                        </div>
                        <div className="text-gray-400">
                            <strong>[Старейшина Ирмель]</strong> Я ждала тебя,
                            путник. У меня есть задание для тебя...
                        </div>
                    </div>

                    <div className="flex">
                        <input
                            type="text"
                            className="flex-1 bg-gray-800 border border-gray-700 text-gray-300 text-xs py-1.5 px-3 rounded-l-md focus:outline-none focus:border-red-900"
                            placeholder="Введите сообщение..."
                        />
                        <button className="bg-red-900 text-gray-200 px-4 py-1.5 text-xs rounded-r-md hover:bg-red-800 border border-red-800">
                            Отправить
                        </button>
                    </div>
                </div>

                <div className="w-64 p-3 flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                        <div className="text-xs text-gray-400 font-medieval">
                            Журнал событий:
                        </div>
                        <div className="flex space-x-1">
                            <button
                                className="text-xs text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                                title="Обновить журнал"
                                onClick={() => {
                                    journalStore.addEntry(
                                        "Журнал обновлен",
                                        "system"
                                    );
                                }}
                            >
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
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                            </button>
                            <button
                                className="text-xs text-gray-500 hover:text-red-400 transition-colors focus:outline-none"
                                title="Очистить журнал"
                                onClick={() => {
                                    if (confirm("Очистить журнал событий?")) {
                                        journalStore.clearJournal();
                                        journalStore.addEntry(
                                            "Журнал очищен",
                                            "system"
                                        );
                                    }
                                }}
                            >
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
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto text-xs bg-gray-900/70 p-2 rounded-md border border-red-900/30 game-panel">
                        {journalStore.getLastEntries(15).map((entry) => (
                            <JournalEntryItem key={entry.id} entry={entry} />
                        ))}
                        {journalStore.entries.length === 0 && (
                            <div className="text-gray-600 text-center p-2">
                                Журнал событий пуст
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Модальные окна - без изменений */}
            {selectedNpc && (
                <NpcInteractionModal
                    isOpen={isNpcModalOpen}
                    onClose={() => setIsNpcModalOpen(false)}
                    npc={{
                        id: selectedNpc.id,
                        name: selectedNpc.name,
                        type: selectedNpc.type,
                    }}
                />
            )}

            {/* Модальное окно для боя */}
            {currentEnemy && characterStore.selectedCharacter && (
                <CombatModal
                    isOpen={isCombatModalOpen}
                    onClose={() => {
                        setIsCombatModalOpen(false);
                        // Сброс врага после закрытия модального окна с задержкой,
                        // чтобы избежать визуальных глюков при закрытии
                        setTimeout(() => setCurrentEnemy(null), 300);
                    }}
                    onVictory={handleCombatVictory}
                    onDefeat={handleCombatDefeat}
                    enemy={currentEnemy}
                    character={{
                        id: characterStore.selectedCharacter.id,
                        name: characterStore.selectedCharacter.name,
                        health: characterStore.selectedCharacter.health,
                        maxHealth: characterStore.selectedCharacter.max_health,
                        mana: characterStore.selectedCharacter.mana,
                        maxMana: characterStore.selectedCharacter.max_mana,
                        stamina: characterStore.selectedCharacter.stamina,
                        maxStamina:
                            characterStore.selectedCharacter.max_stamina,
                        strength: characterStore.selectedCharacter.strength,
                        agility: characterStore.selectedCharacter.agility,
                        intelligence:
                            characterStore.selectedCharacter.intelligence,
                    }}
                />
            )}

            {/* Модальное окно с требованиями локации */}
            <LocationRequirementsModal
                isOpen={isRequirementsModalOpen}
                onClose={() => setIsRequirementsModalOpen(false)}
                location={selectedLocation}
            />

            {/* Модальное окно для путешествия */}
            {activeLocation && selectedTargetLocation && (
                <TravelModal
                    isOpen={isTravelModalOpen}
                    fromLocation={activeLocation}
                    toLocation={selectedTargetLocation}
                    travelTime={travelTime}
                    baseTravelTime={baseTravelTime}
                    savedTime={savedTime}
                    onComplete={completeTravelToLocation}
                    onCancel={cancelTravel}
                    isLocationPreloaded={isLocationPreloaded}
                />
            )}

            {/* Модальное окно для обучения новых игроков */}
            {characterStore.selectedCharacter && (
                <TutorialModal
                    isOpen={showTutorial}
                    onClose={handleTutorialComplete}
                    characterName={characterStore.selectedCharacter.name}
                    characterId={characterStore.selectedCharacter.id}
                />
            )}
        </div>
    );
});

export default GameInterfaceWithQueryProvider;
