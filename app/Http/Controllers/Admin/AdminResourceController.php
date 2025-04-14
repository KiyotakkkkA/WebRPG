<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Resource;
use App\Models\Element;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AdminResourceController extends Controller
{
    /**
     * Получить список всех ресурсов для админ-панели
     */
    public function index()
    {
        $resources = Resource::with('locations')->get();
        $elements = Element::where('is_active', true)->get();
        $locations = Location::select('id', 'name')->get();

        return response()->json([
            'resources' => $resources,
            'elements' => $elements,
            'locations' => $locations,
        ]);
    }

    /**
     * Получить данные конкретного ресурса
     */
    public function show($id)
    {
        $resource = Resource::with(['locations', 'elements'])->findOrFail($id);
        return response()->json($resource);
    }

    /**
     * Создать новый ресурс
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'rarity' => ['required', Rule::in(['common', 'uncommon', 'rare', 'epic', 'legendary'])],
            'element_combination' => 'required|array|min:1',
            'element_combination.*' => 'exists:elements,id',
            'base_gathering_time' => 'required|integer|min:1000',
            'location_ids' => 'array',
            'location_ids.*' => 'exists:locations,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Данные не прошли валидацию',
                'errors' => $validator->errors()
            ], 422);
        }

        // Создаем ресурс
        $resource = Resource::create([
            'name' => $request->name,
            'description' => $request->description,
            'icon' => $request->icon,
            'image_url' => $request->image_url,
            'rarity' => $request->rarity,
            'element_combination' => $request->element_combination,
            'properties' => $request->properties ?? null,
            'base_gathering_time' => $request->base_gathering_time,
            'is_active' => $request->has('is_active') ? (bool)$request->is_active : true,
        ]);

        // Привязываем ресурс к локациям, если указаны
        if ($request->has('location_ids')) {
            try {
                $locationData = [];

                foreach ($request->location_ids as $locationId) {
                    // Явное преобразование и проверка типов данных
                    $spawnChance = (float)$request->input('spawn_chance.' . $locationId, 0.5);
                    $minAmount = (int)$request->input('min_amount.' . $locationId, 1);
                    $maxAmount = (int)$request->input('max_amount.' . $locationId, 3);

                    // Проверка валидности maxAmount (не меньше minAmount)
                    if ($maxAmount < $minAmount) {
                        $maxAmount = $minAmount;
                    }

                    $locationData[$locationId] = [
                        'spawn_chance' => $spawnChance,
                        'min_amount' => $minAmount,
                        'max_amount' => $maxAmount,
                    ];
                }

                // Логирование данных для отладки
                \Log::info('Привязка ресурса к локациям', [
                    'resource_id' => $resource->id,
                    'location_data' => $locationData
                ]);

                $resource->locations()->attach($locationData);
            } catch (\Exception $e) {
                \Log::error('Ошибка при привязке ресурса к локациям', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);

                return response()->json([
                    'message' => 'Ресурс создан, но возникла ошибка при привязке к локациям: ' . $e->getMessage(),
                    'resource' => $resource
                ], 500);
            }
        }

        return response()->json([
            'message' => 'Ресурс успешно создан',
            'resource' => $resource->load('locations'),
        ], 201);
    }

    /**
     * Обновить существующий ресурс
     */
    public function update(Request $request, $id)
    {
        $resource = Resource::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'rarity' => ['required', Rule::in(['common', 'uncommon', 'rare', 'epic', 'legendary'])],
            'element_combination' => 'required|array|min:1',
            'element_combination.*' => 'exists:elements,id',
            'base_gathering_time' => 'required|integer|min:1000',
            'location_ids' => 'array',
            'location_ids.*' => 'exists:locations,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Данные не прошли валидацию',
                'errors' => $validator->errors()
            ], 422);
        }

        // Обновляем ресурс
        $resource->update([
            'name' => $request->name,
            'description' => $request->description,
            'icon' => $request->icon,
            'image_url' => $request->image_url,
            'rarity' => $request->rarity,
            'element_combination' => $request->element_combination,
            'properties' => $request->properties ?? $resource->properties,
            'base_gathering_time' => $request->base_gathering_time,
            'is_active' => $request->has('is_active') ? (bool)$request->is_active : $resource->is_active,
        ]);

        // Обновляем связи с локациями, если указаны
        if ($request->has('location_ids')) {
            try {
                $locationData = [];

                foreach ($request->location_ids as $locationId) {
                    // Явное преобразование и проверка типов данных
                    $spawnChance = (float)$request->input('spawn_chance.' . $locationId, 0.5);
                    $minAmount = (int)$request->input('min_amount.' . $locationId, 1);
                    $maxAmount = (int)$request->input('max_amount.' . $locationId, 3);

                    // Проверка валидности maxAmount (не меньше minAmount)
                    if ($maxAmount < $minAmount) {
                        $maxAmount = $minAmount;
                    }

                    $locationData[$locationId] = [
                        'spawn_chance' => $spawnChance,
                        'min_amount' => $minAmount,
                        'max_amount' => $maxAmount,
                    ];
                }

                // Логирование данных для отладки
                \Log::info('Обновление связей ресурса с локациями', [
                    'resource_id' => $resource->id,
                    'location_data' => $locationData
                ]);

                $resource->locations()->sync($locationData);
            } catch (\Exception $e) {
                \Log::error('Ошибка при обновлении связей ресурса с локациями', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);

                return response()->json([
                    'message' => 'Ресурс обновлен, но возникла ошибка при обновлении связей с локациями: ' . $e->getMessage(),
                    'resource' => $resource
                ], 500);
            }
        }

        return response()->json([
            'message' => 'Ресурс успешно обновлен',
            'resource' => $resource->fresh()->load('locations'),
        ]);
    }

    /**
     * Удалить ресурс
     */
    public function destroy($id)
    {
        $resource = Resource::findOrFail($id);

        // Удаляем связи с локациями перед удалением ресурса
        $resource->locations()->detach();

        $resource->delete();

        return response()->json([
            'message' => 'Ресурс успешно удален'
        ]);
    }

    /**
     * Управление элементами для рунической матрицы
     */
    public function manageElements(Request $request)
    {
        $elements = Element::all();

        return response()->json([
            'elements' => $elements
        ]);
    }

    /**
     * Создать новый элемент
     */
    public function storeElement(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Данные не прошли валидацию',
                'errors' => $validator->errors()
            ], 422);
        }

        $element = Element::create([
            'name' => $request->name,
            'icon' => $request->icon,
            'color' => $request->color,
            'description' => $request->description,
            'is_active' => $request->has('is_active') ? (bool)$request->is_active : true,
        ]);

        return response()->json([
            'message' => 'Элемент успешно создан',
            'element' => $element,
        ], 201);
    }

    /**
     * Обновить существующий элемент
     */
    public function updateElement(Request $request, $id)
    {
        $element = Element::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Данные не прошли валидацию',
                'errors' => $validator->errors()
            ], 422);
        }

        $element->update([
            'name' => $request->name,
            'icon' => $request->icon,
            'color' => $request->color,
            'description' => $request->description,
            'is_active' => $request->has('is_active') ? (bool)$request->is_active : $element->is_active,
        ]);

        return response()->json([
            'message' => 'Элемент успешно обновлен',
            'element' => $element->fresh(),
        ]);
    }

    /**
     * Удалить элемент
     */
    public function destroyElement($id)
    {
        $element = Element::findOrFail($id);

        // Проверяем, используется ли элемент в ресурсах
        $resourcesUsingElement = Resource::where('element_combination', 'like', '%"'.$element->id.'"%')->count();

        if ($resourcesUsingElement > 0) {
            return response()->json([
                'message' => 'Невозможно удалить элемент, который используется в ресурсах',
                'resources_count' => $resourcesUsingElement
            ], 400);
        }

        $element->delete();

        return response()->json([
            'message' => 'Элемент успешно удален'
        ]);
    }
}
