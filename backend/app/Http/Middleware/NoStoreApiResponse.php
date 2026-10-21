<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NoStoreApiResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        // Public images/files (posters, gallery) opt into caching themselves;
        // everything else, including all personal data, stays uncached.
        $publicFile = $request->is('api/public/*')
            && $response instanceof \Symfony\Component\HttpFoundation\BinaryFileResponse
            && $response->headers->hasCacheControlDirective('public');
        if (!$publicFile) $response->headers->set('Cache-Control', 'private, no-store, max-age=0');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        return $response;
    }
}
