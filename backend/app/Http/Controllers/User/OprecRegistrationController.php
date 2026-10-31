<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\OprecRegistrationSubmission;
use Illuminate\Http\Request;

class OprecRegistrationController extends Controller
{
    public function store(Request $request, OprecRegistrationSubmission $submission)
    {
        return $submission->submit($request, $request->user());
    }
}
