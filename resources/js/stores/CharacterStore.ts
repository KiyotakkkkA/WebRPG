import { makeAutoObservable, runInAction } from "mobx";
import axios from "../config/axios";

interface Character {
    id: number;
    name: string;
    class: string;
    level: number;
    experience: number;
    exp_to_next_level: number;
    health: number;
    max_health: number;
    mana: number;
    max_mana: number;
    stamina: number;
    max_stamina: number;
    strength: number;
    agility: number;
    intelligence: number;
    speed: number;
    vitality: number;
    luck: number;
    charisma: number;
    wisdom: number;
    dexterity: number;
    constitution: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

class CharacterStore {
    characters: Character[] = [];
    selectedCharacter: Character | null = null;
    isLoading: boolean = false;
    error: string | null = null;
    maxCharacters: number = 3; // Максимальное количество персонажей по умолчанию
    remainingSlots: number = 3; // Оставшиеся слоты по умолчанию
    canCreateMore: boolean = true; // Флаг возможности создания новых персонажей

    constructor() {
        makeAutoObservable(this);
    }

    // Загрузить всех персонажей пользователя
    async loadCharacters() {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await axios.get("/api/characters");
            runInAction(() => {
                this.characters = response.data.characters;
                this.maxCharacters = response.data.max_characters;
                this.remainingSlots = response.data.remaining_slots;
                this.canCreateMore = response.data.can_create_more;
            });
        } catch (error: any) {
            runInAction(() => {
                this.error =
                    error.response?.data?.message ||
                    "Ошибка загрузки персонажей";
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Создать нового персонажа
    async createCharacter(name: string, characterClass: string) {
        this.isLoading = true;
        this.error = null;

        // Проверка на лимит персонажей
        if (!this.canCreateMore) {
            runInAction(() => {
                this.error = `Вы достигли максимального количества персонажей (${this.maxCharacters})`;
                this.isLoading = false;
            });
            return null;
        }

        try {
            const response = await axios.post("/api/characters", {
                name,
                class: characterClass,
            });

            runInAction(() => {
                this.characters.push(response.data.character);
                this.selectedCharacter = response.data.character;
                this.remainingSlots = response.data.remaining_slots;
                this.canCreateMore = this.remainingSlots > 0;
            });

            return response.data.character;
        } catch (error: any) {
            runInAction(() => {
                this.error =
                    error.response?.data?.message ||
                    "Ошибка создания персонажа";
            });
            return null;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Получить информацию о конкретном персонаже
    async loadCharacter(id: number) {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await axios.get(`/api/characters/${id}`);
            runInAction(() => {
                this.selectedCharacter = response.data.character;
            });
        } catch (error: any) {
            runInAction(() => {
                this.error =
                    error.response?.data?.message ||
                    "Ошибка загрузки персонажа";
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Обновить персонажа
    async updateCharacter(id: number, name: string) {
        this.isLoading = true;
        this.error = null;

        try {
            const response = await axios.put(`/api/characters/${id}`, {
                name,
            });

            runInAction(() => {
                this.characters = this.characters.map((character) =>
                    character.id === id ? response.data.character : character
                );

                if (this.selectedCharacter?.id === id) {
                    this.selectedCharacter = response.data.character;
                }
            });
        } catch (error: any) {
            runInAction(() => {
                this.error =
                    error.response?.data?.message ||
                    "Ошибка обновления персонажа";
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Удалить персонажа
    async deleteCharacter(id: number) {
        this.isLoading = true;
        this.error = null;

        try {
            await axios.delete(`/api/characters/${id}`);

            runInAction(() => {
                this.characters = this.characters.filter(
                    (character) => character.id !== id
                );

                if (this.selectedCharacter?.id === id) {
                    this.selectedCharacter = null;
                }

                // Обновляем счетчики после удаления
                this.remainingSlots += 1;
                this.canCreateMore = true;
            });

            return true;
        } catch (error: any) {
            runInAction(() => {
                this.error =
                    error.response?.data?.message ||
                    "Ошибка удаления персонажа";
            });
            return false;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Выбрать персонажа
    selectCharacter(character: Character) {
        this.selectedCharacter = character;
    }

    // Сбросить выбранного персонажа
    resetSelectedCharacter() {
        this.selectedCharacter = null;
    }

    // Сбросить ошибку
    resetError() {
        this.error = null;
    }
}

const characterStore = new CharacterStore();
export default characterStore;
