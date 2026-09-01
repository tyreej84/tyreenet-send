<?php

declare(strict_types=1);

namespace App\Modules\Identity\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Audit\Action;
use App\Modules\Audit\ActivityLogger;
use App\Modules\Identity\Passwords\PasswordPolicy;
use App\Modules\Identity\TwoFactor\TwoFactorEnforcement;
use App\Modules\Identity\UserType;
use App\Modules\Files\Uploads\ClamAvHealth;
use App\Modules\Platform\Settings\Setting;
use App\Modules\Platform\Settings\Settings;
use App\Modules\Platform\Backups\BackupHistory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

/**
 * System-wide security settings (staff-only): who is required to have
 * two-factor authentication enabled, and what makes an acceptable
 * password.
 */
class SecuritySettingsController extends Controller
{
    public function __construct(
        private readonly Settings $settings,
        private readonly ActivityLogger $activity,
    ) {}

    public function edit(Request $request, BackupHistory $backups, ClamAvHealth $clamAv): Response
    {
        $staff = User::query()->where('type', UserType::Staff);

        return Inertia::render('system/settings/security', [
            'two_factor_enforcement' => $this->settings->get(Setting::TwoFactorEnforcement),
            'password_min_length' => $this->settings->get(Setting::PasswordMinLength),
            'password_reject_breached' => $this->settings->get(Setting::PasswordRejectBreached),
            // The bounds the form offers come from the policy rather than
            // from a literal here, so the field and the rule below can
            // never drift apart.
            'password_min_length_floor' => PasswordPolicy::MIN_LENGTH,
            'password_min_length_ceiling' => PasswordPolicy::MAX_LENGTH,
            'staff_authentication' => [
                'total' => (clone $staff)->count(),
                'two_factor_enrolled' => (clone $staff)->whereNotNull('two_factor_confirmed_at')->count(),
                'passkey_enrolled' => (clone $staff)->whereHas('passkeys')->count(),
                'without_strong_authentication' => (clone $staff)
                    ->whereNull('two_factor_confirmed_at')
                    ->whereDoesntHave('passkeys')
                    ->count(),
            ],
            'backup_history' => array_slice($backups->all(), 0, 10),
            'security_posture' => [
                'public_links_without_password' => Schema::hasTable('share_links')
                    ? DB::table('share_links')->whereNull('password_hash')->count() : 0,
                'unlimited_public_links' => Schema::hasTable('share_links')
                    ? DB::table('share_links')->whereNull('expires_at')->whereNull('max_downloads')->count() : 0,
                'expired_api_tokens' => Schema::hasTable('personal_access_tokens')
                    ? DB::table('personal_access_tokens')->whereNotNull('expires_at')->where('expires_at', '<', now())->count() : 0,
                'failed_jobs' => Schema::hasTable('failed_jobs') ? DB::table('failed_jobs')->count() : 0,
                'failed_webhooks' => Schema::hasTable('webhook_deliveries')
                    ? DB::table('webhook_deliveries')->whereNotNull('failed_at')->whereNull('delivered_at')->count() : 0,
                'malware_scanning' => (bool) config('malware.enabled'),
                'malware_fail_closed' => (bool) config('malware.fail_closed'),
                'malware_health' => $clamAv->report(),
                'webhooks_configured' => is_string(config('webhooks.url')) && config('webhooks.url') !== '',
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'two_factor_enforcement' => ['required', Rule::enum(TwoFactorEnforcement::class)],
            // This is the authoritative floor: PasswordPolicy clamps on
            // read as a backstop, but refusing the save is what tells an
            // administrator their number was rejected instead of silently
            // storing something the application will not honour.
            'password_min_length' => [
                'required',
                'integer',
                'min:'.PasswordPolicy::MIN_LENGTH,
                'max:'.PasswordPolicy::MAX_LENGTH,
            ],
            'password_reject_breached' => ['required', 'boolean'],
        ]);

        $this->settings->set(Setting::TwoFactorEnforcement, $validated['two_factor_enforcement']);
        $this->settings->set(Setting::PasswordMinLength, $validated['password_min_length']);
        $this->settings->set(Setting::PasswordRejectBreached, $validated['password_reject_breached']);

        $this->activity->log(Action::SettingsUpdated, context: [
            'section' => 'security',
            'two_factor_enforcement' => $validated['two_factor_enforcement'],
            'password_min_length' => $validated['password_min_length'],
            'password_reject_breached' => $validated['password_reject_breached'],
        ]);

        return back();
    }
}
