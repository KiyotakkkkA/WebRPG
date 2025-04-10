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
    is_new: boolean;
    created_at: string;
    updated_at: string;
}

// Интерфейс для наград от боя
interface CombatRewards {
    experience: number;
    gold: number;
    items: string[];
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
            return this.characters;
        } catch (error: any) {
            runInAction(() => {
                this.error =
                    error.response?.data?.message ||
                    "Ошибка загрузки персонажей";
            });
            return [];
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
            // Обновляем CSRF-токен перед важными операциями, чтобы избежать ошибки 419
            try {
                // Запрашиваем новый CSRF-токен
                await axios.get("/sanctum/csrf-cookie");

                // Обновляем CSRF-токен в заголовках axios
                const csrfToken =
                    document.head
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute("content") || "";

                if (csrfToken) {
                    axios.defaults.headers.common["X-CSRF-TOKEN"] = csrfToken;
                }
            } catch (csrfError) {
                console.warn(
                    "Не удалось обновить CSRF-токен, продолжаем с текущим токеном:",
                    csrfError
                );
            }

            // Выполняем основной запрос на создание персонажа
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
                if (error.response?.status === 419) {
                    this.error =
                        "Истек срок действия сессии. Пожалуйста, обновите страницу и попробуйте снова.";
                } else {
                    this.error =
                        error.response?.data?.message ||
                        "Ошибка создания персонажа";
                }
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
        // Если персонаж уже загружен и его ID совпадает, не делаем повторный запрос
        if (
            this.selectedCharacter &&
            this.selectedCharacter.id === id &&
            !this.isLoading
        ) {
            return this.selectedCharacter;
        }

        this.isLoading = true;
        this.error = null;

        try {
            const response = await axios.get(`/api/characters/${id}`);
            runInAction(() => {
                this.selectedCharacter = response.data.character;
            });
            return response.data.character;
        } catch (error: any) {
            runInAction(() => {
                this.error =
                    error.response?.data?.message ||
                    "Ошибка загрузки персонажа";
            });
            return null;
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

    // Завершить туториал для персонажа
    async completeTutorial(
        characterId: number,
        onSuccess?: () => void
    ): Promise<boolean> {
        try {
            await axios.post("/api/characters/tutorial-completed", {
                character_id: characterId,
            });

            // Если персонаж текущий, обновляем его данные
            if (
                this.selectedCharacter &&
                this.selectedCharacter.id === characterId
            ) {
                runInAction(() => {
                    if (this.selectedCharacter) {
                        this.selectedCharacter.is_new = false;
                    }
                });
            }

            // Вызываем колбэк функцию, если она была передана
            if (onSuccess) {
                onSuccess();
            }

            return true;
        } catch (error: any) {
            console.error("Ошибка при завершении туториала:", error);
            return false;
        }
    }

    // Применить награды за бой к персонажу
    applyBattleRewards(rewards: CombatRewards): void {
        if (!this.selectedCharacter) return;

        runInAction(() => {
            // Добавляем опыт
            if (this.selectedCharacter) {
                this.selectedCharacter.experience += rewards.experience;

                // Проверка на повышение уровня
                if (
                    this.selectedCharacter.experience >=
                    this.selectedCharacter.exp_to_next_level
                ) {
                    this.levelUp();
                }

                // Другие изменения состояния персонажа могут быть добавлены здесь
            }
        });
    }

    // Повышение уровня персонажа
    private levelUp(): void {
        if (!this.selectedCharacter) return;

        runInAction(() => {
            if (this.selectedCharacter) {
                this.selectedCharacter.level += 1;
                this.selectedCharacter.experience = 0;
                this.selectedCharacter.exp_to_next_level = Math.floor(
                    this.selectedCharacter.exp_to_next_level * 1.5
                );

                // Увеличиваем базовые характеристики
                this.selectedCharacter.max_health += 10;
                this.selectedCharacter.health =
                    this.selectedCharacter.max_health;
                this.selectedCharacter.max_mana += 5;
                this.selectedCharacter.mana = this.selectedCharacter.max_mana;
                this.selectedCharacter.max_stamina += 5;
                this.selectedCharacter.stamina =
                    this.selectedCharacter.max_stamina;

                // TODO: Можно добавить логику для увеличения других атрибутов
            }
        });
    }

    // Восстановить ресурсы персонажа (здоровье, мана, выносливость)
    restoreResources(
        health: number = 0,
        mana: number = 0,
        stamina: number = 0
    ): void {
        if (!this.selectedCharacter) return;

        runInAction(() => {
            if (this.selectedCharacter) {
                // Восстанавливаем здоровье
                if (health > 0) {
                    this.selectedCharacter.health = Math.min(
                        this.selectedCharacter.health + health,
                        this.selectedCharacter.max_health
                    );
                }

                // Восстанавливаем ману
                if (mana > 0) {
                    this.selectedCharacter.mana = Math.min(
                        this.selectedCharacter.mana + mana,
                        this.selectedCharacter.max_mana
                    );
                }

                // Восстанавливаем выносливость
                if (stamina > 0) {
                    this.selectedCharacter.stamina = Math.min(
                        this.selectedCharacter.stamina + stamina,
                        this.selectedCharacter.max_stamina
                    );
                }
            }
        });
    }

    // Получить случайный предмет (возвращает название предмета)
    getRandomItem(): string {
        const items = [
            "Малое зелье здоровья",
            "Малое зелье маны",
            "Кусок хлеба",
            "Монета",
            "Кусок ткани",
            "Осколок металла",
            "Странный кристалл",
            "Старая карта",
        ];
        return items[Math.floor(Math.random() * items.length)];
    }

    // Получить случайный ресурс
    getRandomResource(): string {
        const resources = [
            "Железная руда",
            "Старая древесина",
            "Лечебная трава",
            "Кристаллический осколок",
            "Таинственный гриб",
            "Кожа животного",
        ];
        return resources[Math.floor(Math.random() * resources.length)];
    }

    // Обработка урона в бою
    takeDamage(amount: number): boolean {
        if (!this.selectedCharacter) return false;

        let isDead = false;

        runInAction(() => {
            if (this.selectedCharacter) {
                // Вычисляем урон с учетом защиты персонажа (можно улучшить)
                const actualDamage = Math.max(1, amount);

                this.selectedCharacter.health = Math.max(
                    0,
                    this.selectedCharacter.health - actualDamage
                );

                // Проверяем, жив ли персонаж
                isDead = this.selectedCharacter.health <= 0;
            }
        });

        return isDead;
    }

    // Использовать ресурс (здоровье, мана, выносливость)
    useResource(type: "health" | "mana" | "stamina", amount: number): boolean {
        if (!this.selectedCharacter) return false;

        let success = false;

        runInAction(() => {
            if (this.selectedCharacter) {
                switch (type) {
                    case "health":
                        if (this.selectedCharacter.health >= amount) {
                            this.selectedCharacter.health -= amount;
                            success = true;
                        }
                        break;
                    case "mana":
                        if (this.selectedCharacter.mana >= amount) {
                            this.selectedCharacter.mana -= amount;
                            success = true;
                        }
                        break;
                    case "stamina":
                        if (this.selectedCharacter.stamina >= amount) {
                            this.selectedCharacter.stamina -= amount;
                            success = true;
                        }
                        break;
                }
            }
        });

        return success;
    }

    // Проверка, соответствует ли персонаж требованиям
    meetsRequirement(requirement: {
        type: string;
        parameter: string;
        value: number | string;
    }): boolean {
        if (!this.selectedCharacter) return false;

        const character = this.selectedCharacter;

        switch (requirement.type) {
            case "level":
                return character.level >= Number(requirement.value);
            case "attribute":
                // Проверяем наличие атрибута у персонажа
                const attributeKey = requirement.parameter as keyof Character;
                if (attributeKey in character) {
                    return (
                        (character[attributeKey] as number) >=
                        Number(requirement.value)
                    );
                }
                return false;
            // Можно добавить другие проверки...
            default:
                return false;
        }
    }

    // Получить процент опыта до следующего уровня
    getExpPercentage(): number {
        if (!this.selectedCharacter) return 0;

        return Math.floor(
            (this.selectedCharacter.experience /
                this.selectedCharacter.exp_to_next_level) *
                100
        );
    }
}

const characterStore = new CharacterStore();
export default characterStore;
