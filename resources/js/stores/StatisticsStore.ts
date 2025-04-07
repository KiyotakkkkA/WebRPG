import { makeAutoObservable, runInAction } from "mobx";
import axios from "axios";

interface GameStatistics {
    users_count: string;
    characters_count: string;
}

class StatisticsStore {
    statistics: GameStatistics | null = null;
    isLoading: boolean = false;
    error: string | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    // Загрузить статистику
    async loadStatistics() {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await axios.get("/api/statistics");

            runInAction(() => {
                this.statistics = response.data;
                this.isLoading = false;
            });

            return true;
        } catch (error) {
            runInAction(() => {
                this.error = "Не удалось загрузить статистику";
                this.isLoading = false;
            });

            return false;
        }
    }

    // Сбросить ошибку
    resetError() {
        this.error = null;
    }
}

// Создаем инстанс стора
const statisticsStore = new StatisticsStore();
export default statisticsStore;
