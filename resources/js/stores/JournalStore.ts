import { makeAutoObservable } from "mobx";

export interface JournalEntry {
    id: string;
    text: string;
    timestamp: number;
    type: "system" | "location" | "item" | "combat" | "quest" | "error";
}

class JournalStore {
    entries: JournalEntry[] = [];
    maxEntries: number = 100; // Максимальное количество записей для хранения

    constructor() {
        makeAutoObservable(this);
        this.loadFromLocalStorage();
    }

    // Добавить новую запись в журнал
    addEntry(
        text: string,
        type:
            | "system"
            | "location"
            | "item"
            | "combat"
            | "quest"
            | "error" = "system"
    ) {
        const entry: JournalEntry = {
            id: `entry_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            text,
            timestamp: Date.now(),
            type,
        };

        // Добавляем запись в начало массива
        this.entries = [entry, ...this.entries];

        // Ограничиваем количество записей
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(0, this.maxEntries);
        }

        // Сохраняем в localStorage
        this.saveToLocalStorage();

        return entry;
    }

    // Очистить весь журнал
    clearJournal() {
        this.entries = [];
        this.saveToLocalStorage();
    }

    // Удалить определенную запись по ID
    removeEntry(id: string) {
        this.entries = this.entries.filter((entry) => entry.id !== id);
        this.saveToLocalStorage();
    }

    // Загрузить журнал из localStorage
    private loadFromLocalStorage() {
        try {
            const savedJournal = localStorage.getItem("game_journal");
            if (savedJournal) {
                this.entries = JSON.parse(savedJournal);
            }
        } catch (error) {
            console.error("Ошибка при загрузке журнала:", error);
            this.entries = [];
        }
    }

    // Сохранить журнал в localStorage
    private saveToLocalStorage() {
        try {
            localStorage.setItem("game_journal", JSON.stringify(this.entries));
        } catch (error) {
            console.error("Ошибка при сохранении журнала:", error);
        }
    }

    // Получить последние N записей
    getLastEntries(count: number = 10) {
        return this.entries.slice(0, count);
    }

    // Получить записи определенного типа
    getEntriesByType(type: JournalEntry["type"]) {
        return this.entries.filter((entry) => entry.type === type);
    }

    // Отформатировать время записи
    formatEntryTime(timestamp: number): string {
        const date = new Date(timestamp);
        return `${date.getHours().toString().padStart(2, "0")}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
    }
}

const journalStore = new JournalStore();
export default journalStore;
