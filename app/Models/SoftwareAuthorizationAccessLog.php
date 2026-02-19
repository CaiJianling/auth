<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SoftwareAuthorizationAccessLog extends Model
{
    protected $fillable = [
        'software_authorization_id',
        'access_type',
        'changes',
        'ip_address',
        'is_expired',
    ];

    protected $casts = [
        'changes' => 'array',
    ];

    /**
     * 关联授权记录
     */
    public function softwareAuthorization(): BelongsTo
    {
        return $this->belongsTo(SoftwareAuthorization::class);
    }
}
