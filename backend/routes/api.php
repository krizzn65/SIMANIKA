<?php

use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\OprecController as AdminOprecController;
use App\Http\Controllers\Admin\OprecRegistrantController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\ProfileController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Public\PublicEventController;
use App\Http\Controllers\Public\PublicOprecController;
use App\Http\Controllers\User\OprecRegistrationController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => response()->json(['status' => 'ok']));

Route::prefix('auth')->group(function () {
    Route::post('/register', RegisterController::class)->middleware('throttle:auth');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:auth');
    Route::post('/forgot-password', [PasswordController::class, 'forgot'])->middleware('throttle:password');
    Route::post('/reset-password', [PasswordController::class, 'reset'])->middleware('throttle:password');
});

Route::prefix('public')->group(function () {
    Route::get('/events', [PublicEventController::class, 'index']);
    Route::get('/events/{slug}', [PublicEventController::class, 'show']);
    Route::get('/oprec', [PublicOprecController::class, 'index']);
    Route::post('/oprec/{oprec}/result', [PublicOprecController::class, 'result'])->middleware('throttle:oprec-result');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [LoginController::class, 'destroy']);
    Route::get('/auth/me', [ProfileController::class, 'show']);
    Route::put('/auth/profile', [ProfileController::class, 'update']);
    Route::post('/auth/change-password', [PasswordController::class, 'change'])->middleware('throttle:password');
    Route::post('/user/oprec/register', [OprecRegistrationController::class, 'store'])->middleware('throttle:auth');

    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/events', [AdminEventController::class, 'index']);
        Route::post('/events', [AdminEventController::class, 'store']);
        Route::put('/events/{event}', [AdminEventController::class, 'update']);
        Route::delete('/events/{event}', [AdminEventController::class, 'destroy']);
        Route::get('/oprec', [AdminOprecController::class, 'index']);
        Route::post('/oprec', [AdminOprecController::class, 'store']);
        Route::put('/oprec/{oprec}', [AdminOprecController::class, 'update']);
        Route::get('/oprec/{oprec}/registrants', [OprecRegistrantController::class, 'index']);
        Route::put('/oprec/{oprec}/registrants/{registration}', [OprecRegistrantController::class, 'update']);
        Route::get('/oprec/{oprec}/registrants/{registration}/files/{field}', [OprecRegistrantController::class, 'download']);
    });
});
