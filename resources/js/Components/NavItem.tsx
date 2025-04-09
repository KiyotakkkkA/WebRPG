import React from "react";

interface NavItemProps {
    title: string;
    icon?: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
    title,
    icon,
    active = false,
    onClick,
}) => {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center px-4 py-2 text-left rounded-md transition-colors duration-200
                ${
                    active
                        ? "bg-red-900/30 text-red-400 border-l-2 border-red-600"
                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
                }
            `}
        >
            {icon && <span className="mr-3">{icon}</span>}
            <span className={active ? "font-medium" : ""}>{title}</span>
        </button>
    );
};

export default NavItem;
