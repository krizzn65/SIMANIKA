<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthEmailTemplateTest extends TestCase
{
    public function test_verification_email_uses_simanika_design_and_keeps_signed_link(): void
    {
        $user = new User(['name' => '<script>alert(1)</script>', 'email' => 'baru@example.test']);
        $user->id = 42;

        $message = (new VerifyEmail)->toMail($user);
        $html = view($message->view['html'], $message->viewData)->render();
        $text = view($message->view['text'], $message->viewData)->render();

        $this->assertSame('Verifikasi email akun SIMANIKA', $message->subject);
        $this->assertStringContainsString('Satu langkah lagi.', $html);
        $this->assertStringContainsString('SIMANIKA', $html);
        $this->assertStringContainsString('api/auth/email/verify/42/', html_entity_decode($html));
        $this->assertStringContainsString($message->actionUrl, $text);
        $this->assertStringNotContainsString('<script>alert(1)</script>', $html);

        config()->set('mail.default', 'array');
        $user->notify(new VerifyEmail);
        $sent = Mail::mailer('array')->getSymfonyTransport()->messages()->first()->getOriginalMessage();
        $this->assertStringContainsString('Satu langkah lagi.', $sent->getHtmlBody());
        $this->assertStringContainsString('Verifikasi email', $sent->getTextBody());
    }

    public function test_password_reset_email_uses_simanika_design_and_public_link(): void
    {
        config()->set('app.frontend_url', 'https://himanika.wsmif.myhost.id');
        $user = new User(['name' => 'Pengguna Uji', 'email' => 'pemilik@example.test']);

        $message = (new ResetPassword('sample-token'))->toMail($user);
        $html = view($message->view['html'], $message->viewData)->render();
        $text = view($message->view['text'], $message->viewData)->render();

        $this->assertSame('Atur ulang kata sandi SIMANIKA', $message->subject);
        $this->assertStringContainsString('Atur ulang kata sandimu.', $html);
        $this->assertStringStartsWith('https://himanika.wsmif.myhost.id/reset-password?', $message->actionUrl);
        $this->assertStringContainsString('email=pemilik%40example.test', $message->actionUrl);
        $this->assertStringContainsString($message->actionUrl, $text);
        $this->assertStringContainsString('60 menit', $html);
    }
}
