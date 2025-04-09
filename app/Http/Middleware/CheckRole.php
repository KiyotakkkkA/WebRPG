<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        // Проверяем, авторизован ли пользователь
        if (!Auth::check()) {
            return response()->json(['message' => 'Неавторизованный доступ'], 401);
        }

        // Получаем текущего пользователя
        $user = Auth::user();

        // Преобразуем аргументы в массив ролей
        // Поддержка как role:admin,support, так и role:admin|support
        $allowedRoles = [];
        foreach ($roles as $role) {
            if (str_contains($role, ',')) {
                $allowedRoles = array_merge($allowedRoles, explode(',', $role));
            } elseif (str_contains($role, '|')) {
                $allowedRoles = array_merge($allowedRoles, explode('|', $role));
            } else {
                $allowedRoles[] = $role;
            }
        }

        // Проверяем, имеет ли пользователь одну из разрешенных ролей
        foreach ($allowedRoles as $role) {
            if ($user->role === $role) {
                return $next($request);
            }
        }

        // Если у пользователя нет разрешенной роли, возвращаем ошибку доступа
        return response()->json(['message' => 'Доступ запрещен'], 403);
    }
}
