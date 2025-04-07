import React, { InputHTMLAttributes, useState } from "react";

interface StyledInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: string;
    error?: string;
    showLeftBorder?: boolean;
}

const StyledInput: React.FC<StyledInputProps> = ({
    label,
    icon = "👤",
    error,
    showLeftBorder = true,
    id,
    type = "text",
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    // Определяем актуальный тип поля на основе состояния showPassword
    const actualType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div className="mb-4">
            <label
                htmlFor={id}
                className="block text-sm font-medium text-gray-300 mb-1"
            >
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={actualType}
                    className={`
                        w-full bg-gray-900/80 border border-red-900/30 text-gray-200
                        rounded-md pl-12 ${isPassword ? "pr-10" : "pr-4"} py-2
                        focus:outline-none focus:ring-1 focus:ring-red-700/50 focus:border-red-700/50
                    `}
                    {...props}
                />
                <div className="absolute inset-y-0 left-3 flex items-center">
                    <span className="text-red-600 mr-2">{icon}</span>
                </div>
                {showLeftBorder && (
                    <div className="absolute inset-y-0 pl-8 pr-3 py-2 pointer-events-none">
                        <div className="w-full h-full border-l border-red-900/20"></div>
                    </div>
                )}

                {/* Иконка для показа/скрытия пароля */}
                {isPassword && (
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                            // Иконка "закрытого глаза" (пароль видимый)
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-red-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                />
                            </svg>
                        ) : (
                            // Иконка "открытого глаза" (пароль скрытый)
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-red-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                            </svg>
                        )}
                    </button>
                )}
            </div>
            {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        </div>
    );
};

export default StyledInput;
