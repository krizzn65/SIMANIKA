<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class ApiIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_ping_and_empty_public_contracts(): void
    {
        $this->getJson('/api/ping')->assertOk()->assertExactJson(['status' => 'ok']);
        $this->getJson('/api/public/events')->assertOk()->assertJsonPath('meta.total', 0)->assertJsonCount(0, 'data');
        $this->getJson('/api/public/oprec')->assertOk()->assertExactJson(['data' => null]);
    }

    public function test_draft_event_is_not_public_and_published_event_matches_frontend_contract(): void
    {
        $start = now()->addDays(5);
        $event = Event::create(['slug' => 'uji-event', 'judul' => 'Uji Event', 'kategori' => 'workshop', 'tanggal_mulai' => $start, 'tanggal_selesai' => $start->copy()->addHours(2), 'status' => 'draft']);
        $this->getJson('/api/public/events')->assertJsonPath('meta.total', 0);
        $this->getJson('/api/public/events/uji-event')->assertNotFound();
        $event->update(['status' => 'published']);
        $this->getJson('/api/public/events')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.slug', 'uji-event');
        $this->getJson('/api/public/events/uji-event')->assertOk()->assertJsonPath('data.kategori', 'workshop');
    }

    public function test_password_reset_request_does_not_reveal_if_email_exists(): void
    {
        Notification::fake();
        $this->postJson('/api/auth/forgot-password', ['email' => 'tidak-ada@example.test'])->assertOk();
    }

    public function test_password_reset_revokes_existing_database_sessions(): void
    {
        config(['session.driver' => 'database']);
        $user = User::create(['email' => 'reset@example.test', 'password' => 'old-password-123']);
        DB::table('sessions')->insert([
            'id' => 'old-session',
            'user_id' => $user->id,
            'payload' => 'old',
            'last_activity' => now()->timestamp,
        ]);
        $token = Password::createToken($user);

        $this->postJson('/api/auth/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertOk();

        $this->assertDatabaseMissing('sessions', ['id' => 'old-session']);
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'old-password-123'])
            ->assertUnprocessable();
    }

    public function test_register_creates_normal_user_and_starts_session(): void
    {
        $this->withHeaders(['Origin' => 'http://localhost:3000', 'Referer' => 'http://localhost:3000/register'])
            ->postJson('/api/auth/register', ['email' => 'baru@example.test', 'password' => 'kata-sandi-yang-kuat'])
            ->assertCreated()->assertJsonPath('data.email', 'baru@example.test')->assertJsonPath('data.role', 'user');
        $this->assertDatabaseHas('users', ['email' => 'baru@example.test', 'role' => 'user']);
        $this->assertAuthenticated('web');
    }

    public function test_oprec_result_stays_closed_before_publication(): void
    {
        $oprec = Oprec::create(['periode' => '2026/2027', 'status' => 'closed', 'schema_version' => '1', 'form_fields' => [], 'faq' => [], 'pengumuman_published' => false]);
        $this->postJson("/api/public/oprec/{$oprec->id}/result", ['nim' => 'A1234', 'tanggal_lahir' => '2004-01-01'])->assertStatus(409);
    }

    public function test_admin_endpoint_rejects_normal_user(): void
    {
        $user = User::create(['email' => 'user@example.test', 'password' => 'password-yang-kuat']);
        $this->actingAs($user, 'sanctum')->getJson('/api/admin/events')->assertForbidden();
    }

    public function test_dashboard_only_returns_owners_registrations_and_hides_unpublished_oprec_result(): void
    {
        $owner = User::create(['email' => 'owner@example.test', 'password' => 'password-yang-kuat']);
        $other = User::create(['email' => 'other@example.test', 'password' => 'password-yang-kuat']);
        $event = Event::create([
            'slug' => 'lomba-uji', 'judul' => 'Lomba Uji', 'kategori' => 'competition',
            'tanggal_mulai' => now()->addDays(4), 'tanggal_selesai' => now()->addDays(5),
        ]);
        EventRegistration::create(['event_id' => $event->id, 'user_id' => $owner->id]);
        EventRegistration::create(['event_id' => $event->id, 'user_id' => $other->id]);
        $oprec = Oprec::create(['periode' => '2026/2027', 'schema_version' => '1', 'form_fields' => [], 'faq' => []]);
        OprecRegistration::create([
            'oprec_id' => $oprec->id, 'user_id' => $owner->id, 'nim' => 'E12345',
            'tanggal_lahir' => '2004-01-01', 'form_data' => [], 'status' => 'accepted',
        ]);

        $this->getJson('/api/user/dashboard')->assertUnauthorized();
        $this->actingAs($owner, 'sanctum')->getJson('/api/user/dashboard')
            ->assertOk()
            ->assertJsonCount(2, 'data.items')
            ->assertJsonFragment(['kind' => 'oprec', 'status' => 'pending'])
            ->assertDontSee('E12345');

        $oprec->update(['pengumuman_published' => true, 'pengumuman_tanggal' => now()->subMinute()]);
        $this->getJson('/api/user/dashboard')
            ->assertOk()
            ->assertJsonFragment(['kind' => 'oprec', 'status' => 'accepted']);
    }

    public function test_authenticated_user_can_logout_cleanly(): void
    {
        $user = User::create(['email' => 'logout-test@example.test', 'password' => 'password-yang-kuat']);
        $response = $this->actingAs($user, 'sanctum')->postJson('/api/auth/logout');
        $response->assertOk()->assertJson(['message' => 'Berhasil keluar.']);
    }

    public function test_personal_access_token_logout_revokes_only_current_token(): void
    {
        $user = User::create(['email' => 'token-logout@example.test', 'password' => 'password-yang-kuat']);
        $first = $user->createToken('first');
        $second = $user->createToken('second');

        $this->withToken($first->plainTextToken)->postJson('/api/auth/logout')->assertOk();

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $first->accessToken->id]);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $second->accessToken->id]);
    }

    public function test_login_profile_and_unauthenticated_guard(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();

        User::create(['email' => 'login@example.test', 'password' => 'password-yang-kuat']);
        $this->withHeaders(['Origin' => 'http://localhost:3000', 'Referer' => 'http://localhost:3000/login'])
            ->postJson('/api/auth/login', ['email' => 'login@example.test', 'password' => 'password-yang-kuat'])
            ->assertOk()->assertJsonPath('data.email', 'login@example.test');

        $this->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.email', 'login@example.test');
        $this->putJson('/api/auth/profile', ['name' => 'Mahasiswa Uji'])
            ->assertOk()->assertJsonPath('data.namaLengkap', 'Mahasiswa Uji');
        $this->putJson('/api/auth/profile', ['angkatan' => 1800])->assertUnprocessable();
    }
}
