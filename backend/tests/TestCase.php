<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function verifiedUser(array $attributes): User
    {
        $user = User::create($attributes);
        $user->markEmailAsVerified();
        return $user;
    }
}
