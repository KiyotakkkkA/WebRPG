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
        Schema::create('quests', function (Blueprint $table) {
            $table->id();
            $table->string('quest_key')->unique(); // Уникальный ключ квеста для скриптов
            $table->string('title'); // Название квеста
            $table->text('description'); // Описание квеста
            $table->integer('level')->default(1); // Минимальный уровень персонажа
            $table->enum('category', ['main', 'side', 'daily', 'repeatable'])->default('side'); // Категория квеста
            $table->boolean('is_story')->default(false); // Является ли квест сюжетным
            $table->boolean('is_hidden')->default(false); // Скрыт ли квест в журнале до обнаружения
            $table->boolean('auto_accept')->default(false); // Автоматически принимать квест

            // Связанные NPC
            $table->unsignedBigInteger('npc_giver_id')->nullable(); // NPC, выдающий квест
            $table->unsignedBigInteger('npc_receiver_id')->nullable(); // NPC для сдачи квеста (если отличается)

            // Диалоги
            $table->string('dialogue_start_id')->nullable(); // ID диалога для начала квеста
            $table->string('dialogue_progress_id')->nullable(); // ID диалога для проверки прогресса
            $table->string('dialogue_complete_id')->nullable(); // ID диалога для завершения квеста

            // Условия и ограничения
            $table->json('requirements')->nullable(); // Требования для начала квеста
            $table->json('restrictions')->nullable(); // Ограничения (время, локация и т.д.)

            // Связи с другими квестами
            $table->unsignedBigInteger('prerequisite_quest_id')->nullable(); // Предварительный квест
            $table->unsignedBigInteger('next_quest_id')->nullable(); // Следующий квест в цепочке

            // Метаданные
            $table->boolean('is_active')->default(true); // Активен ли квест в игре
            $table->boolean('is_repeatable')->default(false); // Можно ли повторять квест
            $table->integer('cooldown_hours')->default(0); // Период ожидания для повтора (в часах)

            $table->timestamps();

            // Внешние ключи
            $table->foreign('prerequisite_quest_id')->references('id')->on('quests')->onDelete('set null');
            $table->foreign('next_quest_id')->references('id')->on('quests')->onDelete('set null');
        });
    }

    /**
     * Откат миграции.
     */
    public function down(): void
    {
        Schema::dropIfExists('quests');
    }
};
