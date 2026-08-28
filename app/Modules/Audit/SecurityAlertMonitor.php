<?php

declare(strict_types=1);

namespace App\Modules\Audit;

use App\Modules\Audit\Notifications\AdminSecurityAlertNotification;
use App\Modules\Platform\Settings\Setting;
use App\Modules\Platform\Settings\Settings;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;

class SecurityAlertMonitor
{
    private const DOWNLOADS = [Action::FileDownloaded, Action::ShareLinkDownloaded, Action::PublicFileDownloaded];

    public function __construct(private readonly Settings $settings) {}

    public function inspect(ActivityLog $entry): void
    {
        if (! config('security-alerts.enabled')) {
            return;
        }

        if ($entry->action === Action::Login) {
            $this->inspectLogin($entry);
        }
        if (in_array($entry->action, self::DOWNLOADS, true)) {
            $this->inspectDownloads($entry);
        }
    }

    private function inspectLogin(ActivityLog $entry): void
    {
        if ($entry->actor_id === null || $entry->ip_address === null) {
            return;
        }
        $hasPrior = ActivityLog::query()->where('action', Action::Login)->where('actor_id', $entry->actor_id)->whereKeyNot($entry->id)->exists();
        $knownIp = ActivityLog::query()->where('action', Action::Login)->where('actor_id', $entry->actor_id)->where('ip_address', $entry->ip_address)->whereKeyNot($entry->id)->exists();
        if ($hasPrior && ! $knownIp) {
            $this->notify(__('TyreeNet Send: new login location'), __(':name signed in from a new IP address (:ip).', ['name' => $entry->actor_name ?? __('A user'), 'ip' => $entry->ip_address]));
        }
    }

    private function inspectDownloads(ActivityLog $entry): void
    {
        $threshold = max(1, (int) config('security-alerts.download_threshold'));
        $minutes = max(1, (int) config('security-alerts.download_window_minutes'));
        $identity = $entry->actor_id !== null ? 'user:'.$entry->actor_id : 'ip:'.($entry->ip_address ?? 'unknown');
        $query = ActivityLog::query()->whereIn('action', self::DOWNLOADS)->where('created_at', '>=', now()->subMinutes($minutes));
        $entry->actor_id !== null ? $query->where('actor_id', $entry->actor_id) : $query->whereNull('actor_id')->where('ip_address', $entry->ip_address);
        if ($query->count() >= $threshold && Cache::add('security-alert:downloads:'.hash('sha256', $identity), true, now()->addHour())) {
            $this->notify(__('TyreeNet Send: bulk download alert'), __('At least :count files were downloaded by :identity within :minutes minutes.', ['count' => $threshold, 'identity' => $entry->actor_name ?? $entry->ip_address ?? __('an anonymous visitor'), 'minutes' => $minutes]));
        }
    }

    private function notify(string $subject, string $message): void
    {
        $addresses = $this->settings->get(Setting::AdminNotificationEmails);
        foreach (is_array($addresses) ? $addresses : [] as $address) {
            if (is_string($address) && $address !== '') {
                Notification::route('mail', $address)->notify(new AdminSecurityAlertNotification($subject, $message));
            }
        }
    }
}
