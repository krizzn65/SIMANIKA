<?php

namespace App\Http\Middleware;

use App\Http\Controllers\Admin\OprecAnnouncementController;
use App\Http\Controllers\Admin\OprecAssessmentController;
use App\Http\Controllers\Admin\OprecController;
use App\Http\Controllers\Admin\OprecWrittenTestController;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OprecAccessMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()->effectiveRole() === User::ROLE_LEADER) {
            $action = $request->route()->getActionName();
            // Assessment actions enforce assignment and write permissions themselves.
            $assessment = str_starts_with($action, OprecAssessmentController::class.'@');
            $summary = $request->isMethod('GET') && in_array($action, [
                OprecController::class.'@index', OprecController::class.'@show',
                OprecWrittenTestController::class.'@index',
                OprecAnnouncementController::class.'@index', OprecAnnouncementController::class.'@show',
                OprecAnnouncementController::class.'@poster',
            ], true);
            // Legacy participant/file endpoints belong to management. Reviewers use
            // the assessment endpoints, which filter private data and check assignment.
            abort_unless($assessment || $summary, 403);
        }
        return $next($request);
    }
}
