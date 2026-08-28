<?php

declare(strict_types=1);

namespace App\Modules\Files\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShareMessageTemplate extends Model
{
    protected $fillable = ['user_id', 'name', 'body'];

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
