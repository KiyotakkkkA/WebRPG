<?php

namespace App\Http\Controllers;

use App\Models\Character;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CharacterController extends Controller
{
    /**
     * Получить всех персонажей текущего пользователя
     */
    public function index()
    {
        $user = Auth::user();
        $characters = Character::where('user_id', $user->id)->get();

        return response()->json([
            'characters' => $characters,
            'max_characters' => $user->max_characters,
            'remaining_slots' => $user->getRemainingCharacterSlots(),
            'can_create_more' => !$user->hasReachedCharacterLimit()
        ]);
    }

    /**
     * Создать нового персонажа
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Проверяем, достиг ли пользователь лимита персонажей
        if ($user->hasReachedCharacterLimit()) {
            return response()->json([
                'message' => 'Вы достигли максимального количества персонажей (' . $user->max_characters . ')',
                'error' => 'character_limit_reached',
                'max_characters' => $user->max_characters,
                'remaining_slots' => 0
            ], 403);
        }

        $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:20'],
            'class' => ['required', 'string', Rule::in(['paladin', 'berserker', 'crossbowman', 'elementalist', 'necromancer', 'priest'])],
        ]);

        // Получаем базовые характеристики для выбранного класса
        $baseStats = Character::getBaseStatsForClass($request->class);

        // Создаем персонажа
        $character = Character::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'class' => $request->class,
            'level' => 1,
            'experience' => 0,
            'exp_to_next_level' => $baseStats['exp_to_next_level'],
            'health' => $baseStats['health'],
            'max_health' => $baseStats['max_health'],
            'mana' => $baseStats['mana'],
            'max_mana' => $baseStats['max_mana'],
            'stamina' => $baseStats['stamina'],
            'max_stamina' => $baseStats['max_stamina'],
            'strength' => $baseStats['strength'],
            'agility' => $baseStats['agility'],
            'intelligence' => $baseStats['intelligence'],
            'speed' => $baseStats['speed'],
            'vitality' => $baseStats['vitality'],
            'luck' => $baseStats['luck'],
            'charisma' => $baseStats['charisma'],
            'wisdom' => $baseStats['wisdom'],
            'dexterity' => $baseStats['dexterity'],
            'constitution' => $baseStats['constitution'],
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Персонаж успешно создан',
            'character' => $character,
            'remaining_slots' => $user->getRemainingCharacterSlots()
        ], 201);
    }

    /**
     * Получить информацию о конкретном персонаже
     */
    public function show(Character $character)
    {
        // Проверяем, принадлежит ли персонаж текущему пользователю
        if ($character->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Доступ запрещен'
            ], 403);
        }

        return response()->json([
            'character' => $character
        ]);
    }

    /**
     * Обновить информацию о персонаже
     */
    public function update(Request $request, Character $character)
    {
        // Проверяем, принадлежит ли персонаж текущему пользователю
        if ($character->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Доступ запрещен'
            ], 403);
        }

        $request->validate([
            'name' => ['sometimes', 'required', 'string', 'min:3', 'max:20'],
        ]);

        $character->update($request->only('name'));

        return response()->json([
            'message' => 'Персонаж успешно обновлен',
            'character' => $character
        ]);
    }

    /**
     * Удалить персонажа
     */
    public function destroy(Character $character)
    {
        // Проверяем, принадлежит ли персонаж текущему пользователю
        if ($character->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Доступ запрещен'
            ], 403);
        }

        $character->delete();

        return response()->json([
            'message' => 'Персонаж успешно удален'
        ]);
    }

    /**
     * Временно увеличить скорость персонажа (например, при использовании зелья)
     */
    public function boostSpeed(Request $request, Character $character)
    {
        // Проверяем, принадлежит ли персонаж текущему пользователю
        if ($character->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Доступ запрещен'
            ], 403);
        }

        $request->validate([
            'boost_amount' => ['required', 'integer', 'min:1', 'max:10'],
            'duration' => ['required', 'integer', 'min:5', 'max:3600'], // в секундах (от 5 секунд до 1 часа)
        ]);

        // Сохраняем текущую скорость в кэше, чтобы восстановить ее после истечения времени
        $originalSpeed = $character->speed;
        $cacheKey = "character_{$character->id}_speed_boost";

        // Увеличиваем скорость
        $character->speed += $request->boost_amount;
        $character->save();

        // Сохраняем информацию о бусте в кэше
        \Cache::put($cacheKey, [
            'original_speed' => $originalSpeed,
            'expires_at' => now()->addSeconds($request->duration),
        ], $request->duration);

        // Запланируем задачу для возврата скорости к исходному значению
        // Примечание: для работы этого кода требуется настроенная очередь задач
        dispatch(function () use ($character, $originalSpeed, $cacheKey) {
            if (\Cache::has($cacheKey)) {
                $character->refresh(); // Получаем актуальные данные о персонаже
                $character->speed = $originalSpeed;
                $character->save();
                \Cache::forget($cacheKey);
            }
        })->delay(now()->addSeconds($request->duration));

        return response()->json([
            'message' => "Скорость персонажа увеличена на {$request->boost_amount} на {$request->duration} секунд",
            'character' => $character,
            'boost_expires_at' => now()->addSeconds($request->duration)->toDateTimeString()
        ]);
    }
}
