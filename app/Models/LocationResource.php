<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LocationResource extends Model
{
    use HasFactory;

    /**
     * Атрибуты, которые можно массово назначать.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'location_id',
        'resource_id',
        'name',
        'spawn_chance',
        'min_amount',
        'max_amount',
        'respawn_time',
        'difficulty',
        'description',
        'icon',
    ];

    /**
     * Атрибуты, которые необходимо привести к определенным типам.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'spawn_chance' => 'float',
        'min_amount' => 'integer',
        'max_amount' => 'integer',
        'respawn_time' => 'integer',
        'difficulty' => 'integer',
    ];

    /**
     * Получить локацию, к которой относится ресурс
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Получить случайное количество ресурса в пределах min-max
     */
    public function getRandomAmount(): int
    {
        return rand($this->min_amount, $this->max_amount);
    }

    /**
     * Проверить, можно ли добыть ресурс (на основе шанса появления)
     */
    public function canSpawn(): bool
    {
        return (mt_rand(1, 100) / 100) <= $this->spawn_chance;
    }
}
