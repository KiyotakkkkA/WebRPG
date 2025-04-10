import React, { useRef, useEffect, useState, useCallback } from "react";
import axios from "../../config/axios";

interface MapNode {
    id: number;
    name: string;
    description: string;
    position_x: number;
    position_y: number;
    icon?: string;
    is_accessible?: boolean;
    is_current?: boolean;
    danger_level?: number;
}

interface MapConnection {
    from_id: number;
    to_id: number;
    travel_time: number;
}

interface MapBounds {
    min_x: number;
    min_y: number;
    max_x: number;
    max_y: number;
}

interface GameMapProps {
    mapMode: "world" | "region";
    regionId?: number;
    characterId?: number;
    onNodeSelect?: (node: MapNode) => void;
}

const GameMap: React.FC<GameMapProps> = ({
    mapMode,
    regionId,
    characterId,
    onNodeSelect,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nodes, setNodes] = useState<MapNode[]>([]);
    const [connections, setConnections] = useState<MapConnection[]>([]);
    const [mapBounds, setMapBounds] = useState<MapBounds>({
        min_x: 0,
        min_y: 0,
        max_x: 1000,
        max_y: 1000,
    });

    // Состояние для отслеживания масштаба и позиции карты
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
    const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
    const [cursorCoords, setCursorCoords] = useState<{
        x: number;
        y: number;
    } | null>(null);

    // Рефы для отслеживания последних значений параметров
    const lastMapModeRef = useRef(mapMode);
    const lastRegionIdRef = useRef(regionId);
    const lastCharacterIdRef = useRef(characterId);
    const requestInProgressRef = useRef(false);

    // Мемоизируем функцию загрузки данных карты
    const fetchMapData = useCallback(async () => {
        // Проверяем, не запущен ли уже запрос
        if (requestInProgressRef.current) return;

        // Проверяем, изменились ли важные параметры
        if (
            lastMapModeRef.current === mapMode &&
            lastRegionIdRef.current === regionId &&
            lastCharacterIdRef.current === characterId &&
            nodes.length > 0
        ) {
            return;
        }

        // Обновляем рефы
        lastMapModeRef.current = mapMode;
        lastRegionIdRef.current = regionId;
        lastCharacterIdRef.current = characterId;

        requestInProgressRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            let response;

            if (mapMode === "world") {
                response = await axios.get("/api/world-map");
                setNodes(response.data.regions);
                setConnections([]);
            } else if (mapMode === "region" && regionId) {
                response = await axios.get(`/api/region-map/${regionId}`, {
                    params: { character_id: characterId },
                });
                setNodes(response.data.locations);
                setConnections(response.data.connections);
            }

            if (response?.data.map_bounds) {
                setMapBounds(response.data.map_bounds);
            }

            // Сбросить масштаб и позицию
            setScale(1);
            setOffset({ x: 0, y: 0 });
            setSelectedNode(null);
        } catch (err: any) {
            setError(err.response?.data?.message || "Ошибка загрузки карты");
            console.error("Ошибка загрузки карты:", err);
        } finally {
            setIsLoading(false);
            requestInProgressRef.current = false;
        }
    }, [mapMode, regionId, characterId]);

    // Загрузка данных карты только при изменении важных параметров
    useEffect(() => {
        fetchMapData();
    }, [fetchMapData]);

    // Отрисовка карты на канвасе
    useEffect(() => {
        if (!canvasRef.current || isLoading) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Если нет узлов для отображения, не пытаемся отрисовать карту
        if (!nodes || nodes.length === 0) {
            console.warn("GameMap: Нет узлов для отображения");
            // Отрисуем предупреждение на канвасе
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, "#111827");
            gradient.addColorStop(1, "#0d1425");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = "16px Arial";
            ctx.fillStyle = "#D1D5DB";
            ctx.textAlign = "center";
            ctx.fillText(
                "Нет данных для отображения на карте",
                canvas.width / 2,
                canvas.height / 2
            );
            return;
        }

        // Функция для преобразования координат из пространства карты в пространство канваса
        const mapToCanvas = (x: number, y: number) => {
            const mapWidth = mapBounds.max_x - mapBounds.min_x;
            const mapHeight = mapBounds.max_y - mapBounds.min_y;

            // Расчет масштабированной и смещенной позиции
            const canvasX =
                ((x - mapBounds.min_x) / mapWidth) * canvas.width * scale +
                offset.x;
            const canvasY =
                ((y - mapBounds.min_y) / mapHeight) * canvas.height * scale +
                offset.y;

            return { x: canvasX, y: canvasY };
        };

        // Функция для преобразования координат из пространства канваса в пространство карты
        const canvasToMap = (x: number, y: number) => {
            const mapWidth = mapBounds.max_x - mapBounds.min_x;
            const mapHeight = mapBounds.max_y - mapBounds.min_y;

            const mapX =
                ((x - offset.x) / (canvas.width * scale)) * mapWidth +
                mapBounds.min_x;
            const mapY =
                ((y - offset.y) / (canvas.height * scale)) * mapHeight +
                mapBounds.min_y;

            return { x: mapX, y: mapY };
        };

        // Функция для отрисовки карты
        const drawMap = () => {
            // Очистка канваса
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Фон карты (темный градиент)
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, "#111827");
            gradient.addColorStop(1, "#0d1425");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // ВАЖНО: Удаляем отрисовку сетки, оставляем только установку стилей для линий
            ctx.strokeStyle = "rgba(55, 65, 81, 0.2)";
            ctx.lineWidth = 1;

            // Отрисовка соединений (путей между локациями)
            if (mapMode === "region" && connections && connections.length > 0) {
                connections.forEach((connection) => {
                    const fromNode = nodes.find(
                        (node) => node.id === connection.from_id
                    );
                    const toNode = nodes.find(
                        (node) => node.id === connection.to_id
                    );

                    if (fromNode && toNode) {
                        const { x: x1, y: y1 } = mapToCanvas(
                            fromNode.position_x,
                            fromNode.position_y
                        );
                        const { x: x2, y: y2 } = mapToCanvas(
                            toNode.position_x,
                            toNode.position_y
                        );

                        // Рисуем линию пути (красная для достпных, серая для недоступных)
                        const isAccessible =
                            fromNode.is_accessible && toNode.is_accessible;
                        ctx.strokeStyle = isAccessible
                            ? "rgba(185, 28, 28, 0.6)"
                            : "rgba(75, 85, 99, 0.4)";
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 5]);

                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                        ctx.setLineDash([]);

                        // Рисуем время в пути, если есть
                        if (connection.travel_time > 0) {
                            const midX = (x1 + x2) / 2;
                            const midY = (y1 + y2) / 2;

                            ctx.font = "10px Arial";
                            ctx.fillStyle = isAccessible
                                ? "rgba(252, 165, 165, 0.8)"
                                : "rgba(156, 163, 175, 0.6)";
                            ctx.fillText(
                                `${connection.travel_time} секунд`,
                                midX,
                                midY
                            );
                        }
                    }
                });
            }

            // Отрисовка узлов (регионов или локаций)
            if (nodes && nodes.length > 0) {
                nodes.forEach((node) => {
                    const { x, y } = mapToCanvas(
                        node.position_x,
                        node.position_y
                    );

                    // Определяем цвет и размер узла
                    let nodeSize = 8;
                    let color = "#4B5563"; // Серый по умолчанию

                    if (mapMode === "world") {
                        nodeSize = 12;
                        color = "#7F1D1D"; // Темно-красный для регионов
                    } else {
                        // Для локаций
                        if (node.is_current) {
                            nodeSize = 12;
                            color = "#FBBF24"; // Желтый для текущей локации
                        } else if (node.is_accessible === false) {
                            color = "#4B5563"; // Серый для недоступных
                        } else {
                            // Цвет в зависимости от уровня опасности
                            if (node.danger_level === 0) {
                                color = "#10B981"; // Зеленый для безопасных
                            } else if (
                                node.danger_level &&
                                node.danger_level < 3
                            ) {
                                color = "#F59E0B"; // Оранжевый для низкой опасности
                            } else if (
                                node.danger_level &&
                                node.danger_level < 5
                            ) {
                                color = "#EF4444"; // Красный для средней опасности
                            } else {
                                color = "#991B1B"; // Темно-красный для высокой опасности
                            }
                        }
                    }

                    // Увеличенный размер для подсвеченного или выбранного узла
                    if (hoveredNode?.id === node.id) {
                        nodeSize += 4;
                    }
                    if (selectedNode?.id === node.id) {
                        nodeSize += 6;

                        // Рисуем выделение вокруг выбранного узла
                        ctx.beginPath();
                        ctx.arc(x, y, nodeSize + 4, 0, Math.PI * 2);
                        ctx.fillStyle = "rgba(252, 211, 77, 0.3)";
                        ctx.fill();
                    }

                    // Рисуем узел
                    ctx.beginPath();
                    ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();

                    // Рисуем границу узла
                    ctx.strokeStyle = "#1F2937";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Рисуем название узла
                    ctx.font = "bold 12px Arial";
                    ctx.fillStyle = node.is_current ? "#FCD34D" : "#D1D5DB";
                    ctx.textAlign = "center";
                    ctx.fillText(node.name, x, y - nodeSize - 5);
                });
            }

            // Отображение информации о наведенном узле
            if (hoveredNode) {
                const { x, y } = mapToCanvas(
                    hoveredNode.position_x,
                    hoveredNode.position_y
                );

                // Фон для подсказки
                const tooltipWidth = 200;
                const tooltipHeight = 60;
                const tooltipX = Math.min(
                    x + 15,
                    canvas.width - tooltipWidth - 10
                );
                const tooltipY = Math.min(
                    y + 15,
                    canvas.height - tooltipHeight - 10
                );

                ctx.fillStyle = "rgba(17, 24, 39, 0.9)";
                ctx.strokeStyle = "rgba(185, 28, 28, 0.6)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(
                    tooltipX,
                    tooltipY,
                    tooltipWidth,
                    tooltipHeight,
                    5
                );
                ctx.fill();
                ctx.stroke();

                // Название
                ctx.font = "bold 14px Arial";
                ctx.fillStyle = "#D1D5DB";
                ctx.textAlign = "left";
                ctx.fillText(hoveredNode.name, tooltipX + 10, tooltipY + 20);

                // Описание (укороченное)
                ctx.font = "12px Arial";
                ctx.fillStyle = "#9CA3AF";
                let description = hoveredNode.description || "";
                if (description.length > 30) {
                    description = description.substring(0, 30) + "...";
                }
                ctx.fillText(description, tooltipX + 10, tooltipY + 40);
            }
        };

        // Установка размеров canvas для соответствия размеру контейнера
        const resizeCanvas = () => {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                requestAnimationFrame(() => drawMap());
            }
        };

        // Инициализация размеров и добавление слушателя изменения размера
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Функция для проверки, наведена ли мышь на узел
        const isMouseOverNode = (
            x: number,
            y: number,
            node: MapNode
        ): boolean => {
            const { x: nodeX, y: nodeY } = mapToCanvas(
                node.position_x,
                node.position_y
            );
            const distance = Math.sqrt(
                Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2)
            );
            return distance <= (node.is_current ? 14 : 10) * scale;
        };

        // Обработчики событий мыши
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Обновляем координаты курсора в пространстве карты
            const mapCoords = canvasToMap(x, y);
            setCursorCoords({
                x: Math.floor(mapCoords.x),
                y: Math.floor(mapCoords.y),
            });

            // Если перетаскивание активно, смещаем карту
            if (isDragging) {
                setOffset({
                    x: offset.x + (x - dragStart.x),
                    y: offset.y + (y - dragStart.y),
                });
                setDragStart({ x, y });
                drawMap();
                return;
            }

            // Проверяем, наведена ли мышь на узел
            let isOverNode = false;
            for (const node of nodes) {
                if (isMouseOverNode(x, y, node)) {
                    setHoveredNode(node);
                    canvas.style.cursor = "pointer";
                    isOverNode = true;
                    break;
                }
            }

            if (!isOverNode) {
                setHoveredNode(null);
                canvas.style.cursor = "grab";
            }

            drawMap();
        };

        const handleMouseDown = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Проверяем, кликнули ли по узлу
            for (const node of nodes) {
                if (isMouseOverNode(x, y, node)) {
                    setSelectedNode(node);
                    if (onNodeSelect) {
                        onNodeSelect(node);
                    }
                    drawMap();
                    return;
                }
            }

            // Если не на узле, начинаем перетаскивание
            setIsDragging(true);
            setDragStart({ x, y });
            canvas.style.cursor = "grabbing";
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            canvas.style.cursor = hoveredNode ? "pointer" : "grab";
        };

        const handleMouseLeave = () => {
            setIsDragging(false);
            setHoveredNode(null);
        };

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();

            // Определяем коэффициент масштабирования
            const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(0.5, Math.min(2, scale * scaleChange));

            // Получаем координаты мыши относительно канваса
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Вычисляем новое смещение, чтобы масштабировать относительно позиции мыши
            const newOffset = {
                x: mouseX - (mouseX - offset.x) * (newScale / scale),
                y: mouseY - (mouseY - offset.y) * (newScale / scale),
            };

            setScale(newScale);
            setOffset(newOffset);
            drawMap();
        };

        // Добавляем слушатели событий
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("mouseleave", handleMouseLeave);
        canvas.addEventListener("wheel", handleWheel);

        // Начальная отрисовка
        drawMap();

        // Очистка слушателей событий при размонтировании
        return () => {
            window.removeEventListener("resize", resizeCanvas);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
            canvas.removeEventListener("wheel", handleWheel);
        };
    }, [
        nodes,
        connections,
        isLoading,
        mapBounds,
        scale,
        offset,
        isDragging,
        dragStart,
        hoveredNode,
        selectedNode,
        mapMode,
        onNodeSelect,
    ]);

    // Кнопки управления масштабом
    const handleZoomIn = () => {
        setScale(Math.min(2, scale * 1.2));
    };

    const handleZoomOut = () => {
        setScale(Math.max(0.5, scale * 0.8));
    };

    const handleResetZoom = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    return (
        <div className="relative w-full h-full bg-gray-900 flex items-center justify-center border border-red-900/30 rounded-lg overflow-hidden">
            {isLoading ? (
                <div className="text-gray-400">Загрузка карты...</div>
            ) : error ? (
                <div className="text-red-500">{error}</div>
            ) : (
                <>
                    <canvas ref={canvasRef} className="w-full h-full" />

                    {/* Блок отображения координат курсора */}
                    {cursorCoords && (
                        <div className="absolute top-4 right-4 bg-gray-800/80 px-3 py-2 rounded-md border border-red-900/40 text-xs text-gray-300">
                            <div className="font-bold text-red-400 mb-1">
                                Координаты:
                            </div>
                            <div>X: {cursorCoords.x}</div>
                            <div>Y: {cursorCoords.y}</div>
                        </div>
                    )}

                    {/* Элементы управления масштабом */}
                    <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
                        <button
                            className="bg-gray-800 text-gray-300 hover:bg-gray-700 p-2 rounded-md border border-red-900/40"
                            onClick={handleZoomIn}
                            title="Приблизить"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                <line x1="11" y1="8" x2="11" y2="14" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                        </button>
                        <button
                            className="bg-gray-800 text-gray-300 hover:bg-gray-700 p-2 rounded-md border border-red-900/40"
                            onClick={handleZoomOut}
                            title="Отдалить"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                        </button>
                        <button
                            className="bg-gray-800 text-gray-300 hover:bg-gray-700 p-2 rounded-md border border-red-900/40"
                            onClick={handleResetZoom}
                            title="Сбросить масштаб"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z" />
                                <path d="M9 10v4" />
                                <path d="M15 10v4" />
                            </svg>
                        </button>
                    </div>

                    {/* Легенда карты */}
                    <div className="absolute bottom-4 left-4 bg-gray-900/80 p-2 rounded-md border border-red-900/40 text-xs">
                        {mapMode === "world" ? (
                            <div className="text-gray-300">
                                <div className="font-bold text-red-400 mb-1">
                                    Легенда:
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-red-800 rounded-full mr-1"></div>
                                    <span>Регион</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-300">
                                <div className="font-bold text-red-400 mb-1">
                                    Легенда:
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                                    <span>Текущая локация</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-600 rounded-full mr-1"></div>
                                    <span>Безопасная зона</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-yellow-600 rounded-full mr-1"></div>
                                    <span>Низкая опасность</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-red-600 rounded-full mr-1"></div>
                                    <span>Средняя опасность</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-red-900 rounded-full mr-1"></div>
                                    <span>Высокая опасность</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-gray-600 rounded-full mr-1"></div>
                                    <span>Недоступная локация</span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default GameMap;
