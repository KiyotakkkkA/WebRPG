<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LocationObject extends Model
{
    use HasFactory;

    /**
     * Типы объектов
     */
    const TYPE_BUILDING = 'building';   // Здание
    const TYPE_NPC = 'npc';             // NPC (неигровой персонаж)
    const TYPE_MONSTER = 'monster';     // Монстр
    const TYPE_RESOURCE = 'resource';   // Ресурс (травы, руды и т.д.)

    /**
     * Атрибуты, которые можно массово назначать.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'location_id',
        'object_id',
        'type',
        'name',
        'description',
        'icon',
        'image_url',
        'x_position',
        'y_position',
        'is_active',
        'data',
    ];

    /**
     * Атрибуты, которые необходимо привести к определенным типам.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'data' => 'array',
        'is_active' => 'boolean',
        'x_position' => 'float',
        'y_position' => 'float',
    ];

    /**
     * Получить локацию, к которой относится объект
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Проверить, является ли объект зданием
     */
    public function isBuilding(): bool
    {
        return $this->type === self::TYPE_BUILDING;
    }

    /**
     * Проверить, является ли объект NPC
     */
    public function isNpc(): bool
    {
        return $this->type === self::TYPE_NPC;
    }

    /**
     * Проверить, является ли объект монстром
     */
    public function isMonster(): bool
    {
        return $this->type === self::TYPE_MONSTER;
    }

    /**
     * Проверить, является ли объект ресурсом
     */
    public function isResource(): bool
    {
        return $this->type === self::TYPE_RESOURCE;
    }

    /**
     * Получить иконку по умолчанию в зависимости от типа объекта
     */
    public function getDefaultIcon(): string
    {
        return match($this->type) {
            self::TYPE_BUILDING => '🏠',
            self::TYPE_NPC => '👤',
            self::TYPE_MONSTER => '👹',
            self::TYPE_RESOURCE => '💎',
            default => '❓',
        };
    }
}
