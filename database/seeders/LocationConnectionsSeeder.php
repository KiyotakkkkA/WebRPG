<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LocationConnectionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Очищаем существующие данные
        DB::table('location_connections')->truncate();

        // Включаем проверку внешних ключей обратно
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Создаем соединения между локациями
        $connections = [
            [
                'from_location_id' => 1, // Лагерь выживших -> Леса Теней
                'to_location_id' => 2,
                'is_bidirectional' => true,
                'travel_time' => 10, // Увеличиваем время путешествия
            ],
            [
                'from_location_id' => 2, // Леса Теней -> Забытые руины
                'to_location_id' => 3,
                'is_bidirectional' => true,
                'travel_time' => 15, // Увеличиваем время путешествия
            ],
            [
                'from_location_id' => 3, // Забытые руины -> Кровавые копи
                'to_location_id' => 4,
                'is_bidirectional' => false,
                'travel_time' => 20, // Увеличиваем время путешествия
            ],
            [
                'from_location_id' => 4, // Кровавые копи -> Лагерь выживших
                'to_location_id' => 1,
                'is_bidirectional' => true,
                'travel_time' => 25, // Увеличиваем время путешествия
            ],
        ];

        DB::table('location_connections')->insert($connections);
    }
}
