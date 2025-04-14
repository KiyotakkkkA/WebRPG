import React, { useState, useEffect, Children } from "react";

type TabItem = {
    id: string;
    label: string;
};

interface TabsProps {
    tabs: TabItem[];
    defaultTab?: string;
    children: React.ReactNode;
    className?: string;
}

interface TabPanelProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({
    children,
    id,
    className = "",
}) => {
    return (
        <div className={`tab-panel ${className}`} data-tab-id={id}>
            {children}
        </div>
    );
};

export const Tabs: React.FC<TabsProps> = ({
    tabs,
    defaultTab,
    children,
    className = "",
}) => {
    const [activeTab, setActiveTab] = useState<string>(
        defaultTab || (tabs.length > 0 ? tabs[0].id : "")
    );

    // Устанавливаем активную вкладку при изменении пропсов
    useEffect(() => {
        if (defaultTab) {
            setActiveTab(defaultTab);
        } else if (
            tabs.length > 0 &&
            !tabs.find((tab) => tab.id === activeTab)
        ) {
            setActiveTab(tabs[0].id);
        }
    }, [defaultTab, tabs]);

    // Фильтруем детей, чтобы показать только активную панель
    const childrenArray = Children.toArray(children) as React.ReactElement[];
    const activePanel = childrenArray.find(
        (child) => child.props.id === activeTab
    );

    return (
        <div className={`tabs ${className}`}>
            <div className="border-b border-gray-700 flex gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`px-4 py-2 text-sm font-medium rounded-t-md focus:outline-none ${
                            activeTab === tab.id
                                ? "text-white border-b-2 border-red-500"
                                : "text-gray-400 hover:text-gray-300"
                        }`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="pt-4">{activePanel}</div>
        </div>
    );
};
