<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Region extends Model
{
    use HasFactory;

    /**
     * Поля, доступные для массового заполнения
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'is_accessible',
        'icon',
    ];

    /**
     * Атрибуты, которые должны быть приведены к native типам.
     *
     * @var array
     */
    protected $casts = [
        'is_accessible' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Получить локации, принадлежащие региону
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function locations(): HasMany
    {
        return $this->hasMany(Location::class);
    }
}
