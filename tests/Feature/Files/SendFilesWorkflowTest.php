<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Files\Models\FileAssignment;
use App\Modules\Notifications\PendingNotification;
use App\Modules\Platform\Settings\Setting;
use App\Modules\Platform\Settings\Settings;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    Storage::fake('files');
    $this->admin = User::factory()->create();
});

test('several uploaded files can be sent in one step with a recipient message', function () {
    app(Settings::class)->set(Setting::EmailNotificationsEnabled, true);
    Queue::fake();
    $client = User::factory()->client()->create();
    $first = uploadNamedFile($this->admin, 'first.pdf');
    $second = uploadNamedFile($this->admin, 'second.pdf');

    $this->actingAs($this->admin)->post('/file-assignments/bulk', [
        'file_ids' => [$first->id, $second->id],
        'type' => 'client',
        'id' => $client->id,
        'message' => 'The requested documents are attached.',
    ])->assertRedirect(route('files.index'));

    expect(FileAssignment::query()->where('assignable_id', $client->id)->count())->toBe(2)
        ->and(PendingNotification::query()->where('user_id', $client->id)->count())->toBe(2)
        ->and(PendingNotification::query()->first()?->context['message'])->toBe('The requested documents are attached.');

    $this->actingAs($this->admin)->get('/files/upload')->assertInertia(fn (AssertableInertia $page) => $page
        ->component('files/create')
        ->where('recent_targets.0.id', $client->id)
        ->where('recent_targets.0.type', 'client'));
});

test('message templates are private to their creator', function () {
    $this->actingAs($this->admin)->post('/share-message-templates', ['name' => 'Delivery', 'body' => 'Here are your files.'])->assertRedirect();
    $template = $this->admin->shareMessageTemplates()->sole();

    $other = User::factory()->create();
    $this->actingAs($other)->delete("/share-message-templates/{$template->id}")->assertNotFound();
    expect($template->fresh())->not->toBeNull();

    $this->actingAs($this->admin)->delete("/share-message-templates/{$template->id}")->assertRedirect();
    expect($template->fresh())->toBeNull();
});
