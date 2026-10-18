<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_sends_verification_and_blocks_account_features(): void
    {
        Notification::fake();

        $this->postJson('/api/auth/register', [
            'email' => 'baru@example.test',
            'password' => 'kata-sandi-yang-kuat',
        ])->assertCreated()->assertJsonPath('data.emailVerifiedAt', null);

        $user = User::where('email', 'baru@example.test')->firstOrFail();
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->getJson('/api/user/dashboard')->assertForbidden();
        $this->postJson('/api/auth/logout')->assertOk();
        $this->postJson('/api/auth/login', [
            'email' => 'baru@example.test',
            'password' => 'kata-sandi-yang-kuat',
        ])->assertOk()->assertJsonPath('data.emailVerifiedAt', null);
        $this->getJson('/api/user/dashboard')->assertForbidden();
        $this->postJson('/api/auth/email/resend')->assertOk();
        Notification::assertSentTo($user, VerifyEmail::class, 2);

        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), [
            'id' => $user->getKey(),
            'hash' => sha1($user->getEmailForVerification()),
        ]);
        $this->get($url)->assertRedirect('http://localhost:3000/verify-email?status=success');
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->actingAs($user->fresh());
        $this->getJson('/api/user/dashboard')->assertOk();
    }

    public function test_invalid_verification_link_is_rejected(): void
    {
        $user = User::create(['email' => 'valid@example.test', 'password' => 'kata-sandi-yang-kuat']);
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), [
            'id' => $user->getKey(),
            'hash' => sha1('wrong@example.test'),
        ]);

        $this->get($url)->assertForbidden();
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_changing_email_requires_verification_again(): void
    {
        Notification::fake();
        $user = User::create(['email' => 'lama@example.test', 'password' => 'kata-sandi-yang-kuat']);
        $user->markEmailAsVerified();

        $this->actingAs($user)->putJson('/api/auth/profile', ['email' => 'baru@example.test'])
            ->assertOk()->assertJsonPath('data.emailVerifiedAt', null);

        Notification::assertSentTo($user, VerifyEmail::class);
        $this->getJson('/api/user/dashboard')->assertForbidden();
    }
}
