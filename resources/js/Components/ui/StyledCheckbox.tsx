import React, { InputHTMLAttributes } from "react";

interface StyledCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
    label: React.ReactNode;
}

const StyledCheckbox: React.FC<StyledCheckboxProps> = ({
    id,
    label,
    checked,
    onChange,
    required,
    ...props
}) => {
    return (
        <div className="flex items-center">
            <div className="relative flex items-center">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="h-4 w-4 appearance-none bg-gray-900 border border-red-900/50 rounded focus:ring-1 focus:ring-red-700 focus:outline-none relative z-10"
                    required={required}
                    {...props}
                />
                <div className="absolute top-0 left-0 h-full w-full pointer-events-none flex items-center justify-center z-20">
                    {checked && (
                        <>
                            <div className="absolute inset-0 bg-red-600 rounded"></div>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-3 w-3 text-white relative"
                            >
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </>
                    )}
                </div>
                <div className="absolute inset-0 bg-red-900/10 rounded-sm transform scale-0 transition-transform duration-200 ease-in-out group-checked:scale-100"></div>
            </div>
            <label htmlFor={id} className="ml-2 block text-sm text-gray-400">
                {label}
            </label>
        </div>
    );
};

export default StyledCheckbox;
