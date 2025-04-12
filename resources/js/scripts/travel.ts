import { QueryClient } from "@tanstack/react-query";
import characterStore from "../stores/CharacterStore";
import locationStore, {
    Location,
    LocationConnection,
} from "../stores/LocationStore";
import journalStore from "../stores/JournalStore";

// Интерфейс для результата настройки путешествия
export interface TravelSetupResult {
    targetLocation: Location;
    travelTime: number;
    baseTravelTime: number;
    savedTime: number;
}

// Интерфейс для результата перемещения
export interface TravelResult {
    success: boolean;
    location: Location | null;
    error?: string;
}

/**
 * Настройка путешествия - расчет времени в пути с учетом скорости персонажа
 * @param connection Соединение между локациями (или undefined)
 * @param targetLocation Целевая локация
 * @param defaultTravelTime Время по умолчанию (если соединение не найдено)
 * @returns Объект с результатами настройки путешествия
 */
export const setupTravel = (
    connection: LocationConnection | undefined,
    targetLocation: Location,
    defaultTravelTime: number = 10
): TravelSetupResult => {
    // Получаем скорость персонажа
    const characterSpeed = characterStore.selectedCharacter?.speed || 10;

    // Базовое время перемещения из соединения или по умолчанию
    const baseTravelTime = connection
        ? connection.travel_time
        : defaultTravelTime;

    // Расчет времени с учетом скорости персонажа
    // Формула: baseTravelTime - baseTravelTime * (speed/100)
    const speedModifier = characterSpeed / 100;
    const calculatedTime = Math.round(
        baseTravelTime - baseTravelTime * speedModifier
    );

    // Минимальное время перемещения - 3 секунды
    const finalTravelTime = Math.max(3, calculatedTime);

    // Расчет сэкономленного времени
    const savedTime = baseTravelTime - finalTravelTime;

    return {
        targetLocation,
        travelTime: finalTravelTime,
        baseTravelTime,
        savedTime,
    };
};

/**
 * Поиск соединения между текущей и целевой локацией
 * @param currentLocationId ID текущей локации
 * @param targetLocationId ID целевой локации
 * @param connections Массив соединений между локациями
 * @returns Найденное соединение или undefined
 */
export const findLocationConnection = (
    currentLocationId: number,
    targetLocationId: number,
    connections: LocationConnection[]
): LocationConnection | undefined => {
    return connections.find(
        (conn) =>
            (conn.from_location_id === currentLocationId &&
                conn.to_location_id === targetLocationId) ||
            (conn.is_bidirectional &&
                conn.from_location_id === targetLocationId &&
                conn.to_location_id === currentLocationId)
    );
};

/**
 * Предзагрузка данных локации с использованием React Query
 * @param location Локация для предзагрузки
 * @param characterId ID персонажа
 * @param queryClient Экземпляр QueryClient из React Query
 * @returns Promise<boolean> - результат предзагрузки
 */
export const preloadLocationData = async (
    location: Location,
    characterId: number,
    queryClient: QueryClient
): Promise<boolean> => {
    try {
        await queryClient.prefetchQuery({
            queryKey: ["locationDetails", location.id, characterId],
            queryFn: () =>
                locationStore.getLocationDetails(location.id, characterId),
            staleTime: 5 * 60 * 1000, // Кэшируем на 5 минут
        });
        return true;
    } catch (error) {
        console.error("Ошибка при предзагрузке данных локации:", error);
        return false;
    }
};

/**
 * Выполнение перемещения персонажа в новую локацию
 * @param characterId ID персонажа
 * @param locationId ID целевой локации
 * @param queryClient Экземпляр QueryClient для инвалидации запросов
 * @returns Promise с результатом перемещения
 */
export const completeTravel = async (
    characterId: number,
    locationId: number,
    queryClient: QueryClient
): Promise<TravelResult> => {
    try {
        const result = await locationStore.moveToLocation(
            characterId,
            locationId
        );

        if (result.success) {
            // Инвалидируем все связанные запросы
            queryClient.invalidateQueries({
                queryKey: ["availableLocations", characterId],
            });
            queryClient.invalidateQueries({
                queryKey: ["locationConnections"],
            });
            queryClient.invalidateQueries({
                queryKey: ["regionMap"],
            });
            queryClient.invalidateQueries({
                queryKey: ["worldMap"],
            });
            queryClient.invalidateQueries({
                queryKey: ["character", characterId],
            });

            // Добавляем запись о перемещении в журнал
            journalStore.addEntry(
                `Вы прибыли в локацию ${result.location?.name}`,
                "location"
            );

            return {
                success: true,
                location: result.location as Location,
            };
        } else {
            // Логирование ошибки
            console.error(
                `Ошибка при перемещении в локацию: ${result.error}`,
                result.debug
            );

            // Добавляем запись об ошибке в журнал
            journalStore.addEntry(
                `Не удалось переместиться в локацию: ${result.error}`,
                "error"
            );

            return {
                success: false,
                location: null,
                error:
                    result.error ||
                    "Не удалось переместиться в выбранную локацию",
            };
        }
    } catch (error: any) {
        // Обработка исключения
        console.error("Исключение при перемещении в локацию:", error);
        journalStore.addEntry(
            `Произошла ошибка при перемещении в локацию`,
            "error"
        );

        return {
            success: false,
            location: null,
            error: "Ошибка при перемещении в локацию",
        };
    }
};
