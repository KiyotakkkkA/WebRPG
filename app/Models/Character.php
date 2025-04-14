<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Character extends Model
{
    use HasFactory;

    /**
     * Атрибуты, которые можно массово назначать.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'class',
        'level',
        'experience',
        'exp_to_next_level',
        'health',
        'max_health',
        'mana',
        'max_mana',
        'stamina',
        'max_stamina',
        'strength',
        'agility',
        'intelligence',
        'speed',
        'vitality',
        'luck',
        'charisma',
        'wisdom',
        'dexterity',
        'constitution',
        'is_active',
        'current_location_id',
        'is_new',
    ];

    /**
     * Атрибуты, которые должны быть приведены к типам.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'level' => 'integer',
        'experience' => 'integer',
        'exp_to_next_level' => 'integer',
        'health' => 'integer',
        'max_health' => 'integer',
        'mana' => 'integer',
        'max_mana' => 'integer',
        'stamina' => 'integer',
        'max_stamina' => 'integer',
        'strength' => 'integer',
        'agility' => 'integer',
        'intelligence' => 'integer',
        'speed' => 'integer',
        'vitality' => 'integer',
        'luck' => 'integer',
        'charisma' => 'integer',
        'wisdom' => 'integer',
        'dexterity' => 'integer',
        'constitution' => 'integer',
        'is_active' => 'boolean',
        'is_new' => 'boolean',
    ];

    /**
     * Получить пользователя, владеющего персонажем.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Получить текущую локацию персонажа.
     */
    public function currentLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'current_location_id');
    }

    /**
     * Получить локации, открытые персонажем.
     */
    public function discoveredLocations(): BelongsToMany
    {
        return $this->belongsToMany(Location::class, 'character_discovered_locations')
            ->withPivot(['discovered_at'])
            ->withTimestamps();
    }

    /**
     * Получить ресурсы, открытые персонажем.
     */
    public function discoveredResources(): BelongsToMany
    {
        return $this->belongsToMany(Resource::class, 'character_discovered_resources')
            ->withPivot(['discovered_at', 'gather_count', 'last_gathered_at'])
            ->withTimestamps(false);
    }

    /**
     * Базовые характеристики для каждого класса
     */
    public static function getBaseStatsForClass(string $class): array
    {
        return match ($class) {
            'paladin' => [
                'strength' => 7,
                'agility' => 4,
                'intelligence' => 6,
                'speed' => 8,
                'vitality' => 8,
                'luck' => 5,
                'charisma' => 7,
                'wisdom' => 7,
                'dexterity' => 4,
                'constitution' => 7,
                'health' => 120,
                'max_health' => 120,
                'mana' => 100,
                'max_mana' => 100,
                'stamina' => 90,
                'max_stamina' => 90,
                'exp_to_next_level' => 100,
            ],
            'berserker' => [
                'strength' => 9,
                'agility' => 6,
                'intelligence' => 2,
                'speed' => 10,
                'vitality' => 8,
                'luck' => 3,
                'charisma' => 3,
                'wisdom' => 2,
                'dexterity' => 6,
                'constitution' => 9,
                'health' => 140,
                'max_health' => 140,
                'mana' => 40,
                'max_mana' => 40,
                'stamina' => 120,
                'max_stamina' => 120,
                'exp_to_next_level' => 100,
            ],
            'crossbowman' => [
                'strength' => 5,
                'agility' => 8,
                'intelligence' => 5,
                'speed' => 12,
                'vitality' => 5,
                'luck' => 6,
                'charisma' => 4,
                'wisdom' => 5,
                'dexterity' => 9,
                'constitution' => 5,
                'health' => 100,
                'max_health' => 100,
                'mana' => 70,
                'max_mana' => 70,
                'stamina' => 110,
                'max_stamina' => 110,
                'exp_to_next_level' => 100,
            ],
            'elementalist' => [
                'strength' => 3,
                'agility' => 5,
                'intelligence' => 9,
                'speed' => 9,
                'vitality' => 4,
                'luck' => 5,
                'charisma' => 6,
                'wisdom' => 8,
                'dexterity' => 6,
                'constitution' => 4,
                'health' => 90,
                'max_health' => 90,
                'mana' => 140,
                'max_mana' => 140,
                'stamina' => 80,
                'max_stamina' => 80,
                'exp_to_next_level' => 100,
            ],
            'necromancer' => [
                'strength' => 2,
                'agility' => 4,
                'intelligence' => 10,
                'speed' => 7,
                'vitality' => 3,
                'luck' => 5,
                'charisma' => 4,
                'wisdom' => 9,
                'dexterity' => 4,
                'constitution' => 3,
                'health' => 80,
                'max_health' => 80,
                'mana' => 150,
                'max_mana' => 150,
                'stamina' => 70,
                'max_stamina' => 70,
                'exp_to_next_level' => 100,
            ],
            'priest' => [
                'strength' => 3,
                'agility' => 3,
                'intelligence' => 8,
                'speed' => 8,
                'vitality' => 5,
                'luck' => 6,
                'charisma' => 8,
                'wisdom' => 10,
                'dexterity' => 3,
                'constitution' => 4,
                'health' => 95,
                'max_health' => 95,
                'mana' => 130,
                'max_mana' => 130,
                'stamina' => 80,
                'max_stamina' => 80,
                'exp_to_next_level' => 100,
            ],
            'warrior' => [
                'strength' => 8,
                'agility' => 5,
                'intelligence' => 3,
                'speed' => 9,
                'vitality' => 9,
                'luck' => 4,
                'charisma' => 3,
                'wisdom' => 2,
                'dexterity' => 5,
                'constitution' => 8,
                'health' => 120,
                'max_health' => 120,
                'mana' => 50,
                'max_mana' => 50,
                'stamina' => 100,
                'max_stamina' => 100,
                'exp_to_next_level' => 100,
            ],
            'mage' => [
                'strength' => 2,
                'agility' => 4,
                'intelligence' => 10,
                'speed' => 8,
                'vitality' => 3,
                'luck' => 5,
                'charisma' => 6,
                'wisdom' => 9,
                'dexterity' => 4,
                'constitution' => 3,
                'health' => 80,
                'max_health' => 80,
                'mana' => 150,
                'max_mana' => 150,
                'stamina' => 70,
                'max_stamina' => 70,
                'exp_to_next_level' => 100,
            ],
            'rogue' => [
                'strength' => 4,
                'agility' => 10,
                'intelligence' => 6,
                'speed' => 14,
                'vitality' => 4,
                'luck' => 8,
                'charisma' => 5,
                'wisdom' => 4,
                'dexterity' => 9,
                'constitution' => 4,
                'health' => 90,
                'max_health' => 90,
                'mana' => 80,
                'max_mana' => 80,
                'stamina' => 110,
                'max_stamina' => 110,
                'exp_to_next_level' => 100,
            ],
            default => [
                'strength' => 5,
                'agility' => 5,
                'intelligence' => 5,
                'speed' => 10,
                'vitality' => 5,
                'luck' => 5,
                'charisma' => 5,
                'wisdom' => 5,
                'dexterity' => 5,
                'constitution' => 5,
                'health' => 100,
                'max_health' => 100,
                'mana' => 100,
                'max_mana' => 100,
                'stamina' => 100,
                'max_stamina' => 100,
                'exp_to_next_level' => 100,
            ],
        };
    }
}
