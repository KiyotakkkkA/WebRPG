<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Location extends Model
{
    use HasFactory;

    /**
     * Атрибуты, которые можно массово назначать.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'region_id',
        'name',
        'description',
        'image_url',
        'danger_level',
        'is_default',
        'is_discoverable',
        'position_x',
        'position_y',
    ];

    /**
     * Атрибуты, которые следует преобразовать.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'region_id' => 'integer',
        'danger_level' => 'integer',
        'is_default' => 'boolean',
        'is_discoverable' => 'boolean',
        'position_x' => 'integer',
        'position_y' => 'integer',
    ];

    /**
     * Получить регион, к которому принадлежит локация
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    /**
     * Получить персонажей, находящихся в этой локации.
     */
    public function characters(): HasMany
    {
        return $this->hasMany(Character::class, 'current_location_id');
    }

    /**
     * Получить локации, связанные с данной локацией (куда можно перейти).
     */
    public function connectedLocations(): BelongsToMany
    {
        return $this->belongsToMany(
            Location::class,
            'location_connections',
            'from_location_id',
            'to_location_id'
        )->withPivot('is_bidirectional', 'travel_time')
            ->withTimestamps();
    }

    /**
     * Получить локации, из которых можно попасть в данную локацию.
     */
    public function connectedFrom(): BelongsToMany
    {
        return $this->belongsToMany(
            Location::class,
            'location_connections',
            'to_location_id',
            'from_location_id'
        )->withPivot('is_bidirectional', 'travel_time')
            ->withTimestamps();
    }

    /**
     * Получить требования для доступа к локации.
     */
    public function requirements(): HasMany
    {
        return $this->hasMany(LocationRequirement::class);
    }

    /**
     * Получить объекты, находящиеся в локации.
     */
    public function objects(): HasMany
    {
        return $this->hasMany(LocationObject::class);
    }

    /**
     * Получить ресурсы, доступные в локации.
     */
    public function resources()
    {
        return $this->belongsToMany(Resource::class, 'location_resources')
            ->withPivot(['spawn_chance', 'min_amount', 'max_amount'])
            ->withTimestamps();
    }

    /**
     * Получить события, которые могут произойти в локации.
     */
    public function events(): HasMany
    {
        return $this->hasMany(LocationEvent::class);
    }

    /**
     * Проверить, доступна ли локация для персонажа.
     *
     * @param Character $character Персонаж
     * @return bool Доступность локации
     */
    public function isAccessibleBy(Character $character): bool
    {
        // Проверяем все требования для локации
        foreach ($this->requirements as $requirement) {
            if (!$requirement->isSatisfiedBy($character)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Получить причину недоступности локации для персонажа.
     *
     * @param Character $character Персонаж
     * @return array|null Причина недоступности или null, если локация доступна
     */
    public function getAccessibilityIssue(Character $character): ?array
    {
        foreach ($this->requirements as $requirement) {
            if (!$requirement->isSatisfiedBy($character)) {
                return [
                    'type' => $requirement->type,
                    'description' => $requirement->getDescription(),
                    'current_value' => $requirement->getCurrentValue($character),
                    'required_value' => $requirement->value,
                ];
            }
        }

        return null;
    }

    /**
     * Получить все локации, в которые можно перейти из текущей, с учетом двусторонних связей.
     */
    public function getAllAccessibleLocations()
    {
        try {
            // Прямые связи (куда можно перейти напрямую)
            $directConnections = $this->connectedLocations;

            // Обратные связи (откуда можно вернуться при двусторонней связи)
            $reverseConnections = $this->connectedFrom()
                ->wherePivot('is_bidirectional', true) // Только двусторонние связи
                ->get();

            // Проверяем данные в pivot для обратных связей
            $pivotData = DB::table('location_connections')
                ->where('to_location_id', $this->id)
                ->where('is_bidirectional', true)
                ->get();

            // Объединяем коллекции и удаляем дубликаты (если локация есть и в прямых, и в обратных связях)
            $allConnections = $directConnections->merge($reverseConnections)->unique('id');

            // Убеждаемся, что в коллекции нет текущей локации
            $allConnections = $allConnections->filter(function ($location) {
                return $location->id !== $this->id;
            });

            return $allConnections;
        } catch (\Exception $e) {
            \Log::error("Ошибка при получении доступных локаций: " . $e->getMessage(), [
                'location_id' => $this->id,
                'trace' => $e->getTraceAsString()
            ]);
            return collect();
        }
    }
}
