<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\EventGuidebookController;
use App\Http\Controllers\OprecWrittenTestFileController;
use App\Http\Controllers\Admin\EventFormController;
use App\Http\Controllers\Admin\EventRegistrantController;
use App\Http\Controllers\Admin\OprecController as AdminOprecController;
use App\Http\Controllers\Admin\OprecRegistrantController;
use App\Http\Controllers\Admin\OprecAssessmentController;
use App\Http\Controllers\Admin\OprecWrittenTestController;
use App\Http\Controllers\Admin\OprecWrittenTestSubmissionController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\ProfileController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Public\PublicEventController;
use App\Http\Controllers\Public\HomeContentController as PublicHomeContentController;
use App\Http\Controllers\Admin\HomeContentController as AdminHomeContentController;
use App\Http\Controllers\Public\PublicOprecController;
use App\Http\Controllers\User\OprecRegistrationController;
use App\Http\Controllers\User\OprecEnrollmentController;
use App\Http\Controllers\User\OprecWorkspaceController;
use App\Http\Controllers\User\OprecWrittenTestController as UserOprecWrittenTestController;
use App\Http\Controllers\User\EventRegistrationController;
use App\Http\Controllers\User\EventEnrollmentController;
use App\Http\Controllers\User\CreateEventTeamController;
use App\Http\Controllers\User\JoinEventTeamController;
use App\Http\Controllers\User\DashboardController;
use App\Http\Controllers\User\EventWorkspaceController;
use App\Http\Controllers\User\EventGroupSubmissionController;
use App\Http\Controllers\User\TeamMemberController;
use App\Http\Controllers\User\UserTestimonialController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => response()->json(['status' => 'ok']));

Route::prefix('auth')->group(function () {
    Route::post('/register', RegisterController::class)->middleware('throttle:auth');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:auth');
    Route::post('/forgot-password', [PasswordController::class, 'forgot'])->middleware('throttle:password');
    Route::post('/reset-password', [PasswordController::class, 'reset'])->middleware('throttle:password');
});

