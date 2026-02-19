<?php

namespace App\Http\Middleware;

use App\Models\AuthorizationCode;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => '未提供授权码',
            ], 401);
        }

        $authCode = AuthorizationCode::where('code', $token)->first();

        if (!$authCode) {
            return response()->json([
                'success' => false,
                'message' => '授权码不存在',
            ], 401);
        }

        if (!$authCode->isValid()) {
            return response()->json([
                'success' => false,
                'message' => '授权码已过期或已禁用',
            ], 403);
        }

        // 将授权码附加到请求中
        $request->attributes->set('auth_code', $authCode);

        return $next($request);
    }
}
