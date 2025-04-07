import React, { useEffect, useRef } from "react";
import { Location, LocationConnection } from "../../stores/LocationStore";

interface LocationMapProps {
    locations: Location[];
    connections: LocationConnection[];
    currentLocation: Location | null;
    onLocationSelect: (location: Location) => void;
    width?: number;
    height?: number;
}

const LocationMap: React.FC<LocationMapProps> = ({
    locations,
    connections,
    currentLocation,
    onLocationSelect,
    width = 300,
    height = 200,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Координаты локаций на карте
    const nodeRadius = 10;
    const selectedNodeRadius = 15;
    const locationNodes: { location: Location; x: number; y: number }[] =
        locations.map((location) => {
            // Используем position_x и position_y из локации или генерируем случайные координаты
            const x =
                location.position_x !== undefined
                    ? location.position_x * width
                    : Math.random() * (width - 2 * nodeRadius) + nodeRadius;
            const y =
                location.position_y !== undefined
                    ? location.position_y * height
                    : Math.random() * (height - 2 * nodeRadius) + nodeRadius;
            return { location, x, y };
        });

    // Отрисовка карты
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Очистка холста
        ctx.clearRect(0, 0, width, height);

        // Отрисовка соединений (линий) между локациями
        ctx.lineWidth = 2;
        connections.forEach((connection) => {
            const sourceNode = locationNodes.find(
                (node) => node.location.id === connection.from_location_id
            );
            const targetNode = locationNodes.find(
                (node) => node.location.id === connection.to_location_id
            );

            if (sourceNode && targetNode) {
                // Рисуем линию
                ctx.beginPath();
                ctx.moveTo(sourceNode.x, sourceNode.y);
                ctx.lineTo(targetNode.x, targetNode.y);

                // Стиль линии в зависимости от доступности
                const sourceAccessible = sourceNode.location.is_accessible;
                const targetAccessible = targetNode.location.is_accessible;

                if (sourceAccessible && targetAccessible) {
                    ctx.strokeStyle = "#6b7280"; // gray-500
                } else {
                    ctx.strokeStyle = "#4b5563"; // gray-600 - более темный для недоступных
                    ctx.setLineDash([5, 3]); // Пунктирная линия для недоступных соединений
                }

                ctx.stroke();
                ctx.setLineDash([]); // Сброс стиля линии

                // Если соединение двустороннее, рисуем стрелку в обе стороны
                if (connection.is_bidirectional) {
                    // Можно добавить стрелки или другие обозначения
                }
            }
        });

        // Отрисовка локаций (узлов)
        locationNodes.forEach((node) => {
            const { location, x, y } = node;

            // Задаем стиль узла в зависимости от доступности и текущего статуса
            const isCurrent = currentLocation?.id === location.id;
            const radius = isCurrent ? selectedNodeRadius : nodeRadius;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);

            // Заливка узла
            if (isCurrent) {
                ctx.fillStyle = "#991b1b"; // red-800
            } else if (location.is_accessible) {
                ctx.fillStyle = "#7f1d1d"; // red-900
            } else {
                ctx.fillStyle = "#1f2937"; // gray-800
            }

            ctx.fill();

            // Обводка узла
            ctx.lineWidth = 2;
            ctx.strokeStyle = location.is_accessible ? "#f87171" : "#4b5563"; // red-400 : gray-600
            ctx.stroke();

            // Текст с названием локации
            ctx.fillStyle = "#f3f4f6"; // gray-100
            ctx.font = "10px Arial";
            ctx.textAlign = "center";
            ctx.fillText(location.name, x, y + radius + 15);
        });
    }, [locations, connections, currentLocation, width, height]);

    // Обработка клика по карте для выбора локации
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Проверяем, попал ли клик на какую-то локацию
        for (const node of locationNodes) {
            const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
            const radius =
                currentLocation?.id === node.location.id
                    ? selectedNodeRadius
                    : nodeRadius;

            if (distance <= radius && node.location.is_accessible) {
                onLocationSelect(node.location);
                break;
            }
        }
    };

    return (
        <div className="relative bg-gray-900/70 border border-red-900/40 rounded-lg p-2">
            <h3 className="text-xs text-red-400 font-medieval mb-2 text-center">
                Карта мира
            </h3>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                onClick={handleCanvasClick}
                className="rounded-md cursor-pointer"
            />
        </div>
    );
};

export default LocationMap;
