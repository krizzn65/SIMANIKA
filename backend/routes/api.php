<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\EventGuidebookController;
use App\Http\Controllers\Admin\EventFormController;
use App\Http\Controllers\Admin\EventRegistrantController;
use App\Http\Controllers\Admin\OprecController as AdminOprecController;
use App\Http\Controllers\Admin\OprecRegistrantController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\ProfileController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Public\PublicEventController;
use App\Http\Controllers\Public\PublicOprecController;
use App\Http\Controllers\User\OprecRegistrationController;
use App\Http\Controllers\User\OprecEnrollmentController;
use App\Http\Controllers\User\OprecWorkspaceController;
use App\Http\Controllers\User\EventRegistrationController;
use App\Http\Controllers\User\EventEnrollmentController;
use App\Http\Controllers\User\CreateEventTeamController;
use App\Http\Controllers\User\JoinEventTeamController;
use App\Http\Controllers\User\DashboardController;
use App\Http\Controllers\User\EventWorkspaceController;
use App\Http\Controllers\User\EventGroupSubmissionController;
use App\Http\Controllers\User\TeamMemberController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => response()->json(['status' => 'ok']));

Route::prefix('auth')->group(function () {
    Route::post('/register', RegisterController::class)->middleware('throttle:auth');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:auth');
    Route::post('/forgot-password', [PasswordController::class, 'forgot'])->middleware('throttle:password');
    Route::post('/reset-password', [PasswordController::class, 'reset'])->middleware('throttle:password');
});

Route::prefix('public')->group(function () {
    Route::get('/events/posters/{filename}', [PublicEventController::class, 'poster'])->name('public.event-poster');
    Route::get('/events/guidebooks/{filename}', [EventGuidebookController::class, 'download'])->name('public.event-guidebook');
    Route::get('/events', [PublicEventController::class, 'index']);
    Route::get('/events/{slug}', [PublicEventController::class, 'show']);
    Route::get('/oprec/posters/{filename}', [PublicOprecController::class, 'poster'])->name('public.oprec-poster');
    Route::get('/oprec', [PublicOprecController::class, 'index']);
    Route::post('/oprec/{oprec}/result', [PublicOprecController::class, 'result'])->middleware('throttle:oprec-result');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user/dashboard', DashboardController::class);
    Route::get('/user/events/{event}/workspace', [EventWorkspaceController::class, 'show']);
    Route::post('/user/events/{event}/groups/{group}/submit', [EventGroupSubmissionController::class, 'store'])->middleware('throttle:auth');
    Route::get('/user/events/{event}/groups/{group}/files/{field}', [EventGroupSubmissionController::class, 'download'])->name('user.event-group-file');
    Route::get('/user/events/{event}/files/{field}', [EventWorkspaceController::class, 'download'])->name('user.event-file');
    Route::post('/user/events/{event}/teams/{team}/members/{member}', TeamMemberController::class)->whereNumber(['team', 'member'])->middleware('throttle:auth');
    Route::post('/auth/logout', [LoginController::class, 'destroy']);
    Route::get('/auth/me', [ProfileController::class, 'show']);
    Route::put('/auth/profile', [ProfileController::class, 'update']);
    Route::post('/auth/change-password', [PasswordController::class, 'change'])->middleware('throttle:password');
    Route::post('/user/oprec/register', [OprecRegistrationController::class, 'store'])->middleware('throttle:auth');
    Route::post('/user/oprec/enroll', OprecEnrollmentController::class)->middleware('throttle:auth');
    Route::get('/user/oprec/workspace', [OprecWorkspaceController::class, 'show']);
    Route::post('/user/events/{event}/register', [EventRegistrationController::class, 'store'])->middleware('throttle:auth');
    Route::post('/user/events/{event}/enroll', EventEnrollmentController::class)->middleware('throttle:auth');
    Route::post('/user/events/{event}/create-team', CreateEventTeamController::class)->middleware('throttle:auth');
    Route::post('/user/events/{event}/join-team', JoinEventTeamController::class)->middleware('throttle:auth');

    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{id}', [AdminUserController::class, 'show']);
        Route::put('/users/{id}', [AdminUserController::class, 'update']);
        Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
        Route::get('/events', [AdminEventController::class, 'index']);
        Route::get('/events/{event}', [EventFormController::class, 'show']);
        Route::put('/events/{event}/form', [EventFormController::class, 'save']);
        Route::post('/events/{event}/publish', [EventFormController::class, 'publish']);
        Route::get('/events/{event}/registrants', [EventRegistrantController::class, 'index']);
        Route::get('/events/{event}/registrants/{kind}/{id}/files/{field}', [EventRegistrantController::class, 'download'])->name('admin.event-file');
        Route::post('/events', [AdminEventController::class, 'store']);
        Route::post('/events/upload-poster', [AdminEventController::class, 'uploadPoster']);
        Route::post('/events/upload-guidebook', [EventGuidebookController::class, 'upload']);
        Route::put('/events/{event}', [AdminEventController::class, 'update']);
        Route::delete('/events/{event}', [AdminEventController::class, 'destroy']);
        Route::get('/oprec', [AdminOprecController::class, 'index']);
        Route::get('/oprec/{oprec}', [AdminOprecController::class, 'show']);
        Route::post('/oprec', [AdminOprecController::class, 'store']);
        Route::post('/oprec/upload-poster', [AdminOprecController::class, 'uploadPoster']);
        Route::post('/oprec/upload-logo', [AdminOprecController::class, 'uploadLogo']);
        Route::put('/oprec/{oprec}', [AdminOprecController::class, 'update']);
        Route::delete('/oprec/{oprec}', [AdminOprecController::class, 'destroy']);
        Route::get('/oprec/{oprec}/registrants', [OprecRegistrantController::class, 'index']);
        Route::put('/oprec/{oprec}/registrants/{registration}', [OprecRegistrantController::class, 'update']);
        Route::get('/oprec/{oprec}/registrants/{registration}/files/{field}', [OprecRegistrantController::class, 'download']);
    });
});
