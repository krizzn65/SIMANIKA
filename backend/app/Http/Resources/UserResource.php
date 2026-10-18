<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $nama = !empty($this->nama) ? $this->nama : (!empty($this->name) ? $this->name : explode('@', $this->email)[0]);

        return [
            'id' => $this->id,
            'email' => $this->email,
            'nama' => $nama,
            'namaLengkap' => $nama,
            'name' => $nama,
            'fotoProfil' => $this->foto_profil,
            'role' => $this->effectiveRole(),
            'emailVerifiedAt' => $this->email_verified_at?->toIso8601String(),
        ];
    }
}
