import { makeAutoObservable, runInAction } from "mobx";
// Вместо импорта хука мы импортируем только тип Element
import { Element } from "../hooks/useElements";
import axios from "../config/axios";
import { ApiResource } from "../hooks/useResources";

// Интерфейс описывающий элемент для рунической матрицы
export interface ElementType {
    id: string;
    name: string;
    icon: string;
    color: string;
}

// Интерфейс описывающий ресурс
export interface Resource {
    id: string;
    name: string;
    description: string;
    icon: string;
    image_url?: string;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
    elementCombination: string[]; // массив ID элементов, необходимых для добычи
    discovered: boolean; // найден ли ресурс ранее
    location_ids: number[]; // локации, в которых можно найти ресурс
}

class ResourceStore {
    discoveredResources: Set<string> = new Set();
    isLoading: boolean = false;
    error: string | null = null;

    // Элементы для рунической матрицы - инициализируем как пустой массив
    elements: ElementType[] = [];
    // Ресурсы для добычи - инициализируем как пустой массив
    resources: Resource[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    // Новый метод для установки ресурсов напрямую из хука useLocationResources
    setResources(resources: Resource[], locationId: number) {
        runInAction(() => {
            this.resources = resources;
            // Обновляем сет обнаруженных ресурсов
            resources.forEach((resource: Resource) => {
                if (resource.discovered) {
                    this.discoveredResources.add(resource.id);
                }
            });
            this.isLoading = false;
            this.error = null;
        });
    }

    // Сохраняем метод loadResourcesForLocation для обратной совместимости,
    // но он будет использовать хук useLocationResources в компоненте
    async loadResourcesForLocation(locationId: number, characterId: number) {
        this.isLoading = true;
        this.error = null;

        try {
            // Этот метод теперь только маркирует состояние загрузки
            // Фактическая загрузка данных происходит в компоненте через хук useLocationResources
            return this.resources;
        } catch (error: any) {
            console.error("Ошибка при загрузке ресурсов:", error);

            runInAction(() => {
                this.error =
                    error.response?.data?.message ||
                    "Не удалось загрузить ресурсы для этой локации";
            });

            return [];
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Проверить правильность комбинации элементов для добычи ресурса
    checkElementCombination(
        resourceId: string,
        selectedElements: string[]
    ): boolean {
        // Находим ресурс
        const resource = this.resources.find((r) => r.id === resourceId);

        if (!resource) {
            return false;
        }

        // Проверка, содержат ли выбранные элементы все необходимые элементы ресурса,
        // и нет ли лишних элементов
        if (selectedElements.length !== resource.elementCombination.length) {
            return false;
        }

        // Преобразуем все ID к строкам для надежного сравнения
        const requiredElementsStr = resource.elementCombination.map((el) =>
            String(el)
        );
        const selectedElementsStr = selectedElements.map((el) => String(el));

        // Сортируем массивы для корректного сравнения, независимо от порядка элементов
        const sortedRequired = [...requiredElementsStr].sort();
        const sortedSelected = [...selectedElementsStr].sort();

        // Проверяем совпадение всех элементов
        const isEqual = sortedRequired.every(
            (el, index) => el === sortedSelected[index]
        );

        return isEqual;
    }

    // Отметить ресурс как обнаруженный
    async discoverResource(resourceId: string, characterId: number) {
        try {
            // Находим ресурс для получения комбинации элементов
            const resource = this.resources.find((r) => r.id === resourceId);
            if (!resource) {
                console.error("Ресурс не найден:", resourceId);
                return false;
            }

            // Делаем запрос к API для обнаружения ресурса
            const response = await axios.post("/api/resources/discover", {
                resource_id: parseInt(resourceId), // Конвертируем строковый ID в число
                character_id: characterId,
                // Отправляем комбинацию элементов для отладки на сервере
                debug_element_combination: resource.elementCombination.map(
                    (id) => parseInt(id)
                ), // Также конвертируем элементы
            });

            // Если запрос успешен, обновляем состояние в сторе
            if (response.data.success) {
                if (resource) {
                    runInAction(() => {
                        resource.discovered = true;
                        this.discoveredResources.add(resourceId);
                    });
                }

                return true;
            } else {
                console.error("Сервер вернул ошибку:", response.data.message);
                return false;
            }
        } catch (error: any) {
            console.error("Ошибка при обнаружении ресурса:", error);

            runInAction(() => {
                this.error =
                    error.response?.data?.message ||
                    "Не удалось обнаружить ресурс";
            });

            return false;
        }
    }

    // Метод для установки элементов из компонента
    setElements(elements: ElementType[]) {
        runInAction(() => {
            this.elements = elements;
        });
    }

    // Получить элементы для рунической матрицы
    getElements(): ElementType[] {
        return this.elements;
    }

    // Очистить ошибки
    resetError() {
        this.error = null;
    }
}

export default new ResourceStore();
