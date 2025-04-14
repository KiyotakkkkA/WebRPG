import { useQuery } from "@tanstack/react-query";
import axios from "../config/axios";
import { Resource } from "../stores/ResourceStore";

// Интерфейс ответа API для ресурсов локации
export interface LocationResourcesResponse {
    resources: ApiResource[];
    location: {
        id: number;
        name: string;
    };
}

// Интерфейс ресурса из API
export interface ApiResource {
    id: number;
    name: string;
    description: string;
    icon: string;
    image_url: string | null;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
    element_combination: number[];
    base_gathering_time: number;
    is_active: boolean;
    discovered: boolean;
    properties?: any;
    pivot?: {
        spawn_chance: number;
        min_amount: number;
        max_amount: number;
    };
}

// Трансформация данных с сервера в формат для клиентских компонентов
export const transformApiResources = (
    apiResources: ApiResource[]
): Resource[] => {
    return apiResources.map((resource) => ({
        id: String(resource.id),
        name: resource.name,
        description: resource.description,
        icon: resource.icon,
        image_url: resource.image_url || undefined,
        rarity: resource.rarity,
        elementCombination:
            resource.element_combination?.map((id) => String(id)) || [],
        discovered: resource.discovered,
        location_ids: [], // Эти данные обычно не приходят в API ресурсов локации
    }));
};

// Хук для получения ресурсов текущей локации персонажа
export const useLocationResources = (characterId: number) => {
    return useQuery({
        queryKey: ["location-resources", characterId],
        queryFn: async () => {
            const { data } = await axios.get<LocationResourcesResponse>(
                "/api/location-resources",
                {
                    params: { character_id: characterId },
                }
            );
            return data;
        },
        select: (data) => ({
            resources: transformApiResources(data.resources),
            location: data.location,
        }),
        staleTime: 1000 * 60 * 5, // 5 минут
        gcTime: 1000 * 60 * 30, // 30 минут
        enabled: !!characterId, // Хук будет работать только если передан ID персонажа
    });
};
