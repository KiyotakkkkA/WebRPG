<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Запуск миграции.
     */
    public function up(): void
    {
        Schema::create('character_quests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('character_id'); // ID персонажа
            $table->unsignedBigInteger('quest_id'); // ID квеста

            // Статус квеста
            $table->enum('status', [
                'available',     // Доступен, но не принят
                'active',        // Принят и выполняется
                'completed',     // Завершен
                'failed',        // Провален
                'abandoned',     // Отказ от квеста
                'locked'         // Заблокирован (недоступен из-за условий)
            ])->default('available');

            $table->dateTime('accepted_at')->nullable(); // Когда принят
            $table->dateTime('completed_at')->nullable(); // Когда завершен
            $table->dateTime('expires_at')->nullable(); // Срок выполнения

            // Данные о прогрессе квеста (e.g. {"objective_key": {"current": 2, "max": 5}})
            $table->json('progress')->nullable();

            // Метаданные квеста (специальные настройки, пользовательские данные)
            $table->json('meta_data')->nullable();

            // Выбранные награды (для квестов с выбором награды)
            $table->json('chosen_rewards')->nullable();

            // Завершенные цели квеста
            $table->json('completed_objectives')->nullable();

            // История изменений статуса квеста
            $table->json('status_history')->nullable();

            // Количество выполнений для повторяемых квестов
            $table->integer('completion_count')->default(0);

            // Последнее время завершения для повторяемых квестов
            $table->dateTime('last_completion')->nullable();

            $table->timestamps();

            // Внешние ключи
            $table->foreign('character_id')->references('id')->on('characters')->onDelete('cascade');
            $table->foreign('quest_id')->references('id')->on('quests')->onDelete('cascade');

            // Уникальный индекс для предотвращения дублирования
            $table->unique(['character_id', 'quest_id']);
        });
    }

    /**
     * Откат миграции.
     */
    public function down(): void
    {
        Schema::dropIfExists('character_quests');
    }
};
