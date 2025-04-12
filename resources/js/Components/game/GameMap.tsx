import React, {
    useRef,
    useEffect,
    useState,
    useCallback,
    useMemo,
} from "react";
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
    type?: string;
}

interface MapConnection {
    from_id: number;
    to_id: number;
    travel_time: number;
    is_bidirectional: boolean;
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
    const lastMapModeRef = useRef<"world" | "region" | null>(null);
    const lastRegionIdRef = useRef<number | undefined>(undefined);
    const lastCharacterIdRef = useRef<number | undefined>(undefined);
    const requestInProgressRef = useRef(false);

    // Определяем объект для хранения скорректированных позиций для каждого узла
    const [adjustedPositions] = useState<Map<number, { x: number; y: number }>>(
        new Map()
    );

    // Функция для определения, является ли соединение двунаправленным
    const isBidirectionalConnection = useCallback(
        (fromId: number, toId: number): boolean => {
            // Проверяем, есть ли соединение в обратном направлении
            const hasReverseConnection = connections.some(
                (conn) => conn.from_id === toId && conn.to_id === fromId
            );

            // Проверяем, имеет ли текущее соединение флаг is_bidirectional
            const currentConnection = connections.find(
                (conn) => conn.from_id === fromId && conn.to_id === toId
            );

            return (
                hasReverseConnection ||
                currentConnection?.is_bidirectional ||
                false
            );
        },
        [connections]
    );

    // Функция для преобразования координат из пространства карты в пространство канваса
    const mapToCanvas = useCallback(
        (x: number, y: number) => {
            // Если границы карты не определены, возвращаем исходные координаты
            if (!mapBounds || !canvasRef.current) {
                return { x, y };
            }

            const canvas = canvasRef.current;
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
        },
        [mapBounds, scale, offset]
    );

    // Создаем уникальный ключ для текущего состояния карты
    const mapStateKey = useMemo(
        () => `${mapMode}-${regionId}-${Date.now()}`,
        [mapMode, regionId]
    );

