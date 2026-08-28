<?php

declare(strict_types=1);

namespace App\Modules\Identity\Http\Responses;

use App\Models\User;
use App\Modules\Identity\SignIn;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Passkeys\Contracts\PasskeyLoginResponse as PasskeyLoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

/** Keeps the application's TOTP handshake in front of passkey sessions. */
class PasskeyLoginResponse implements PasskeyLoginResponseContract
{
    public function __construct(private readonly SignIn $signIn) {}

    public function toResponse($request): Response
    {
        $user = Auth::user();

        if ($user instanceof User && $user->hasTwoFactorEnabled()) {
            Auth::logout();
            $this->signIn->begin($user, $request->boolean('remember'));
            $target = route('two-factor.challenge');
        } else {
            $target = redirect()->intended(config('passkeys.redirect', '/'))->getTargetUrl();
        }

        return $request->wantsJson()
            ? new JsonResponse(['redirect' => $target])
            : redirect()->to($target);
    }
}
