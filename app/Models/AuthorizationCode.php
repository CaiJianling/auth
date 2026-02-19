<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AuthorizationCode extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'code',
        'notes',
        'start_time',
        'end_time',
        'is_active',
        'used_count',
        'last_used_at',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'is_active' => 'boolean',
        'used_count' => 'integer',
        'last_used_at' => 'datetime',
    ];

    /**
     * 检查授权码是否在有效期内
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $now = now();

        if ($this->start_time && $now->lt($this->start_time)) {
            return false;
        }

        if ($this->end_time && $now->gt($this->end_time)) {
            return false;
        }

        return true;
    }

    /**
     * 记录使用
     */
    public function recordUsage(): void
    {
        $this->increment('used_count');
        $this->update(['last_used_at' => now()]);
    }

    /**
     * 生成随机授权码
     */
    public static function generateCode(int $length = 32): string
    {
        return bin2hex(random_bytes($length / 2));
    }

    /**
     * 关联的软件授权记录
     */
    public function softwareAuthorizations(): HasMany
    {
        return $this->hasMany(SoftwareAuthorization::class);
    }
}
