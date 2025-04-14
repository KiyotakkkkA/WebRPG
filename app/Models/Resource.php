<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Resource extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'icon',
        'image_url',
        'rarity',
        'element_combination',
        'properties',
        'base_gathering_time',
        'is_active',
    ];

    protected $casts = [
        'element_combination' => 'array',
        'properties' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Локации, где доступен этот ресурс
     */
    public function locations(): BelongsToMany
    {
        return $this->belongsToMany(Location::class, 'location_resources')
            ->withPivot(['spawn_chance', 'min_amount', 'max_amount'])
            ->withTimestamps();
    }

    /**
     * Персонажи, открывшие этот ресурс
     */
    public function discoveredByCharacters(): BelongsToMany
    {
        return $this->belongsToMany(Character::class, 'character_discovered_resources')
            ->withPivot(['discovered_at', 'gather_count', 'last_gathered_at']);
    }

    /**
     * Получить элементы, из которых состоит ресурс
     */
    public function elements()
    {
        $elementIds = $this->element_combination;
        return Element::whereIn('id', $elementIds)->get();
    }

    /**
     * Проверить правильность комбинации элементов
     */
    public function checkElementCombination(array $selectedElements): bool
    {
        sort($selectedElements);
        $required = $this->element_combination;
        sort($required);

        return $selectedElements == $required;
    }
}
