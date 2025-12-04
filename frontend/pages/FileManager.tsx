
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import FileEditor from '../components/FileEditor';
import { FileItem } from '../types';
import { FileService } from '../services/api';
import { FileText, Folder, MoreVertical, Search, Upload, Download, Trash2, Home, RefreshCw, ChevronRight, AlertCircle, Lock, ArrowLeft } from 'lucide-react';

// 格式化檔案大小
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '-';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
};

// 計算總大小
const calculateTotalSize = (files: FileItem[]): number => {
    return files.reduce((acc, file) => acc + file.size, 0);
};

const FileManager: React.FC = () => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [currentPath, setCurrentPath] = useState('/');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [accessDenied, setAccessDenied] = useState(false);
    
    // File Editor 狀態
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    
    // Delete Dialog 狀態
    const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // 載入檔案列表
    const loadFiles = useCallback(async (path: string) => {
        setLoading(true);
        setError(null);
        setAccessDenied(false);
        try {
            const data = await FileService.listFiles(path);
            // 排序：資料夾在前，檔案在後，同類型按名稱排序
            const sorted = data.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });
            setFiles(sorted);
            
            // 如果回傳空陣列且不是根目錄，可能是權限問題
            if (sorted.length === 0 && path !== '/') {
                setAccessDenied(true);
            }
        } catch (err: any) {
            console.error('Failed to load files:', err);
            // 檢查是否為權限錯誤
            if (err.response?.status === 403 || err.message?.includes('Access')) {
                setAccessDenied(true);
                setError('Permission denied. You do not have access to this directory.');
            } else if (err.response?.status === 500) {
                setAccessDenied(true);
                setError('Cannot access this directory. Permission denied.');
            } else {
                setError('Failed to load files. Please check if the backend is running.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFiles(currentPath);
    }, [currentPath, loadFiles]);

    // 導航到指定路徑
    const navigateTo = (path: string) => {
        setCurrentPath(path);
    };

    // 返回上層目錄
    const goBack = () => {
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
        navigateTo(parentPath);
    };

    // 點擊項目
    const handleItemClick = (file: FileItem) => {
        if (file.isDirectory) {
            navigateTo(file.path);
        } else {
            // 開啟檔案編輯器
            setSelectedFile(file);
            setIsEditorOpen(true);
        }
    };

    // 關閉編輯器
    const handleCloseEditor = () => {
        setIsEditorOpen(false);
        setSelectedFile(null);
    };

    // 儲存檔案
    const handleSaveFile = async (path: string, content: string) => {
        await FileService.saveFileContent(path, content);
    };

    // 開啟刪除確認對話框
    const handleDeleteClick = (file: FileItem) => {
        setFileToDelete(file);
        setIsDeleteDialogOpen(true);
    };

    // 確認刪除
    const handleConfirmDelete = async () => {
        if (!fileToDelete) return;
        
        setDeleting(true);
        try {
            await FileService.deleteFile(fileToDelete.path);
            // 刪除成功後重新載入檔案列表
            await loadFiles(currentPath);
            setIsDeleteDialogOpen(false);
            setFileToDelete(null);
        } catch (err: any) {
            console.error('Failed to delete:', err);
            if (err.response?.status === 403) {
                setError('Permission denied. Cannot delete this item.');
            } else {
                setError('Failed to delete. Please try again.');
            }
        } finally {
            setDeleting(false);
        }
    };

    // 取消刪除
    const handleCancelDelete = () => {
        setIsDeleteDialogOpen(false);
        setFileToDelete(null);
    };

    // 解析路徑成麵包屑
    const breadcrumbs = currentPath.split('/').filter(Boolean);

    // 篩選檔案
    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="File Manager"
                icon={FileText}
                description="Browse, edit, and manage server files."
                actions={
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-zinc-900 border border-zinc-700 text-zinc-300 pl-9 pr-4 py-2 rounded text-sm focus:outline-none focus:border-emerald-500 w-64 shadow-lg"
                            />
                        </div>
                        <button 
                            onClick={() => loadFiles(currentPath)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2 border border-zinc-700"
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2 border border-zinc-700">
                            <Upload size={16} /> Upload
                        </button>
                    </div>
                }
            />

            <div className="flex flex-col shadow-xl rounded-lg">
                {/* Breadcrumb / Toolbar */}
                <div className="bg-zinc-900 border border-border p-3 rounded-t-lg flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-zinc-400 flex-wrap">
                        <button
                            onClick={() => navigateTo('/')}
                            className="hover:text-emerald-400 transition-colors flex items-center gap-1"
                        >
                            <Home size={16} className="text-emerald-500" />
                        </button>
                        {breadcrumbs.map((crumb, index) => {
                            const pathUpToCrumb = '/' + breadcrumbs.slice(0, index + 1).join('/');
                            const isLast = index === breadcrumbs.length - 1;
                            return (
                                <React.Fragment key={index}>
                                    <ChevronRight size={14} className="text-zinc-600" />
                                    <button
                                        onClick={() => !isLast && navigateTo(pathUpToCrumb)}
                                        className={`hover:text-white transition-colors ${isLast ? 'text-white font-medium cursor-default' : 'cursor-pointer'}`}
                                    >
                                        {crumb}
                                    </button>
                                </React.Fragment>
                            );
                        })}
                    </div>
                    <div className="text-xs text-zinc-500">
                        {filteredFiles.length} items | {formatFileSize(calculateTotalSize(filteredFiles))}
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 flex items-center gap-3">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* File Table */}
                <div className="bg-surface border border-border border-t-0 rounded-b-lg overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-zinc-900/50 border-b border-border text-xs uppercase text-zinc-500">
                                <th className="p-4 w-10"></th>
                                <th className="p-4 font-medium">Name</th>
                                <th className="p-4 font-medium">Size</th>
                                <th className="p-4 font-medium">Permissions</th>
                                <th className="p-4 font-medium">Modified</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-border">
                            {/* 上層目錄連結 */}
                            {currentPath !== '/' && (
                                <tr 
                                    className="hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                    onClick={goBack}
                                >
                                    <td className="p-4 text-center">
                                        <Folder size={20} className="text-zinc-500" />
                                    </td>
                                    <td className="p-4 font-medium text-zinc-400">..</td>
                                    <td className="p-4 text-zinc-500">-</td>
                                    <td className="p-4 text-zinc-500">-</td>
                                    <td className="p-4 text-zinc-500">-</td>
                                    <td className="p-4"></td>
                                </tr>
                            )}

                            {/* Loading State */}
                            {loading && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-zinc-500">
                                        <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                                        Loading files...
                                    </td>
                                </tr>
                            )}

                            {/* Access Denied State */}
                            {!loading && accessDenied && filteredFiles.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                                                <Lock size={32} className="text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="text-zinc-300 font-medium mb-1">Permission Denied</p>
                                                <p className="text-zinc-500 text-sm">You don't have permission to access this directory.</p>
                                            </div>
                                            <button
                                                onClick={goBack}
                                                className="mt-2 flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors text-sm"
                                            >
                                                <ArrowLeft size={16} />
                                                Go Back
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* Empty State */}
                            {!loading && !accessDenied && filteredFiles.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-zinc-500">
                                        {searchTerm ? 'No files match your search.' : 'This directory is empty.'}
                                    </td>
                                </tr>
                            )}

                            {/* File List */}
                            {!loading && filteredFiles.map((file) => (
                                <tr 
                                    key={file.path} 
                                    className="hover:bg-zinc-800/50 transition-colors group cursor-pointer"
                                    onClick={() => handleItemClick(file)}
                                >
                                    <td className="p-4 text-center">
                                        {file.isDirectory ? (
                                            <Folder size={20} className="text-amber-400 fill-amber-400/20" />
                                        ) : (
                                            <FileText size={20} className="text-zinc-400" />
                                        )}
                                    </td>
                                    <td className="p-4 font-medium text-zinc-200">
                                        {file.name}
                                    </td>
                                    <td className="p-4 text-zinc-400 font-mono text-xs">
                                        {file.isDirectory ? '-' : formatFileSize(file.size)}
                                    </td>
                                    <td className="p-4 text-zinc-500 font-mono text-xs">
                                        {file.permissions}
                                    </td>
                                    <td className="p-4 text-zinc-500 text-xs">
                                        {file.lastModified}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div 
                                            className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {!file.isDirectory && (
                                                <button 
                                                    className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white" 
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDeleteClick(file)}
                                                className="p-1.5 hover:bg-rose-500/20 rounded text-zinc-400 hover:text-rose-400" 
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button 
                                                className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white" 
                                                title="More"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* File Editor Dialog */}
            <FileEditor
                file={selectedFile}
                isOpen={isEditorOpen}
                onClose={handleCloseEditor}
                onSave={handleSaveFile}
            />

            {/* Delete Confirmation Dialog */}
            {isDeleteDialogOpen && fileToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={handleCancelDelete}
                    />
                    
                    {/* Dialog */}
                    <div className="relative bg-zinc-900 rounded-lg border border-zinc-700 shadow-2xl p-6 max-w-md w-full mx-4 animate-fade-in">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                                <Trash2 size={24} className="text-rose-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-white mb-1">
                                    Delete {fileToDelete.isDirectory ? 'Folder' : 'File'}?
                                </h3>
                                <p className="text-sm text-zinc-400 mb-2">
                                    Are you sure you want to delete{' '}
                                    <span className="text-zinc-200 font-medium">{fileToDelete.name}</span>?
                                </p>
                                <p className="text-xs text-zinc-500 font-mono bg-zinc-800 px-2 py-1 rounded">
                                    {fileToDelete.path}
                                </p>
                                {fileToDelete.isDirectory && (
                                    <p className="text-xs text-amber-400 mt-2">
                                        ⚠️ Warning: This will delete all contents inside this folder.
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={handleCancelDelete}
                                disabled={deleting}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {deleting ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileManager;
