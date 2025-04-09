<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportMessage extends Model
{
    use HasFactory;

    /**
     * Атрибуты, которые можно массово присваивать.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'type',
        'character_name',
        'message',
        'status',
        'response',
        'responder_id',
        'responded_at'
    ];

    /**
     * Атрибуты, которые нужно преобразовать.
     *
     * @var array
     */
    protected $casts = [
        'responded_at' => 'datetime',
    ];

    /**
     * Получить пользователя, создавшего сообщение.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Получить сотрудника поддержки, ответившего на сообщение.
     */
    public function responder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responder_id');
    }

    /**
     * Определить, является ли сообщение новым.
     *
     * @return bool
     */
    public function isNew(): bool
    {
        return $this->status === 'new';
    }

    /**
     * Определить, находится ли сообщение в обработке.
     *
     * @return bool
     */
    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }

    /**
     * Определить, закрыто ли сообщение.
     *
     * @return bool
     */
    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    /**
     * Установить статус сообщения как "в обработке".
     *
     * @param int|null $responderId ID сотрудника поддержки
     * @return bool
     */
    public function markAsInProgress(?int $responderId = null): bool
    {
        return $this->update([
            'status' => 'in_progress',
            'responder_id' => $responderId ?? $this->responder_id,
        ]);
    }

    /**
     * Установить статус сообщения как "закрыто".
     *
     * @param int|null $responderId ID сотрудника поддержки
     * @return bool
     */
    public function markAsClosed(?int $responderId = null): bool
    {
        return $this->update([
            'status' => 'closed',
            'responder_id' => $responderId ?? $this->responder_id,
        ]);
    }

    /**
     * Установить статус сообщения как "новое".
     *
     * @return bool
     */
    public function markAsNew(): bool
    {
        return $this->update([
            'status' => 'new',
        ]);
    }

    /**
     * Добавить ответ на сообщение.
     *
     * @param string $response Текст ответа
     * @param int|null $responderId ID сотрудника поддержки
     * @param string|null $status Новый статус сообщения
     * @return bool
     */
    public function addResponse(string $response, ?int $responderId = null, ?string $status = 'in_progress'): bool
    {
        return $this->update([
            'response' => $response,
            'responder_id' => $responderId ?? $this->responder_id,
            'status' => $status ?? $this->status,
            'responded_at' => now(),
        ]);
    }
}
