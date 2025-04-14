import { colorMap } from "@/config/dictionary";

export const styling = {
    getColorStyle: (colorClass: string): React.CSSProperties => {
        // Если цвет не задан, используем серый по умолчанию
        if (!colorClass || typeof colorClass !== "string")
            return { color: "#9CA3AF" }; // text-gray-400

        try {
            // Преобразуем "TEXT-COLOR-NUMBER" в соответствующий CSS цвет
            const normalized = colorClass.toLowerCase().replace(/[-]+/g, "-");

            // Извлекаем информацию из строки формата "TEXT-COLOR-NUMBER"
            let parts: string[] = [];

            if (normalized.startsWith("text-")) {
                parts = normalized.substring(5).split("-");
            } else if (normalized.includes("-")) {
                parts = normalized.split("-");
            } else {
                // Если просто название цвета
                return { color: colorMap[normalized]?.["500"] || "#6b7280" }; // default gray-500
            }

            const colorName = parts[0];
            const shade = parts[1] || "500";

            // Если цвет есть в нашей карте, используем его
            if (colorMap[colorName] && colorMap[colorName][shade]) {
                return { color: colorMap[colorName][shade] };
            }

            // Если не нашли цвет, возвращаем серый по умолчанию
            return { color: "#6b7280" }; // gray-500
        } catch (e) {
            console.error("Ошибка при парсинге цвета:", colorClass, e);
            return { color: "#6b7280" }; // gray-500 по умолчанию при ошибке
        }
    },
};
