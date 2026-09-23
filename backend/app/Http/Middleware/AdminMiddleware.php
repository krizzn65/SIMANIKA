<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // A database value alone is never sufficient. This blocks stale or
        // accidentally promoted accounts even before the cleanup migration runs.
        abort_unless($request->user()?->isOfficialAdmin(), 403);
        return $next($request);
    }
}
