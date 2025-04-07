<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    /**
     * Аутентификация пользователя
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            // Регенерируем сессию для защиты от атак фиксации сессии
            $request->session()->regenerate();

            // Явно обновляем CSRF токен
            $newToken = csrf_token();

            $user = Auth::user();

            return response()->json([
                'user' => $user,
                'message' => 'Вход выполнен успешно',
                'csrf_token' => $newToken // Отправляем новый токен клиенту
            ]);
        }

        throw ValidationException::withMessages([
            'email' => ['Предоставленные учетные данные не соответствуют нашим записям.'],
        ]);
    }

    /**
     * Выход пользователя
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $newToken = csrf_token();

        return response()->json([
            'message' => 'Выход выполнен успешно',
            'csrf_token' => $newToken
        ]);
    }

    /**
     * Получение информации о текущем аутентифицированном пользователе
     */
    public function user(Request $request)
    {
        if (Auth::check()) {
            return response()->json([
                'user' => Auth::user(),
                'isAuthenticated' => true
            ]);
        }

        return response()->json([
            'user' => null,
            'isAuthenticated' => false
        ]);
    }
}
