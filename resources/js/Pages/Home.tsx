import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../Layouts/MainLayout";
import Button from "../Components/ui/Button";
import NewsCard from "../Components/ui/NewsCard";
import { observer } from "mobx-react-lite";
import authStore from "../stores/AuthStore";
import characterStore from "../stores/CharacterStore";
import statisticsStore from "../stores/StatisticsStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Определение типов интерфейсов для данных API
interface GameStatistics {
    users_count: string;
    characters_count: string;
}

interface CharacterData {
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
    characters: CharacterData[];
    max_characters: number;
    remaining_slots: number;
    can_create_more: boolean;
}

// API функции для использования с React Query
const fetchStatisticsAPI = async (): Promise<GameStatistics> => {
    const response = await axios.get("/api/statistics");
    return response.data;
};

const fetchCharactersAPI = async (): Promise<CharactersResponse> => {
    const response = await axios.get("/api/characters");
    return response.data;
};

// Декоративный разделитель в средневековом стиле
const Divider = () => (
    <div className="flex items-center justify-center my-6">
        <div className="w-1/4 h-0.5 bg-gradient-to-r from-transparent to-red-800/30"></div>
        <div className="mx-4 text-red-600">❖</div>
        <div className="w-1/4 h-0.5 bg-gradient-to-l from-transparent to-red-800/30"></div>
    </div>
);

// Декоративный заголовок секции
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="text-center mb-8">
        <h2 className="text-red-500 inline-block relative">{children}</h2>
        <div className="h-0.5 w-3/4 mx-auto mt-2 bg-gradient-to-r from-transparent via-red-700/40 to-transparent"></div>
    </div>
);

