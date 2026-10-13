<?php

namespace App\Http\Middleware;

use App\Services\AuditTrail;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpFoundation\Response;

class AuditTrailMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $audit = app(AuditTrail::class);
        $requestId = (string) Str::uuid();
        $request->attributes->set('audit_request_id', $requestId);
        try {
            $before = $audit->captureBefore($request);
        } catch (\Throwable) {
            $before = [];
        }
        try {
            $response = $next($request);
            $this->recordSafely($audit, $request, $response->getStatusCode(), $requestId, $before);
            $response->headers->set('X-Request-ID', $requestId);
            return $response;
        } catch (\Throwable $error) {
            $status = match (true) {
                $error instanceof ValidationException => $error->status,
                $error instanceof AuthenticationException => 401,
                $error instanceof AuthorizationException => 403,
                $error instanceof HttpExceptionInterface => $error->getStatusCode(),
                default => 500,
            };
            $this->recordSafely($audit, $request, $status, $requestId, $before, $error);
            throw $error;
        }
    }

    private function recordSafely(AuditTrail $audit, Request $request, int $status, string $requestId, array $before, ?\Throwable $error = null): void
    {
        try {
            $audit->record($request, $status, $requestId, $before, $error);
        } catch (\Throwable) {
            // Logging must never change the result of the original request.
        }
        $request->attributes->set('audit_recorded', true);
    }
}
