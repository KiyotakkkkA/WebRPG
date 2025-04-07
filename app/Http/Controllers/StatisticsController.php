<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Character;
use Illuminate\Http\Request;

class StatisticsController extends Controller
{
    /**
     * Получить статистику по игре
     */
    public function getStatistics()
    {
        // Количество пользователей
        $usersCount = User::count();

        // Количество персонажей (можно добавить другие статистики)
        $charactersCount = Character::count();

        // Форматируем числа для красивого отображения
        $formattedUsersCount = number_format($usersCount, 0, ',', ',');
        $formattedCharactersCount = number_format($charactersCount, 0, ',', ',');

        return response()->json([
            'users_count' => $formattedUsersCount,
            'characters_count' => $formattedCharactersCount,
            // Здесь можно добавить другие статистические данные
        ]);
    }
}
