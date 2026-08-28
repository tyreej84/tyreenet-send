<?php

declare(strict_types=1);

namespace App\Modules\Files\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Files\Access\StaffLibraryScope;
use App\Modules\Files\Http\Controllers\Concerns\ResolvesShareTargets;
use App\Modules\Files\Models\File;
use App\Modules\Files\Sharing\FileSharing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class FileAssignmentsController extends Controller
{
    use ResolvesShareTargets;

    public function __construct(
        private readonly StaffLibraryScope $scope,
        private readonly FileSharing $sharing,
    ) {}

    protected function assignmentScope(): StaffLibraryScope
    {
        return $this->scope;
    }

    public function store(Request $request, File $file): RedirectResponse
    {
        Gate::authorize('update', $file);
        $this->guardFileOwnsItsSharing($file);

        [$assignable, $targetName] = $this->resolveRequestedTarget(
            $request,
            __('Files can only be assigned to clients or groups.'),
        );

        $this->sharing->assign($file, $assignable, $targetName);

        return back();
    }

    public function bulkStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file_ids' => ['required', 'array', 'min:1'],
            'file_ids.*' => ['integer', 'distinct', 'exists:files,id'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);
        [$assignable, $targetName] = $this->resolveRequestedTarget($request, __('Files can only be assigned to clients or groups.'));
        $files = File::query()->whereIn('id', $validated['file_ids'])->get();

        foreach ($files as $file) {
            Gate::authorize('update', $file);
            $this->guardFileOwnsItsSharing($file);
            $this->sharing->assign($file, $assignable, $targetName, $validated['message'] ?? null);
        }

        return redirect()->route('files.index')->with('success', trans_choice(':count file sent.|:count files sent.', $files->count(), ['count' => $files->count()]));
    }

    public function destroy(Request $request, File $file): RedirectResponse
    {
        Gate::authorize('update', $file);
        $this->guardFileOwnsItsSharing($file);

        [$assignable, $targetName] = $this->resolveRequestedTarget(
            $request,
            __('Files can only be assigned to clients or groups.'),
        );

        $this->sharing->unassign($file, $assignable, $targetName);

        return back();
    }
}
