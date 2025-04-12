import React from "react";
import { JournalEntry } from "../../stores/JournalStore";

// Компонент для отображения отдельной записи в журнале
export const JournalEntryItem: React.FC<{ entry: JournalEntry }> = ({
    entry,
}) => {
    // Определяем стиль записи в зависимости от её типа
    const getEntryStyle = (type: JournalEntry["type"]) => {
        switch (type) {
            case "combat":
                return "text-red-400";
            case "item":
                return "text-yellow-400";
            case "quest":
                return "text-blue-400";
            case "location":
                return "text-green-400";
            case "error":
                return "text-red-500";
            case "system":
            default:
                return "text-gray-400";
        }
    };

    // Определяем иконку для типа записи
    const getEntryIcon = (type: JournalEntry["type"]) => {
        switch (type) {
            case "combat":
                return "⚔️";
            case "item":
                return "🎒";
            case "quest":
                return "📜";
            case "location":
                return "🏠";
            case "error":
                return "❌";
            case "system":
            default:
                return "ℹ️";
        }
    };

    // Функция для форматирования времени
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        return `${hours}:${minutes}:${seconds}`;
    };

    return (
        <div className={`mb-1 leading-tight ${getEntryStyle(entry.type)} flex`}>
            <span className="mr-1 w-5 flex-shrink-0 flex-grow-0">
                {getEntryIcon(entry.type)}
            </span>
            <span className="flex-grow">
                <span className="text-gray-500 text-opacity-70 mr-1">
                    [{formatTime(entry.timestamp)}]
                </span>{" "}
                {entry.text}
            </span>
        </div>
    );
};

// Основной компонент журнала
const JournalPanel: React.FC<{
    entries: JournalEntry[];
    onClear: () => void;
    onRefresh: () => void;
    entriesLimit?: number;
}> = ({ entries, onClear, onRefresh, entriesLimit = 15 }) => {
    // Показываем только ограниченное количество последних записей
    const displayedEntries = entries.slice(-entriesLimit);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-400 font-medieval">
                    Журнал событий:
                </div>
                <div className="flex space-x-1">
                    <button
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                        title="Обновить журнал"
                        onClick={onRefresh}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </button>
                    <button
                        className="text-xs text-gray-500 hover:text-red-400 transition-colors focus:outline-none"
                        title="Очистить журнал"
                        onClick={() => {
                            if (confirm("Очистить журнал событий?")) {
                                onClear();
                            }
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto text-xs bg-gray-900/70 p-2 rounded-md border border-red-900/30 game-panel">
                {displayedEntries.map((entry) => (
                    <JournalEntryItem key={entry.id} entry={entry} />
                ))}
                {entries.length === 0 && (
                    <div className="text-gray-600 text-center p-2">
                        Журнал событий пуст
                    </div>
                )}
            </div>
        </div>
    );
};

export default JournalPanel;
