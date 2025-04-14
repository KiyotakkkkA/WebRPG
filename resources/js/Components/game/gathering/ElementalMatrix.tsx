import React, { useState, useEffect, useMemo } from "react";
import { useElements } from "../../../hooks/useElements";
import Spinner from "../../ui/Spinner";
import { ElementType } from "../../../stores/ResourceStore";

interface ElementalMatrixProps {
    // Делаем параметр elements опциональным, так как теперь можем загружать данные с сервера
    elements?: ElementType[];
    selectedElements: string[];
    onElementToggle: (elementId: string) => void;
    matrixSize?: number; // размер матрицы в px
    useLocalElements?: boolean; // флаг для использования локальных элементов вместо загрузки с сервера
}

const ElementalMatrix: React.FC<ElementalMatrixProps> = ({
    elements: providedElements,
    selectedElements,
    onElementToggle,
    matrixSize = 280,
    useLocalElements = false,
}) => {
    // Добавим новый хук для генерации уникального ID для SVG элементов
    const matrixId = useMemo(
        () => `matrix-${Math.random().toString(36).substring(2, 9)}`,
        []
    );

    // Загружаем элементы с сервера через React Query
    const { data: remoteElements, isLoading, error } = useElements();

    // Используем либо переданные элементы, либо загруженные с сервера
    const elements = useMemo(() => {
        return useLocalElements ? providedElements || [] : remoteElements || [];
    }, [useLocalElements, providedElements, remoteElements]);

    // Создаем эффект перемещения рун
    const [runeElements, setRuneElements] = useState<
        {
            id: number;
            character: string;
            x: number;
            y: number;
            size: number;
            speed: number;
            opacity: number;
            rotation: number;
            glowIntensity: number; // Добавляем свечение для рун
            glowColor: string; // Цвет свечения
        }[]
    >([]);

    // Пульсация центральной точки
    const [centerPulse, setCenterPulse] = useState(1);

    // Эффект искр вокруг матрицы
    const [sparks, setSparks] = useState<
        {
            id: number;
            x: number;
            y: number;
            size: number;
            speed: number;
            life: number;
            maxLife: number;
            color: string;
        }[]
    >([]);

    // Аморфные волны, расходящиеся от центра
    const [waves, setWaves] = useState<
        {
            id: number;
            scale: number;
            opacity: number;
            speed: number;
            life: number;
            maxLife: number;
            color: string;
        }[]
    >([]);

    // Инициализация случайных рун
    useEffect(() => {
        const runeChars = [
            "ᚠ",
            "ᚢ",
            "ᚦ",
            "ᚨ",
            "ᚱ",
            "ᚲ",
            "ᚷ",
            "ᚹ",
            "ᚺ",
            "ᚾ",
            "ᛁ",
            "ᛃ",
            "ᛇ",
            "ᛈ",
            "ᛉ",
            "ᛊ",
            "ᛏ",
            "ᛒ",
            "ᛖ",
            "ᛗ",
            "ᛚ",
            "ᛜ",
            "ᛞ",
            "ᛟ",
            "ᛥ",
            "ᛦ",
            "ᛧ",
            "ᛨ",
            "ᛩ",
            "ᛪ",
            "ᛮ",
            "ᛯ",
            "ᛰ",
            "ᛱ",
            "ᛲ",
            "ᛳ",
            "ᛴ",
            "ᛵ",
            "ᛶ",
            "ᛷ",
            "ᛸ",
            // Добавляем еще старшие руны Футарка
            "ᚫ",
            "ᚪ",
            "ᚣ",
            "ᚳ",
            "ᚸ",
            "ᛄ",
            "ᛅ",
            "ᛆ",
            // Добавляем руны Футорка
            "ᚴ",
            "ᚵ",
            "ᚶ",
            "ᚼ",
            "ᚿ",
        ];

        // Цвета свечения для рун
        const glowColors = [
            "#7f1d1d", // red-900
            "#991b1b", // red-800
            "#b91c1c", // red-700
            "#7f1d4d", // темно-красный с фиолетовым оттенком
            "#4a1d7f", // фиолетовый с синим оттенком
            "#1d3c7f", // темно-синий
            "#5c1e7f", // насыщенный фиолетовый
            "#801e5c", // пурпурный
        ];

        // Создаем руны с различными параметрами анимации (увеличиваем количество)
        const runes = Array.from({ length: 40 }, (_, i) => ({
            id: i,
            character: runeChars[Math.floor(Math.random() * runeChars.length)],
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 20 + 12,
            speed: Math.random() * 0.6 + 0.2, // Увеличиваем скорость
            opacity: Math.random() * 0.4 + 0.1, // Увеличиваем непрозрачность
            rotation: Math.random() * 360,
            glowIntensity: Math.random() * 4 + 1, // Увеличиваем интенсивность свечения
            glowColor:
                glowColors[Math.floor(Math.random() * glowColors.length)],
        }));

        setRuneElements(runes);

        // Создаем начальные искры
        createSparks(8);

        // Создаем начальные волны
        createWaves(3);
    }, []);

    // Создание искр
    const createSparks = (count: number) => {
        const sparkColors = [
            "rgba(255, 60, 60, 0.8)", // красный
            "rgba(255, 100, 40, 0.8)", // оранжевый
            "rgba(200, 60, 120, 0.8)", // розовый
            "rgba(130, 40, 200, 0.8)", // фиолетовый
        ];

        const newSparks = Array.from({ length: count }, (_, i) => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 48 + Math.random() * 5; // искры вокруг границы матрицы

            return {
                id: Date.now() + i,
                x: 50 + Math.cos(angle) * distance, // от центра
                y: 50 + Math.sin(angle) * distance,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.8 + 0.2,
                life: Math.random() * 100, // текущее время жизни
                maxLife: Math.random() * 100 + 50, // максимальное время жизни
                color: sparkColors[
                    Math.floor(Math.random() * sparkColors.length)
                ],
            };
        });

        setSparks((prev) => [...prev, ...newSparks]);
    };

    // Функция создания волн
    const createWaves = (count: number) => {
        const waveColors = [
            "rgba(185, 28, 28, 0.2)", // red-700
            "rgba(155, 40, 40, 0.15)", // темно-красный
            "rgba(200, 50, 50, 0.2)", // красный
            "rgba(170, 30, 100, 0.15)", // красно-фиолетовый
            "rgba(130, 20, 170, 0.1)", // фиолетовый
        ];

        const newWaves = Array.from({ length: count }, (_, i) => ({
            id: Date.now() + i,
            scale: 0.1, // начальный размер волны
            opacity: 0.8, // начальная непрозрачность
            speed: Math.random() * 0.01 + 0.003, // скорость расширения
            life: 0, // текущее время жизни
            maxLife: Math.random() * 200 + 100, // максимальное время жизни
            color: waveColors[Math.floor(Math.random() * waveColors.length)],
        }));

        setWaves((prev) => [...prev, ...newWaves]);
    };

    // Анимация движения рун, искр и пульсация центра
    useEffect(() => {
        // Анимация рун
        const runeAnimationInterval = setInterval(() => {
            setRuneElements((prev) =>
                prev.map((rune) => ({
                    ...rune,
                    y: rune.y > 100 ? -10 : rune.y + rune.speed,
                    rotation: (rune.rotation + Math.random() * 0.8) % 360,
                }))
            );
        }, 100);

        // Пульсация центральной точки
        const centerPulseInterval = setInterval(() => {
            setCenterPulse((prev) => (prev > 1.2 ? 1 : prev + 0.02));
        }, 50);

        // Обновление искр
        const sparksInterval = setInterval(() => {
            setSparks((prev) => {
                // Обновляем существующие искры
                const updated = prev
                    .map((spark) => ({
                        ...spark,
                        life: spark.life + spark.speed,
                    }))
                    .filter((spark) => spark.life < spark.maxLife);

                // Создаем новые искры
                if (updated.length < 8 && Math.random() > 0.7) {
                    createSparks(Math.floor(Math.random() * 3) + 1);
                }

                return updated;
            });
        }, 30);

        // Обновление волн
        const wavesInterval = setInterval(() => {
            setWaves((prev) => {
                // Обновляем существующие волны
                const updated = prev
                    .map((wave) => ({
                        ...wave,
                        scale: wave.scale + wave.speed,
                        opacity: Math.max(0, 0.8 - wave.life / wave.maxLife),
                        life: wave.life + 1,
                    }))
                    .filter((wave) => wave.life < wave.maxLife);

                // Создаем новые волны
                if (updated.length < 5 && Math.random() > 0.95) {
                    createWaves(1);
                }

                return updated;
            });
        }, 50);

        return () => {
            clearInterval(runeAnimationInterval);
            clearInterval(centerPulseInterval);
            clearInterval(sparksInterval);
            clearInterval(wavesInterval);
        };
    }, []);

    // Расчет позиций элементов в зависимости от их количества
    const calculateElementPositions = useMemo(() => {
        return (elementsCount: number, radius: number) => {
            const positions = [];
            const centerX = 50; // центр в процентах
            const centerY = 50; // центр в процентах

            for (let i = 0; i < elementsCount; i++) {
                // Для распределения элементов по окружности
                const angle = (i / elementsCount) * Math.PI * 2;
                // Рассчитываем позицию в процентах от размера контейнера
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);

                // Сохраняем угол для использования в стилях линии
                positions.push({
                    x,
                    y,
                    angle,
                    // Длина линии в процентах от центра до элемента
                    length: radius,
                });
            }

            return positions;
        };
    }, []);

    // Вычисляем позиции элементов на матрице
    const positions = useMemo(() => {
        return calculateElementPositions(elements.length, 38);
    }, [calculateElementPositions, elements.length]);

    // Готовим проверенные элементы для отрисовки линий
    // Нормализуем элементы для корректной проверки
    const normalizedSelectedElements = useMemo(() => {
        return selectedElements.map((el) => String(el));
    }, [selectedElements]);

    // Если загружаем элементы с сервера и данные еще не получены
    if (!useLocalElements && isLoading) {
        return (
            <div
                className="flex items-center justify-center"
                style={{ width: matrixSize, height: matrixSize }}
            >
                <Spinner size="lg" />
            </div>
        );
    }

    // Отображаем ошибку, если что-то пошло не так
    if (!useLocalElements && error) {
        return (
            <div
                className="flex items-center justify-center text-red-500 text-center p-4"
                style={{ width: matrixSize, height: matrixSize }}
            >
                Не удалось загрузить элементы
            </div>
        );
    }

    // Если нет элементов для отображения
    if (elements.length === 0) {
        return (
            <div
                className="flex items-center justify-center text-gray-400 text-center p-4"
                style={{ width: matrixSize, height: matrixSize }}
            >
                Нет доступных элементов
            </div>
        );
    }

    return (
        <div
            className="relative"
            style={{ width: matrixSize, height: matrixSize }}
        >
            {/* Фон рунической матрицы */}
            <div
                className="absolute inset-0 rounded-full border-2 border-red-900/50 overflow-hidden"
                style={{
                    boxShadow: `0 0 20px rgba(155, 40, 40, 0.6) inset,
                                0 0 40px rgba(155, 40, 40, 0.2)`,
                    background: `radial-gradient(circle,
                                rgba(30,30,35,0.9) 0%,
                                rgba(15,15,20,0.95) 85%,
                                rgba(10,10,15,1) 100%)`,
                }}
            >
                {/* Свечение вокруг матрицы */}
                <div
                    className="absolute inset-0 z-0 rounded-full"
                    style={{
                        background: `radial-gradient(circle,
                                    rgba(155, 40, 40, 0.1) 0%,
                                    rgba(155, 40, 40, 0.05) 70%,
                                    rgba(155, 40, 40, 0) 100%)`,
                        animation: "pulse 4s infinite alternate",
                    }}
                />

                {/* Аморфные волны от центра */}
                {waves.map((wave) => (
                    <div
                        key={wave.id}
                        className="absolute rounded-full"
                        style={{
                            left: "50%",
                            top: "50%",
                            width: "100%",
                            height: "100%",
                            transform: `translate(-50%, -50%) scale(${wave.scale})`,
                            opacity: wave.opacity,
                            background: `radial-gradient(circle, ${wave.color} 0%, rgba(155, 40, 40, 0.01) 70%, transparent 100%)`,
                            filter: "blur(4px)",
                            zIndex: 5,
                            transition:
                                "transform 0.1s linear, opacity 0.1s linear",
                        }}
                    />
                ))}

                {/* Движущиеся руны */}
                {runeElements.map((rune) => (
                    <div
                        key={rune.id}
                        className="absolute select-none pointer-events-none font-norse"
                        style={{
                            left: `${rune.x}%`,
                            top: `${rune.y}%`,
                            fontSize: `${rune.size}px`,
                            opacity: rune.opacity,
                            transform: `rotate(${rune.rotation}deg)`,
                            transition: "transform 1s ease-out",
                            color: "rgba(155, 40, 40, 0.4)",
                            textShadow: `0 0 ${rune.glowIntensity}px ${rune.glowColor}`,
                        }}
                    >
                        {rune.character}
                    </div>
                ))}

                {/* Искры вокруг матрицы */}
                {sparks.map((spark) => (
                    <div
                        key={spark.id}
                        className="absolute rounded-full"
                        style={{
                            left: `${spark.x}%`,
                            top: `${spark.y}%`,
                            width: `${spark.size}px`,
                            height: `${spark.size}px`,
                            opacity: 1 - spark.life / spark.maxLife, // Постепенно исчезают
                            background: spark.color,
                            boxShadow: `0 0 ${spark.size * 2}px ${spark.color}`,
                        }}
                    />
                ))}

                {/* НОВАЯ РЕАЛИЗАЦИЯ: линии к элементам с использованием CSS */}
                {elements.map((element, index) => {
                    const position = positions[index];
                    const normalizedId = String(element.id);
                    const isSelected =
                        normalizedSelectedElements.includes(normalizedId);

                    if (!isSelected) return null;

                    // Рассчитываем угол поворота линии в градусах
                    const rotationDeg = (position.angle * 180) / Math.PI;

                    // Длина линии в процентах от ширины контейнера
                    const lineLength = position.length;

                    return (
                        <div
                            key={`line-${normalizedId}`}
                            className="absolute pointer-events-none"
                            style={{
                                left: "50%",
                                top: "50%",
                                width: `${lineLength}%`, // Длина линии
                                height: "2px", // Толщина линии
                                transform: `rotate(${rotationDeg}deg)`, // Поворачиваем линию
                                transformOrigin: "left center", // Точка поворота - левый центр
                                background:
                                    "linear-gradient(90deg, rgba(155, 40, 40, 0.9), rgba(255, 70, 70, 0.8), rgba(155, 40, 40, 0.9))",
                                boxShadow: "0 0 8px rgba(255, 70, 70, 0.6)", // Свечение
                                zIndex: 10,
                            }}
                        >
                            {/* Анимированные точки на линии для эффекта движения */}
                            <div className="absolute inset-0 overflow-hidden">
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage:
                                            "linear-gradient(90deg, transparent 50%, rgba(255, 70, 70, 0.8) 50%)",
                                        backgroundSize: "8px 2px",
                                        animation:
                                            "dashMove 30s linear infinite",
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}

                {/* Центральная точка с пульсацией */}
                <div
                    className="absolute rounded-full bg-red-600"
                    style={{
                        left: "50%",
                        top: "50%",
                        width: "16px",
                        height: "16px",
                        marginLeft: "-8px",
                        marginTop: "-8px",
                        transform: `scale(${centerPulse})`,
                        boxShadow: `0 0 10px #b91c1c,
                                   0 0 20px rgba(185, 28, 28, 0.5)`,
                        zIndex: 20,
                        transition: "transform 0.1s ease-out",
                    }}
                ></div>
            </div>

            {/* Элементы на матрице */}
            {elements.map((element, index) => {
                const position = positions[index];
                const normalizedId = String(element.id);
                const isSelected =
                    normalizedSelectedElements.includes(normalizedId);

                return (
                    <button
                        key={element.id}
                        className={`absolute flex items-center justify-center rounded-full w-12 h-12
                                   transition-all duration-300 cursor-pointer z-30
                                   ${
                                       isSelected
                                           ? "bg-gray-900 border-2 border-red-500 shadow-lg shadow-red-900/50"
                                           : "bg-gray-900/80 border border-gray-700 hover:border-gray-600"
                                   }
                                   hover:bg-gray-800`}
                        style={{
                            left: `${position.x}%`,
                            top: `${position.y}%`,
                            transform: "translate(-50%, -50%)",
                            boxShadow: isSelected
                                ? "0 0 15px rgba(185, 28, 28, 0.7)"
                                : "0 0 5px rgba(60, 60, 70, 0.5)",
                        }}
                        onClick={() => onElementToggle(normalizedId)}
                    >
                        <span className="text-xl relative">
                            {element.icon}
                            {isSelected && (
                                <span
                                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"
                                    style={{
                                        animation: "elementPulse 1.5s infinite",
                                    }}
                                ></span>
                            )}
                        </span>
                    </button>
                );
            })}

            {/* CSS для анимаций */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes pulse {
                        0% { opacity: 0.7; }
                        100% { opacity: 1; }
                    }

                    @keyframes dashMove {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }

                    @keyframes elementPulse {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.5); opacity: 0.7; }
                        100% { transform: scale(1); opacity: 1; }
                    }

                    @keyframes waveExpand {
                        0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
                        90% { opacity: 0.1; }
                        100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
                    }
                `,
                }}
            />
        </div>
    );
};

export default ElementalMatrix;
