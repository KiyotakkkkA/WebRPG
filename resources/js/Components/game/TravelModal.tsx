import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Button from "../ui/Button";
import { Location } from "../../stores/LocationStore";

interface TravelModalProps {
    isOpen: boolean;
    fromLocation: Location;
    toLocation: Location;
    travelTime: number; // в секундах
    baseTravelTime?: number; // базовое время до применения модификатора скорости
    savedTime?: number; // сэкономленное время в секундах
    onComplete: () => void;
    onCancel: () => void;
    isLocationPreloaded: boolean;
}

const TravelModal: React.FC<TravelModalProps> = ({
    isOpen,
    fromLocation,
    toLocation,
    travelTime: rawTravelTime,
    baseTravelTime = 0,
    savedTime = 0,
    onComplete,
    onCancel,
    isLocationPreloaded,
}) => {
    // Принудительно устанавливаем минимальное время путешествия в 3 секунды
    // для обеспечения плавной анимации
    const travelTime = Math.max(3, rawTravelTime);

    const [progress, setProgress] = useState(0);
    const [remainingTime, setRemainingTime] = useState(travelTime);
    const [isCancelling, setIsCancelling] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Сбрасываем прогресс при открытии модального окна
    useEffect(() => {
        if (isOpen) {
            setProgress(0);
            setRemainingTime(travelTime);
        }
    }, [isOpen, travelTime, baseTravelTime, savedTime]);

    // Начать или остановить путешествие
    useEffect(() => {
        if (isOpen && !isCancelling) {
            // Фиксированные точки прогресса для гарантии заполнения
            const milestones = [5, 15, 30, 50, 70, 85, 95, 100];
            let currentMilestoneIndex = 0;

            // Запуск таймера начала
            startTimeRef.current = Date.now();

            // Основной интервал обновления - раз в 100мс
            const updateInterval = 100; // миллисекунды

            // Расчет времени для каждой контрольной точки
            const getMilestoneTime = (milestone: number) => {
                return (milestone / 100) * travelTime * 1000;
            };

            // Запускаем интервал обновления
            intervalRef.current = setInterval(() => {
                // Текущее прошедшее время
                const elapsed = Date.now() - startTimeRef.current;

                // Текущая контрольная точка, которую нужно достичь
                const currentMilestone = milestones[currentMilestoneIndex];
                const milestoneTime = getMilestoneTime(currentMilestone);

                // Если достигли или превысили текущую контрольную точку
                if (elapsed >= milestoneTime) {
                    // Устанавливаем прогресс равным текущей контрольной точке
                    setProgress(currentMilestone);

                    // Обновляем оставшееся время
                    const remaining = Math.max(0, travelTime - elapsed / 1000);
                    setRemainingTime(remaining);

                    // Переходим к следующей контрольной точке
                    currentMilestoneIndex++;

                    // Если достигли последней контрольной точки (100%)
                    if (currentMilestoneIndex >= milestones.length) {
                        // Очищаем интервал
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }

                        // Даем небольшую задержку перед завершением для плавности UI
                        setTimeout(() => {
                            if (!isCancelling) {
                                onComplete();
                            }
                        }, 300);
                    }
                } else {
                    // Если еще не достигли контрольной точки,
                    // интерполируем прогресс между предыдущей и текущей точкой
                    const prevMilestone =
                        currentMilestoneIndex > 0
                            ? milestones[currentMilestoneIndex - 1]
                            : 0;
                    const prevMilestoneTime =
                        currentMilestoneIndex > 0
                            ? getMilestoneTime(prevMilestone)
                            : 0;

                    // Процент пути между предыдущей и текущей контрольной точкой
                    const segmentProgress =
                        (elapsed - prevMilestoneTime) /
                        (milestoneTime - prevMilestoneTime);

                    // Прогресс между контрольными точками
                    const interpolatedProgress =
                        prevMilestone +
                        segmentProgress * (currentMilestone - prevMilestone);

                    setProgress(interpolatedProgress);

                    // Обновляем оставшееся время
                    const remaining = Math.max(0, travelTime - elapsed / 1000);
                    setRemainingTime(remaining);
                }
            }, updateInterval);
        }

        return () => {
            // Очистка интервала при размонтировании
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isOpen, isCancelling, travelTime, onComplete]);

    // Обработка отмены путешествия
    const handleCancel = () => {
        setIsCancelling(true);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        onCancel();
    };

    // Форматирование времени
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    // Вспомогательная функция для формирования правильного URL изображения
    const getImageUrl = (imagePath: string) => {
        if (!imagePath)
            return (
                window.location.origin +
                "/images/locations/fallback-location.jpg"
            );

        // Если путь уже начинается с http или https, оставляем как есть
        if (
            imagePath.startsWith("http://") ||
            imagePath.startsWith("https://")
        ) {
            return imagePath;
        }

        // Если путь начинается с /, добавляем только origin
        if (imagePath.startsWith("/")) {
            return window.location.origin + imagePath;
        }

        // Иначе добавляем origin и /
        return window.location.origin + "/" + imagePath;
    };

    if (!isOpen) return null;

    // Убедимся, что процент прогресса корректный и безопасный
    const safeProgress = isNaN(progress)
        ? 0
        : Math.max(0, Math.min(100, progress));

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Затемнение и размытие фона */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleCancel}
            ></div>

            {/* Фон локации назначения - постепенно проявляется */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
                style={{
                    backgroundImage: `url(${getImageUrl(
                        toLocation.image_url
                    )})`,
                    opacity: safeProgress / 100,
                    filter: "brightness(0.3) blur(3px)",
                }}
            ></div>

            {/* Фон локации отправления - постепенно исчезает */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
                style={{
                    backgroundImage: `url(${getImageUrl(
                        fromLocation.image_url
                    )})`,
                    opacity: 1 - safeProgress / 100,
                    filter: "brightness(0.3) blur(3px)",
                }}
            ></div>

            {/* Окно путешествия */}
            <div
                className="bg-gradient-to-b from-gray-800 to-gray-900 border border-red-900/30 rounded-lg p-6 shadow-xl max-w-md w-full relative z-10 animate-fade-in-down"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Декоративные уголки */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-700/60"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-700/60"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-700/60"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-700/60"></div>

                {/* Заголовок */}
                <h2 className="text-xl text-red-500 mb-6 text-center">
                    Путешествие: {fromLocation.name} → {toLocation.name}
                </h2>

                {/* Информация о скорости персонажа */}
                <div className="text-sm text-center text-gray-400 mb-4 bg-gray-800/80 p-2 rounded-md border border-red-900/20">
                    <span className="text-lime-500 mr-1">🏃</span> Ваша скорость
                    влияет на время путешествия. Чем выше скорость, тем быстрее
                    вы преодолеваете расстояния.
                </div>

                {/* Информация о сэкономленном времени */}
                {savedTime > 0 && (
                    <div className="mb-4 p-3 bg-yellow-900/30 border-2 border-yellow-600 rounded-md shadow-md">
                        <div className="flex items-center justify-center text-center">
                            <span className="text-yellow-400 text-xl mr-2">
                                ⏱
                            </span>
                            <span className="text-yellow-300 font-bold">
                                ВЫ СЭКОНОМИЛИ {savedTime} СЕКУНД ВРЕМЕНИ!
                                <span className="block mt-1 text-xs text-yellow-500">
                                    (БАЗОВОЕ ВРЕМЯ: {baseTravelTime}С)
                                </span>
                            </span>
                        </div>
                    </div>
                )}

                {/* Информация о путешествии */}
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-400">
                        <div>
                            Из:{" "}
                            <span className="text-gray-300">
                                {fromLocation.name}
                            </span>
                        </div>
                        <div>
                            В:{" "}
                            <span className="text-gray-300">
                                {toLocation.name}
                            </span>
                        </div>
                    </div>
                    <div className="text-lg text-red-400 font-medieval">
                        {formatTime(remainingTime)}
                    </div>
                </div>

                {/* Индикатор загрузки локации */}
                {!isLocationPreloaded && safeProgress > 50 && (
                    <div className="text-xs text-yellow-500 mb-2 flex items-center">
                        <svg
                            className="animate-spin -ml-1 mr-2 h-3 w-3 text-yellow-500"
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
                        Загрузка локации...
                    </div>
                )}

                {/* Прогресс путешествия */}
                <div className="mb-6">
                    <div className="flex justify-between mb-2 text-xs text-gray-400">
                        <span>{fromLocation.name}</span>
                        <span>{toLocation.name}</span>
                    </div>
                    <div className="h-3 relative w-full bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-800 to-red-600 transition-all duration-300 ease-linear"
                            style={{ width: `${safeProgress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Описание путешествия */}
                <p className="text-sm text-gray-400 mb-6 text-center">
                    Ваш персонаж путешествует через опасные земли...
                    {safeProgress < 30 && " Впереди долгий путь."}
                    {safeProgress >= 30 &&
                        safeProgress < 60 &&
                        " Вы преодолели половину пути."}
                    {safeProgress >= 60 &&
                        safeProgress < 90 &&
                        " Вы почти у цели."}
                    {safeProgress >= 90 && " Пункт назначения уже виден вдали."}
                </p>

                {/* Изображения локаций */}
                <div className="flex mt-4 space-x-4">
                    <div className="flex-1 relative">
                        <div className="text-xs text-gray-400 mb-1 text-center">
                            Откуда: {fromLocation.name}
                        </div>
                        <img
                            src={getImageUrl(fromLocation.image_url)}
                            alt={fromLocation.name}
                            className="w-full h-24 object-cover rounded-md border border-gray-600 opacity-75"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                    window.location.origin +
                                    "/images/locations/fallback-location.jpg";
                            }}
                        />
                    </div>
                    <div className="flex-1 relative">
                        <div className="text-xs text-gray-400 mb-1 text-center">
                            Куда: {toLocation.name}
                        </div>
                        <img
                            src={getImageUrl(toLocation.image_url)}
                            alt={toLocation.name}
                            className="w-full h-24 object-cover rounded-md border border-gray-600"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                    window.location.origin +
                                    "/images/locations/fallback-location.jpg";
                            }}
                        />
                    </div>
                </div>

                {/* Кнопка отмены */}
                <div className="flex justify-center">
                    <Button
                        variant="secondary"
                        onClick={handleCancel}
                        className="px-6 mt-4"
                    >
                        Отменить путешествие
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TravelModal;
