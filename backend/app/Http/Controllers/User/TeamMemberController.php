<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\TeamMembershipService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TeamMemberController extends Controller
{
    public function __invoke(Request $request, Event $event, int $team, int $member, TeamMembershipService $teams)
    {
        $data = $request->validate(['action' => ['required', Rule::in(['accept', 'remove'])]]);
        $teams->manage($event, $team, $request->user()->id, $member, $data['action']);
        return response()->json(['data' => ['updated' => true]]);
    }
}
