<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisterController extends Controller
{
    /**
     * Регистрация новых пользователей
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        Auth::login($user);

        // Регенерируем сессию для безопасности
        $request->session()->regenerate();

        // Явно обновляем CSRF токен
        $newToken = csrf_token();

        return response()->json([
            'user' => $user,
            'message' => 'Регистрация выполнена успешно',
            'csrf_token' => $newToken // Отправляем новый токен клиенту
        ]);
    }
}
