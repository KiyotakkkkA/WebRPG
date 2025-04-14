import { useQuery } from "@tanstack/react-query";
import axios from "../config/axios";

// Интерфейс описывающий элемент для рунической матрицы
export interface Element {
    id: number;
    name: string;
    icon: string;
    color: string;
    description: string | null;
    is_active: boolean;
}

// Трансформация данных с сервера в формат для компонента ElementalMatrix
export const transformElementsForMatrix = (elements: Element[]) => {
    return elements.map((element) => ({
        id: String(element.id),
        name: element.name,
        icon: element.icon,
        color: element.color,
    }));
};

// Хук для получения всех активных элементов
export const useElements = () => {
    return useQuery({
        queryKey: ["elements"],
        queryFn: async () => {
            const { data } = await axios.get("/api/elements");
            return data.elements as Element[];
        },
        select: transformElementsForMatrix,
        staleTime: 1000 * 60 * 5, // 5 минут
        gcTime: 1000 * 60 * 30, // 30 минут
    });
};

// Хук для получения конкретного элемента по ID
export const useElement = (id: number) => {
    return useQuery({
        queryKey: ["elements", id],
        queryFn: async () => {
            const { data } = await axios.get(`/api/elements/${id}`);
            return data.element as Element;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 минут
        gcTime: 1000 * 60 * 30, // 30 минут
    });
};
