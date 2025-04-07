<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LocationRequirement extends Model
{
    use HasFactory;

    /**
     * Типы требований
     */
    const TYPE_LEVEL = 'level';             // Уровень персонажа
    const TYPE_QUEST = 'quest';             // Выполненный квест
    const TYPE_SKILL = 'skill';             // Уровень навыка
    const TYPE_GOLD = 'gold';               // Количество золота
    const TYPE_ITEM = 'item';               // Наличие предмета
    const TYPE_REPUTATION = 'reputation';   // Уровень репутации
    const TYPE_ATTRIBUTE = 'attribute';     // Значение атрибута (сила, ловкость и т.д.)

    /**
     * Атрибуты, которые можно массово назначать.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'location_id',
        'type',
        'parameter',
        'value',
        'description',
    ];

    /**
     * Атрибуты, которые следует преобразовать.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'value' => 'integer',
    ];

    /**
     * Локация, к которой относится это требование
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Проверить, удовлетворяет ли персонаж требованию
     *
     * @param Character $character Персонаж
     * @return bool Удовлетворяет ли требованию
     */
    public function isSatisfiedBy(Character $character): bool
    {
        switch ($this->type) {
            case self::TYPE_LEVEL:
                return $character->level >= $this->value;

            case self::TYPE_QUEST:
                // Здесь будет логика проверки выполнения квеста
                // return $character->hasCompletedQuest($this->parameter);
                return true; // Временная заглушка

            case self::TYPE_SKILL:
                // Здесь будет логика проверки уровня навыка
                // Например: return $character->getSkillLevel($this->parameter) >= $this->value;
                return true; // Временная заглушка

            case self::TYPE_GOLD:
                // Проверка наличия золота
                return $character->gold >= $this->value;

            case self::TYPE_ITEM:
                // Здесь будет логика проверки наличия предмета
                // return $character->hasItem($this->parameter, $this->value);
                return true; // Временная заглушка

            case self::TYPE_REPUTATION:
                // Здесь будет логика проверки репутации
                // return $character->getReputation($this->parameter) >= $this->value;
                return true; // Временная заглушка

            case self::TYPE_ATTRIBUTE:
                // Проверка значения атрибута
                return $character->{$this->parameter} >= $this->value;

            default:
                return false;
        }
    }

    /**
     * Получить текущее значение требования для персонажа
     *
     * @param Character $character Персонаж
     * @return int|null Текущее значение
     */
    public function getCurrentValue(Character $character): ?int
    {
        switch ($this->type) {
            case self::TYPE_LEVEL:
                return $character->level;

            case self::TYPE_GOLD:
                return $character->gold;

            case self::TYPE_ATTRIBUTE:
                return $character->{$this->parameter};

            // Другие типы требований будут реализованы позже
            default:
                return null;
        }
    }

    /**
     * Получить описание требования
     *
     * @return string Описание
     */
    public function getDescription(): string
    {
        if (!empty($this->description)) {
            return $this->description;
        }

        switch ($this->type) {
            case self::TYPE_LEVEL:
                return "Требуется уровень: {$this->value}";

            case self::TYPE_QUEST:
                return "Требуется выполнить квест: {$this->parameter}";

            case self::TYPE_SKILL:
                return "Требуется навык {$this->parameter}: {$this->value}";

            case self::TYPE_GOLD:
                return "Требуется золото: {$this->value}";

            case self::TYPE_ITEM:
                return "Требуется предмет: {$this->parameter}";

            case self::TYPE_REPUTATION:
                return "Требуется репутация с {$this->parameter}: {$this->value}";

            case self::TYPE_ATTRIBUTE:
                return "Требуется {$this->parameter}: {$this->value}";

            default:
                return "Неизвестное требование";
        }
    }
}
