<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\CharacterController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AdminLocationController;
use App\Http\Controllers\Admin\AdminResourceController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\SupportMessageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MapController;
use App\Http\Controllers\ElementController;

// Маршрут для обновления CSRF-токена
Route::get('/refresh-csrf', function () {
    return response()->json(['message' => 'CSRF token refreshed successfully']);
});

// Публичные маршруты для аутентификации и статистики - добавляем middleware web для поддержки сессий
Route::middleware(['web'])->group(function () {
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/register', [RegisterController::class, 'register']);
    Route::get('/user', [LoginController::class, 'user']);

    // Маршрут для получения статистики (публичный)
    Route::get('/statistics', [StatisticsController::class, 'getStatistics']);
});

// Защищенные маршруты (требуют аутентификации)
Route::middleware(['web', 'auth:sanctum'])->group(function () {
    Route::post('/logout', [LoginController::class, 'logout']);

    // Маршруты для работы с персонажами
    Route::get('/characters', [CharacterController::class, 'index']);
    Route::post('/characters', [CharacterController::class, 'store']);
    Route::get('/characters/{character}', [CharacterController::class, 'show']);
    Route::put('/characters/{character}', [CharacterController::class, 'update']);
    Route::delete('/characters/{character}', [CharacterController::class, 'destroy']);
    Route::post('/characters/{character}/boost-speed', [CharacterController::class, 'boostSpeed']);
    Route::post('/characters/tutorial-completed', [CharacterController::class, 'tutorialCompleted']);

    // Маршруты для работы с локациями
    Route::get('/locations', [LocationController::class, 'getAvailableLocations']);
    Route::get('/locations/connections', [LocationController::class, 'getLocationConnections']);
    Route::get('/locations/{location}', [LocationController::class, 'getLocation']);
    Route::post('/locations/move', [LocationController::class, 'moveToLocation']);

    // Маршруты для работы с ресурсами
    Route::get('/location-resources', [LocationController::class, 'getLocationResources']);
    Route::post('/resources/discover', [LocationController::class, 'discoverResource']);

    // Маршруты для службы поддержки
    Route::post('/support-messages', [SupportMessageController::class, 'store']);
    Route::get('/my-support-messages', [SupportMessageController::class, 'getUserMessages']);
    Route::post('/support-messages/{id}/rate', [SupportMessageController::class, 'rate']);

    // Маршруты для получения элементов (публичные)
    Route::get('/elements', [ElementController::class, 'getElements']);
    Route::get('/elements/{id}', [ElementController::class, 'getElement']);
});

// Маршруты для авторизованных сотрудников поддержки и администраторов
Route::middleware(['web', 'auth:sanctum', 'role:admin,support'])->group(function () {
    Route::get('/support-messages', [SupportMessageController::class, 'index']);
    Route::get('/support-messages/{id}', [SupportMessageController::class, 'show']);
    Route::put('/support-messages/{id}', [SupportMessageController::class, 'update']);
    Route::get('/support-messages-statistics', [SupportMessageController::class, 'getStatistics']);

    // Маршруты для взятия и освобождения сообщений от модерации
    Route::put('/support-messages/{id}/take-for-moderation', [SupportMessageController::class, 'takeForModeration']);
    Route::put('/support-messages/{id}/release-from-moderation', [SupportMessageController::class, 'releaseFromModeration']);
});

// Маршруты для админ-панели (требуют роли admin)
Route::middleware(['web', 'auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    // Получение информации для дэшборда админа
    Route::get('/dashboard', [AdminController::class, 'dashboard']);

    // Управление пользователями (только для root-администраторов - проверка происходит в контроллере)
    Route::get('/users', [AdminController::class, 'getAllUsers']);
    Route::put('/users/{userId}/role', [AdminController::class, 'updateUserRole']);

    // Управление регионами
    Route::get('/regions', [RegionController::class, 'index']);
    Route::post('/regions', [RegionController::class, 'store']);
    Route::get('/regions/{region}', [RegionController::class, 'show']);
    Route::put('/regions/{region}', [RegionController::class, 'update']);
    Route::delete('/regions/{region}', [RegionController::class, 'destroy']);

    // Управление локациями
    Route::get('/locations', [AdminLocationController::class, 'index']);
    Route::post('/locations', [AdminLocationController::class, 'store']);
    Route::get('/locations/{location}', [AdminLocationController::class, 'show']);
    Route::put('/locations/{location}', [AdminLocationController::class, 'update']);
    Route::delete('/locations/{location}', [AdminLocationController::class, 'destroy']);

    // Управление соединениями между локациями
    Route::get('/location-connections', [AdminLocationController::class, 'getConnections']);
    Route::post('/location-connections', [AdminLocationController::class, 'createConnection']);
    Route::put('/location-connections/{connection}', [AdminLocationController::class, 'updateConnection']);
    Route::delete('/location-connections/{connection}', [AdminLocationController::class, 'deleteConnection']);

    // Управление требованиями для локаций
    Route::get('/location-requirements/{location}', [AdminLocationController::class, 'getRequirements']);
    Route::post('/location-requirements', [AdminLocationController::class, 'createRequirement']);
    Route::put('/location-requirements/{requirement}', [AdminLocationController::class, 'updateRequirement']);
    Route::delete('/location-requirements/{requirement}', [AdminLocationController::class, 'deleteRequirement']);

    // Управление ресурсами
    Route::get('/resources', [AdminResourceController::class, 'index']);
    Route::post('/resources', [AdminResourceController::class, 'store']);
    Route::get('/resources/{resource}', [AdminResourceController::class, 'show']);
    Route::put('/resources/{resource}', [AdminResourceController::class, 'update']);
    Route::delete('/resources/{resource}', [AdminResourceController::class, 'destroy']);

    // Управление элементами для рунической матрицы
    Route::get('/elements', [AdminResourceController::class, 'manageElements']);
    Route::post('/elements', [AdminResourceController::class, 'storeElement']);
    Route::put('/elements/{element}', [AdminResourceController::class, 'updateElement']);
    Route::delete('/elements/{element}', [AdminResourceController::class, 'destroyElement']);
});

// Маршруты для карты
Route::get('/world-map', [MapController::class, 'getWorldMap']);
Route::get('/region-map/{regionId}', [MapController::class, 'getRegionMap']);
