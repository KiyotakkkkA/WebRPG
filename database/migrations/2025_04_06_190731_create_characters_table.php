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
        Schema::create('characters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('class');
            $table->integer('level')->default(1);
            $table->integer('exp_to_next_level')->default(100);
            $table->integer('experience')->default(0);
            $table->integer('health')->default(100);
            $table->integer('max_health')->default(100);
            $table->integer('mana')->default(100);
            $table->integer('max_mana')->default(100);
            $table->integer('stamina')->default(100);
            $table->integer('max_stamina')->default(100);

            // Характеристики персонажа
            $table->integer('strength')->default(1);
            $table->integer('agility')->default(1);
            $table->integer('intelligence')->default(1);
            $table->integer('vitality')->default(1);
            $table->integer('luck')->default(1);
            $table->integer('charisma')->default(0);
            $table->integer('wisdom')->default(0);
            $table->integer('dexterity')->default(0);
            $table->integer('constitution')->default(0);

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Отмена миграции.
     */
    public function down(): void
    {
        Schema::dropIfExists('characters');
    }
};
