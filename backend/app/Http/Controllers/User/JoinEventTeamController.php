<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\TeamMembershipService;
use Illuminate\Http\Request;

class JoinEventTeamController extends Controller
{
    public function __invoke(Request $request, Event $event, TeamMembershipService $teams)
    {
        $data = $request->validate(['kode_unik' => ['required', 'string', 'max:16', 'regex:/^[a-zA-Z0-9]+$/']]);
        $teams->requestJoin($event, $request->user()->id, strtoupper($data['kode_unik']));
        return response()->json(['data' => ['requested' => true, 'membershipStatus' => 'pending'], 'message' => 'Permintaan terkirim. Tunggu persetujuan ketua tim.']);
    }
}
