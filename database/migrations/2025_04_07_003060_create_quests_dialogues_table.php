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
        Schema::create('quest_dialogues', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('npc_id'); // ID NPC
            $table->string('dialogue_key')->unique(); // Уникальный ключ диалога
            $table->string('name'); // Название диалога для администрирования

            // Тип диалога
            $table->enum('type', [
                'greeting',        // Приветствие
                'quest_start',     // Начало квеста
                'quest_progress',  // Прогресс квеста
                'quest_complete',  // Завершение квеста
                'general',         // Общий диалог
                'shop',            // Торговля
                'special'          // Специальный (события, истории)
            ])->default('general');

            $table->text('npc_text'); // Текст, который говорит NPC

            // Связь с квестом (необязательно)
            $table->unsignedBigInteger('quest_id')->nullable();

            // Состояние квеста, для которого предназначен диалог
            $table->enum('quest_state', [
                'not_started',    // Квест не начат
                'in_progress',    // Квест в процессе
                'completed',      // Квест завершен
                'failed',         // Квест провален
                'any'             // Любое состояние
            ])->default('any');

            // Условия отображения диалога
            $table->json('conditions')->nullable();

            // Порядок в цепочке диалогов
            $table->integer('order')->default(0);

            // JSON со всеми вариантами ответов и их последствиями
            $table->json('options')->nullable();

            // Родительский диалог (для создания цепочек)
            $table->unsignedBigInteger('parent_id')->nullable();

            // Действие, выполняемое при показе диалога
            $table->string('trigger_action')->nullable();

            $table->timestamps();

            // Внешние ключи
            $table->foreign('npc_id')->references('id')->on('npcs')->onDelete('cascade');
            $table->foreign('quest_id')->references('id')->on('quests')->onDelete('cascade');
            $table->foreign('parent_id')->references('id')->on('quest_dialogues')->onDelete('set null');
        });
    }

    /**
     * Откат миграции.
     */
    public function down(): void
    {
        Schema::dropIfExists('quest_dialogues');
    }
};
