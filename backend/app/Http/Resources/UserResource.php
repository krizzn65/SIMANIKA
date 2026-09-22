<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'namaLengkap' => $this->name,
            'nim' => $this->nim,
            'jurusan' => $this->jurusan,
            'angkatan' => $this->angkatan,
            'role' => $this->role,
            'fotoProfil' => $this->foto_profil,
        ];
    }
}
