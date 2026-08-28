<?php

declare(strict_types=1);

namespace App\Modules\Audit\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminSecurityAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $subject, private readonly string $message) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)->subject($this->subject)->line($this->message)->action(__('Review activity'), route('activity.index'));
    }
}
