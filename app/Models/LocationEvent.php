<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LocationEvent extends Model
{
    use HasFactory;

    /**
     * Типы событий
     */
    const TYPE_COMBAT = 'combat';             // Боевое событие
    const TYPE_DISCOVERY = 'discovery';       // Обнаружение чего-то
    const TYPE_DIALOGUE = 'dialogue';         // Диалоговое событие
    const TYPE_TRAP = 'trap';                 // Ловушка
    const TYPE_TREASURE = 'treasure';         // Сокровище
    const TYPE_EFFECT = 'effect';             // Эффект (бафф/дебафф)
    const TYPE_QUEST = 'quest';               // Связанное с квестом

    /**
     * Атрибуты, которые можно массово назначать.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'location_id',
        'event_id',
        'name',
        'description',
        'type',
        'trigger_chance',
        'requirements',
        'actions',
        'cooldown',
        'is_one_time',
    ];

    /**
     * Атрибуты, которые необходимо привести к определенным типам.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'trigger_chance' => 'float',
        'requirements' => 'array',
        'actions' => 'array',
        'cooldown' => 'integer',
        'is_one_time' => 'boolean',
    ];

    /**
     * Получить локацию, к которой относится событие
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Проверить, может ли сработать событие (на основе шанса)
     */
    public function canTrigger(): bool
    {
        return (mt_rand(1, 100) / 100) <= $this->trigger_chance;
    }

    /**
     * Проверить, выполняются ли требования для срабатывания события
     *
     * @param Character $character Персонаж
     * @return bool Результат проверки
     */
    public function checkRequirements(Character $character): bool
    {
        if (empty($this->requirements)) {
            return true;
        }

        // Проверка требований может быть реализована в зависимости от структуры
        // данных в поле requirements
        // Это простая заготовка

        foreach ($this->requirements as $requirement) {
            if (isset($requirement['type']) && isset($requirement['value'])) {
                switch ($requirement['type']) {
                    case 'level':
                        if ($character->level < $requirement['value']) {
                            return false;
                        }
                        break;
                    case 'skill':
                        // Здесь будет проверка навыков
                        break;
                    case 'item':
                        // Здесь будет проверка наличия предметов
                        break;
                    // ... другие типы требований
                }
            }
        }

        return true;
    }
}