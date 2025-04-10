<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Region;
use App\Models\Location;
use App\Models\Character;
use Illuminate\Http\Request;

class MapController extends Controller
{
    /**
     * Получить данные для карты мира (список регионов с координатами)
     */
    public function getWorldMap()
    {
        $regions = Region::select('id', 'name', 'description', 'icon', 'position_x', 'position_y')
            ->get()
            ->map(function ($region) {
                // Если у региона нет координат, генерируем случайные
                if (!$region->position_x || !$region->position_y) {
                    $region->position_x = rand(100, 900);
                    $region->position_y = rand(100, 900);
                }

                return $region;
            });

        return response()->json([
            'regions' => $regions,
            'map_bounds' => [
                'min_x' => 0,
                'min_y' => 0,
                'max_x' => 1000,
                'max_y' => 1000
            ]
        ]);
    }

    /**
     * Получить данные для карты региона (список локаций с координатами)
     */
    public function getRegionMap(Request $request, $regionId)
    {
        $characterId = $request->query('character_id');
        $character = null;

        if ($characterId) {
            $character = Character::find($characterId);
        }

        $region = Region::findOrFail($regionId);

        $locations = Location::where('region_id', $regionId)
            ->select('id', 'name', 'description', 'image_url', 'danger_level', 'position_x', 'position_y')
            ->get()
            ->map(function ($location) use ($character) {
                // Если у локации нет координат, генерируем случайные
                if (!$location->position_x || !$location->position_y) {
                    $location->position_x = rand(100, 900);
                    $location->position_y = rand(100, 900);
                }

                // Проверяем, доступна ли локация персонажу
                if ($character) {
                    $location->is_accessible = $location->isAccessibleBy($character);
                    $location->accessibility_issue = $location->getAccessibilityIssue($character);
                    $location->is_current = $character->current_location_id === $location->id;
                }

                return $location;
            });

        // Связи между локациями для отображения путей на карте
        $connections = [];
        foreach ($locations as $location) {
            $connectedLocations = $location->getAllAccessibleLocations()
                ->where('region_id', $regionId);

            foreach ($connectedLocations as $connected) {
                $connections[] = [
                    'from_id' => $location->id,
                    'to_id' => $connected->id,
                    'travel_time' => $connected->pivot->travel_time ?? 0
                ];
            }
        }

        return response()->json([
            'region' => $region,
            'locations' => $locations,
            'connections' => $connections,
            'map_bounds' => [
                'min_x' => 0,
                'min_y' => 0,
                'max_x' => 1000,
                'max_y' => 1000
            ]
        ]);
    }
}
