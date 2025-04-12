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
        // Таблица локаций
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->string('image_url')->nullable();
            $table->integer('danger_level')->default(0);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_discoverable')->default(true);
            $table->integer('position_x')->default(0);
            $table->integer('position_y')->default(0);
            $table->timestamps();
        });

        // Таблица связей между локациями
        Schema::create('location_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_location_id');
            $table->foreignId('to_location_id');
            $table->boolean('is_bidirectional')->default(true);
            $table->integer('travel_time')->default(0)->comment('Время перемещения в секундах');
            $table->timestamps();

            $table->foreign('from_location_id')->references('id')->on('locations')->onDelete('cascade');
            $table->foreign('to_location_id')->references('id')->on('locations')->onDelete('cascade');
            $table->unique(['from_location_id', 'to_location_id']);
        });

        // Таблица требований для локаций
        Schema::create('location_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id');
            $table->string('type')->comment('Тип требования: level, quest, skill, gold, item, reputation, attribute');
            $table->string('parameter')->nullable()->comment('Дополнительный параметр (название квеста, навыка и т.д.)');
            $table->integer('value')->default(0)->comment('Требуемое значение');
            $table->string('description')->nullable()->comment('Пользовательское описание требования');
            $table->timestamps();

            $table->foreign('location_id')->references('id')->on('locations')->onDelete('cascade');
        });

        // Таблица объектов на локациях
        Schema::create('location_objects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id');
            $table->foreignId('object_id');
            $table->string('type')->comment('Тип объекта: npc, monster, building, resource, etc');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->string('image_url')->nullable();
            $table->json('properties')->nullable()->comment('Дополнительные свойства объекта');
            $table->timestamps();

            $table->foreign('location_id')->references('id')->on('locations')->onDelete('cascade');
            // $table->foreign('object_id')->references('id')->on('game_objects')->onDelete('cascade');
        });

        // Таблица ресурсов на локациях
        Schema::create('location_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id');
            $table->foreignId('resource_id')->comment('Ссылка на ID ресурса из таблицы resources или другой');
            $table->string('name');
            $table->float('spawn_chance')->default(1.0)->comment('Вероятность появления ресурса (0.0-1.0)');
            $table->integer('min_amount')->default(1);
            $table->integer('max_amount')->default(1);
            $table->timestamps();

            $table->foreign('location_id')->references('id')->on('locations')->onDelete('cascade');
            // $table->foreign('resource_id')->references('id')->on('resources')->onDelete('cascade');
        });

        // Таблица событий на локациях
        Schema::create('location_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id');
            $table->foreignId('event_id')->comment('Ссылка на ID события из таблицы events или другой');
            $table->string('name');
            $table->text('description')->nullable();
            $table->float('trigger_chance')->default(0.1)->comment('Вероятность активации события (0.0-1.0)');
            $table->json('requirements')->nullable()->comment('Требования для активации события');
            $table->json('actions')->nullable()->comment('Действия, выполняемые при активации события');
            $table->timestamps();

            $table->foreign('location_id')->references('id')->on('locations')->onDelete('cascade');
            // $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
        });

        // Добавляем поле для текущей локации персонажа
        Schema::table('characters', function (Blueprint $table) {
            $table->foreignId('current_location_id')->nullable()->after('is_active');
            $table->foreign('current_location_id')->references('id')->on('locations')->onDelete('set null');
        });

        // Таблица для отслеживания открытых локаций для персонажей
        Schema::create('character_discovered_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('character_id');
            $table->foreignId('location_id');
            $table->timestamp('discovered_at');

            $table->foreign('character_id')->references('id')->on('characters')->onDelete('cascade');
            $table->foreign('location_id')->references('id')->on('locations')->onDelete('cascade');
            $table->unique(['character_id', 'location_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Удаляем поле для текущей локации персонажа
        Schema::table('characters', function (Blueprint $table) {
            $table->dropForeign(['current_location_id']);
            $table->dropColumn('current_location_id');
        });

        Schema::dropIfExists('character_discovered_locations');
        Schema::dropIfExists('location_events');
        Schema::dropIfExists('location_resources');
        Schema::dropIfExists('location_objects');
        Schema::dropIfExists('location_requirements');
        Schema::dropIfExists('location_connections');
        Schema::dropIfExists('locations');
    }
};
