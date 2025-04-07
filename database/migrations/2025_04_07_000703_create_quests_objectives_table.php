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
        Schema::create('quest_objectives', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quest_id'); // ID квеста
            $table->string('objective_key')->unique(); // Уникальный ключ цели для скриптов
            $table->string('description'); // Описание цели для игрока

            // Тип цели (kill, collect, visit, escort, defend, talk...)
            $table->enum('type', [
                'kill', // Убить существ
                'collect', // Собрать предметы
                'interact', // Взаимодействовать с объектом
                'visit', // Посетить локацию
                'escort', // Сопроводить NPC
                'defend', // Защитить объект/NPC
                'talk', // Поговорить с NPC
                'craft', // Создать предмет
                'deliver', // Доставить предмет
                'use_ability', // Использовать способность
                'custom' // Пользовательский тип
            ]);

            $table->string('target'); // ID цели (монстр, предмет, локация и т.д.)
            $table->string('target_name'); // Имя цели для отображения
            $table->unsignedInteger('amount')->default(1); // Количество (например, убить 5 монстров)

            $table->unsignedBigInteger('location_id')->nullable(); // ID локации, где выполняется цель
            $table->json('additional_data')->nullable(); // Дополнительные данные для специфических целей
            $table->integer('order')->default(0); // Порядок выполнения
            $table->boolean('is_optional')->default(false); // Опциональная цель
            $table->boolean('is_hidden')->default(false); // Скрытая цель

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
        Schema::dropIfExists('quest_objectives');
    }
};