Route::prefix('public')->group(function () {
    Route::get('/home', [PublicHomeContentController::class, 'index']);
    Route::get('/home/images/{kind}/{filename}', [PublicHomeContentController::class, 'image'])->name('public.home-image');
    Route::get('/oprec/{oprec}/announcement', [\App\Http\Controllers\Public\OprecAnnouncementController::class, 'show']);
    Route::get('/oprec/{oprec}/guidebook', [PublicOprecController::class, 'guidebook'])->name('public.oprec-guidebook');
    Route::get('/oprec/{oprec}/examples/{field}', [PublicOprecController::class, 'questionExample'])->name('public.oprec-example');
    Route::get('/oprec/{oprec}/announcement/poster', [\App\Http\Controllers\Public\OprecAnnouncementController::class, 'poster']);
    Route::post('/oprec/{oprec}/announcement/verify', [\App\Http\Controllers\Public\OprecAnnouncementController::class, 'verify'])->middleware('throttle:oprec-announcement');
    Route::post('/oprec/{oprec}/announcement/result', [\App\Http\Controllers\Public\OprecAnnouncementController::class, 'result'])->middleware('throttle:oprec-result-view');
    Route::get('/events/posters/{filename}', [PublicEventController::class, 'poster'])->name('public.event-poster');
    Route::get('/events/guidebooks/{filename}', [EventGuidebookController::class, 'download'])->name('public.event-guidebook');
    Route::get('/gallery-albums', [\App\Http\Controllers\Public\GalleryAlbumController::class, 'index']);
    Route::get('/gallery-albums/{slug}', [\App\Http\Controllers\Public\GalleryAlbumController::class, 'show']);
    Route::get('/events', [PublicEventController::class, 'index']);
    Route::get('/events/{slug}', [PublicEventController::class, 'show']);
    Route::get('/oprec/posters/{filename}', [PublicOprecController::class, 'poster'])->name('public.oprec-poster');
    Route::get('/oprec', [PublicOprecController::class, 'index']);
    Route::get('/status', [\App\Http\Controllers\MaintenanceController::class, 'show']);
    Route::post('/oprec/{oprec}/result', [PublicOprecController::class, 'result'])->middleware('throttle:oprec-result');
});

Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::get('/user/dashboard', DashboardController::class);
    Route::get('/user/events/{event}/workspace', [EventWorkspaceController::class, 'show']);
    Route::post('/user/events/{event}/groups/{group}/submit', [EventGroupSubmissionController::class, 'store'])->middleware('throttle:auth');
    Route::get('/user/events/{event}/groups/{group}/files/{field}', [EventGroupSubmissionController::class, 'download'])->name('user.event-group-file');
    Route::get('/user/events/{event}/files/{field}', [EventWorkspaceController::class, 'download'])->name('user.event-file');
    Route::post('/user/events/{event}/teams/{team}/members/{member}', TeamMemberController::class)->whereNumber(['team', 'member'])->middleware('throttle:auth');
    Route::post('/auth/logout', [LoginController::class, 'destroy'])->withoutMiddleware('verified');
    Route::get('/auth/me', [ProfileController::class, 'show'])->withoutMiddleware('verified');
    Route::put('/auth/profile', [ProfileController::class, 'update'])->withoutMiddleware('verified');
    Route::post('/auth/change-password', [PasswordController::class, 'change'])->middleware('throttle:password')->withoutMiddleware('verified');
    Route::post('/auth/email/resend', [EmailVerificationController::class, 'resend'])->middleware('throttle:6,1')->withoutMiddleware('verified');
    Route::post('/user/oprec/register', [OprecRegistrationController::class, 'store'])->middleware('throttle:oprec-submission');
    Route::post('/user/oprec/enroll', OprecEnrollmentController::class)->middleware('throttle:oprec-submission');
    Route::get('/user/oprec/workspace', [OprecWorkspaceController::class, 'show']);
    Route::get('/user/oprec/{oprec}/written-test', [UserOprecWrittenTestController::class, 'show']);
    Route::get('/user/oprec/{oprec}/written-test/files/{field}', [OprecWrittenTestFileController::class, 'user']);
    Route::post('/user/oprec/{oprec}/written-test', [UserOprecWrittenTestController::class, 'submit'])->middleware('throttle:oprec-submission');
    Route::post('/user/events/{event}/register', [EventRegistrationController::class, 'store'])->middleware('throttle:auth');
    Route::post('/user/events/{event}/enroll', EventEnrollmentController::class)->middleware('throttle:auth');
    Route::post('/user/events/{event}/create-team', CreateEventTeamController::class)->middleware('throttle:auth');
    Route::post('/user/events/{event}/join-team', JoinEventTeamController::class)->middleware('throttle:auth');
    Route::get('/user/testimonial', [UserTestimonialController::class, 'show']);
    Route::post('/user/testimonial', [UserTestimonialController::class, 'store'])->middleware('throttle:6,1');

    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::middleware('admin:content')->prefix('home-content')->group(function () {
            Route::get('/', [AdminHomeContentController::class, 'index']);
            Route::put('/text', [AdminHomeContentController::class, 'updateText']);
            Route::post('/gallery/batch', [AdminHomeContentController::class, 'storeBatchGallery']);
            Route::post('/gallery', [AdminHomeContentController::class, 'storeGallery']);
            Route::post('/gallery/{id}', [AdminHomeContentController::class, 'updateGallery'])->whereNumber('id');
            Route::delete('/gallery/{id}', [AdminHomeContentController::class, 'destroyGallery'])->whereNumber('id');
            Route::post('/testimonials', [AdminHomeContentController::class, 'storeTestimonial']);
            Route::post('/testimonials/{id}', [AdminHomeContentController::class, 'updateTestimonial'])->whereNumber('id');
            Route::delete('/testimonials/{id}', [AdminHomeContentController::class, 'destroyTestimonial'])->whereNumber('id');
            Route::get('/testimonial-form', [AdminHomeContentController::class, 'testimonialForm']);
            Route::put('/testimonial-form', [AdminHomeContentController::class, 'updateTestimonialForm']);
            Route::patch('/testimonials/{id}/visibility', [AdminHomeContentController::class, 'toggleTestimonialVisibility'])->whereNumber('id');
            Route::patch('/testimonials/{id}/status', [AdminHomeContentController::class, 'updateTestimonialStatus'])->whereNumber('id');
        });
        Route::middleware('admin:content')->prefix('gallery-albums')->controller(\App\Http\Controllers\Admin\GalleryAlbumController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::put('/{id}', 'update')->whereNumber('id');
            Route::delete('/{id}', 'destroy')->whereNumber('id');
            Route::post('/{id}/photos', 'storePhotos')->whereNumber('id');
            Route::delete('/{id}/photos/{photo}', 'destroyPhoto')->whereNumber(['id', 'photo']);
        });
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->middleware('admin:dashboard');
        Route::middleware('admin:settings')->group(function () {
            Route::get('/maintenance', [\App\Http\Controllers\MaintenanceController::class, 'show']);
            Route::put('/maintenance', [\App\Http\Controllers\MaintenanceController::class, 'update']);
        });
        Route::middleware('admin:logs')->group(function () {
            Route::get('/logs', [AuditLogController::class, 'index']);
            Route::get('/logs/{entry}', [AuditLogController::class, 'show']);
        });

        Route::middleware('admin:users')->group(function () {
            Route::get('/users', [AdminUserController::class, 'index']);
            Route::get('/users/{id}', [AdminUserController::class, 'show']);
            Route::put('/users/{id}', [AdminUserController::class, 'update']);
            Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
        });

        Route::middleware('admin:events')->group(function () {
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
        });

        Route::middleware(['admin:oprec', \App\Http\Middleware\OprecAccessMiddleware::class])->group(function () {
            Route::get('/oprec/announcements', [\App\Http\Controllers\Admin\OprecAnnouncementController::class, 'index']);
            Route::get('/oprec/{oprec}/announcement', [\App\Http\Controllers\Admin\OprecAnnouncementController::class, 'show']);
            Route::post('/oprec/{oprec}/announcement', [\App\Http\Controllers\Admin\OprecAnnouncementController::class, 'save']);
            Route::get('/oprec/{oprec}/announcement/poster', [\App\Http\Controllers\Admin\OprecAnnouncementController::class, 'poster']);
            Route::get('/oprec', [AdminOprecController::class, 'index']);
            Route::get('/oprec/assessments', [OprecAssessmentController::class, 'periods']);
            Route::get('/oprec/{oprec}/assessment', [OprecAssessmentController::class, 'index']);
            Route::get('/oprec/{oprec}/assessment/assignments', [OprecAssessmentController::class, 'assignments']);
            Route::put('/oprec/{oprec}/assessment/assignments/{reviewer}', [OprecAssessmentController::class, 'setAssignment']);
            Route::delete('/oprec/{oprec}/assessment/assignments/{reviewer}', [OprecAssessmentController::class, 'revokeAssignment']);
            Route::patch('/oprec/{oprec}/assessment/registrations/{registration}/review', [OprecAssessmentController::class, 'saveReview']);
            Route::put('/oprec/{oprec}/assessment/registrations/{registration}/decision', [OprecAssessmentController::class, 'decide']);
            Route::get('/oprec/{oprec}/assessment/{submission}', [OprecAssessmentController::class, 'show']);
            Route::get('/oprec/{oprec}/assessment/{submission}/test-files/{field}', [OprecAssessmentController::class, 'testFile']);
            Route::get('/oprec/{oprec}/assessment/{submission}/registration-files/{field}', [OprecAssessmentController::class, 'registrationFile']);
            Route::get('/oprec/written-tests', [OprecWrittenTestController::class, 'index']);
            Route::get('/oprec/{oprec}', [AdminOprecController::class, 'show']);
            Route::get('/oprec/{oprec}/written-test', [OprecWrittenTestController::class, 'show']);
            Route::put('/oprec/{oprec}/written-test', [OprecWrittenTestController::class, 'save']);
            Route::post('/oprec/{oprec}/written-test', [OprecWrittenTestController::class, 'create']);
            Route::get('/oprec/{oprec}/written-test/submissions', [OprecWrittenTestSubmissionController::class, 'index']);
            Route::get('/oprec/{oprec}/written-test/submissions/{submission}', [OprecWrittenTestSubmissionController::class, 'show']);
            Route::get('/oprec/{oprec}/written-test/submissions/{submission}/files/{field}', [OprecWrittenTestFileController::class, 'admin']);
            Route::delete('/oprec/{oprec}/written-test/submissions/{submission}', [OprecWrittenTestSubmissionController::class, 'destroy']);
            Route::post('/oprec', [AdminOprecController::class, 'store']);
            Route::post('/oprec/upload-poster', [AdminOprecController::class, 'uploadPoster']);
            Route::post('/oprec/upload-guidebook', [AdminOprecController::class, 'uploadGuidebook']);
            Route::post('/oprec/upload-question-example', [AdminOprecController::class, 'uploadQuestionExample']);
            Route::post('/oprec/upload-logo', [AdminOprecController::class, 'uploadLogo']);
            Route::put('/oprec/{oprec}', [AdminOprecController::class, 'update']);
            Route::delete('/oprec/{oprec}', [AdminOprecController::class, 'destroy']);
            Route::get('/oprec/{oprec}/registrants', [OprecRegistrantController::class, 'index']);
            Route::get('/oprec/{oprec}/registrants/export/{format}', \App\Http\Controllers\Admin\OprecRegistrantExportController::class);
            Route::put('/oprec/{oprec}/registrants/{registration}/form', [OprecRegistrantController::class, 'updateForm']);
            Route::put('/oprec/{oprec}/registrants/{registration}', [OprecRegistrantController::class, 'update']);
            Route::delete('/oprec/{oprec}/registrants/{registration}', [OprecRegistrantController::class, 'destroy']);
            Route::get('/oprec/{oprec}/registrants/{registration}/files/{field}', [OprecRegistrantController::class, 'download']);
            Route::post('/oprec/{oprec}/registrants/{registration}/files/{field}', [OprecRegistrantController::class, 'restoreFile']);
        });
    });
});
