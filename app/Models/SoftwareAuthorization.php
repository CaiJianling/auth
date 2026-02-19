<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SoftwareAuthorization extends Model
{
    use HasFactory;

    protected $fillable = [
        'software_name',
        'software_version',
        'os_version',
        'bios_uuid',
        'motherboard_serial',
        'cpu_id',
        'request_ip',
        'last_access_ip',
        'status',
        'authorized_at',
        'notes',
        'authorization_code_id',
    ];

    protected $casts = [
        'authorized_at' => 'datetime',
    ];

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * 授权访问记录
     */
    public function accessLogs()
    {
        return $this->hasMany(SoftwareAuthorizationAccessLog::class);
    }

    /**
     * 关联的授权码
     */
    public function authorizationCode()
    {
        return $this->belongsTo(AuthorizationCode::class);
    }

    /**
     * 检查设备是否有任意一个信息匹配
     */
    public function matchesDevice($biosUuid, $motherboardSerial, $cpuId): bool
    {
        return $this->bios_uuid === $biosUuid
            || $this->motherboard_serial === $motherboardSerial
            || $this->cpu_id === $cpuId;
    }

    /**
     * 检查当前是否在授权时间范围内
     */
    public function isWithinAuthorizationPeriod(): bool
    {
        if (!$this->authorizationCode) {
            return false;
        }

        return $this->authorizationCode->isValid();
    }
}
