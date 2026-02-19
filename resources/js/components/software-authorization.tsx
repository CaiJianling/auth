import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Shield, Trash2, Clock, History, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlash } from '@/hooks/use-flash';
import type { SoftwareAuthorization as AuthorizationType, AccessLog } from '@/types';

interface AuthorizationCode {
    id: number;
    name: string;
    code: string;
    notes: string | null;
    start_time: string | null;
    end_time: string | null;
    is_active: boolean;
    used_count: number;
    last_used_at: string | null;
}

interface SoftwareAuthorizationProps {
    authorizations: AuthorizationType[];
    authorization_codes: AuthorizationCode[];
}

export function SoftwareAuthorization({ authorizations, authorization_codes }: SoftwareAuthorizationProps) {
    const { success } = useFlash();
    const [selectedAuth, setSelectedAuth] = useState<AuthorizationType | null>(null);
    const [dialogType, setDialogType] = useState<'delete' | 'edit' | 'history' | null>(null);
    const [selectedCodeId, setSelectedCodeId] = useState<number | null>(null);
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // 已批准页面筛选条件
    const [filterSoftwareName, setFilterSoftwareName] = useState('');
    const [filterAuthorizationCode, setFilterAuthorizationCode] = useState<number | null>(null);
    const [filterLastAccessIp, setFilterLastAccessIp] = useState('');
    const [filterAuthorizedStartDate, setFilterAuthorizedStartDate] = useState('');
    const [filterAuthorizedEndDate, setFilterAuthorizedEndDate] = useState('');

    const handleDialogClose = () => {
        setDialogType(null);
        setSelectedCodeId(null);
        // 重置筛选条件
        setFilterType('all');
        setFilterStartDate('');
        setFilterEndDate('');
        setPagination({
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
        });
    };

    const handleDeleteDialogOpen = (auth: AuthorizationType) => {
        setSelectedAuth(auth);
        setDialogType('delete');
    };

    const handleDeleteDialogClose = () => {
        setSelectedAuth(null);
        setDialogType(null);
        setAuthorizationData(null);
    };

    const handleEditDialogOpen = (auth: AuthorizationType) => {
        setSelectedAuth(auth);
        setDialogType('edit');
        setSelectedCodeId(auth.authorization_code_id || null);
    };

    const handleHistoryDialogOpen = async (auth: AuthorizationType) => {
        setSelectedAuth(auth);
        setDialogType('history');
        await fetchAccessLogs(auth.id);
    };

    const fetchAccessLogs = async (authId: number, page = 1) => {
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('per_page', '10');
            if (filterType !== 'all') {
                params.append('access_type', filterType);
            }
            if (filterStartDate) {
                params.append('start_date', filterStartDate);
            }
            if (filterEndDate) {
                params.append('end_date', filterEndDate);
            }

            const response = await fetch(`/software-authorization/${authId}/access-logs?${params}`);
            const data = await response.json();
            setAccessLogs(data.logs || []);
            setPagination(data.pagination || {
                current_page: 1,
                last_page: 1,
                per_page: 10,
                total: 0,
            });
            setAuthorizationData(data.authorization || null);
        } catch (error) {
            console.error('Failed to fetch access logs:', error);
            setAccessLogs([]);
            setPagination({
                current_page: 1,
                last_page: 1,
                per_page: 10,
                total: 0,
            });
            setAuthorizationData(null);
        }
    };

    const handleAccessLogsPageChange = (page: number) => {
        if (selectedAuth) {
            fetchAccessLogs(selectedAuth.id, page);
        }
    };

    const handleFilterChange = () => {
        if (selectedAuth) {
            fetchAccessLogs(selectedAuth.id, 1);
        }
    };

    const [authorizationData, setAuthorizationData] = useState<{
        notes: string | null;
    } | null>(null);

    const handleDelete = () => {
        if (!selectedAuth) return;

        router.delete(`/software-authorization/${selectedAuth.id}`, {
            onSuccess: () => {
                setSelectedAuth(null);
                setDialogType(null);
            },
        });
    };

    const handleCancelClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleDialogClose();
    };

    const handleEditSubmit = () => {
        if (!selectedAuth || !selectedCodeId) return;

        router.put(`/software-authorization/${selectedAuth.id}`, {
            authorization_code_id: selectedCodeId,
        }, {
            onSuccess: () => {
                setSelectedAuth(null);
                handleDialogClose();
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-500">已授权</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500">已拒绝</Badge>;
            default:
                return <Badge className="bg-yellow-500">待审核</Badge>;
        }
    };

    // 根据筛选条件过滤数据（只显示已授权和已拒绝）
    const filteredAuthorizations = authorizations.filter(auth => {
        if (auth.status !== 'approved' && auth.status !== 'rejected') {
            return false;
        }
        // 筛选软件名称
        if (filterSoftwareName && !auth.software_name.toLowerCase().includes(filterSoftwareName.toLowerCase())) {
            return false;
        }
        // 筛选授权码
        if (filterAuthorizationCode && auth.authorization_code_id !== filterAuthorizationCode) {
            return false;
        }
        // 筛选IP地址
        const ipToCheck = auth.last_access_ip || auth.request_ip;
        if (filterLastAccessIp && !ipToCheck.includes(filterLastAccessIp)) {
            return false;
        }
        // 筛选授权时间范围
        if (filterAuthorizedStartDate) {
            const authorizedDate = auth.authorized_at ? new Date(auth.authorized_at) : null;
            const startDate = new Date(filterAuthorizedStartDate);
            if (!authorizedDate || authorizedDate < startDate) {
                return false;
            }
        }
        if (filterAuthorizedEndDate) {
            const authorizedDate = auth.authorized_at ? new Date(auth.authorized_at) : null;
            const endDate = new Date(filterAuthorizedEndDate);
            if (!authorizedDate || authorizedDate > endDate) {
                return false;
            }
        }
        return true;
    });

    // 分页
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const paginatedAuthorizations = filteredAuthorizations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredAuthorizations.length / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleResetFilters = () => {
        setFilterSoftwareName('');
        setFilterAuthorizationCode(null);
        setFilterLastAccessIp('');
        setFilterAuthorizedStartDate('');
        setFilterAuthorizedEndDate('');
        setCurrentPage(1);
    };

    // 格式化时间显示
    const formatTime = (time: string | null) => {
        if (!time) return '无限制';
        return new Date(time).toLocaleString('zh-CN');
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
            {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
                    {success}
                </div>
            )}

            {/* 筛选条件 */}
            <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h3 className="text-sm font-semibold mb-3">筛选条件</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="filterSoftwareName" className="text-sm">软件名称</Label>
                        <Input
                            id="filterSoftwareName"
                            placeholder="输入软件名称"
                            value={filterSoftwareName}
                            onChange={(e) => {
                                setFilterSoftwareName(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="filterAuthorizationCode" className="text-sm">授权码</Label>
                        <select
                            id="filterAuthorizationCode"
                            value={filterAuthorizationCode || ''}
                            onChange={(e) => {
                                setFilterAuthorizationCode(e.target.value ? Number(e.target.value) : null);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="">全部授权码</option>
                            {authorization_codes.map((code) => (
                                <option key={code.id} value={code.id}>
                                    {code.name} - {code.code}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="filterLastAccessIp" className="text-sm">IP地址</Label>
                        <Input
                            id="filterLastAccessIp"
                            placeholder="输入IP地址"
                            value={filterLastAccessIp}
                            onChange={(e) => {
                                setFilterLastAccessIp(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="filterAuthorizedStartDate" className="text-sm">授权开始日期</Label>
                        <Input
                            id="filterAuthorizedStartDate"
                            type="date"
                            value={filterAuthorizedStartDate}
                            onChange={(e) => {
                                setFilterAuthorizedStartDate(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="filterAuthorizedEndDate" className="text-sm">授权结束日期</Label>
                        <Input
                            id="filterAuthorizedEndDate"
                            type="date"
                            value={filterAuthorizedEndDate}
                            onChange={(e) => {
                                setFilterAuthorizedEndDate(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm">操作</Label>
                        <div className="flex gap-2">
                            <Button onClick={handleResetFilters} variant="outline" className="flex-1">
                                重置
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">软件名称</TableHead>
                            <TableHead className="font-semibold">版本号</TableHead>
                            <TableHead className="font-semibold">系统版本</TableHead>
                            <TableHead className="font-semibold">BIOS UUID</TableHead>
                            <TableHead className="font-semibold">主板序列号</TableHead>
                            <TableHead className="font-semibold">CPU ID</TableHead>
                            <TableHead className="font-semibold">最后访问IP</TableHead>
                            <TableHead className="font-semibold">状态</TableHead>
                            <TableHead className="font-semibold">授权时间</TableHead>
                            <TableHead className="font-semibold">授权码</TableHead>
                            <TableHead className="font-semibold">授权开始时间</TableHead>
                            <TableHead className="font-semibold">授权结束时间</TableHead>
                            <TableHead className="font-semibold">备注</TableHead>
                            <TableHead className="text-right font-semibold">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedAuthorizations.map((auth) => (
                            <TableRow key={auth.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{auth.software_name}</TableCell>
                                <TableCell>{auth.software_version}</TableCell>
                                <TableCell>{auth.os_version}</TableCell>
                                <TableCell className="font-mono text-xs">{auth.bios_uuid}</TableCell>
                                <TableCell className="font-mono text-xs">{auth.motherboard_serial}</TableCell>
                                <TableCell className="font-mono text-xs">{auth.cpu_id}</TableCell>
                                <TableCell className="font-mono text-xs">
                                    {auth.last_access_ip || auth.request_ip}
                                </TableCell>
                                <TableCell>{getStatusBadge(auth.status)}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {auth.authorized_at ? new Date(auth.authorized_at).toLocaleString('zh-CN') : '-'}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                    {auth.authorization_code?.code ? `${auth.authorization_code.name} - ${auth.authorization_code.code}` : '-'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {formatTime(auth.authorization_code?.start_time || null)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {formatTime(auth.authorization_code?.end_time || null)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {auth.notes || '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-950"
                                            onClick={() => handleEditDialogOpen(auth)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-purple-600 text-purple-600 hover:bg-purple-50 hover:text-purple-700 dark:border-purple-500 dark:text-purple-500 dark:hover:bg-purple-950"
                                            onClick={() => handleHistoryDialogOpen(auth)}
                                        >
                                            <History className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-950"
                                            onClick={() => handleDeleteDialogOpen(auth)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {paginatedAuthorizations.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={14} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <Shield className="h-12 w-12 text-muted-foreground/50" />
                                        <p>
                                            {filteredAuthorizations.length === 0 ? '暂无授权记录' : '未找到符合筛选条件的记录'}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* 分页 */}
                {filteredAuthorizations.length > 0 && totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            共 {filteredAuthorizations.length} 条记录，第 {currentPage} / {totalPages} 页
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                上一页
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                下一页
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={dialogType === 'edit'} onOpenChange={handleDialogClose}>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>更换授权码</DialogTitle>
                        <DialogDescription>
                            为此授权选择新的授权码
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>软件信息</Label>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>软件名称: {selectedAuth?.software_name}</p>
                                <p>版本号: {selectedAuth?.software_version}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>当前授权信息</Label>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>授权码: {selectedAuth?.authorization_code?.code || '-'}</p>
                                <p>备注: {selectedAuth?.notes || '-'}</p>
                                <p>授权开始时间: {formatTime(selectedAuth?.authorization_code?.start_time || null)}</p>
                                <p>授权结束时间: {formatTime(selectedAuth?.authorization_code?.end_time || null)}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>当前设备信息</Label>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>BIOS UUID: {selectedAuth?.bios_uuid}</p>
                                <p>主板序列号: {selectedAuth?.motherboard_serial}</p>
                                <p>CPU ID: {selectedAuth?.cpu_id}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="authCodeEdit">选择新的授权码</Label>
                            <select
                                id="authCodeEdit"
                                value={selectedCodeId || ''}
                                onChange={(e) => setSelectedCodeId(e.target.value ? Number(e.target.value) : null)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2"
                            >
                                <option value="">请选择授权码</option>
                                {authorization_codes.map((code) => (
                                    <option key={code.id} value={code.id}>
                                        {code.name} - {code.code}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancelClick}>
                            取消
                        </Button>
                        <Button
                            onClick={handleEditSubmit}
                            variant="default"
                        >
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={dialogType === 'history'} onOpenChange={handleDialogClose}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>授权访问及变更记录</DialogTitle>
                        <DialogDescription>
                            查看此授权的所有访问记录和设备信息变更
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>软件信息</Label>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>软件名称: {selectedAuth?.software_name}</p>
                                <p>版本号: {selectedAuth?.software_version}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>授权信息</Label>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>授权码: {selectedAuth?.authorization_code?.code || '-'}</p>
                                <p>备注: {authorizationData?.notes || '-'}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>当前设备信息</Label>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>BIOS UUID: {selectedAuth?.bios_uuid}</p>
                                <p>主板序列号: {selectedAuth?.motherboard_serial}</p>
                                <p>CPU ID: {selectedAuth?.cpu_id}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                访问记录
                            </Label>

                            {/* 筛选功能 */}
                            <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex-1 min-w-[180px]">
                                        <Label htmlFor="filterStartDate" className="text-sm">开始日期</Label>
                                        <Input
                                            id="filterStartDate"
                                            type="date"
                                            value={filterStartDate}
                                            onChange={(e) => setFilterStartDate(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-[180px]">
                                        <Label htmlFor="filterEndDate" className="text-sm">结束日期</Label>
                                        <Input
                                            id="filterEndDate"
                                            type="date"
                                            value={filterEndDate}
                                            onChange={(e) => setFilterEndDate(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <Label htmlFor="filterType" className="text-sm">访问类型</Label>
                                        <select
                                            id="filterType"
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="all">全部</option>
                                            <option value="normal">正常访问</option>
                                            <option value="expired">超出授权时间范围</option>
                                            <option value="update">设备信息更新</option>
                                            <option value="code_change">授权码变更</option>
                                        </select>
                                    </div>
                                    <Button onClick={handleFilterChange} className="mt-5">
                                        筛选
                                    </Button>
                                </div>
                            </div>

                            {accessLogs.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    暂无访问记录
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {accessLogs.map((log) => {
                                            const isExpired = log.is_expired;

                                            return (
                                                <div
                                                    key={log.id}
                                                    className={`rounded-lg border border-border bg-muted/50 p-3 space-y-2 ${isExpired ? 'border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20' : ''}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        {log.access_type === 'update' ? (
                                                            <Badge className="bg-orange-500">
                                                                设备信息更新
                                                            </Badge>
                                                        ) : log.access_type === 'code_change' ? (
                                                            <Badge className="bg-purple-500">
                                                                授权码变更
                                                            </Badge>
                                                        ) : isExpired ? (
                                                            <Badge className="bg-red-500">
                                                                超出授权时间范围
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-blue-500">
                                                                正常访问
                                                            </Badge>
                                                        )}
                                                        <span className="text-sm text-muted-foreground">
                                                            {new Date(log.created_at).toLocaleString('zh-CN')}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        IP地址: <span className="font-mono">{log.ip_address}</span>
                                                    </div>
                                                    {log.changes && log.access_type === 'update' && (
                                                        <div className="space-y-2">
                                                            <div className="text-sm font-medium">设备信息变更：</div>
                                                            <div className="rounded-md border border-border bg-background p-2 space-y-1 text-xs">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <div className="text-muted-foreground">BIOS UUID:</div>
                                                                        <div className="font-mono truncate">{log.changes.before.bios_uuid}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-muted-foreground">→</div>
                                                                        <div className="font-mono truncate text-green-600">{log.changes.after.bios_uuid}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <div className="text-muted-foreground">主板序列号:</div>
                                                                        <div className="font-mono truncate">{log.changes.before.motherboard_serial}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-muted-foreground">→</div>
                                                                        <div className="font-mono truncate text-green-600">{log.changes.after.motherboard_serial}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <div className="text-muted-foreground">CPU ID:</div>
                                                                        <div className="font-mono truncate">{log.changes.before.cpu_id}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-muted-foreground">→</div>
                                                                        <div className="font-mono truncate text-green-600">{log.changes.after.cpu_id}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {log.changes && log.access_type === 'code_change' && (
                                                        <div className="space-y-2">
                                                            <div className="text-sm font-medium">授权码变更：</div>
                                                            <div className="rounded-md border border-border bg-background p-2 space-y-1 text-xs">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <div className="text-muted-foreground">授权码:</div>
                                                                        <div className="font-mono">{log.changes.before.code || '无'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-muted-foreground">→</div>
                                                                        <div className="font-mono text-green-600">{log.changes.after.code || '无'}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <div className="text-muted-foreground">备注:</div>
                                                                        <div>{log.changes.before.notes || '无'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-muted-foreground">→</div>
                                                                        <div className="text-green-600">{log.changes.after.notes || '无'}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <div className="text-muted-foreground">开始时间:</div>
                                                                        <div>{log.changes.before.start_time || '无限制'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-muted-foreground">→</div>
                                                                        <div className="text-green-600">{log.changes.after.start_time || '无限制'}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <div className="text-muted-foreground">结束时间:</div>
                                                                        <div>{log.changes.before.end_time || '无限制'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-muted-foreground">→</div>
                                                                        <div className="text-green-600">{log.changes.after.end_time || '无限制'}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* 分页 */}
                                    {pagination.last_page > 1 && (
                                        <div className="flex items-center justify-between pt-4">
                                            <div className="text-sm text-muted-foreground">
                                                共 {pagination.total} 条记录，第 {pagination.current_page} / {pagination.last_page} 页
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAccessLogsPageChange(pagination.current_page - 1)}
                                                    disabled={pagination.current_page === 1}
                                                >
                                                    上一页
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAccessLogsPageChange(pagination.current_page + 1)}
                                                    disabled={pagination.current_page === pagination.last_page}
                                                >
                                                    下一页
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancelClick}>
                            关闭
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={dialogType === 'delete'} onOpenChange={handleDeleteDialogClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>删除授权记录</DialogTitle>
                        <DialogDescription>
                            确定要删除此授权记录吗？此操作不可恢复。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDeleteDialogClose}>
                            取消
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            删除
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
