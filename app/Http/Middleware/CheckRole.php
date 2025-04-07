<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Обработка входящего запроса.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role = null): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Необходима аутентификация'], 401);
        }

        // Проверка роли, если она указана в формате "role:{role_name}"
        if ($role) {
            $parts = explode(':', $role);

            if (count($parts) === 2 && $parts[0] === 'role') {
                $roleName = $parts[1];

                if (!$request->user()->hasRole($roleName)) {
                    return response()->json(['message' => 'Недостаточно прав для выполнения действия'], 403);
                }
            }
        }

        return $next($request);
    }
}
