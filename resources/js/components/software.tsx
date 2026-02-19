import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Trash2, Edit2, Power, PowerOff, Download, ExternalLink, ChevronLeft, ChevronRight, Search, Check, X } from 'lucide-react';
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

interface Software {
    id: number;
    name: string;
    latest_version: string;
    download_url: string | null;
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface SoftwareManagementProps {
    softwares: Software[];
}

export default function SoftwareManagement({ softwares }: SoftwareManagementProps) {
    const { success } = useFlash();
    const [selectedSoftware, setSelectedSoftware] = useState<Software | null>(null);
    const [dialogType, setDialogType] = useState<'create' | 'edit' | 'delete' | null>(null);
    const [name, setName] = useState('');
    const [latestVersion, setLatestVersion] = useState('');
    const [downloadUrl, setDownloadUrl] = useState('');
    const [notes, setNotes] = useState('');
    const [isActive, setIsActive] = useState(true);

    // 筛选条件
    const [filterName, setFilterName] = useState('');
    const [filterVersion, setFilterVersion] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // 搜索框状态
    const [filterNameSearchTerm, setFilterNameSearchTerm] = useState('');

    // 下拉框显示状态
    const [isFilterNameDropdownOpen, setIsFilterNameDropdownOpen] = useState(false);

    // 下拉框引用
    const filterNameDropdownRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭下拉框
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterNameDropdownRef.current && !filterNameDropdownRef.current.contains(event.target as Node)) {
                setIsFilterNameDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // 过滤软件名称列表
    const filteredSoftwareNames = softwares.map(s => s.name).filter((name, index, self) =>
        self.indexOf(name) === index && name.toLowerCase().includes(filterNameSearchTerm.toLowerCase())
    );

    // 分页
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleDialogOpen = (software?: Software) => {
        if (software) {
            setSelectedSoftware(software);
            setDialogType('edit');
            setName(software.name);
            setLatestVersion(software.latest_version);
            setDownloadUrl(software.download_url || '');
            setNotes(software.notes || '');
            setIsActive(software.is_active);
        } else {
            setSelectedSoftware(null);
            setDialogType('create');
            setName('');
            setLatestVersion('');
            setDownloadUrl('');
            setNotes('');
            setIsActive(true);
        }
    };

    const handleDialogClose = () => {
        setDialogType(null);
        setName('');
        setLatestVersion('');
        setDownloadUrl('');
        setNotes('');
        setIsActive(true);
        setSelectedSoftware(null);
    };

    const handleSubmit = () => {
        if (dialogType === 'create') {
            router.post('/software', {
                name,
                latest_version: latestVersion,
                download_url: downloadUrl || undefined,
                notes,
            }, {
                onSuccess: () => {
                    handleDialogClose();
                },
            });
        } else if (dialogType === 'edit' && selectedSoftware) {
            router.put(`/software/${selectedSoftware.id}`, {
                name,
                latest_version: latestVersion,
                download_url: downloadUrl || undefined,
                is_active: isActive,
                notes,
            }, {
                onSuccess: () => {
                    handleDialogClose();
                },
            });
        }
    };

    const handleDelete = (software: Software) => {
        setSelectedSoftware(software);
        setDialogType('delete');
    };

    const handleDeleteDialogClose = () => {
        setSelectedSoftware(null);
        setDialogType(null);
    };

    const handleDeleteConfirm = () => {
        if (selectedSoftware) {
            router.delete(`/software/${selectedSoftware.id}`, {
                onSuccess: () => {
                    setSelectedSoftware(null);
                    setDialogType(null);
                },
            });
        }
    };

    const toggleStatus = (software: Software) => {
        router.post(`/software/${software.id}/toggle`);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // 筛选软件
    const filteredSoftwares = softwares.filter(software => {
        if (filterName && !software.name.toLowerCase().includes(filterName.toLowerCase())) {
            return false;
        }
        if (filterVersion && !software.latest_version.includes(filterVersion)) {
            return false;
        }
        if (filterStatus === 'active' && !software.is_active) {
            return false;
        }
        if (filterStatus === 'inactive' && software.is_active) {
            return false;
        }
        if (filterStartDate) {
            const createdDate = new Date(software.created_at);
            const startDate = new Date(filterStartDate);
            if (createdDate < startDate) {
                return false;
            }
        }
        if (filterEndDate) {
            const createdDate = new Date(software.created_at);
            const endDate = new Date(filterEndDate);
            if (createdDate > endDate) {
                return false;
            }
        }
        return true;
    });

    // 分页数据
    const paginatedSoftwares = filteredSoftwares.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredSoftwares.length / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleResetFilters = () => {
        setFilterName('');
        setFilterVersion('');
        setFilterStatus('all');
        setFilterStartDate('');
        setFilterEndDate('');
        setCurrentPage(1);
    };

    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
            {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
                    {success}
                </div>
            )}

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">我的软件</h1>
                <Button onClick={() => handleDialogOpen()}>
                    <Plus className="mr-2 h-4 w-4" />
                    新增软件
                </Button>
            </div>

            {/* 筛选条件 */}
            <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h3 className="text-sm font-semibold mb-3">筛选条件</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="filterName" className="text-sm">软件名称</Label>
                        <div ref={filterNameDropdownRef} className="relative">
                            <div
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer flex items-center justify-between"
                                onClick={() => setIsFilterNameDropdownOpen(!isFilterNameDropdownOpen)}
                            >
                                <span className={filterName ? '' : 'text-muted-foreground'}>
                                    {filterName || '全部软件名称'}
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
                                                placeholder="搜索软件名称..."
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
                                            <span className={!filterName ? 'font-medium' : ''}>全部软件名称</span>
                                        </div>
                                        {filteredSoftwareNames.map((name) => (
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
                        <Label htmlFor="filterVersion" className="text-sm">版本号</Label>
                        <Input
                            id="filterVersion"
                            placeholder="输入版本号"
                            value={filterVersion}
                            onChange={(e) => {
                                setFilterVersion(e.target.value);
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
                            <option value="inactive">已停用</option>
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
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">软件名称</TableHead>
                            <TableHead className="font-semibold">最新版本号</TableHead>
                            <TableHead className="font-semibold">下载链接</TableHead>
                            <TableHead className="font-semibold">状态</TableHead>
                            <TableHead className="font-semibold">备注</TableHead>
                            <TableHead className="font-semibold">创建时间</TableHead>
                            <TableHead className="text-right font-semibold">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedSoftwares.map((software) => (
                            <TableRow key={software.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{software.name}</TableCell>
                                <TableCell className="font-mono">{software.latest_version}</TableCell>
                                <TableCell>
                                    {software.download_url ? (
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={software.download_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                下载
                                            </a>
                                            <span
                                                className="cursor-pointer text-muted-foreground hover:text-primary"
                                                onClick={() => copyToClipboard(software.download_url!)}
                                                title="复制链接"
                                            >
                                                <Download className="h-3 w-3" />
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">无</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {software.is_active ? (
                                        <Badge className="bg-green-500">已启用</Badge>
                                    ) : (
                                        <Badge className="bg-gray-500">已停用</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm">{software.notes || '-'}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(software.created_at).toLocaleString('zh-CN')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggleStatus(software)}
                                            title={software.is_active ? '停用' : '启用'}
                                        >
                                            {software.is_active ? (
                                                <PowerOff className="h-4 w-4" />
                                            ) : (
                                                <Power className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDialogOpen(software)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-950"
                                            onClick={() => handleDelete(software)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {paginatedSoftwares.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <p>
                                            {filteredSoftwares.length === 0 ? '暂无软件' : '未找到符合筛选条件的记录'}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* 分页 */}
                {filteredSoftwares.length > 0 && totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            共 {filteredSoftwares.length} 条记录，第 {currentPage} / {totalPages} 页
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
                        <DialogTitle>新增软件</DialogTitle>
                        <DialogDescription>
                            添加新的软件信息
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">软件名称 <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                placeholder="请输入软件名称"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="latestVersion">最新版本号 <span className="text-red-500">*</span></Label>
                            <Input
                                id="latestVersion"
                                placeholder="例如：1.0.0"
                                value={latestVersion}
                                onChange={(e) => setLatestVersion(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="downloadUrl">下载链接（可选）</Label>
                            <Input
                                id="downloadUrl"
                                type="url"
                                placeholder="https://example.com/download"
                                value={downloadUrl}
                                onChange={(e) => setDownloadUrl(e.target.value)}
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
                        <DialogTitle>编辑软件</DialogTitle>
                        <DialogDescription>
                            修改软件信息
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="editName">软件名称 <span className="text-red-500">*</span></Label>
                            <Input
                                id="editName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editLatestVersion">最新版本号 <span className="text-red-500">*</span></Label>
                            <Input
                                id="editLatestVersion"
                                value={latestVersion}
                                onChange={(e) => setLatestVersion(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editDownloadUrl">下载链接（可选）</Label>
                            <Input
                                id="editDownloadUrl"
                                type="url"
                                value={downloadUrl}
                                onChange={(e) => setDownloadUrl(e.target.value)}
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
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="isActive">启用软件</Label>
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
                        <DialogTitle>删除软件</DialogTitle>
                        <DialogDescription>
                            确定要删除此软件吗？此操作不可恢复。
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
