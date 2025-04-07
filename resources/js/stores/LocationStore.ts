import { makeAutoObservable, runInAction } from "mobx";
import axios from "../config/axios";

export interface LocationRequirement {
    type: string;
    parameter: string;
    value: number | string;
    description: string;
    fulfilled: boolean;
    current_value?: number | string;
}

export interface LocationObject {
    id: string;
    name: string;
    icon: string;
    type: "building" | "npc" | "monster" | "resource";
    description: string;
    image_url?: string;
}

export interface Location {
    id: number;
    name: string;
    description: string;
    image_url: string;
    danger_level: number;
    is_default: boolean;
    is_discoverable: boolean;
    position_x: number;
    position_y: number;
    is_accessible: boolean;
    is_current: boolean;
    is_accessible_from_current?: boolean;
    is_discovered?: boolean;
    requirements?: LocationRequirement[];
    objects?: LocationObject[];
    access_issue?: string;
}

export interface LocationConnection {
    from_location_id: number;
    to_location_id: number;
    is_bidirectional: boolean;
    travel_time: number;
}

// Интерфейс для результата загрузки локаций
export interface LocationsLoadResult {
    currentLocation: Location | null;
    availableLocations: Location[];
}

class LocationStore {
    locations: Location[] = [];
    currentLocation: Location | null = null;
    availableLocations: Location[] = [];
    isLoading: boolean = false;
    error: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    // Загрузить доступные локации для персонажа
    async loadAvailableLocations(
        characterId: number
    ): Promise<LocationsLoadResult | null> {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await axios.get("/api/locations", {
                params: { character_id: characterId },
            });

            if (response.data.locations?.length > 0) {
                const accessibleLocations = response.data.locations.filter(
                    (loc: Location) =>
                        loc.is_accessible_from_current && loc.is_accessible
                );
            }

            // Проверяем структуру данных
            if (!response.data || !response.data.locations) {
                console.error(
                    "Неверный формат данных в ответе API локаций",
                    response.data
                );
                throw new Error("Неверный формат данных в ответе API");
            }

            const locations = response.data.locations;
            const currentLocation = response.data.current_location;

            runInAction(() => {
                this.availableLocations = locations;
                this.currentLocation = currentLocation;
            });

            return {
                availableLocations: locations,
                currentLocation: currentLocation,
            };
        } catch (error: any) {
            console.error("Ошибка при загрузке локаций:", error);
            console.error("Детали ответа:", {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
            });

            runInAction(() => {
                this.error =
                    error.response?.data?.message ||
                    "Ошибка загрузки доступных локаций";
            });
            return null;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Загрузить соединения между локациями
    async loadLocationConnections(): Promise<LocationConnection[]> {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await axios.get("/api/locations/connections");

            // Проверяем наличие данных
            if (
                !response.data ||
                !response.data.connections ||
                !Array.isArray(response.data.connections)
            ) {
                console.error(
                    "Неверный формат данных в ответе:",
                    response.data
                );
                return [];
            }

            // Преобразуем данные, если необходимо
            const connections = response.data.connections.map((conn: any) => ({
                from_location_id: Number(conn.from_location_id),
                to_location_id: Number(conn.to_location_id),
                is_bidirectional: Boolean(conn.is_bidirectional),
                travel_time: Number(conn.travel_time),
            }));

            // Возвращаем соединения
            return connections;
        } catch (error: any) {
            console.error("Ошибка при загрузке соединений:", error);
            runInAction(() => {
                this.error =
                    error.response?.data?.message ||
                    "Ошибка загрузки соединений между локациями";
            });
            // Возвращаем пустой массив в случае ошибки
            return [];
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Получить детальную информацию о локации
    async getLocationDetails(locationId: number, characterId?: number) {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await axios.get(`/api/locations/${locationId}`, {
                params: { character_id: characterId },
            });

            const location = response.data.location;

            // Обновляем локацию в списке доступных, если она там есть
            runInAction(() => {
                this.availableLocations = this.availableLocations.map((loc) =>
                    loc.id === location.id ? location : loc
                );

                // Если это текущая локация, обновляем и её
                if (this.currentLocation?.id === location.id) {
                    this.currentLocation = location;
                }
            });

            return location;
        } catch (error: any) {
            runInAction(() => {
                this.error =
                    error.response?.data?.message ||
                    `Ошибка загрузки информации о локации #${locationId}`;
            });
            return null;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Переместить персонажа в новую локацию
    async moveToLocation(characterId: number, targetLocationId: number) {
        this.isLoading = true;
        this.error = null;

        try {
            // Проверка входных данных
            if (!characterId || !targetLocationId) {
                console.error("moveToLocation: Неверные входные данные", {
                    characterId,
                    targetLocationId,
                });
                return {
                    success: false,
                    error: "Отсутствуют необходимые данные для перемещения",
                    debug: { characterId, targetLocationId },
                };
            }

            // Замер времени выполнения запроса
            const startTime = Date.now();

            const response = await axios.post("/api/locations/move", {
                character_id: characterId,
                location_id: targetLocationId,
            });

            const requestTime = Date.now() - startTime;

            runInAction(() => {
                // Проверяем, что в ответе есть ожидаемые данные
                if (!response.data.location) {
                    console.warn(
                        "API вернул ответ без информации о локации:",
                        response.data
                    );
                    this.error = "API вернул неполные данные";
                    return {
                        success: false,
                        error: this.error,
                        debug: response.data,
                    };
                }

                this.currentLocation = response.data.location;

                // Обновляем статус текущей локации в списке доступных
                this.availableLocations = this.availableLocations.map(
                    (loc) => ({
                        ...loc,
                        is_current: loc.id === targetLocationId,
                    })
                );
            });

            // Загружаем обновленный список доступных локаций
            await this.loadAvailableLocations(characterId);

            return {
                success: true,
                location: this.currentLocation,
                requestTime,
            };
        } catch (error: any) {
            console.error("Ошибка при перемещении:", error);
            console.error("Детали ответа:", {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
            });

            runInAction(() => {
                this.error =
                    error.response?.data?.message ||
                    "Ошибка перемещения в локацию";
            });

            return {
                success: false,
                error: this.error,
                debug: {
                    responseData: error.response?.data,
                    status: error.response?.status,
                    message: error.message,
                },
            };
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Очистить ошибку
    resetError() {
        this.error = null;
    }
}

const locationStore = new LocationStore();
export default locationStore;
