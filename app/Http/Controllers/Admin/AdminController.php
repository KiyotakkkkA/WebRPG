<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Character;
use App\Models\Location;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Получить статистику для дэшборда админ-панели
     */
    public function dashboard()
    {
        $totalUsers = User::count();
        $totalCharacters = Character::count();
        $totalLocations = Location::count();
        $activeCharacters = Character::where('is_active', true)->count();

        // Последние зарегистрированные пользователи
        $recentUsers = User::orderBy('created_at', 'desc')
                           ->take(5)
                           ->get(['id', 'name', 'email', 'role', 'is_root', 'created_at']);

        // Самые популярные локации
        $popularLocations = Location::withCount('characters as visitors_count')
                                   ->orderBy('visitors_count', 'desc')
                                   ->take(5)
                                   ->get(['id', 'name', 'description', 'danger_level']);

        return response()->json([
            'statistics' => [
                'total_users' => $totalUsers,
                'total_characters' => $totalCharacters,
                'total_locations' => $totalLocations,
                'active_characters' => $activeCharacters,
            ],
            'recent_users' => $recentUsers,
            'popular_locations' => $popularLocations,
        ]);
    }

    /**
     * Получить список всех пользователей
     */
    public function getAllUsers()
    {
        // Проверяем, что текущий пользователь является root-администратором
        $currentUser = auth()->user();
        if (!$currentUser || !$currentUser->isRootAdmin()) {
            return response()->json([
                'message' => 'Недостаточно прав для выполнения этой операции'
            ], 403);
        }

        // Получаем всех пользователей
        $users = User::orderBy('created_at', 'desc')
                    ->get(['id', 'name', 'email', 'role', 'is_root', 'created_at']);

        return response()->json([
            'users' => $users,
        ]);
    }

    /**
     * Обновить роль пользователя
     *
     * @param Request $request
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateUserRole(Request $request, $userId)
    {
        // Проверяем, что текущий пользователь является root-администратором
        $currentUser = auth()->user();
        if (!$currentUser || !$currentUser->isRootAdmin()) {
            return response()->json([
                'message' => 'Недостаточно прав для выполнения этой операции'
            ], 403);
        }

        // Валидация входных данных
        $request->validate([
            'role' => 'required|string|in:user,admin,support',
        ]);

        // Проверяем, что пользователь не меняет свою собственную роль
        if ((int)$userId === $currentUser->id) {
            return response()->json([
                'message' => 'Невозможно изменить свою собственную роль'
            ], 403);
        }

        // Находим пользователя
        $user = User::findOrFail($userId);

        // Обновляем роль
        $user->role = $request->role;

        // Если пользователю назначается роль admin, но не is_root
        if ($request->role === 'admin') {
            $user->is_root = false;
        }

        // Если пользователь не admin, убираем флаг is_root
        if ($request->role !== 'admin') {
            $user->is_root = false;
        }

        $user->save();

        return response()->json([
            'message' => 'Роль пользователя успешно обновлена',
            'user' => $user
        ]);
    }
}
