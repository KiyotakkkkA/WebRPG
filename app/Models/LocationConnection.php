<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LocationConnection extends Model
{
    use HasFactory;

    /**
     * Атрибуты, которые можно массово назначать.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'from_location_id',
        'to_location_id',
        'is_bidirectional',
        'travel_time'
    ];

    /**
     * Атрибуты, которые следует преобразовать.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_bidirectional' => 'boolean',
        'travel_time' => 'integer',
    ];

    /**
     * Получить локацию откуда идет переход.
     */
    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'from_location_id');
    }

    /**
     * Получить локацию куда идет переход.
     */
    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'to_location_id');
    }
}
