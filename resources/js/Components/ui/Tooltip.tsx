import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    theme?: "dark" | "light";
}

const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = "top",
    theme = "dark",
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const childRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible && childRef.current) {
            const childRect = childRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current?.getBoundingClientRect();
            const tooltipWidth = tooltipRect?.width || 200;
            const tooltipHeight = tooltipRect?.height || 100;

            let top = 0;
            let left = 0;

            // Рассчитываем позицию в зависимости от выбранной стороны
            switch (position) {
                case "top":
                    top = childRect.top - tooltipHeight - 10;
                    left =
                        childRect.left + childRect.width / 2 - tooltipWidth / 2;
                    break;
                case "bottom":
                    top = childRect.bottom + 10;
                    left =
                        childRect.left + childRect.width / 2 - tooltipWidth / 2;
                    break;
                case "left":
                    top =
                        childRect.top +
                        childRect.height / 2 -
                        tooltipHeight / 2;
                    left = childRect.left - tooltipWidth - 10;
                    break;
                case "right":
                    top =
                        childRect.top +
                        childRect.height / 2 -
                        tooltipHeight / 2;
                    left = childRect.right + 10;
                    break;
            }

            // Проверяем, что тултип не выходит за границы экрана
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // Корректируем по горизонтали
            if (left < 10) left = 10;
            if (left + tooltipWidth > windowWidth - 10) {
                left = windowWidth - tooltipWidth - 10;
            }

            // Корректируем по вертикали
            if (top < 10) top = 10;
            if (top + tooltipHeight > windowHeight - 10) {
                top = windowHeight - tooltipHeight - 10;
            }

            setTooltipPosition({ top, left });
        }
    }, [isVisible, position]);

    // Классы темы
    const themeClasses = {
        dark: "bg-gray-900 text-stone-200 border border-red-900/40",
        light: "bg-stone-200 text-gray-900 border border-red-900/40",
    };

    const handleMouseEnter = () => {
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    return (
        <div
            ref={childRef}
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {isVisible &&
                createPortal(
                    <div
                        ref={tooltipRef}
                        className={`fixed z-[9999] px-3 py-2 text-sm rounded-md shadow-xl max-w-xs w-max animate-fade-in ${themeClasses[theme]}`}
                        style={{
                            top: `${tooltipPosition.top}px`,
                            left: `${tooltipPosition.left}px`,
                        }}
                    >
                        {content}
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default Tooltip;
