<?php

namespace App\Http\Middleware;

use App\Services\AuditTrail;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class AuditFailureMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $response = $next($request);
            if ($request->is('api/*') && ($response->getStatusCode() >= 500 || in_array($response->getStatusCode(), [401, 403, 429], true))) {
                $this->record($request, $response->getStatusCode(), $request->attributes->get('audit_exception'));
                if ($request->attributes->get('audit_request_id')) $response->headers->set('X-Request-ID', $request->attributes->get('audit_request_id'));
            }
            return $response;
        } catch (\Throwable $error) {
            if ($request->is('api/*')) {
                $status = match (true) {
                    $error instanceof ValidationException => $error->status,
                    $error instanceof AuthenticationException => 401,
                    $error instanceof AuthorizationException => 403,
                    $error instanceof HttpExceptionInterface => $error->getStatusCode(),
                    default => 500,
                };
                if ($status >= 500 || in_array($status, [401, 403, 429], true)) $this->record($request, $status, $error);
            }
            throw $error;
        }
    }

    private function record(Request $request, int $status, ?\Throwable $error = null): void
    {
        if ($request->attributes->get('audit_recorded')) return;
        $requestId = $request->attributes->get('audit_request_id') ?? (string) Str::uuid();
        $request->attributes->set('audit_request_id', $requestId);
        try {
            app(AuditTrail::class)->record($request, $status, $requestId, [], $error);
        } catch (\Throwable) {
            // Authentication and error responses must remain available even if logging fails.
        }
        $request->attributes->set('audit_recorded', true);
    }
}
