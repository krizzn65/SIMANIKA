<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Team;
use Illuminate\Support\Facades\DB;

class EventWorkspaceService
{
    public function context(Event $event, int $userId): array
    {
        $membership = DB::table('team_members')->where('event_id', $event->id)->where('user_id', $userId)->first();
        $team = $membership ? $event->teams()->find($membership->team_id) : null;
        $registration = $event->tipe_pendaftaran === 'individu'
            ? $event->registrations()->where('user_id', $userId)->first() : null;
        $enrolled = DB::table('event_enrollments')->where('event_id', $event->id)->where('user_id', $userId)->exists();
        abort_unless($membership || $registration || $enrolled, 404);
        $isLeader = $team && (int) $team->ketua_id === $userId;
        $accepted = $membership?->status === 'accepted';
        return compact('team', 'registration', 'membership', 'isLeader', 'accepted');
    }

    public function data(Event $event, int $userId): array
    {
        $context = $this->context($event, $userId);
        ['team' => $team, 'registration' => $registration, 'membership' => $membership,
            'isLeader' => $isLeader, 'accepted' => $accepted] = $context;
        $fields = $event->formFields()->get();
        $canView = $event->tipe_pendaftaran === 'individu' || $accepted;
        $record = $team ?: $registration;
        $submitted = $team ? $team->form_submitted_at !== null : $registration !== null;
        $reason = app(TeamMembershipService::class)->lockReason($event, $team);
        $answers = [];
        if ($canView && $submitted) {
            foreach ($fields as $field) {
                $value = ($record->form_data ?? [])[$field->name] ?? null;
                $answers[] = [
                    'name' => $field->name, 'label' => $field->label, 'type' => $field->type,
                    'value' => $field->type === 'file' ? null : $value,
                    'downloadUrl' => $field->type === 'file' && $value
                        ? route('user.event-file', ['event' => $event->id, 'field' => $field->name]) : null,
                ];
            }
        }
        return [
            'event' => [
                'id' => $event->id, 'judul' => $event->judul, 'slug' => $event->slug,
                'kategori' => $event->kategori, 'tipePendaftaran' => $event->tipe_pendaftaran,
                'formFields' => $canView ? $fields->map(fn ($field) => [
                    'name' => $field->name, 'label' => $field->label, 'type' => $field->type,
                    'required' => (bool) $field->required, 'options' => $field->options ?? [],
                    'help' => $field->help, 'placeholder' => $field->placeholder,
                ])->values()->all() : [],
            ],
            'paymentStatus' => $event->payment_type === 'paid' ? 'unpaid' : 'free',
            'htm' => $event->payment_type === 'paid' ? $event->htm : null,
            'team' => $team ? [
                'id' => $team->id, 'name' => $team->nama_tim,
                'code' => $accepted ? $team->kode_unik : null,
                'memberCount' => $team->members()->count(), 'minMembers' => $event->min_anggota,
                'maxMembers' => $event->max_anggota, 'isLeader' => (bool) $isLeader,
                'membershipStatus' => $membership->status,
                'canManage' => $isLeader && !$reason, 'lockReason' => $reason,
                'members' => $accepted ? $team->members()->orderBy('team_members.joined_at')->get(['users.id', 'users.name'])
                    ->map(fn ($user) => $this->member($user, $team, $userId))->values()->all() : [],
                'requests' => $isLeader ? $team->participants()->wherePivot('status', 'pending')
                    ->orderBy('team_members.joined_at')->get(['users.id', 'users.name'])
                    ->map(fn ($user) => $this->member($user, $team, $userId))->values()->all() : [],
            ] : null,
            'form' => [
                'submitted' => $canView && $submitted,
                'canSubmit' => $canView && (!$team || $isLeader) && !$reason && !$submitted && $fields->isNotEmpty()
                    && ($event->tipe_pendaftaran === 'individu' || $team !== null),
                'reviewStatus' => $canView && $submitted ? ($team ? $team->review_status : $registration->status) : null,
                'note' => $canView && $submitted ? $record->catatan : null,
                'lockReason' => $reason, 'answers' => $answers,
            ],
        ];
    }

    private function member($user, Team $team, int $viewerId): array
    {
        return ['id' => $user->id, 'name' => $user->name ?: 'Peserta',
            'role' => (int) $user->id === (int) $team->ketua_id ? 'leader' : 'member',
            'isYou' => (int) $user->id === $viewerId, 'status' => $user->pivot->status];
    }
}
