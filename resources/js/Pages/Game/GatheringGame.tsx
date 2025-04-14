import React, { useState, useEffect, useCallback, useRef } from "react";
import { Head } from "@inertiajs/react";
import { useNavigate, useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import characterStore from "../../stores/CharacterStore";
import locationStore from "../../stores/LocationStore";
import resourceStore, { Resource } from "../../stores/ResourceStore";
import journalStore from "../../stores/JournalStore";
import GameHeader from "../../Layouts/GameHeader";
import ElementalMatrix from "../../Components/game/gathering/ElementalMatrix";
import ResourceCard from "../../Components/game/gathering/ResourceCard";
import {
    useElements,
    transformElementsForMatrix,
} from "../../hooks/useElements";
import { useLocationResources } from "../../hooks/useResources";

const GatheringGame = observer(() => {
    const navigate = useNavigate();
    const params = useParams();
    const charId = Number(params.characterId);

    // Получаем элементы через React Query
    const elementsQuery = useElements();

    // Получаем ресурсы локации через новый хук
    const {
        data: locationResourcesData,
        isLoading: isLoadingResources,
        error: resourcesError,
    } = useLocationResources(charId);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Состояния для механики добычи
    const [selectedResource, setSelectedResource] = useState<Resource | null>(
        null
    );
    const [selectedElements, setSelectedElements] = useState<string[]>([]);
    const [gatheringProgress, setGatheringProgress] = useState(0);
    const [isCombinationCorrect, setIsCombinationCorrect] = useState(false);
    const [gatheringInterval, setGatheringInterval] =
        useState<NodeJS.Timeout | null>(null);

    // Состояния для автодобычи
    const [isAutoGathering, setIsAutoGathering] = useState(false);
    const [autoGatheringQueue, setAutoGatheringQueue] = useState<Resource[]>(
        []
    );
    const [originalResourceOrder, setOriginalResourceOrder] = useState<
        Resource[]
    >([]);
    const [selectedForAutoGathering, setSelectedForAutoGathering] = useState<
        string[]
    >([]);
    const [gatheringStats, setGatheringStats] = useState({
        resourcesGathered: 0,
        cyclesCompleted: 0,
        resourceCounts: {} as Record<string, number>, // Подсчет каждого типа ресурса
    });
    const autoGatheringRef = useRef(false);
    const [showStatsTooltip, setShowStatsTooltip] = useState(false);

    // Загрузка данных
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Загружаем персонажа, если он ещё не загружен
                if (
                    !characterStore.selectedCharacter ||
                    characterStore.selectedCharacter.id !== charId
                ) {
                    const character = await characterStore.loadCharacter(
                        charId
                    );
                    if (!character) {
                        setError("Не удалось загрузить персонажа");
                        return;
                    }
                }

                // Загружаем текущую локацию, если она ещё не загружена
                if (!locationStore.currentLocation) {
                    const locationData =
                        await locationStore.loadAvailableLocations(charId);
                    if (!locationData || !locationData.currentLocation) {
                        setError(
                            "Не удалось загрузить информацию о текущей локации"
                        );
                        return;
                    }
                }

                // Больше не загружаем ресурсы здесь, так как они загружаются через хук useLocationResources
            } catch (err) {
                console.error("Ошибка при загрузке данных для добычи:", err);
                setError("Произошла ошибка при загрузке данных");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();

        // Очистка интервала при размонтировании
        return () => {
            if (gatheringInterval) {
                clearInterval(gatheringInterval);
            }
        };
    }, [charId]);

    // Когда элементы загружены, передаем их в стор
    useEffect(() => {
        if (elementsQuery.data) {
            resourceStore.setElements(elementsQuery.data);
        }
    }, [elementsQuery.data]);

    // Когда ресурсы загружены, передаем их в стор
    useEffect(() => {
        if (locationResourcesData && locationStore.currentLocation) {
            resourceStore.setResources(
                locationResourcesData.resources,
                locationStore.currentLocation.id
            );
        }
    }, [locationResourcesData, locationStore.currentLocation]);

    // Отображаем ошибку, если есть проблемы с загрузкой ресурсов
    useEffect(() => {
        if (resourcesError) {
            setError("Не удалось загрузить ресурсы текущей локации");
        }
    }, [resourcesError]);

    // Выбор/отмена выбора ресурса для автодобычи
    const toggleResourceForAutoGathering = (resourceId: string) => {
        // Проверяем, выбран ли ресурс уже
        if (selectedForAutoGathering.includes(resourceId)) {
            // Если да, удаляем его из списка
            setSelectedForAutoGathering((prev) =>
                prev.filter((id) => id !== resourceId)
            );
        } else {
            // Если нет, проверяем, что ресурс открыт
            const resource = resourceStore.resources.find(
                (r) => r.id === resourceId
            );
            if (!resource || !resource.discovered) {
                return;
            }

            // Проверяем лимит в 3 ресурса
            if (selectedForAutoGathering.length >= 3) {
                journalStore.addEntry(
                    "Вы не можете выбрать больше 3 ресурсов для автодобычи",
                    "system"
                );
                return;
            }

            // Добавляем ресурс в список выбранных
            setSelectedForAutoGathering((prev) => [...prev, resourceId]);
        }
    };

    // Обработчик выбора ресурса
    const handleResourceSelect = (resource: Resource) => {
        // Если запущена автодобыча, игнорируем ручной выбор ресурса
        if (isAutoGathering) return;

        // Если выбран тот же ресурс, снимаем выбор
        if (selectedResource && selectedResource.id === resource.id) {
            setSelectedResource(null);
            setSelectedElements([]);
            stopGathering();
            return;
        }

        setSelectedResource(resource);
        setSelectedElements([]);
        stopGathering();

        // Если ресурс уже открыт, автоматически выбираем правильные элементы с задержкой
        if (resource.discovered) {
            // Симуляция постепенного добавления элементов
            const elements = [...resource.elementCombination];
            const addElementWithDelay = (index: number) => {
                if (index < elements.length) {
                    setTimeout(() => {
                        setSelectedElements((prev) => [
                            ...prev,
                            elements[index],
                        ]);
                        addElementWithDelay(index + 1);
                    }, 300);
                }
            };

            addElementWithDelay(0);
        }
    };

    // Обработчик переключения элемента
    const handleElementToggle = (elementId: string) => {
        if (!selectedResource) return;

        // Если ресурс уже обнаружен, нельзя изменить комбинацию
        if (selectedResource.discovered) return;

        setSelectedElements((prev) => {
            // Если элемент уже выбран, удаляем его
            if (prev.includes(elementId)) {
                return prev.filter((id) => id !== elementId);
            }

            // Иначе добавляем
            return [...prev, elementId];
        });
    };

    // Проверка комбинации элементов
    useEffect(() => {
        if (!selectedResource || selectedElements.length === 0) {
            setIsCombinationCorrect(false);
            stopGathering();
            return;
        }

        const isCorrect = resourceStore.checkElementCombination(
            selectedResource.id,
            selectedElements
        );

        setIsCombinationCorrect(isCorrect);

        // Если комбинация правильная, начинаем сбор ресурса
        if (isCorrect) {
            startGathering();
        } else {
            stopGathering();
        }
    }, [selectedElements, selectedResource]);

    // Начать сбор ресурса
    const startGathering = useCallback(() => {
        // Если уже идет сбор, не запускаем новый интервал
        if (gatheringInterval) return;

        const interval = setInterval(() => {
            setGatheringProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);

                    // Отмечаем ресурс как обнаруженный и добавляем запись в журнал
                    if (selectedResource) {
                        resourceStore
                            .discoverResource(selectedResource.id, charId)
                            .then((success) => {
                                if (success) {
                                    // Обновляем состояние локально (также для отражения в UI)
                                    const updatedResource =
                                        resourceStore.resources.find(
                                            (r) => r.id === selectedResource.id
                                        );
                                    if (updatedResource) {
                                        updatedResource.discovered = true;
                                        journalStore.addEntry(
                                            `Вы успешно добыли ${selectedResource.name}`,
                                            "item"
                                        );
                                    }

                                    // Если в автоматическом режиме, продолжаем
                                    if (isAutoGathering) {
                                        processNextResourceInQueue();
                                    }
                                } else {
                                    journalStore.addEntry(
                                        `Не удалось добыть ${selectedResource.name}. Попробуйте снова.`,
                                        "error"
                                    );
                                    stopGathering();
                                }
                            });
                    }

                    return 100;
                }

                // Увеличиваем прогресс на 3% каждые 100ms (итого 3 секунды на заполнение)
                return prev + 3;
            });
        }, 100);

        setGatheringInterval(interval);
    }, [selectedResource, gatheringInterval, isAutoGathering, charId]);

    // Остановить сбор ресурса
    const stopGathering = useCallback(() => {
        if (gatheringInterval) {
            clearInterval(gatheringInterval);
            setGatheringInterval(null);
        }

        setGatheringProgress(0);
    }, [gatheringInterval]);

    // Начать автоматический сбор выбранных ресурсов
    const startAutoGathering = () => {
        // Если уже идет автодобыча, останавливаем ее
        if (isAutoGathering) {
            stopAutoGathering();
            return;
        }

        // Проверяем, что есть выбранные ресурсы для автодобычи
        if (selectedForAutoGathering.length === 0) {
            journalStore.addEntry(
                "Выберите до трех открытых ресурсов для автодобычи",
                "system"
            );
            return;
        }

        // Получаем выбранные ресурсы в порядке их выбора
        const resourcesForGathering = resourceStore.resources.filter(
            (resource) => selectedForAutoGathering.includes(resource.id)
        );

        // Сортируем ресурсы по порядку их выбора
        const orderedResources = [];
        for (const resourceId of selectedForAutoGathering) {
            const resource = resourcesForGathering.find(
                (r) => r.id === resourceId
            );
            if (resource) {
                orderedResources.push(resource);
            }
        }

        // Инициализируем счетчики ресурсов
        const initialResourceCounts: Record<string, number> = {};
        orderedResources.forEach((resource) => {
            initialResourceCounts[resource.id] = 0;
        });

        // Настраиваем автодобычу
        setIsAutoGathering(true);
        autoGatheringRef.current = true;
        setAutoGatheringQueue([...orderedResources]);
        setOriginalResourceOrder(orderedResources);
        setGatheringStats({
            resourcesGathered: 0,
            cyclesCompleted: 0,
            resourceCounts: initialResourceCounts,
        });

        journalStore.addEntry(
            "Начата автоматическая добыча выбранных ресурсов",
            "system"
        );

        // Начинаем добычу первого ресурса
        processFirstResourceInQueue(orderedResources);
    };

    // Остановить автодобычу
    const stopAutoGathering = () => {
        setIsAutoGathering(false);
        autoGatheringRef.current = false;
        setAutoGatheringQueue([]);
        setOriginalResourceOrder([]);
        stopGathering();
        setSelectedResource(null);
        setSelectedElements([]);
        setShowStatsTooltip(false);

        journalStore.addEntry(
            `Автодобыча остановлена. Собрано ресурсов: ${gatheringStats.resourcesGathered}`,
            "system"
        );
    };

    // Начать обработку первого ресурса в очереди
    const processFirstResourceInQueue = (resources: Resource[]) => {
        if (resources.length === 0 || !autoGatheringRef.current) {
            stopAutoGathering();
            return;
        }

        const nextResource = resources[0];
        setSelectedResource(nextResource);
        setSelectedElements([]);

        // Добавляем элементы с задержкой для визуализации
        const elements = [...nextResource.elementCombination];
        const addElementWithDelay = (index: number) => {
            if (index < elements.length && autoGatheringRef.current) {
                setTimeout(() => {
                    setSelectedElements((prev) => [...prev, elements[index]]);
                    addElementWithDelay(index + 1);
                }, 200);
            }
        };

        addElementWithDelay(0);
    };

    // Обработка следующего ресурса в очереди
    const processNextResourceInQueue = () => {
        if (!autoGatheringRef.current) return;

        // Обновляем статистику для текущего ресурса
        if (selectedResource) {
            setGatheringStats((prev) => {
                const updatedResourceCounts = { ...prev.resourceCounts };
                updatedResourceCounts[selectedResource.id] =
                    (updatedResourceCounts[selectedResource.id] || 0) + 1;

                return {
                    ...prev,
                    resourcesGathered: prev.resourcesGathered + 1,
                    resourceCounts: updatedResourceCounts,
                };
            });
        }

        // Удаляем текущий ресурс из очереди
        const newQueue = [...autoGatheringQueue];
        newQueue.shift();

        // Если очередь пуста, начинаем новый цикл
        if (newQueue.length === 0) {
            setGatheringStats((prev) => ({
                ...prev,
                cyclesCompleted: prev.cyclesCompleted + 1,
            }));

            // Восстанавливаем исходный порядок ресурсов для нового цикла
            setTimeout(() => {
                if (autoGatheringRef.current) {
                    // Используем оригинальный порядок ресурсов для нового цикла
                    setAutoGatheringQueue([...originalResourceOrder]);
                    processFirstResourceInQueue([...originalResourceOrder]);
                }
            }, 500);

            return;
        }

        setAutoGatheringQueue(newQueue);

        // Начинаем добычу следующего ресурса с небольшой задержкой
        setTimeout(() => {
            if (autoGatheringRef.current) {
                processFirstResourceInQueue(newQueue);
            }
        }, 500);
    };

    // Если ошибка загрузки, показываем сообщение
    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
                <GameHeader />
                <div className="flex-1 flex items-center justify-center">
                    <div className="p-6 bg-gray-800 rounded-lg border border-red-900/40 max-w-lg text-center">
                        <h2 className="text-xl text-red-400 mb-4 font-medieval">
                            Ошибка
                        </h2>
                        <p className="text-gray-300 mb-6">{error}</p>
                        <button
                            className="bg-red-900 hover:bg-red-800 text-white py-2 px-4 rounded"
                            onClick={() => navigate("/characters")}
                        >
                            Вернуться к выбору персонажа
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Форматирование статистики для отображения
    const formatGatheringStats = () => {
        const details = [];

        // Детали по каждому ресурсу
        for (const resourceId in gatheringStats.resourceCounts) {
            const resource = resourceStore.resources.find(
                (r) => r.id === resourceId
            );
            if (resource) {
                details.push(
                    `${resource.icon} ${resource.name}: ${gatheringStats.resourceCounts[resourceId]}`
                );
            }
        }

        return {
            totalResources: gatheringStats.resourcesGathered,
            completedCycles: gatheringStats.cyclesCompleted,
            resourceDetails: details,
        };
    };

    // Используем элементы, загруженные через React Query
    const renderSelectedElementIcon = (elementId: string, index: number) => {
        // Используем элементы, загруженные через React Query
        const element = elementsQuery.data?.find((e) => e.id === elementId);
        if (!element) return null;

        return (
            <div
                key={index}
                className="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center"
            >
                {element.icon}
            </div>
        );
    };

    return (
        <>
            <Head title="Добыча ресурсов" />
            <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
                {/* Заголовок игры */}
                <GameHeader
                    activeLocationName={locationStore.currentLocation?.name}
                />

                {/* Фоновое изображение текущей локации */}
                <div
                    className="absolute inset-0 z-0 opacity-30"
                    style={{
                        backgroundImage: locationStore.currentLocation
                            ?.image_url
                            ? `url(/${locationStore.currentLocation.image_url})`
                            : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        filter: "blur(2px)",
                    }}
                ></div>

                {/* Основное содержимое */}
                <div className="relative z-10 flex-1 flex overflow-hidden p-4">
                    {isLoading ? (
                        // Индикатор загрузки
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-lg text-red-400 font-medieval animate-pulse">
                                Загрузка данных о ресурсах...
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Левая панель с ресурсами */}
                            <div className="w-2/3 pr-4 overflow-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl text-red-400 font-medieval">
                                        Добыча ресурсов в{" "}
                                        {locationStore.currentLocation?.name ||
                                            "текущей локации"}
                                    </h2>

                                    <div className="flex items-center gap-2">
                                        {/* Кнопка автодобычи */}
                                        <button
                                            onClick={startAutoGathering}
                                            className={`px-4 py-2 rounded-md font-medieval transition-all
                                            ${
                                                isAutoGathering
                                                    ? "bg-red-700 hover:bg-red-600 text-white"
                                                    : "bg-red-900 hover:bg-red-800 text-white"
                                            }`}
                                        >
                                            {isAutoGathering
                                                ? `Остановить автодобычу (${gatheringStats.resourcesGathered})`
                                                : "Автодобыча ресурсов"}
                                        </button>

                                        {/* Иконка вопроса со статистикой */}
                                        {isAutoGathering && (
                                            <div className="relative">
                                                <button
                                                    className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 flex items-center justify-center text-base"
                                                    onMouseEnter={() =>
                                                        setShowStatsTooltip(
                                                            true
                                                        )
                                                    }
                                                    onMouseLeave={() =>
                                                        setShowStatsTooltip(
                                                            false
                                                        )
                                                    }
                                                >
                                                    ?
                                                </button>

                                                {showStatsTooltip && (
                                                    <div className="absolute right-0 mt-2 p-3 bg-gray-800 border border-gray-700 rounded-md shadow-lg text-xs text-gray-300 w-60 z-50">
                                                        <div className="font-bold text-red-400 mb-1">
                                                            Статистика добычи:
                                                        </div>
                                                        <div className="mb-1">
                                                            Всего добыто:{" "}
                                                            {
                                                                formatGatheringStats()
                                                                    .totalResources
                                                            }
                                                        </div>
                                                        <div className="mb-2">
                                                            Завершено циклов:{" "}
                                                            {
                                                                formatGatheringStats()
                                                                    .completedCycles
                                                            }
                                                        </div>
                                                        <div className="border-t border-gray-700 pt-2 mt-1">
                                                            <div className="font-semibold text-gray-400 mb-1">
                                                                Добыто ресурсов:
                                                            </div>
                                                            {formatGatheringStats().resourceDetails.map(
                                                                (
                                                                    detail,
                                                                    index
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="flex items-center gap-1 mb-1"
                                                                    >
                                                                        <span
                                                                            dangerouslySetInnerHTML={{
                                                                                __html: detail,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <p className="text-gray-400 text-sm mb-6">
                                    Выберите ресурс и угадайте правильную
                                    комбинацию элементов для его добычи. После
                                    успешной добычи вы сможете выбрать до трех
                                    ресурсов для автоматической добычи.
                                </p>

                                {resourceStore.resources.length === 0 ? (
                                    <div className="p-6 bg-gray-800/50 rounded-lg border border-red-900/30 text-center">
                                        <h3 className="text-lg text-red-400 mb-2">
                                            Нет доступных ресурсов
                                        </h3>
                                        <p className="text-gray-400 text-sm">
                                            В данной локации нет ресурсов,
                                            которые можно добыть. Посетите
                                            другую локацию, чтобы найти ресурсы
                                            для добычи.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {resourceStore.resources.map(
                                            (resource) => (
                                                <ResourceCard
                                                    key={resource.id}
                                                    resource={resource}
                                                    isSelected={
                                                        selectedResource?.id ===
                                                        resource.id
                                                    }
                                                    isDiscovered={
                                                        resource.discovered
                                                    }
                                                    onSelect={() =>
                                                        handleResourceSelect(
                                                            resource
                                                        )
                                                    }
                                                    gatherProgress={
                                                        selectedResource?.id ===
                                                        resource.id
                                                            ? gatheringProgress
                                                            : 0
                                                    }
                                                    isSelectedForAutoGathering={selectedForAutoGathering.includes(
                                                        resource.id
                                                    )}
                                                    onToggleAutoGathering={() =>
                                                        toggleResourceForAutoGathering(
                                                            resource.id
                                                        )
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Правая панель с рунической матрицей */}
                            <div className="w-1/3 pl-4 flex flex-col items-center">
                                <div className="bg-gray-800 rounded-lg border border-red-900/30 p-4 w-full">
                                    <h3 className="text-center text-red-400 mb-4 font-medieval">
                                        Руническая матрица
                                    </h3>

                                    <div className="flex justify-center mb-4">
                                        <ElementalMatrix
                                            selectedElements={selectedElements}
                                            onElementToggle={
                                                handleElementToggle
                                            }
                                        />
                                    </div>

                                    <div className="text-center text-sm text-gray-400 mt-4">
                                        {!selectedResource ? (
                                            "Выберите ресурс для добычи"
                                        ) : selectedResource.discovered ? (
                                            "Ресурс уже изучен, используйте известную комбинацию"
                                        ) : !isCombinationCorrect ? (
                                            "Выберите правильную комбинацию элементов"
                                        ) : (
                                            <span className="text-green-400">
                                                Правильная комбинация! Ресурс
                                                добывается...
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-6 space-y-2">
                                        {selectedElements.length > 0 && (
                                            <div className="flex justify-center space-x-2">
                                                {selectedElements.map(
                                                    (elementId, index) =>
                                                        renderSelectedElementIcon(
                                                            elementId,
                                                            index
                                                        )
                                                )}
                                            </div>
                                        )}

                                        {selectedResource &&
                                            isCombinationCorrect &&
                                            gatheringProgress === 100 && (
                                                <button
                                                    onClick={() => {
                                                        journalStore.addEntry(
                                                            `Вы собрали ${selectedResource.name}`,
                                                            "item"
                                                        );

                                                        // Сбрасываем состояние после сбора
                                                        setGatheringProgress(0);
                                                    }}
                                                    className="w-full py-2 px-4 mt-4 bg-red-800 hover:bg-red-700 transition-colors rounded-md text-white"
                                                >
                                                    Собрать ресурс
                                                </button>
                                            )}
                                    </div>
                                </div>

                                {/* Информация о рунической матрице */}
                                <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-red-900/30">
                                    <h4 className="text-sm text-red-400 mb-2">
                                        Об алхимических элементах
                                    </h4>
                                    <p className="text-xs text-gray-400">
                                        Каждый ресурс в мире требует уникальной
                                        комбинации элементов для его добычи.
                                        Угадайте правильную комбинацию для
                                        каждого ресурса и запомните её для
                                        будущего использования.
                                    </p>
                                </div>

                                {/* Информация об автодобыче */}
                                <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-red-900/30">
                                    <h4 className="text-sm text-red-400 mb-2">
                                        Об автодобыче
                                    </h4>
                                    <p className="text-xs text-gray-400">
                                        Выберите до трех изученных ресурсов для
                                        автодобычи, нажав на иконку{" "}
                                        {isAutoGathering ? "⛔" : "✓"} на
                                        карточке ресурса. Затем нажмите кнопку
                                        "Автодобыча ресурсов" для начала
                                        процесса.
                                        {selectedForAutoGathering.length >
                                            0 && (
                                            <span className="block mt-2">
                                                Выбрано ресурсов:{" "}
                                                {
                                                    selectedForAutoGathering.length
                                                }
                                                /3
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
});

export default GatheringGame;
