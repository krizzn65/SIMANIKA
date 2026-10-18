<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\User;
use App\Support\SearchSql;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseCompatibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_json_defaults_search_and_announcement_schedule_work_on_selected_database(): void
    {
        $oprecId = DB::table('oprecs')->insertGetId(['periode' => 'Compatibility', 'status' => 'closed']);
        $oprec = Oprec::findOrFail($oprecId);
        $this->assertSame([], $oprec->form_fields);
        $this->assertSame([], $oprec->faq);

        $oprec->pengumuman_tanggal = '2026-10-17T15:30:00+07:00';
        $oprec->save();
        $this->assertSame('2026-10-17T15:30:00+07:00', $oprec->fresh()->pengumuman_tanggal->toIso8601String());

        $user = $this->verifiedUser(['email' => 'compatibility@example.test', 'password' => 'password-testing-123']);
        OprecRegistration::create([
            'oprec_id' => $oprecId, 'user_id' => $user->id, 'nim' => 'E12345',
            'tanggal_lahir' => '2004-01-01', 'form_data' => ['nama' => 'Nama_Khusus'],
        ]);
        $this->assertSame(1, OprecRegistration::whereRaw(SearchSql::lowerLike('form_data->nama'), ['%nama\\_khusus%'])->count());
        $this->assertSame(0, OprecRegistration::whereRaw(SearchSql::lowerLike('form_data->nama'), ['%nama\\%khusus%'])->count());
    }
}
