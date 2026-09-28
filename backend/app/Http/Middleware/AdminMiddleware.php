<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next, string $area = 'console'): Response
    {
        abort_unless($request->user()?->canAccessArea($area), 403);
        return $next($request);
    }
}
