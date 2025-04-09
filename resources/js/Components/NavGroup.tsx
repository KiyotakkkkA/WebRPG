import React, { useState } from "react";

interface NavGroupProps {
    title: string;
    icon?: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

const NavGroup: React.FC<NavGroupProps> = ({
    title,
    icon,
    defaultOpen = false,
    children,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="mb-2">
            <button
                onClick={toggleOpen}
                className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-300 hover:text-red-400 bg-gray-800/50 hover:bg-gray-800 transition-colors duration-200 rounded-md group"
            >
                <div className="flex items-center">
                    {icon && <span className="mr-3">{icon}</span>}
                    <span className="font-medieval">{title}</span>
                </div>
                <svg
                    className={`w-5 h-5 transition-transform duration-200 ${
                        isOpen ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen
                        ? "max-h-[1000px] opacity-100 mt-2"
                        : "max-h-0 opacity-0"
                }`}
            >
                <div className="pl-4 border-l border-gray-700/50 ml-4 space-y-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default NavGroup;
