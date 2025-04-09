<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'max_characters',
        'role',
        'is_root',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'max_characters' => 'integer',
        ];
    }

    /**
     * Получить всех персонажей, принадлежащих пользователю.
     */
    public function characters(): HasMany
    {
        return $this->hasMany(Character::class);
    }

    /**
     * Проверить, достиг ли пользователь лимита персонажей
     */
    public function hasReachedCharacterLimit(): bool
    {
        return $this->characters()->count() >= $this->max_characters;
    }

    /**
     * Получить количество оставшихся слотов для персонажей
     */
    public function getRemainingCharacterSlots(): int
    {
        $currentCount = $this->characters()->count();
        return max(0, $this->max_characters - $currentCount);
    }

    /**
     * Проверить, является ли пользователь главным администратором
     */
    public function isRootAdmin(): bool
    {
        return $this->role === 'admin' && $this->is_root === true;
    }

    /**
     * Проверить, является ли пользователь администратором
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Проверить, является ли пользователь сотрудником поддержки
     */
    public function isSupport(): bool
    {
        return $this->role === 'support';
    }

    /**
     * Проверить, является ли пользователь администратором или сотрудником поддержки
     */
    public function isSupportOrAdmin(): bool
    {
        return $this->isAdmin() || $this->isSupport();
    }

    /**
     * Проверить, имеет ли пользователь указанную роль
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }
}
