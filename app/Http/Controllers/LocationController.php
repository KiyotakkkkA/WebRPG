<?php

namespace App\Http\Controllers;

use App\Models\Character;
use App\Models\Location;
use App\Models\LocationRequirement;
use App\Models\Resource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class LocationController extends Controller
{
    /**
     * Получить список доступных локаций для персонажа
     */
    public function getAvailableLocations(Request $request)
    {
        $characterId = $request->input('character_id');

        if (!$characterId) {
            return response()->json([
                'message' => 'Персонаж не указан',
            ], 400);
        }

        $character = Character::findOrFail($characterId);

        // Проверяем, принадлежит ли персонаж текущему пользователю
        if ($character->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Доступ запрещен',
            ], 403);
        }

        // Получаем текущую локацию персонажа
        $currentLocation = $character->current_location_id
            ? Location::with(['requirements', 'objects', 'resources', 'events', 'region'])
                ->find($character->current_location_id)
            : Location::with(['requirements', 'objects', 'resources', 'events', 'region'])
                ->where('is_default', true)->first();

        if (!$currentLocation) {
            \Log::warning("Персонаж ID: {$characterId} не находится ни в одной локации");
            return response()->json([
                'message' => 'Персонаж не находится ни в одной локации',
            ], 404);
        }

        // Получаем все локации, в которые можно перейти
        $allConnectedLocations = $currentLocation->getAllAccessibleLocations();

        // Получаем все открытые локации для персонажа
        $discoveredLocations = DB::table('character_discovered_locations')
            ->where('character_id', $character->id)
            ->pluck('location_id')
            ->toArray();

        // Добавляем текущую локацию к списку открытых
        if (!in_array($currentLocation->id, $discoveredLocations)) {
            $discoveredLocations[] = $currentLocation->id;
        }

        // Добавляем все соседние локации в список локаций для отображения
        $connectedLocationIds = $allConnectedLocations->pluck('id')->toArray();
        $allLocationIds = array_merge($discoveredLocations, $connectedLocationIds);
        $allLocationIds = array_unique($allLocationIds);


        // Получаем полную информацию обо всех локациях
        $locations = Location::with(['requirements', 'objects', 'resources', 'events', 'region'])
            ->whereIn('id', $allLocationIds)
            ->get();

        $locations = $locations->map(function ($location) use ($character, $currentLocation, $allConnectedLocations, $discoveredLocations) {
            // Доступна ли локация для перехода из текущей
            $isAccessibleFromCurrent = $allConnectedLocations->contains('id', $location->id);

            // Присваиваем значение полю is_accessible_from_current
            $location->is_accessible_from_current = $isAccessibleFromCurrent;

            // Открыта ли локация (была ли посещена ранее)
            $location->is_discovered = in_array($location->id, $discoveredLocations);

            // Текущая локация не должна быть доступна для перехода
            if ($location->id == $currentLocation->id) {
                $location->is_accessible_from_current = false;
                $location->is_current = true;
            } else {
                $location->is_current = false;
            }

            // Проверяем требования для доступа
            $location->is_accessible = $location->isAccessibleBy($character);

            // Если локация недоступна, получаем причину
            if (!$location->is_accessible) {
                $location->accessibility_issue = $location->getAccessibilityIssue($character);

                // Для фронтенда - маркируем требования как выполненные/невыполненные
                if ($location->requirements) {
                    foreach ($location->requirements as $requirement) {
                        $requirement->fulfilled = $requirement->isSatisfiedBy($character);
                        $requirement->current_value = $requirement->getCurrentValue($character);
                    }
                }
            }

            return $location;
        });

        return response()->json([
            'current_location' => $currentLocation,
            'locations' => $locations,
        ]);
    }

    /**
     * Получить информацию о конкретной локации
     */
    public function getLocation(Request $request, $locationId)
    {
        $characterId = $request->input('character_id');

        if (!$characterId) {
            return response()->json([
                'message' => 'Персонаж не указан',
            ], 400);
        }

        $character = Character::findOrFail($characterId);

        // Проверяем, принадлежит ли персонаж текущему пользователю
        if ($character->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Доступ запрещен',
            ], 403);
        }

        // Проверяем, открыта ли эта локация для персонажа
        $isDiscovered = DB::table('character_discovered_locations')
            ->where('character_id', $character->id)
            ->where('location_id', $locationId)
            ->exists();

        // Если локация не открыта и не является текущей, запрещаем доступ
        if (!$isDiscovered && $character->current_location_id !== $locationId) {
            return response()->json([
                'message' => 'Локация не открыта для этого персонажа',
            ], 403);
        }

        // Получаем локацию со всеми связанными данными
        $location = Location::with(['requirements', 'objects', 'resources', 'events', 'connectedLocations', 'region'])
            ->findOrFail($locationId);

        // Проверяем, доступна ли локация для персонажа
        $location->is_accessible = $location->isAccessibleBy($character);

        // Если локация недоступна, получаем причину
        if (!$location->is_accessible) {
            $location->accessibility_issue = $location->getAccessibilityIssue($character);
        }

        // Это текущая локация?
        $location->is_current = ($locationId === $character->current_location_id);

        return response()->json($location);
    }

    /**
     * Переместить персонажа в другую локацию
     */
    public function moveToLocation(Request $request)
    {
        $characterId = $request->input('character_id');
        $targetLocationId = $request->input('location_id');

        if (!$characterId || !$targetLocationId) {
            return response()->json([
                'message' => 'Необходимо указать персонажа и целевую локацию',
            ], 400);
        }

        $character = Character::findOrFail($characterId);

        // Проверяем, принадлежит ли персонаж текущему пользователю
        if ($character->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Доступ запрещен',
            ], 403);
        }

        // Получаем текущую локацию персонажа
        $currentLocation = $character->current_location_id
            ? Location::find($character->current_location_id)
            : Location::where('is_default', true)->first();

        if (!$currentLocation) {
            return response()->json([
                'message' => 'Персонаж не находится ни в одной локации',
            ], 404);
        }

        // Новая проверка: Предотвращение перемещения в ту же локацию
        if ($currentLocation->id == $targetLocationId) {
            // Если персонаж уже в этой локации, возвращаем успешный ответ без изменений
            return response()->json([
                'message' => 'Персонаж уже находится в указанной локации',
                'location' => $currentLocation,
                'success' => true,
            ]);
        }

        // Получаем целевую локацию
        $targetLocation = Location::findOrFail($targetLocationId);

        // Получаем все локации, в которые можно перейти
        $accessibleLocations = $currentLocation->getAllAccessibleLocations();

        // Проверяем, находится ли целевая локация среди доступных
        $isConnected = $accessibleLocations->contains('id', $targetLocationId);

        if (!$isConnected) {
            \Log::error("Попытка перемещения в недоступную локацию", [
                'character_id' => $characterId,
                'current_location' => $currentLocation->id,
                'target_location' => $targetLocationId,
                'available_transitions' => $accessibleLocations->pluck('id')->toArray()
            ]);

            return response()->json([
                'message' => 'Нельзя переместиться в локацию, которая не соединена с текущей',
                'debug' => [
                    'current_location_id' => $currentLocation->id,
                    'target_location_id' => $targetLocationId,
                    'accessible_locations' => $accessibleLocations->pluck('id', 'name')
                ],
                'success' => false
            ], 400);
        }

        // Проверяем требования для доступа к локации
        if (!$targetLocation->isAccessibleBy($character)) {
            $issue = $targetLocation->getAccessibilityIssue($character);

            return response()->json([
                'message' => 'Персонаж не соответствует требованиям для входа в локацию',
                'issue' => $issue,
                'debug' => [
                    'current_location_id' => $currentLocation->id,
                    'target_location_id' => $targetLocationId,
                    'requirements' => $targetLocation->requirements
                ]
            ], 400);
        }

        // Обновляем текущую локацию персонажа
        $character->current_location_id = $targetLocationId;

        // Если персонаж новый, сбрасываем флаг is_new после первого перемещения
        if ($character->is_new) {
            $character->is_new = false;
            \Log::info("Персонаж ID: {$characterId} начал свое приключение и больше не считается новым");
        }

        $character->save();

        // Добавляем локацию в список открытых, если её там еще нет
        DB::table('character_discovered_locations')
            ->updateOrInsert(
                [
                    'character_id' => $characterId,
                    'location_id' => $targetLocationId,
                ],
                [
                    'discovered_at' => Carbon::now(),
                ]
            );

        return response()->json([
            'message' => 'Персонаж успешно перемещен в локацию ' . $targetLocation->name,
            'location' => $targetLocation,
            'success' => true
        ]);
    }

    /**
     * Получить соединения между локациями
     */
    public function getLocationConnections()
    {
        try {
            // Получаем все соединения из базы данных
            $connections = DB::table('location_connections')
                ->select('from_location_id', 'to_location_id', 'is_bidirectional', 'travel_time')
                ->get();

            \Log::info("Запрос соединений между локациями", [
                'count' => $connections->count(),
                'connections' => $connections->toArray()
            ]);

            // Проверяем, что у нас есть данные
            if ($connections->isEmpty()) {
                \Log::warning("Таблица location_connections пуста!");

                // Возвращаем пустой массив, если данных нет
                return response()->json([
                    'connections' => [],
                    'message' => 'Соединения между локациями не найдены'
                ]);
            }

            // Преобразуем булево значение is_bidirectional в числовой формат для совместимости с JS
            $connections = $connections->map(function($connection) {
                $connection->is_bidirectional = (bool)$connection->is_bidirectional ? 1 : 0;
                return $connection;
            });

            return response()->json([
                'connections' => $connections
            ]);
        } catch (\Exception $e) {
            \Log::error("Ошибка при получении соединений между локациями: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Не удалось получить соединения между локациями',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Получить ресурсы доступные в текущей локации персонажа
     */
    public function getLocationResources(Request $request)
    {
        $characterId = $request->input('character_id');

        if (!$characterId) {
            return response()->json([
                'message' => 'Персонаж не указан',
            ], 400);
        }

        $character = Character::findOrFail($characterId);

        // Проверяем, принадлежит ли персонаж текущему пользователю
        if ($character->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Доступ запрещен',
            ], 403);
        }

        // Получаем текущую локацию персонажа
        $currentLocation = $character->current_location_id
            ? Location::find($character->current_location_id)
            : Location::where('is_default', true)->first();

        if (!$currentLocation) {
            return response()->json([
                'message' => 'Персонаж не находится ни в одной локации',
            ], 404);
        }

        // Получаем ресурсы текущей локации с учетом их свойств
        $resources = $currentLocation->resources()
            ->with(['discoveredByCharacters' => function($query) use ($character) {
                $query->where('character_id', $character->id);
            }])
            ->get()
            ->map(function($resource) use ($character) {
                // Добавляем информацию, найден ресурс или нет
                $resourceData = $resource->toArray();
                $resourceData['discovered'] = $resource->discoveredByCharacters->isNotEmpty();

                // Если ресурс не обнаружен, скрываем некоторую информацию
                if (!$resourceData['discovered']) {
                    // Оставляем только базовую информацию
                    unset($resourceData['properties']);
                }

                return $resourceData;
            });

        return response()->json([
            'resources' => $resources,
            'location' => [
                'id' => $currentLocation->id,
                'name' => $currentLocation->name
            ]
        ]);
    }

    /**
     * Отметить ресурс как обнаруженный персонажем
     */
    public function discoverResource(Request $request)
    {
        \Log::info('Запрос на открытие ресурса', $request->all());

        $characterId = $request->input('character_id');
        $resourceId = $request->input('resource_id');

        if (!$characterId || !$resourceId) {
            \Log::error('Не указаны обязательные параметры', [
                'character_id' => $characterId,
                'resource_id' => $resourceId
            ]);

            return response()->json([
                'message' => 'Необходимо указать персонажа и ресурс',
            ], 400);
        }

        try {
            $character = Character::findOrFail($characterId);

            // Проверяем, принадлежит ли персонаж текущему пользователю
            if ($character->user_id !== Auth::id()) {
                \Log::warning('Попытка доступа к чужому персонажу', [
                    'character_id' => $characterId,
                    'character_user_id' => $character->user_id,
                    'current_user_id' => Auth::id()
                ]);

                return response()->json([
                    'message' => 'Доступ запрещен',
                ], 403);
            }

            $resource = Resource::findOrFail($resourceId);
            \Log::info('Ресурс найден', [
                'resource_id' => $resourceId,
                'resource_name' => $resource->name
            ]);

            // Проверяем, доступен ли ресурс в текущей локации персонажа
            $currentLocation = $character->currentLocation;
            if (!$currentLocation) {
                \Log::error('Персонаж не находится в локации', [
                    'character_id' => $characterId
                ]);

                return response()->json([
                    'message' => 'Персонаж не находится ни в одной локации',
                ], 404);
            }

            $isResourceAvailable = $currentLocation->resources()
                ->where('resources.id', $resourceId)
                ->exists();

            if (!$isResourceAvailable) {
                \Log::warning('Ресурс недоступен в текущей локации', [
                    'resource_id' => $resourceId,
                    'location_id' => $currentLocation->id,
                    'location_name' => $currentLocation->name
                ]);

                return response()->json([
                    'message' => 'Ресурс недоступен в текущей локации',
                ], 400);
            }

            // Комментируем проверку комбинации элементов, так как она выполняется на клиенте
            // Клиент отправляет запрос только если комбинация верна
            // $elementCombination = $request->input('element_combination', []);
            // if (!$resource->checkElementCombination($elementCombination)) {
            //     return response()->json([
            //         'message' => 'Неверная комбинация элементов',
            //         'success' => false
            //     ]);
            // }

            // Отмечаем ресурс как обнаруженный или обновляем счетчик добычи
            $alreadyDiscovered = $character->discoveredResources()
                ->where('resources.id', $resourceId)
                ->exists();

            if ($alreadyDiscovered) {
                // Если ресурс уже открыт, увеличиваем счетчик добычи
                \Log::info('Обновление счетчика добычи для уже открытого ресурса', [
                    'resource_id' => $resourceId,
                    'character_id' => $characterId
                ]);

                // Заменяем updateExistingPivot на прямой SQL запрос
                DB::table('character_discovered_resources')
                    ->where('character_id', $characterId)
                    ->where('resource_id', $resourceId)
                    ->update([
                        'gather_count' => DB::raw('gather_count + 1'),
                        'last_gathered_at' => now()
                    ]);
            } else {
                // Если ресурс открывается впервые
                \Log::info('Ресурс открывается впервые', [
                    'resource_id' => $resourceId,
                    'character_id' => $characterId
                ]);

                // Заменяем метод attach() на прямое создание записи в pivot-таблице
                DB::table('character_discovered_resources')->insert([
                    'character_id' => $characterId,
                    'resource_id' => $resourceId,
                    'discovered_at' => now(),
                    'gather_count' => 1,
                    'last_gathered_at' => now()
                ]);
            }

            \Log::info('Ресурс успешно обработан', [
                'resource_id' => $resourceId,
                'already_discovered' => $alreadyDiscovered
            ]);

            return response()->json([
                'message' => $alreadyDiscovered ? 'Ресурс успешно добыт' : 'Ресурс успешно обнаружен',
                'resource' => $resource,
                'success' => true
            ]);

        } catch (\Exception $e) {
            \Log::error('Ошибка при обработке ресурса', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Произошла ошибка при обработке ресурса',
                'success' => false
            ], 500);
        }
    }
}
