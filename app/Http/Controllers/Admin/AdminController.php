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
                           ->get(['id', 'name', 'email', 'role', 'created_at']);

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
}
