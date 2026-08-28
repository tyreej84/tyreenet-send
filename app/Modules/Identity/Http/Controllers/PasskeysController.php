<?php

declare(strict_types=1);

namespace App\Modules\Identity\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PasskeysController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        assert($user !== null);

        return Inertia::render('settings/passkeys', [
            'passkeys' => $user->passkeys()->latest()->get()->map(fn ($passkey): array => [
                'id' => $passkey->id,
                'name' => $passkey->name,
                'last_used_at' => $passkey->last_used_at?->toIso8601String(),
                'created_at' => $passkey->created_at?->toIso8601String(),
            ])->all(),
        ]);
    }
}
