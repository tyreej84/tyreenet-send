<?php

declare(strict_types=1);

namespace App\Modules\Files\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ShareLinkVerificationCodeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly string $code) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(__('Your TyreeNet file access code'))
            ->line(__('Use this one-time code to open the file shared with you:'))
            ->line($this->code)
            ->line(__('This code expires in 10 minutes. If you did not request it, you can ignore this message.'));
    }
}
