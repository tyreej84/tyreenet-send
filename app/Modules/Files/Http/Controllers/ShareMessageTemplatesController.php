<?php

declare(strict_types=1);

namespace App\Modules\Files\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Files\Models\ShareMessageTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ShareMessageTemplatesController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80', Rule::unique('share_message_templates')->where('user_id', $user->id)],
            'body' => ['required', 'string', 'max:2000'],
        ]);
        $user->shareMessageTemplates()->create($validated);

        return back()->with('success', __('Message template saved.'));
    }

    public function destroy(Request $request, ShareMessageTemplate $template): RedirectResponse
    {
        abort_unless($template->user_id === $request->user()?->id, 404);
        $template->delete();

        return back()->with('success', __('Message template deleted.'));
    }
}
