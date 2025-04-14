<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Основная таблица ресурсов
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->string('icon')->nullable();
            $table->string('image_url')->nullable();
            $table->enum('rarity', ['common', 'uncommon', 'rare', 'epic', 'legendary'])->default('common');
            $table->json('element_combination')->comment('Массив ID элементов, необходимых для добычи');
            $table->json('properties')->nullable()->comment('Дополнительные свойства ресурса');
            $table->integer('base_gathering_time')->default(3000)->comment('Базовое время добычи в миллисекундах');
            $table->boolean('is_active')->default(true)->comment('Доступен ли ресурс для добычи');
            $table->timestamps();
        });

        // Таблица для отслеживания открытых ресурсов для персонажей
        Schema::create('character_discovered_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('character_id');
            $table->foreignId('resource_id');
            $table->timestamp('discovered_at');
            $table->integer('gather_count')->default(0)->comment('Сколько раз ресурс был собран');
            $table->timestamp('last_gathered_at')->nullable();

            $table->foreign('character_id')->references('id')->on('characters')->onDelete('cascade');
            $table->foreign('resource_id')->references('id')->on('resources')->onDelete('cascade');
            $table->unique(['character_id', 'resource_id']);
        });

        // Обновляем таблицу связей локаций и ресурсов
        Schema::table('location_resources', function (Blueprint $table) {
            // Добавляем правильную связь с таблицей resources
            $table->foreign('resource_id')->references('id')->on('resources')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Удаляем связь перед удалением таблицы
        Schema::table('location_resources', function (Blueprint $table) {
            $table->dropForeign(['resource_id']);
            $table->string('name')->after('resource_id'); // Возвращаем колонку
        });

        Schema::dropIfExists('character_discovered_resources');
        Schema::dropIfExists('resources');
    }
};
