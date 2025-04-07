<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\CharacterController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\LocationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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

    // Маршруты для работы с локациями
    Route::get('/locations', [LocationController::class, 'getAvailableLocations']);
    Route::get('/locations/connections', [LocationController::class, 'getLocationConnections']);
    Route::get('/locations/{location}', [LocationController::class, 'getLocation']);
    Route::post('/locations/move', [LocationController::class, 'moveToLocation']);
});
