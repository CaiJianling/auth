import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Trash2, Edit2, Power, PowerOff, ChevronLeft, ChevronRight, Search, Check, X, ArrowLeft } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFlash } from '@/hooks/use-flash';

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
    created_at: string;
}

interface AuthorizationCodeManagementProps {
    codes: AuthorizationCode[];
    authorizations?: Array<{
        software_name: string;
        authorization_code_id: number;
    }>;
    code?: string;
    software?: string;
}

export default function AuthorizationCodeManagement({ codes, authorizations, code, software }: AuthorizationCodeManagementProps) {
    const { success } = useFlash();
    const [selectedCode, setSelectedCode] = useState<AuthorizationCode | null>(null);
    const [dialogType, setDialogType] = useState<'create' | 'edit' | 'delete' | null>(null);
    const [name, setName] = useState('');
    const [codeInput, setCodeInput] = useState('');
    const [notes, setNotes] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isActive, setIsActive] = useState(true);

    // 筛选条件
    const [filterName, setFilterName] = useState('');
    const [filterCode, setFilterCode] = useState(code || '');
    const [filterSoftwareName, setFilterSoftwareName] = useState(software || '');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // 搜索框状态
    const [filterNameSearchTerm, setFilterNameSearchTerm] = useState('');
    const [filterSoftwareNameSearchTerm, setFilterSoftwareNameSearchTerm] = useState('');

    // 下拉框显示状态
    const [isFilterNameDropdownOpen, setIsFilterNameDropdownOpen] = useState(false);
    const [isFilterSoftwareNameDropdownOpen, setIsFilterSoftwareNameDropdownOpen] = useState(false);

    // 下拉框引用
    const filterNameDropdownRef = useRef<HTMLDivElement>(null);
    const filterSoftwareNameDropdownRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭下拉框
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterNameDropdownRef.current && !filterNameDropdownRef.current.contains(event.target as Node)) {
                setIsFilterNameDropdownOpen(false);
            }
            if (filterSoftwareNameDropdownRef.current && !filterSoftwareNameDropdownRef.current.contains(event.target as Node)) {
                setIsFilterSoftwareNameDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // 过滤授权码名称列表
    const filteredAuthCodeNames = codes.map(c => c.name).filter((name, index, self) =>
        self.indexOf(name) === index && name.toLowerCase().includes(filterNameSearchTerm.toLowerCase())
    );

    // 过滤软件名称列表
    const filteredSoftwareNames = authorizations
        ? authorizations.map(auth => auth.software_name).filter((name, index, self) =>
            self.indexOf(name) === index && name.toLowerCase().includes(filterSoftwareNameSearchTerm.toLowerCase())
        )
        : [];

    // 分页
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleDialogOpen = (codeData?: AuthorizationCode) => {
        if (codeData) {
            setSelectedCode(codeData);
            setDialogType('edit');
            setName(codeData.name);
            setCodeInput(codeData.code);
            setNotes(codeData.notes || '');
            setStartTime(codeData.start_time ? codeData.start_time.slice(0, 16) : '');
            setEndTime(codeData.end_time ? codeData.end_time.slice(0, 16) : '');
            setIsActive(codeData.is_active);
        } else {
            setSelectedCode(null);
            setDialogType('create');
            setName('');
            setCodeInput('');
            setNotes('');
            setStartTime('');
            setEndTime('');
            setIsActive(true);
        }
    };

    const handleDialogClose = () => {
        setDialogType(null);
        setName('');
        setCodeInput('');
        setNotes('');
        setStartTime('');
        setEndTime('');
        setIsActive(true);
        setSelectedCode(null);
    };

    const handleSubmit = () => {
        if (dialogType === 'create') {
            router.post('/authorization-code', {
                name,
                code: codeInput || undefined,
                notes,
                start_time: startTime || undefined,
                end_time: endTime || undefined,
            }, {
                onSuccess: () => {
                    handleDialogClose();
                },
            });
        } else if (dialogType === 'edit' && selectedCode) {
            router.put(`/authorization-code/${selectedCode.id}`, {
                name,
                code: codeInput,
                notes,
                start_time: startTime || undefined,
                end_time: endTime || undefined,
                is_active: isActive,
            }, {
                onSuccess: () => {
                    handleDialogClose();
                },
            });
        }
    };

    const handleDelete = (codeData: AuthorizationCode) => {
        setSelectedCode(codeData);
        setDialogType('delete');
    };

    const handleDeleteDialogClose = () => {
        setSelectedCode(null);
        setDialogType(null);
    };

    const handleDeleteConfirm = () => {
        if (selectedCode) {
            router.delete(`/authorization-code/${selectedCode.id}`, {
                onSuccess: () => {
                    setSelectedCode(null);
                    setDialogType(null);
                },
            });
        }
    };

    const toggleStatus = (codeData: AuthorizationCode) => {
        router.put(`/authorization-code/${codeData.id}`, {
            code: codeData.code,
            notes: codeData.notes,
            start_time: codeData.start_time,
            end_time: codeData.end_time,
            is_active: !codeData.is_active,
        });
    };

    const formatTime = (time: string | null) => {
        if (!time) return '无限制';
        return new Date(time).toLocaleString('zh-CN');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // 筛选授权码
    const filteredCodes = codes.filter(codeData => {
        if (filterName && !codeData.name.toLowerCase().includes(filterName.toLowerCase())) {
            return false;
        }
        if (filterCode && !codeData.code.includes(filterCode)) {
            return false;
        }
        // 根据软件名称筛选：只显示该软件使用的授权码
        if (filterSoftwareName && authorizations) {
            const authSoftwareNames = authorizations
                .filter(auth => auth.authorization_code_id === codeData.id)
                .map(auth => auth.software_name);
            if (!authSoftwareNames.some(name => name.toLowerCase().includes(filterSoftwareName.toLowerCase()))) {
                return false;
            }
        }
        if (filterStatus === 'active' && !codeData.is_active) {
            return false;
        }
        if (filterStatus === 'inactive' && codeData.is_active) {
            return false;
        }
        if (filterStartDate) {
            const createdDate = new Date(codeData.created_at);
            const startDate = new Date(filterStartDate);
            if (createdDate < startDate) {
                return false;
            }
        }
        if (filterEndDate) {
            const createdDate = new Date(codeData.created_at);
            const endDate = new Date(filterEndDate);
            if (createdDate > endDate) {
                return false;
            }
        }
        return true;
    });

    // 分页数据
    const paginatedCodes = filteredCodes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleResetFilters = () => {
        setFilterName('');
        setFilterCode('');
        setFilterSoftwareName('');
        setFilterStatus('all');
        setFilterStartDate('');
        setFilterEndDate('');
        setCurrentPage(1);
    };

    // 跳转到软件授权页面
    const navigateToSoftwareAuthorization = () => {
        const params = new URLSearchParams();
        if (filterSoftwareName) {
            params.append('software', filterSoftwareName);
        }
        if (filterCode) {
            params.append('code', filterCode);
        }
        const queryString = params.toString();
        window.location.href = `/software-authorization${queryString ? '?' + queryString : ''}`;
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
            {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
                    {success}
                </div>
            )}

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">授权码管理</h1>
                <Button onClick={() => handleDialogOpen()}>
                    <Plus className="mr-2 h-4 w-4" />
                    新增授权码
                </Button>
            </div>

            {/* 筛选条件 */}
            <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h3 className="text-sm font-semibold mb-3">筛选条件</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="filterSoftwareName" className="text-sm">软件名称</Label>
                        <div ref={filterSoftwareNameDropdownRef} className="relative">
                            <div
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer flex items-center justify-between"
                                onClick={() => setIsFilterSoftwareNameDropdownOpen(!isFilterSoftwareNameDropdownOpen)}
                            >
                                <span className={filterSoftwareName ? '' : 'text-muted-foreground'}>
                                    {filterSoftwareName || '全部软件名称'}
                                </span>
                                {filterSoftwareName && (
                                    <X
                                        className="h-4 w-4 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFilterSoftwareName('');
                                            setCurrentPage(1);
                                        }}
                                    />
                                )}
                            </div>
                            {isFilterSoftwareNameDropdownOpen && (
                                <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-background shadow-lg">
                                    <div className="border-b border-border p-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="搜索软件名称..."
                                                value={filterSoftwareNameSearchTerm}
                                                onChange={(e) => setFilterSoftwareNameSearchTerm(e.target.value)}
                                                className="pl-9"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        <div
                                            className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                                            onClick={() => {
                                                setFilterSoftwareName('');
                                                setCurrentPage(1);
                                                setIsFilterSoftwareNameDropdownOpen(false);
                                                setFilterSoftwareNameSearchTerm('');
                                            }}
                                        >
                                            {!filterSoftwareName && <Check className="h-4 w-4" />}
                                            <span className={!filterSoftwareName ? 'font-medium' : ''}>全部软件名称</span>
                                        </div>
                                        {filteredSoftwareNames.map((name) => (
                                            <div
                                                key={name}
                                                className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                                                onClick={() => {
                                                    setFilterSoftwareName(name);
                                                    setCurrentPage(1);
                                                    setIsFilterSoftwareNameDropdownOpen(false);
                                                    setFilterSoftwareNameSearchTerm('');
                                                }}
                                            >
                                                {filterSoftwareName === name && <Check className="h-4 w-4" />}
                                                <span className={filterSoftwareName === name ? 'font-medium' : ''}>
                                                    {name}
                                                </span>
                                            </div>
                                        ))}
                                        {filteredSoftwareNames.length === 0 && (
                                            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                                未找到匹配的软件名称
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="filterName" className="text-sm">授权码名称</Label>
                        <div ref={filterNameDropdownRef} className="relative">
                            <div
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer flex items-center justify-between"
                                onClick={() => setIsFilterNameDropdownOpen(!isFilterNameDropdownOpen)}
                            >
                                <span className={filterName ? '' : 'text-muted-foreground'}>
                                    {filterName || '全部授权码名称'}
                                </span>
                                {filterName && (
                                    <X
                                        className="h-4 w-4 text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFilterName('');
                                            setCurrentPage(1);
                                        }}
                                    />
                                )}
                            </div>
                            {isFilterNameDropdownOpen && (
                                <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-background shadow-lg">
                                    <div className="border-b border-border p-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="搜索授权码名称..."
                                                value={filterNameSearchTerm}
                                                onChange={(e) => setFilterNameSearchTerm(e.target.value)}
                                                className="pl-9"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        <div
                                            className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                                            onClick={() => {
                                                setFilterName('');
                                                setCurrentPage(1);
                                                setIsFilterNameDropdownOpen(false);
                                                setFilterNameSearchTerm('');
                                            }}
                                        >
                                            {!filterName && <Check className="h-4 w-4" />}
                                            <span className={!filterName ? 'font-medium' : ''}>全部授权码名称</span>
                                        </div>
                                        {filteredAuthCodeNames.map((name) => (
                                            <div
                                                key={name}
                                                className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2"
                                                onClick={() => {
                                                    setFilterName(name);
                                                    setCurrentPage(1);
                                                    setIsFilterNameDropdownOpen(false);
                                                    setFilterNameSearchTerm('');
                                                }}
                                            >
                                                {filterName === name && <Check className="h-4 w-4" />}
                                                <span className={filterName === name ? 'font-medium' : ''}>
                                                    {name}
                                                </span>
                                            </div>
                                        ))}
                                        {filteredAuthCodeNames.length === 0 && (
                                            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                                未找到匹配的授权码名称
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="filterCode" className="text-sm">授权码</Label>
                        <Input
                            id="filterCode"
                            placeholder="输入授权码"
                            value={filterCode}
                            onChange={(e) => {
                                setFilterCode(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="filterStatus" className="text-sm">状态</Label>
                        <select
                            id="filterStatus"
                            value={filterStatus}
                            onChange={(e) => {
                                setFilterStatus(e.target.value as 'all' | 'active' | 'inactive');
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">全部状态</option>
                            <option value="active">已启用</option>
                            <option value="inactive">已禁用</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="filterStartDate" className="text-sm">创建开始日期</Label>
                        <Input
                            id="filterStartDate"
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => {
                                setFilterStartDate(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="filterEndDate" className="text-sm">创建结束日期</Label>
                        <Input
                            id="filterEndDate"
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => {
                                setFilterEndDate(e.target.value);
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
                    {(filterSoftwareName || filterCode) && (
                        <div className="space-y-2">
                            <Label className="text-sm">关联筛选</Label>
                            <Button onClick={navigateToSoftwareAuthorization} variant="default" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                查看软件授权
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">授权码名称</TableHead>
                            <TableHead className="font-semibold">授权码</TableHead>
                            <TableHead className="font-semibold">备注</TableHead>
                            <TableHead className="font-semibold">授权开始时间</TableHead>
                            <TableHead className="font-semibold">授权结束时间</TableHead>
                            <TableHead className="font-semibold">状态</TableHead>
                            <TableHead className="font-semibold">使用次数</TableHead>
                            <TableHead className="font-semibold">最后使用</TableHead>
                            <TableHead className="font-semibold">创建时间</TableHead>
                            <TableHead className="text-right font-semibold">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCodes.map((authCode) => (
                            <TableRow key={authCode.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{authCode.name}</TableCell>
                                <TableCell className="font-mono text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="cursor-pointer hover:text-primary" onClick={() => copyToClipboard(authCode.code)}>
                                            {authCode.code}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm">{authCode.notes || '-'}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {formatTime(authCode.start_time)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {formatTime(authCode.end_time)}
                                </TableCell>
                                <TableCell>
                                    {authCode.is_active ? (
                                        <Badge className="bg-green-500">已启用</Badge>
                                    ) : (
                                        <Badge className="bg-gray-500">已禁用</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm font-mono">{authCode.used_count}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {authCode.last_used_at ? new Date(authCode.last_used_at).toLocaleString('zh-CN') : '-'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(authCode.created_at).toLocaleString('zh-CN')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggleStatus(authCode)}
                                            title={authCode.is_active ? '禁用' : '启用'}
                                        >
                                            {authCode.is_active ? (
                                                <PowerOff className="h-4 w-4" />
                                            ) : (
                                                <Power className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDialogOpen(authCode)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-950"
                                            onClick={() => handleDelete(authCode)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {paginatedCodes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <p>
                                            {filteredCodes.length === 0 ? '暂无授权码' : '未找到符合筛选条件的记录'}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* 分页 */}
                {filteredCodes.length > 0 && totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            共 {filteredCodes.length} 条记录，第 {currentPage} / {totalPages} 页
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

            <Dialog open={dialogType === 'create'} onOpenChange={handleDialogClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>新增授权码</DialogTitle>
                        <DialogDescription>
                            创建新的授权码，留空授权码将自动生成
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">授权码名称 <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                placeholder="请输入授权码名称"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">授权码（留空自动生成）</Label>
                            <Input
                                id="code"
                                placeholder="留空自动生成32位授权码"
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">备注（可选）</Label>
                            <Textarea
                                id="notes"
                                placeholder="请输入备注信息"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">开始时间（留空表示不限制）</Label>
                                <Input
                                    id="startTime"
                                    type="datetime-local"
                                    placeholder="选择开始时间"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">结束时间（留空表示不限制）</Label>
                                <Input
                                    id="endTime"
                                    type="datetime-local"
                                    placeholder="选择结束时间"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>
                            取消
                        </Button>
                        <Button onClick={handleSubmit}>
                            创建
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={dialogType === 'edit'} onOpenChange={handleDialogClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑授权码</DialogTitle>
                        <DialogDescription>
                            修改授权码信息
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="editName">授权码名称 <span className="text-red-500">*</span></Label>
                            <Input
                                id="editName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editCode">授权码</Label>
                            <Input
                                id="editCode"
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editNotes">备注（可选）</Label>
                            <Textarea
                                id="editNotes"
                                placeholder="请输入备注信息"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="editStartTime">开始时间（留空表示不限制）</Label>
                                <Input
                                    id="editStartTime"
                                    type="datetime-local"
                                    placeholder="选择开始时间"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editEndTime">结束时间（留空表示不限制）</Label>
                                <Input
                                    id="editEndTime"
                                    type="datetime-local"
                                    placeholder="选择结束时间"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="isActive">启用授权码</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>
                            取消
                        </Button>
                        <Button onClick={handleSubmit}>
                            保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={dialogType === 'delete'} onOpenChange={handleDeleteDialogClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>删除授权码</DialogTitle>
                        <DialogDescription>
                            确定要删除此授权码吗？此操作不可恢复。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDeleteDialogClose}>
                            取消
                        </Button>
                        <Button
                            onClick={handleDeleteConfirm}
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
