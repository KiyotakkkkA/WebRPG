import React from "react";
import { Link } from "react-router-dom";

type ButtonVariant = "primary" | "secondary" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    to?: string; // Для использования с Link из react-router-dom
    href?: string; // Для обычных ссылок <a>
    className?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = "primary",
    size = "md",
    to,
    href,
    className = "",
    onClick,
    disabled = false,
    fullWidth = false,
}) => {
    const baseClasses =
        "inline-flex items-center justify-center font-medium transition-all duration-200 relative overflow-hidden group";

    const variantClasses = {
        primary:
            "bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-gray-200 border border-red-700 shadow-md hover:shadow-red-900/30",
        secondary:
            "bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-red-400 hover:text-red-300 border border-red-800/30 hover:border-red-700/50 shadow-md hover:shadow-gray-800/30",
        danger: "bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-gray-200 border border-red-600 shadow-md hover:shadow-red-700/30",
        success:
            "bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800 text-gray-200 border border-green-700 shadow-md hover:shadow-green-800/30",
    };

    const sizeClasses = {
        sm: "text-xs py-1.5 px-3 rounded",
        md: "text-sm py-2 px-4 rounded-md",
        lg: "text-base py-2.5 px-5 rounded-md",
    };

    const disabledClasses = disabled
        ? "opacity-50 cursor-not-allowed pointer-events-none"
        : "";

    const widthClasses = fullWidth ? "w-full" : "";

    // Декоративные элементы для средневекового стиля
    const decorativeElements = (
        <>
            <span className="absolute top-0 left-0 h-1 w-1 bg-white/20 rounded-tr-sm"></span>
            <span className="absolute top-0 right-0 h-1 w-1 bg-white/20 rounded-tl-sm"></span>
            <span className="absolute bottom-0 left-0 h-1 w-1 bg-white/20 rounded-br-sm"></span>
            <span className="absolute bottom-0 right-0 h-1 w-1 bg-white/20 rounded-bl-sm"></span>
        </>
    );

    // Рябь при клике (эффект ripple)
    const rippleEffect = !disabled && (
        <span className="absolute w-0 h-0 transition-all duration-300 ease-out bg-white/10 rounded-full group-active:w-[200%] group-active:h-[200%] -z-10"></span>
    );

    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${widthClasses} ${className}`;

    // Рендер в зависимости от типа (кнопка, внутренняя ссылка, внешняя ссылка)
    if (to) {
        return (
            <Link to={to} className={buttonClasses}>
                {children}
                {decorativeElements}
                {rippleEffect}
            </Link>
        );
    }

    if (href) {
        return (
            <a
                href={href}
                className={buttonClasses}
                target="_blank"
                rel="noopener noreferrer"
            >
                {children}
                {decorativeElements}
                {rippleEffect}
            </a>
        );
    }

    return (
        <button onClick={onClick} disabled={disabled} className={buttonClasses}>
            {children}
            {decorativeElements}
            {rippleEffect}
        </button>
    );
};

export default Button;
