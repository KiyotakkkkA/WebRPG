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
        Schema::create('quest_rewards', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quest_id'); // ID квеста

            // Тип награды (опыт, деньги, предмет, способность, репутация...)
            $table->enum('type', [
                'experience', // Опыт
                'gold', // Золото
                'item', // Предмет
                'ability', // Способность
                'reputation', // Репутация
                'attribute', // Атрибут
                'skill', // Навык
                'currency', // Специальная валюта
                'custom' // Пользовательская награда
            ]);

            $table->string('reward_key')->nullable(); // Ключ награды (id предмета, название способности и т.д.)
            $table->string('name'); // Название награды для отображения
            $table->unsignedInteger('amount')->default(1); // Количество
            $table->text('description')->nullable(); // Описание награды

            // Дополнительные данные о награде (свойства предмета, бонусы и т.д.)
            $table->json('additional_data')->nullable();

            // Условия получения награды (по умолчанию - просто завершить квест)
            $table->json('conditions')->nullable();

            $table->boolean('is_choice')->default(false); // Является ли наградой по выбору
            $table->integer('choice_group')->nullable(); // Группа наград для выбора
            $table->boolean('is_hidden')->default(false); // Скрытая награда

            $table->timestamps();

            // Внешние ключи
            $table->foreign('quest_id')->references('id')->on('quests')->onDelete('cascade');
        });
    }

    /**
     * Откат миграции.
     */
    public function down(): void
    {
        Schema::dropIfExists('quest_rewards');
    }
};
