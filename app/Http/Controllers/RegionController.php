<?php

namespace App\Http\Controllers;

use App\Models\Region;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class RegionController extends Controller
{
    /**
     * Конструктор контроллера
     *
     * Защита маршрутов через middleware auth и role
     */
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'role:admin']);
    }

    /**
     * Отображение списка всех регионов.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $regions = Region::orderBy('name', 'asc')
            ->get();

        return response()->json($regions);
    }

    /**
     * Показать форму создания нового региона.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        // REST API не использует separate методы для форм
        abort(404);
    }

    /**
     * Сохранение нового региона.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:regions,name',
            'description' => 'nullable|string',
            'is_accessible' => 'boolean',
            'icon' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Создание нового региона
        $region = Region::create([
            'name' => $request->name,
            'description' => $request->description,
            'is_accessible' => $request->has('is_accessible') ? $request->is_accessible : true,
            'icon' => $request->icon,
        ]);

        return response()->json([
            'message' => 'Регион успешно создан',
            'region' => $region
        ], 201);
    }

    /**
     * Отображение указанного региона.
     *
     * @param  \App\Models\Region  $region
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Region $region)
    {
        // Загрузим связанные локации для полноты данных
        $region->load('locations');

        return response()->json($region);
    }

    /**
     * Показать форму редактирования указанного региона.
     *
     * @param  \App\Models\Region  $region
     * @return \Illuminate\Http\Response
     */
    public function edit(Region $region)
    {
        // REST API не использует separate методы для форм
        abort(404);
    }

    /**
     * Обновление указанного региона.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Region  $region
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, Region $region)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:regions,name,'.$region->id,
            'description' => 'nullable|string',
            'is_accessible' => 'boolean',
            'icon' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Обновление региона
        $region->update($request->all());

        return response()->json([
            'message' => 'Регион успешно обновлен',
            'region' => $region
        ]);
    }

    /**
     * Удаление указанного региона.
     *
     * @param  \App\Models\Region  $region
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Region $region)
    {
        // Проверяем, есть ли локации в этом регионе
        $locationsCount = $region->locations()->count();

        if ($locationsCount > 0) {
            return response()->json([
                'message' => 'Невозможно удалить регион, так как он содержит локации',
                'locations_count' => $locationsCount
            ], 422);
        }

        $region->delete();

        return response()->json([
            'message' => 'Регион успешно удален'
        ]);
    }
}