    // Мемоизируем функцию загрузки данных карты
    const fetchMapData = useCallback(async () => {
        // Проверяем, не запущен ли уже запрос
        if (requestInProgressRef.current) {
            return;
        }

        // Если режим карты или ID региона не заданы, ничего не делаем
        if (mapMode === undefined) {
            return;
        }

        // Проверяем, изменились ли важные параметры или принудительно ли нужно запросить данные
        const isModeChanged = lastMapModeRef.current !== mapMode;
        const isRegionChanged = lastRegionIdRef.current !== regionId;
        const forceUpdate = isModeChanged || isRegionChanged;

        if (
            !forceUpdate &&
            nodes.length > 0 &&
            lastCharacterIdRef.current === characterId
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
                // Для мировой карты загружаем данные о регионах

                response = await axios.get("/api/world-map");

                setNodes(
                    response.data.regions.map((region: any) => ({
                        ...region,
                        type: "region",
                    }))
                );
                setConnections([]);
                setMapBounds(response.data.map_bounds);
            } else if (regionId) {
                // Для карты региона загружаем локации и соединения

                response = await axios.get(`/api/region-map/${regionId}`, {
                    params: {
                        character_id: characterId,
                    },
                });

                setNodes(response.data.locations);
                setConnections(response.data.connections);
                setMapBounds(response.data.map_bounds);
            } else {
                console.warn("Не указан ID региона для режима region");
                return;
            }

            // Сбросить масштаб и позицию
            setScale(1);
            setOffset({ x: 0, y: 0 });
            setSelectedNode(null);
        } catch (err: any) {
            setError(err.response?.data?.message || "Ошибка загрузки карты");
            console.error("Ошибка загрузки карты:", err);
        } finally {
            requestInProgressRef.current = false;
            setIsLoading(false);
        }
    }, [mapMode, regionId, characterId]);

    // Загрузка данных карты только при изменении важных параметров
    useEffect(() => {
        fetchMapData();
    }, [fetchMapData]);

    // Этот эффект будет запускаться при каждом изменении режима карты или ID региона
    useEffect(() => {
        // Принудительно сбрасываем кэширование и запрашиваем новые данные
        setNodes([]);
        setConnections([]);
        lastMapModeRef.current = null;
        lastRegionIdRef.current = undefined;
        lastCharacterIdRef.current = undefined;

        // Немедленно запускаем загрузку данных для нового режима
        fetchMapData();
    }, [mapMode, regionId]);

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

        // Функция для отрисовки карты
        const drawMap = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Создаем Set для отслеживания уже отрисованных соединений
            const drawnConnections = new Set<string>();

            // Отрисовываем соединения между локациями
            ctx.save();
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            for (const connection of connections) {
                const fromNode = nodes.find(
                    (node) => node.id === connection.from_id
                );
                const toNode = nodes.find(
                    (node) => node.id === connection.to_id
                );

                if (!fromNode || !toNode) {
                    continue;
                }

                // Создаем уникальный ключ для пары узлов (сортируем ID для уникальности)
                const nodeIds = [fromNode.id, toNode.id].sort((a, b) => a - b);
                const connectionKey = `${nodeIds[0]}-${nodeIds[1]}`;

                // Если соединение между этими узлами уже отрисовано, пропускаем
                if (drawnConnections.has(connectionKey)) {
                    continue;
                }

                // Получаем исходные позиции узлов
                const fromPosition = {
                    x: fromNode.position_x,
                    y: fromNode.position_y,
                };
                const toPosition = {
                    x: toNode.position_x,
                    y: toNode.position_y,
                };

                const fromCanvasPos = mapToCanvas(
                    fromPosition.x,
                    fromPosition.y
                );
                const toCanvasPos = mapToCanvas(toPosition.x, toPosition.y);

                // Адаптивная толщина линии в зависимости от масштаба
                const lineWidth = Math.max(2, Math.min(4, 2.5 * scale));

                // Проверяем, является ли соединение двунаправленным
                const isBidirectional = isBidirectionalConnection(
                    connection.from_id,
                    connection.to_id
                );

                // Определяем стиль линии в зависимости от типа соединения
                if (isBidirectional) {
                    // Двустороннее соединение - сплошная красная линия
                    ctx.beginPath();
                    ctx.strokeStyle = "#b91c1c"; // Темно-красный
                    ctx.lineWidth = lineWidth;
                    ctx.setLineDash([]); // Сплошная линия
                    ctx.moveTo(fromCanvasPos.x, fromCanvasPos.y);
                    ctx.lineTo(toCanvasPos.x, toCanvasPos.y);
                    ctx.stroke();
                } else {
                    // Одностороннее соединение - пунктирная линия
                    ctx.beginPath();
                    ctx.strokeStyle = "#b91c1c"; // Темно-красный
                    ctx.lineWidth = lineWidth;
                    ctx.setLineDash([5, 5]); // Пунктирная линия
                    ctx.moveTo(fromCanvasPos.x, fromCanvasPos.y);
                    ctx.lineTo(toCanvasPos.x, toCanvasPos.y);
                    ctx.stroke();
                }

                // Рисуем стрелку направления на линии только для однонаправленных соединений
                if (!isBidirectional) {
                    // Вычисляем точку для стрелки (3/4 пути от начала)
                    const arrowPosX =
                        fromCanvasPos.x +
                        (toCanvasPos.x - fromCanvasPos.x) * 0.75;
                    const arrowPosY =
                        fromCanvasPos.y +
                        (toCanvasPos.y - fromCanvasPos.y) * 0.75;

                    // Размер стрелки зависит от масштаба
                    const arrowSize = 5 * scale;

                    // Вычисляем углы для стрелки
                    const arrowAngle = Math.atan2(
                        toCanvasPos.y - fromCanvasPos.y,
                        toCanvasPos.x - fromCanvasPos.x
                    );

                    ctx.save();
                    ctx.translate(arrowPosX, arrowPosY);
                    ctx.rotate(arrowAngle);

                    // Рисуем стрелку
                    ctx.fillStyle = "#b91c1c"; // Темно-красный
                    ctx.beginPath();
                    ctx.moveTo(arrowSize, 0);
                    ctx.lineTo(-arrowSize, arrowSize);
                    ctx.lineTo(-arrowSize, -arrowSize);
                    ctx.closePath();
                    ctx.fill();

                    ctx.restore();
                }

                // Отмечаем соединение как отрисованное
                drawnConnections.add(connectionKey);
            }
            ctx.restore();

            // Отрисовка локаций
            for (const node of nodes) {
                // Получаем позицию узла на канвасе
                const { x, y } = mapToCanvas(node.position_x, node.position_y);

                // Определяем размер и цвет узла
                const baseSize = 16 * scale; // Базовый размер

                // Увеличиваем размер для текущего или выбранного узла
                let nodeSize = baseSize;
                if (node.is_current) {
                    nodeSize = baseSize * 1.2;
                }
                if (node.id === hoveredNode?.id) {
                    nodeSize *= 1.1;
                }
                if (node.id === selectedNode?.id) {
                    nodeSize *= 1.2;
                }

                // Внешняя подсветка для узлов
                ctx.save();
                if (node.is_current) {
                    // Яркая подсветка для текущей локации
                    ctx.shadowColor = "rgba(185, 28, 28, 0.8)"; // Темно-красный
                    ctx.shadowBlur = 10 * scale;
                } else if (node.id === selectedNode?.id) {
                    // Подсветка для выбранной локации
                    ctx.shadowColor = "rgba(185, 28, 28, 0.6)"; // Темно-красный
                    ctx.shadowBlur = 8 * scale;
                } else if (node.id === hoveredNode?.id) {
                    // Подсветка для локации под курсором
                    ctx.shadowColor = "rgba(185, 28, 28, 0.4)"; // Темно-красный
                    ctx.shadowBlur = 6 * scale;
                }

                // Создаем градиент для заливки
                const gradient = ctx.createRadialGradient(
                    x,
                    y,
                    0,
                    x,
                    y,
                    nodeSize
                );

                // Выбираем цвета градиента в зависимости от типа узла
                if (node.is_current) {
                    // Текущая локация - яркий красный
                    gradient.addColorStop(0, "#ef4444"); // Красный
                    gradient.addColorStop(1, "#b91c1c"); // Темно-красный
                } else if (node.id === selectedNode?.id) {
                    // Выбранная локация - красный
                    gradient.addColorStop(0, "#dc2626"); // Красный
                    gradient.addColorStop(1, "#991b1b"); // Темно-красный
                } else if (node.is_accessible === false) {
                    // Недоступная локация - серая темная
                    gradient.addColorStop(0, "#4b5563"); // Серый (более темный)
                    gradient.addColorStop(1, "#1f2937"); // Темно-серый
                } else if (mapMode === "world" || node.type === "region") {
                    // Узел мировой карты (регион) - серый
                    gradient.addColorStop(0, "#6b7280"); // Серый
                    gradient.addColorStop(1, "#374151"); // Темно-серый
                } else {
                    // Обычная доступная локация - серая
                    gradient.addColorStop(0, "#6b7280"); // Серый
                    gradient.addColorStop(1, "#374151"); // Темно-серый
                }

                // Рисуем узел
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
                ctx.fill();

                // Добавляем обводку
                if (node.is_accessible === false) {
                    // Серая обводка для недоступных локаций
                    ctx.strokeStyle = "#6b7280";
                } else {
                    // Стандартная обводка для доступных локаций
                    ctx.strokeStyle = "#f8fafc";
                }
                ctx.lineWidth = 1.5 * scale;
                ctx.stroke();

                // Сбрасываем тень
                ctx.restore();

                // Рисуем название локации
                ctx.save();

                // Размер шрифта зависит от масштаба
                const fontSize = Math.max(12, 14 * scale);
                ctx.font = `${fontSize}px "Anticva", sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                // Добавляем тень для текста
                ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
                ctx.shadowBlur = 3;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;

                // Отображаем текст под локацией с учетом доступности
                if (node.is_accessible === false) {
                    ctx.fillStyle = "#9ca3af"; // Серый текст для недоступных локаций
                } else {
                    ctx.fillStyle = "#f1f5f9"; // Белый текст для доступных локаций
                }
                ctx.fillText(node.name, x, y + nodeSize + 15 * scale);

                ctx.restore();
            }
        };

        // Установка размеров canvas для соответствия размеру контейнера
        const resizeCanvas = () => {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                drawMap();
            }
        };

        // Создаем анимацию для движения пунктирных линий
        let animationId: number;

        const animate = () => {
            drawMap();
            animationId = requestAnimationFrame(animate);
        };

        // Запускаем анимационный цикл
        animationId = requestAnimationFrame(animate);

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
            const mapCoords = mapToCanvas(x, y);
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
                    // Устанавливаем выбранный узел и вызываем колбэк
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
            cancelAnimationFrame(animationId);
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
                        <div className="text-gray-300">
                            <div className="font-bold text-red-400 mb-1 font-anticva">
                                Легенда:
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-600 rounded-full mr-1"></div>
                                <span className="font-anticva">
                                    Выделенная точка
                                </span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-gray-600 rounded-full mr-1"></div>
                                <span className="font-anticva">
                                    Обычная точка
                                </span>
                            </div>
                            <div className="flex items-center mt-1">
                                <div className="w-6 h-1 bg-red-600 mr-1"></div>
                                <span className="font-anticva">
                                    Двустороннее соединение
                                </span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-6 h-1 border-t-2 border-red-600 border-dashed mr-1"></div>
                                <span className="font-anticva">
                                    Одностороннее соединение
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default GameMap;
