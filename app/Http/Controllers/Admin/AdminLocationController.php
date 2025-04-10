<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\LocationConnection;
use App\Models\LocationRequirement;
use App\Models\LocationObject;
use App\Models\LocationResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AdminLocationController extends Controller
{
    /**
     * Получить список всех локаций для админ-панели
     */
    public function index()
    {
        $locations = Location::with('region')
            ->withCount([
                'connectedLocations',
                'requirements',
                'objects',
                'resources'
            ])->get();

        return response()->json($locations);
    }

    /**
     * Получить детальную информацию о локации
     */
    public function show(Location $location)
    {
        $location->load([
            'region',
            'connectedLocations',
            'connectedFrom',
            'requirements',
            'objects',
            'resources'
        ]);

        return response()->json($location);
    }

    /**
     * Создать новую локацию
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'danger_level' => 'required|integer|min:1|max:10',
            'is_default' => 'required|in:true,false,0,1',
            'is_discoverable' => 'required|in:true,false,0,1',
            'position_x' => 'required|numeric',
            'position_y' => 'required|numeric',
            'region_id' => 'nullable|exists:regions,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        // Преобразуем строковые значения в булевы
        $validated['is_default'] = filter_var($validated['is_default'], FILTER_VALIDATE_BOOLEAN);
        $validated['is_discoverable'] = filter_var($validated['is_discoverable'], FILTER_VALIDATE_BOOLEAN);

        // Если загружено изображение, сохраняем его
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();

            // Проверяем существование директории и создаем ее при необходимости
            $uploadPath = public_path('images/locations');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }

            $image->move($uploadPath, $imageName);
            $validated['image_url'] = 'images/locations/' . $imageName;
        } else {
            $validated['image_url'] = 'images/locations/default.jpg';
        }

        // Если локация устанавливается как стартовая, сначала снимаем этот статус со всех других локаций
        if ($validated['is_default']) {
            Location::where('is_default', true)->update(['is_default' => false]);
        }

        $location = Location::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Локация успешно создана',
            'location' => $location
        ], 201);
    }

    /**
     * Обновить локацию
     */
    public function update(Request $request, $id)
    {
        $location = Location::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'danger_level' => 'required|integer|min:1|max:10',
            'is_default' => 'required|in:true,false,0,1',
            'is_discoverable' => 'required|in:true,false,0,1',
            'position_x' => 'required|numeric',
            'position_y' => 'required|numeric',
            'region_id' => 'nullable|exists:regions,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        // Преобразуем строковые значения в булевы
        $validated['is_default'] = filter_var($validated['is_default'], FILTER_VALIDATE_BOOLEAN);
        $validated['is_discoverable'] = filter_var($validated['is_discoverable'], FILTER_VALIDATE_BOOLEAN);

        // Если загружено новое изображение, сохраняем его
        if ($request->hasFile('image')) {
            // Удаляем старое изображение, если оно не является дефолтным
            if ($location->image_url !== 'images/locations/default.jpg' && file_exists(public_path($location->image_url))) {
                try {
                    unlink(public_path($location->image_url));
                } catch (\Exception $e) {
                    // Логируем ошибку, но продолжаем выполнение
                    \Log::error('Не удалось удалить старое изображение: ' . $e->getMessage());
                }
            }

            $image = $request->file('image');
            $imageName = time() . '_' . $image->getClientOriginalName();

            // Проверяем существование директории и создаем ее при необходимости
            $uploadPath = public_path('images/locations');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }

            $image->move($uploadPath, $imageName);
            $validated['image_url'] = 'images/locations/' . $imageName;
        }

        // Если локация устанавливается как стартовая, сначала снимаем этот статус со всех других локаций
        if ($validated['is_default'] && !$location->is_default) {
            Location::where('is_default', true)->update(['is_default' => false]);
        }

        $location->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Локация успешно обновлена',
            'location' => $location
        ]);
    }

    /**
     * Удалить локацию
     */
    public function destroy(Location $location)
    {
        // Проверяем, не является ли локация стартовой
        if ($location->is_default) {
            return response()->json([
                'message' => 'Невозможно удалить стартовую локацию'
            ], 422);
        }

        // Удаляем связи с другими локациями
        DB::table('location_connections')
            ->where('from_location_id', $location->id)
            ->orWhere('to_location_id', $location->id)
            ->delete();

        // Удаляем требования, объекты и ресурсы
        $location->requirements()->delete();
        $location->objects()->delete();
        $location->resources()->delete();

        // Удаляем локацию
        $location->delete();

        return response()->json([
            'message' => 'Локация и все связанные с ней данные успешно удалены'
        ]);
    }

    /**
     * Получить все соединения между локациями
     */
    public function getConnections()
    {
        $connections = LocationConnection::with(['fromLocation', 'toLocation'])->get();
        \Log::info('Connections:', ['connections' => $connections]);

        return response()->json($connections);
    }

    /**
     * Создать новое соединение между локациями
     */
    public function createConnection(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'from_location_id' => 'required|exists:locations,id',
            'to_location_id' => 'required|exists:locations,id|different:from_location_id',
            'is_bidirectional' => 'boolean',
            'travel_time' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Проверка на существование соединения
        $existingConnection = LocationConnection::where([
            'from_location_id' => $request->from_location_id,
            'to_location_id' => $request->to_location_id,
        ])->first();

        if ($existingConnection) {
            return response()->json([
                'message' => 'Соединение между этими локациями уже существует'
            ], 422);
        }

        $connection = LocationConnection::create($request->all());

        // Если соединение двунаправленное, создаем и обратное соединение
        if ($request->is_bidirectional) {
            LocationConnection::create([
                'from_location_id' => $request->to_location_id,
                'to_location_id' => $request->from_location_id,
                'is_bidirectional' => true,
                'travel_time' => $request->travel_time,
            ]);
        }

        return response()->json([
            'message' => 'Соединение между локациями успешно создано',
            'connection' => $connection
        ], 201);
    }

    /**
     * Обновить соединение между локациями
     */
    public function updateConnection(Request $request, $connectionId)
    {
        $connection = LocationConnection::findOrFail($connectionId);

        $validator = Validator::make($request->all(), [
            'is_bidirectional' => 'boolean',
            'travel_time' => 'sometimes|required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $oldBidirectional = $connection->is_bidirectional;
        $connection->update($request->all());

        // Если изменилась двунаправленность
        if ($oldBidirectional !== $request->is_bidirectional) {
            if ($request->is_bidirectional) {
                // Создаем обратное соединение, если его нет
                $reverseConnection = LocationConnection::firstOrCreate(
                    [
                        'from_location_id' => $connection->to_location_id,
                        'to_location_id' => $connection->from_location_id,
                    ],
                    [
                        'is_bidirectional' => true,
                        'travel_time' => $request->travel_time ?? $connection->travel_time,
                    ]
                );
            } else {
                // Удаляем обратное соединение, если оно есть
                LocationConnection::where([
                    'from_location_id' => $connection->to_location_id,
                    'to_location_id' => $connection->from_location_id,
                ])->delete();
            }
        } elseif ($request->is_bidirectional) {
            // Обновляем время в обратном соединении
            LocationConnection::where([
                'from_location_id' => $connection->to_location_id,
                'to_location_id' => $connection->from_location_id,
            ])->update(['travel_time' => $request->travel_time ?? $connection->travel_time]);
        }

        return response()->json([
            'message' => 'Соединение между локациями успешно обновлено',
            'connection' => $connection
        ]);
    }

    /**
     * Удалить соединение между локациями
     */
    public function deleteConnection($connectionId)
    {
        $connection = LocationConnection::findOrFail($connectionId);

        // Если соединение двунаправленное, удаляем и обратное соединение
        if ($connection->is_bidirectional) {
            LocationConnection::where([
                'from_location_id' => $connection->to_location_id,
                'to_location_id' => $connection->from_location_id,
            ])->delete();
        }

        $connection->delete();

        return response()->json([
            'message' => 'Соединение между локациями успешно удалено'
        ]);
    }

    /**
     * Получить требования для локации
     */
    public function getRequirements(Location $location)
    {
        $requirements = $location->requirements;

        return response()->json($requirements);
    }

    /**
     * Создать новое требование для локации
     */
    public function createRequirement(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'location_id' => 'required|exists:locations,id',
            'type' => 'required|string',
            'parameter' => 'required|string',
            'value' => 'required',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $requirement = LocationRequirement::create($request->all());

        return response()->json([
            'message' => 'Требование для локации успешно создано',
            'requirement' => $requirement
        ], 201);
    }

    /**
     * Обновить требование для локации
     */
    public function updateRequirement(Request $request, $requirementId)
    {
        $requirement = LocationRequirement::findOrFail($requirementId);

        $validator = Validator::make($request->all(), [
            'type' => 'sometimes|required|string',
            'parameter' => 'sometimes|required|string',
            'value' => 'sometimes|required',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $requirement->update($request->all());

        return response()->json([
            'message' => 'Требование для локации успешно обновлено',
            'requirement' => $requirement
        ]);
    }

    /**
     * Удалить требование для локации
     */
    public function deleteRequirement($requirementId)
    {
        $requirement = LocationRequirement::findOrFail($requirementId);
        $requirement->delete();

        return response()->json([
            'message' => 'Требование для локации успешно удалено'
        ]);
    }
}
