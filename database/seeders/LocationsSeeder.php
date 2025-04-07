<?php

namespace Database\Seeders;

use App\Models\Location;
use App\Models\LocationRequirement;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LocationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Временно отключаем проверку внешних ключей
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Очищаем существующие данные
        DB::table('location_connections')->truncate();
        DB::table('location_requirements')->truncate();
        DB::table('location_objects')->truncate(); // Добавляем очистку объектов
        DB::table('character_discovered_locations')->truncate(); // Очищаем связи персонажей с локациями
        DB::table('locations')->truncate();

        // Включаем проверку внешних ключей обратно
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Создаем базовые локации
        $locations = [
            [
                'id' => 1,
                'name' => 'Лагерь выживших',
                'description' => 'Защищенное место, где собираются те, кто смог пережить первые дни проклятия.',
                'image_url' => '/images/locations/novice-camp.jpg',
                'danger_level' => 1,
                'is_default' => true,
                'is_discoverable' => true,
                'position_x' => 0,
                'position_y' => 0,
            ],
            [
                'id' => 2,
                'name' => 'Леса Теней',
                'description' => 'Древние леса, где деревья шепчут тайны прошлого и скрывают многочисленные опасности.',
                'image_url' => '/images/locations/shadow-woods.jpg',
                'danger_level' => 3,
                'is_default' => false,
                'is_discoverable' => true,
                'position_x' => 1,
                'position_y' => 1,
            ],
            [
                'id' => 3,
                'name' => 'Забытые руины',
                'description' => 'Останки древней цивилизации, полные артефактов и смертельных ловушек.',
                'image_url' => '/images/locations/forgotten-ruins.jpg',
                'danger_level' => 5,
                'is_default' => false,
                'is_discoverable' => true,
                'position_x' => 2,
                'position_y' => 0,
            ],
            [
                'id' => 4,
                'name' => 'Кровавые копи',
                'description' => 'Заброшенные шахты, где добывали редкие кристаллы. Теперь там обитают существа из бездны.',
                'image_url' => '/images/locations/blood-mines.jpg',
                'danger_level' => 7,
                'is_default' => false,
                'is_discoverable' => true,
                'position_x' => 0,
                'position_y' => 2,
            ],
        ];

        // Вставляем локации в базу данных
        foreach ($locations as $locationData) {
            Location::create($locationData);
        }

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

        // Создаем требования для локаций
        $requirements = [
            // Требование по уровню для входа в забытые руины
            [
                'location_id' => 3,
                'type' => LocationRequirement::TYPE_LEVEL,
                'parameter' => null,
                'value' => 3, // Минимальный уровень 3
                'description' => 'Требуется минимум 3 уровень для входа в Забытые руины',
            ],

            // Требование по уровню для входа в кровавые копи
            [
                'location_id' => 4,
                'type' => LocationRequirement::TYPE_LEVEL,
                'parameter' => null,
                'value' => 5, // Минимальный уровень 5
                'description' => 'Требуется минимум 5 уровень для входа в Кровавые копи',
            ],

            // Требование по силе для входа в кровавые копи
            [
                'location_id' => 4,
                'type' => LocationRequirement::TYPE_ATTRIBUTE,
                'parameter' => 'strength',
                'value' => 6, // Минимум 6 силы
                'description' => 'Требуется минимум 6 силы для открытия тяжелой двери в Кровавые копи',
            ],
        ];

        // Вставляем требования в базу данных
        foreach ($requirements as $requirementData) {
            LocationRequirement::create($requirementData);
        }

        // Добавляем объекты на локации
        $objects = [
            // Объекты в лагере выживших
            [
                'location_id' => 1,
                'object_id' => 'tavern',
                'type' => 'building',
                'name' => 'Таверна "Кровавый кубок"',
                'description' => 'Место, где можно найти приют и услышать последние слухи.',
                'icon' => '🏠',
            ],
            [
                'location_id' => 1,
                'object_id' => 'blacksmith',
                'type' => 'building',
                'name' => 'Кузница проклятых',
                'description' => 'Кузница, где мастер Горан создает оружие из редких металлов.',
                'icon' => '⚒️',
            ],
            [
                'location_id' => 1,
                'object_id' => 'merchant',
                'type' => 'npc',
                'name' => 'Торговец Малвер',
                'description' => 'Загадочный торговец с редкими товарами и странной улыбкой.',
                'icon' => '👨‍🦳',
            ],
            [
                'location_id' => 1,
                'object_id' => 'quest-giver',
                'type' => 'npc',
                'name' => 'Старейшина Ирмель',
                'description' => 'Хранительница знаний, которая дает задания отважным авантюристам.',
                'icon' => '👵',
            ],

            // Объекты в лесу теней
            [
                'location_id' => 2,
                'object_id' => 'wounded-wolf',
                'type' => 'monster',
                'name' => 'Раненый теневой волк',
                'description' => 'Опасное существо, ослабленное ранами. Хорошая добыча для новичка.',
                'icon' => '🐺',
            ],

            // Объекты в забытых руинах
            [
                'location_id' => 3,
                'object_id' => 'skeleton-warrior',
                'type' => 'monster',
                'name' => 'Скелет-воин',
                'description' => 'Древний воин, поднятый черной магией. Охраняет руины от посторонних.',
                'icon' => '💀',
            ],

            // Объекты в кровавых копях
            [
                'location_id' => 4,
                'object_id' => 'dark-mage',
                'type' => 'monster',
                'name' => 'Темный маг',
                'description' => 'Могущественный чародей, изучающий силы бездны в глубинах копей.',
                'icon' => '🧙‍♂️',
            ],
        ];

        // Вставляем объекты в базу данных
        foreach ($objects as $objectData) {
            DB::table('location_objects')->insert($objectData);
        }

        // Добавляем тестовую запись в character_discovered_locations
        // Для демонстрационных целей открываем все локации первому персонажу
        $testDiscoveredLocations = [];

        // Проверяем, есть ли тестовый персонаж
        $testCharacterId = DB::table('characters')->first()->id ?? null;

        if ($testCharacterId) {
            // Добавляем все локации как открытые для тестового персонажа
            foreach ($locations as $location) {
                $testDiscoveredLocations[] = [
                    'character_id' => $testCharacterId,
                    'location_id' => $location['id'],
                    'discovered_at' => now(),
                ];
            }

            // Устанавливаем текущую локацию для тестового персонажа на Лагерь выживших
            DB::table('characters')
                ->where('id', $testCharacterId)
                ->update(['current_location_id' => 1]);
        }

        // Если есть данные для добавления
        if (!empty($testDiscoveredLocations)) {
            DB::table('character_discovered_locations')->insert($testDiscoveredLocations);
        }
    }
}