const Home: React.FC = observer(() => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Используем React Query для загрузки статистики
    const {
        data: statisticsData,
        isLoading: statisticsLoading,
        error: statisticsError,
    } = useQuery<GameStatistics>({
        queryKey: ["statistics"],
        queryFn: fetchStatisticsAPI,
        staleTime: 5 * 60 * 1000, // 5 минут кэширования
    });

    // Используем React Query для загрузки персонажей если пользователь авторизован
    const {
        data: charactersData,
        isLoading: charactersLoading,
        error: charactersError,
    } = useQuery<CharactersResponse>({
        queryKey: ["characters"],
        queryFn: fetchCharactersAPI,
        staleTime: 5 * 60 * 1000, // 5 минут кэширования
        enabled: authStore.isAuthenticated, // Запрос выполняется только если пользователь авторизован
    });

    // Обновляем данные в Mobx хранилищах для обратной совместимости
    useEffect(() => {
        if (statisticsData) {
            statisticsStore.statistics = statisticsData;
        }
    }, [statisticsData]);

    useEffect(() => {
        if (charactersData) {
            characterStore.characters = charactersData.characters;
            characterStore.maxCharacters = charactersData.max_characters;
            characterStore.remainingSlots = charactersData.remaining_slots;
            characterStore.canCreateMore = charactersData.can_create_more;
        }
    }, [charactersData]);

    // Обработка ошибок при загрузке данных
    useEffect(() => {
        if (statisticsError) {
            console.error("Ошибка при загрузке статистики:", statisticsError);
        }
        if (charactersError) {
            console.error("Ошибка при загрузке персонажей:", charactersError);
        }
    }, [statisticsError, charactersError]);

    // Данные для новостей
    const newsItems = [
        {
            id: 1,
            title: "Обновление 1.2.5 - Затерянные катакомбы",
            excerpt:
                "Спуститесь в зловещие глубины древних катакомб и столкнитесь с ужасами, спящими во тьме. Рискните найти утерянные реликвии невиданной силы.",
            date: "2025-04-01",
            imageSrc: "/images/news/dungeons.jpg",
        },
        {
            id: 2,
            title: "Кровавое полнолуние - Ритуал скорби",
            excerpt:
                "Редкое астрономическое событие пробуждает древнее зло. Выживите в течение семи ночей кровавого полнолуния и получите благословение тьмы.",
            date: "2025-03-28",
            imageSrc: "/images/news/festival.jpg",
        },
        {
            id: 3,
            title: "Печать проклятых - Новые силы",
            excerpt:
                "Новые запретные умения стали доступны. Принесите жертву, чтобы овладеть тёмными заклинаниями и получить мощь, недоступную простым смертным.",
            date: "2025-03-21",
            imageSrc: "/images/news/battlepass.jpg",
        },
    ];

    // Данные для статистики с использованием данных из React Query
    const statistics = [
        {
            label: "Проклятых душ",
            value: statisticsData?.users_count || "...",
            icon: "👤",
        },
        {
            label: "Созданных персонажей",
            value: statisticsData?.characters_count || "...",
            icon: "🧙",
        },
        {
            label: "Темных ритуалов",
            value: "53,892",
            icon: "🔮",
        },
    ];

    // Функция для получения класса персонажа
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

    // Функция для получения пути к изображению класса
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
                return "/images/classes/berserker.jpg"; // Используем берсерка для воина
            case "mage":
                return "/images/classes/necromancer.jpg"; // Используем некроманта для мага
            case "rogue":
                return "/images/classes/crossbowman.jpg"; // Используем арбалетчика для разбойника
            default:
                return "/images/fallback-hero.jpg";
        }
    };

    return (
        <MainLayout>
            <div className="relative min-h-screen">
                {/* Фоновое изображение */}
                <div className="absolute inset-0 bg-[url('/images/backgrounds/menu_bg.jpg')] bg-cover bg-center opacity-30"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/60 backdrop-blur-[1px]"></div>

                {/* Героический баннер с новым фоном */}
                <section className="relative h-[600px] overflow-hidden">
                    {/* Новый фон с эффектами */}
                    <div className="absolute inset-0 bg-[url('/images/backgrounds/menu_bg.jpg')] bg-cover bg-center bg-fixed transform scale-105 transition-transform duration-1000"></div>

                    {/* Слои эффектов */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
                    <div className="absolute inset-0 backdrop-blur-[2px]"></div>

                    {/* Декоративные элементы */}
                    <div className="absolute top-10 left-10 w-20 h-20 border-t border-l border-red-700/50 animate-pulse"></div>
                    <div className="absolute top-10 right-10 w-20 h-20 border-t border-r border-red-700/50 animate-pulse"></div>
                    <div className="absolute bottom-10 left-10 w-20 h-20 border-b border-l border-red-700/50 animate-pulse"></div>
                    <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r border-red-700/50 animate-pulse"></div>

                    {/* Мистические частицы (имитация) */}
                    <div className="absolute inset-0 opacity-30 mix-blend-lighten">
                        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-red-600 rounded-full blur-sm animate-ping"></div>
                        <div className="absolute top-1/3 left-1/2 w-1 h-1 bg-red-400 rounded-full blur-sm animate-ping animation-delay-300"></div>
                        <div className="absolute top-2/3 left-1/4 w-2 h-2 bg-red-500 rounded-full blur-sm animate-ping animation-delay-700"></div>
                        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-red-600 rounded-full blur-sm animate-ping animation-delay-1000"></div>
                    </div>

                    <div className="container mx-auto h-full px-4 flex flex-col justify-center relative z-10">
                        <div className="max-w-2xl">
                            <h1 className="echoes-title mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-700 drop-shadow-sm font-size-stable animate-fade-in-down">
                                ECHOES OF OBLIVION
                            </h1>
                            <div className="h-0.5 w-3/4 bg-gradient-to-r from-red-700/80 to-transparent mb-6 animate-width-expand"></div>

                            <p className="text-lg text-gray-100 mb-8 leading-relaxed drop-shadow-md font-medieval animate-fade-in">
                                ШАГНИТЕ В ЗАБЫТЫЙ МИР, ОКУТАННЫЙ ТЬМОЙ. ДРЕВНИЕ
                                РУИНЫ, НАСЕЛЕННЫЕ ПРОКЛЯТЫМИ ДУШАМИ, ЖДУТ
                                ХРАБРЕЦОВ, ГОТОВЫХ БРОСИТЬ ВЫЗОВ СУДЬБЕ.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up">
                                {/* Показываем разные кнопки в зависимости от статуса аутентификации */}
                                {authStore.isAuthenticated ? (
                                    // Для авторизованных пользователей
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        to="/character/create"
                                    >
                                        <span className="mr-2">⚔️</span> Создать
                                        персонажа
                                    </Button>
                                ) : (
                                    // Для гостей
                                    <>
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            to="/register"
                                        >
                                            <span className="mr-2">⚔️</span>{" "}
                                            Начать путешествие
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            to="/auth"
                                        >
                                            <span className="mr-2">🔑</span>{" "}
                                            Войти
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Декоративный нижний край */}
                    <div className="absolute bottom-0 left-0 right-0">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 1440 60"
                            className="w-full"
                        >
                            <path
                                fill="rgb(17 24 39)"
                                fillOpacity="1"
                                d="M0,50L48,45C96,40,192,30,288,30C384,30,480,40,576,40C672,40,768,30,864,25C960,20,1056,20,1152,25C1248,30,1344,40,1392,45L1440,50L1440,60L1392,60C1344,60,1248,60,1152,60C1056,60,960,60,864,60C768,60,672,60,576,60C480,60,384,60,288,60C192,60,96,60,48,60L0,60Z"
                            ></path>
                        </svg>
                    </div>
                </section>

                {/* Секция персонажей для авторизованных пользователей */}
                {authStore.isAuthenticated && (
                    <section className="py-12 bg-gray-900 border-b border-red-900/20 relative">
                        <div className="absolute inset-0 bg-[url('/images/stone-texture.png')] bg-repeat opacity-5"></div>

                        <div className="container mx-auto px-4 relative z-10">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center">
                                    <div className="w-1 h-8 bg-red-700 mr-3"></div>
                                    <h2 className="text-red-500">
                                        Ваши персонажи
                                    </h2>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`text-sm px-3 py-1 rounded-md ${
                                            charactersData?.remaining_slots ===
                                            0
                                                ? "bg-red-900/40 text-red-300"
                                                : "bg-gray-800/60 text-gray-300"
                                        }`}
                                    >
                                        Слоты:{" "}
                                        <span className="font-bold">
                                            {charactersData?.remaining_slots ||
                                                0}
                                        </span>
                                        /{charactersData?.max_characters || 3}
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        to="/character/create"
                                        disabled={
                                            !charactersData?.can_create_more
                                        }
                                    >
                                        <span className="mr-1">🧙</span> Создать
                                        персонажа
                                    </Button>
                                </div>
                            </div>

                            {/* Отображение ошибки при загрузке */}
                            {charactersError && (
                                <div className="bg-red-900/20 text-red-400 p-4 mb-4 rounded-lg border border-red-900/40">
                                    <div className="flex items-center">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 mr-2"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        Произошла ошибка при загрузке
                                        персонажей. Пожалуйста, попробуйте
                                        обновить страницу.
                                    </div>
                                    <button
                                        className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                                        onClick={() =>
                                            queryClient.invalidateQueries({
                                                queryKey: ["characters"],
                                            })
                                        }
                                    >
                                        Повторить загрузку
                                    </button>
                                </div>
                            )}

                            {charactersLoading ? (
                                <div className="flex justify-center items-center h-40">
                                    <div className="relative">
                                        <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-red-600"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-6 w-6 rounded-full bg-gray-900"></div>
                                        </div>
                                    </div>
                                    <p className="ml-4 text-lg font-medieval text-red-600">
                                        Призываем души...
                                    </p>
                                </div>
                            ) : charactersData?.characters &&
                              charactersData.characters.length === 0 ? (
                                <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 rounded-lg border border-red-900/30 shadow-lg text-center">
                                    <p className="text-gray-400 mb-4">
                                        У вас пока нет персонажей
                                    </p>
                                    <Button
                                        variant="primary"
                                        to="/character/create"
                                        disabled={
                                            !charactersData.can_create_more
                                        }
                                    >
                                        <span className="mr-2">⚔️</span> Создать
                                        первого персонажа
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {charactersData?.characters.map(
                                        (character) => (
                                            <div
                                                key={character.id}
                                                className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border border-red-900/30 shadow-lg overflow-hidden hover:shadow-red-900/20 transition-all hover:-translate-y-1 cursor-pointer"
                                                onClick={() =>
                                                    navigate(
                                                        `/character/${character.id}`
                                                    )
                                                }
                                            >
                                                <div className="relative h-32">
                                                    <img
                                                        src={getClassImageSrc(
                                                            character.class
                                                        )}
                                                        alt={getCharacterClass(
                                                            character.class
                                                        )}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>

                                                    {character.is_active && (
                                                        <div
                                                            className="absolute top-2 right-2 bg-green-600 w-6 h-6 rounded-full flex items-center justify-center"
                                                            title="Активный персонаж"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-4 w-4 text-white"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h3 className="text-lg text-red-500 font-medieval">
                                                            {character.name}
                                                        </h3>
                                                        <div className="flex items-center">
                                                            <span className="bg-red-900/30 text-gray-300 text-xs px-2 py-1 rounded">
                                                                Ур.{" "}
                                                                {
                                                                    character.level
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <p className="text-gray-400 text-sm mb-3">
                                                        {getCharacterClass(
                                                            character.class
                                                        )}
                                                    </p>

                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="flex items-center">
                                                            <span className="text-gray-500 mr-1">
                                                                Сила:
                                                            </span>
                                                            <span className="text-red-400">
                                                                {
                                                                    character.strength
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <span className="text-gray-500 mr-1">
                                                                Ловк:
                                                            </span>
                                                            <span className="text-red-400">
                                                                {
                                                                    character.agility
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <span className="text-gray-500 mr-1">
                                                                Инт:
                                                            </span>
                                                            <span className="text-red-400">
                                                                {
                                                                    character.intelligence
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <span className="text-gray-500 mr-1">
                                                                Жив:
                                                            </span>
                                                            <span className="text-red-400">
                                                                {
                                                                    character.vitality
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between items-center">
                                                        <div>
                                                            <div className="flex items-center mb-1">
                                                                <span className="text-gray-500 text-xs mr-1">
                                                                    HP:
                                                                </span>
                                                                <div className="w-24 bg-gray-700 rounded-full h-1.5">
                                                                    <div
                                                                        className="bg-red-600 h-1.5 rounded-full"
                                                                        style={{
                                                                            width: `${
                                                                                (character.health /
                                                                                    character.max_health) *
                                                                                100
                                                                            }%`,
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-gray-500 text-xs ml-1">
                                                                    {
                                                                        character.health
                                                                    }
                                                                    /
                                                                    {
                                                                        character.max_health
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center mb-1">
                                                                <span className="text-gray-500 text-xs mr-1">
                                                                    MP:
                                                                </span>
                                                                <div className="w-24 bg-gray-700 rounded-full h-1.5">
                                                                    <div
                                                                        className="bg-blue-600 h-1.5 rounded-full"
                                                                        style={{
                                                                            width: `${
                                                                                (character.mana /
                                                                                    character.max_mana) *
                                                                                100
                                                                            }%`,
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-gray-500 text-xs ml-1">
                                                                    {
                                                                        character.mana
                                                                    }
                                                                    /
                                                                    {
                                                                        character.max_mana
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center mb-1">
                                                                <span className="text-gray-500 text-xs mr-1">
                                                                    SP:
                                                                </span>
                                                                <div className="w-24 bg-gray-700 rounded-full h-1.5">
                                                                    <div
                                                                        className="bg-green-600 h-1.5 rounded-full"
                                                                        style={{
                                                                            width: `${
                                                                                (character.stamina /
                                                                                    character.max_stamina) *
                                                                                100
                                                                            }%`,
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-gray-500 text-xs ml-1">
                                                                    {
                                                                        character.stamina
                                                                    }
                                                                    /
                                                                    {
                                                                        character.max_stamina
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <span className="text-gray-500 text-xs mr-1">
                                                                    XP:
                                                                </span>
                                                                <div className="w-24 bg-gray-700 rounded-full h-1.5">
                                                                    <div
                                                                        className="bg-yellow-600 h-1.5 rounded-full"
                                                                        style={{
                                                                            width: `${
                                                                                (character.experience /
                                                                                    character.exp_to_next_level) *
                                                                                100
                                                                            }%`,
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-gray-500 text-xs ml-1">
                                                                    {
                                                                        character.experience
                                                                    }
                                                                    /
                                                                    {
                                                                        character.exp_to_next_level
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="secondary"
                                                            className="text-xs px-2 py-1"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(
                                                                    `/character/${character.id}`
                                                                );
                                                            }}
                                                        >
                                                            Играть
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Статистика игры - показываем ошибку если есть */}
                <section className="py-8 bg-gray-900 border-y border-red-900/20 relative">
                    {/* Фоновая текстура */}
                    <div className="absolute inset-0 bg-[url('/images/stone-texture.png')] bg-repeat opacity-5"></div>

                    <div className="container mx-auto px-4 relative z-10">
                        {statisticsError && (
                            <div className="bg-red-900/20 text-red-400 p-4 mb-4 rounded-lg border border-red-900/40">
                                <div className="flex items-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    Произошла ошибка при загрузке статистики.
                                </div>
                                <button
                                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                                    onClick={() =>
                                        queryClient.invalidateQueries({
                                            queryKey: ["statistics"],
                                        })
                                    }
                                >
                                    Повторить загрузку
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-6">
                            {statistics.map((stat, index) => (
                                <div
                                    key={index}
                                    className="text-center transform hover:scale-105 transition-transform"
                                >
                                    <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-4 rounded-md border border-red-900/20 shadow-lg">
                                        <div className="text-3xl mb-1">
                                            {stat.icon}
                                        </div>
                                        <p className="stats-value text-red-600">
                                            {statisticsLoading
                                                ? "..."
                                                : stat.value}
                                        </p>
                                        <div className="h-0.5 w-1/2 mx-auto bg-gradient-to-r from-transparent via-red-700/30 to-transparent my-2"></div>
                                        <p className="stats-label text-gray-400">
                                            {stat.label}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Последние новости - более стильные */}
                <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800">
                    <div className="container mx-auto px-4">
                        <div className="container mx-auto text-center relative z-10">
                            <div className="flex items-center justify-center">
                                <SectionTitle>Вести из мрака</SectionTitle>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {newsItems.map((news) => (
                                <NewsCard
                                    key={news.id}
                                    id={news.id}
                                    title={news.title}
                                    excerpt={news.excerpt}
                                    date={news.date}
                                    imageSrc={news.imageSrc}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Секция присоединения - только для неавторизованных пользователей */}
                {!authStore.isAuthenticated && (
                    <section className="py-20 relative">
                        {/* Фоновое изображение с эффектами */}
                        <div className="absolute inset-0 bg-[url('/images/backgrounds/menu_bg.jpg')] bg-cover bg-center opacity-40 bg-fixed"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/60 to-gray-900"></div>
                        <div className="absolute inset-0 backdrop-blur-[1px]"></div>

                        {/* Декоративные элементы */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-800/60 to-transparent"></div>
                        <div className="absolute top-10 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-red-800/30 to-transparent"></div>
                        <div className="absolute inset-0 bg-[url('/images/scroll-texture.png')] bg-repeat opacity-10 mix-blend-overlay"></div>

                        <div className="container mx-auto px-4 text-center relative z-10">
                            <SectionTitle>Услышь зов тьмы</SectionTitle>

                            <p className="text-gray-200 max-w-2xl mx-auto mb-10 text-lg drop-shadow-md">
                                Тени шепчут твое имя. Присоединяйся к проклятым
                                и раскрой тайны забытого мира.
                            </p>

                            <div className="relative inline-block">
                                <div className="absolute -inset-1 bg-red-600/20 rounded blur-lg"></div>
                                <div className="flex gap-4 relative">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        to="/register"
                                    >
                                        <span className="mr-2">⚔️</span> Принять
                                        судьбу
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        to="/auth"
                                    >
                                        <span className="mr-2">🔑</span>{" "}
                                        Вернуться
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Мистические частицы */}
                        <div className="absolute inset-0 opacity-30 pointer-events-none mix-blend-lighten">
                            <div className="absolute top-1/3 left-1/5 w-1 h-1 bg-red-600 rounded-full blur-sm animate-ping"></div>
                            <div className="absolute top-2/3 left-3/4 w-2 h-2 bg-red-500 rounded-full blur-sm animate-ping animation-delay-700"></div>
                            <div className="absolute top-1/4 right-1/3 w-1 h-1 bg-red-600 rounded-full blur-sm animate-ping animation-delay-1000"></div>
                        </div>

                        {/* Нижний декоративный элемент */}
                        <div className="absolute bottom-0 left-0 right-0">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 1440 70"
                                className="w-full"
                            >
                                <path
                                    fill="rgb(17 24 39)"
                                    fillOpacity="1"
                                    d="M0,50L40,45C80,40,160,30,240,35C320,40,400,60,480,60C560,60,640,40,720,35C800,30,880,40,960,45C1040,50,1120,50,1200,45C1280,40,1360,30,1400,25L1440,20L1440,70L1400,70C1360,70,1280,70,1200,70C1120,70,1040,70,960,70C880,70,800,70,720,70C640,70,560,70,480,70C400,70,320,70,240,70C160,70,80,70,40,70L0,70Z"
                                ></path>
                            </svg>
                        </div>
                    </section>
                )}

                {/* Кланы мрака - с улучшенным дизайном */}
                <section className="py-12 bg-gray-900 relative">
                    <div className="container mx-auto px-4">
                        <SectionTitle>Могущественные кланы</SectionTitle>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                {
                                    name: "Культ Багряной Луны",
                                    members: 124,
                                    emblem: "🌑",
                                    description: "Поклонники лунного цикла",
                                },
                                {
                                    name: "Орден Костяного Шепота",
                                    members: 98,
                                    emblem: "💀",
                                    description: "Владыки некромантии",
                                },
                                {
                                    name: "Кровавая Гвардия",
                                    members: 87,
                                    emblem: "🗡️",
                                    description: "Элитные воины тьмы",
                                },
                                {
                                    name: "Тени Отчаяния",
                                    members: 76,
                                    emblem: "👁️",
                                    description: "Мастера иллюзий",
                                },
                            ].map((guild, index) => (
                                <div
                                    key={index}
                                    className="bg-gradient-to-b from-gray-800 to-gray-900 p-5 rounded-md border border-red-900/30 shadow-lg hover:shadow-red-900/10 transition-all hover:translate-y-[-3px] relative"
                                >
                                    {/* Декоративные углы */}
                                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-700/60"></div>
                                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-700/60"></div>
                                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-700/60"></div>
                                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-700/60"></div>

                                    <div className="flex items-center mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center text-2xl border border-red-900/30 shadow-inner">
                                            {guild.emblem}
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-red-400 font-medieval text-lg">
                                                {guild.name}
                                            </h3>
                                            <div className="h-0.5 w-3/4 bg-gradient-to-r from-red-700/40 to-transparent"></div>
                                        </div>
                                    </div>

                                    <p className="text-gray-400 text-xs mb-2">
                                        {guild.description}
                                    </p>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-xs">
                                            {guild.members} последователей
                                        </span>
                                        <Link
                                            to="/guilds"
                                            className="text-red-400 text-xs hover:text-red-300 transition-colors"
                                        >
                                            Подробнее →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </MainLayout>
    );
});

export default Home;
