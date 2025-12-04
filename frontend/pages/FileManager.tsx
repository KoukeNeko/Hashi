
import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { MOCK_FILES } from '../constants';
import { FileText, Folder, HardDrive, MoreVertical, Search, Upload, Download, Trash2, Home, ChevronRight } from 'lucide-react';

const FileManager: React.FC = () => {
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
                                className="bg-zinc-900 border border-zinc-700 text-zinc-300 pl-9 pr-4 py-2 rounded text-sm focus:outline-none focus:border-emerald-500 w-64 shadow-lg"
                            />
                        </div>
                        <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2 border border-zinc-700">
                            <Upload size={16} /> Upload
                        </button>
                    </div>
                }
            />

            <div className="flex flex-col shadow-xl rounded-lg">
                {/* Breadcrumb / Toolbar */}
                <div className="bg-zinc-900 border border-border p-3 rounded-t-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Home size={16} className="text-emerald-500" />
                        <span className="text-zinc-600">/</span>
                        <span className="hover:text-white cursor-pointer transition-colors">var</span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-white font-medium">www</span>
                    </div>
                    <div className="text-xs text-zinc-500">
                        5 items | 24.1 GB
                    </div>
                </div>

                <div className="bg-surface border border-border border-t-0 rounded-b-lg overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-zinc-900/50 border-b border-border text-xs uppercase text-zinc-500">
                                <th className="p-4 w-10"></th>
                                <th className="p-4 font-medium">Name</th>
                                <th className="p-4 font-medium">Size</th>
                                <th className="p-4 font-medium">Permissions</th>
                                <th className="p-4 font-medium">Owner</th>
                                <th className="p-4 font-medium">Updated</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-border">
                            {MOCK_FILES.map((file, idx) => (
                                <tr key={idx} className="hover:bg-zinc-800/50 transition-colors group cursor-pointer">
                                    <td className="p-4 text-center">
                                        {file.type === 'folder' ? (
                                            <Folder size={20} className="text-amber-400 fill-amber-400/20" />
                                        ) : (
                                            <FileText size={20} className="text-zinc-400" />
                                        )}
                                    </td>
                                    <td className="p-4 font-medium text-zinc-200">{file.name}</td>
                                    <td className="p-4 text-zinc-400 font-mono text-xs">{file.size}</td>
                                    <td className="p-4 text-zinc-500 font-mono text-xs">{file.permissions}</td>
                                    <td className="p-4 text-zinc-400">{file.owner}</td>
                                    <td className="p-4 text-zinc-500 text-xs">{file.updated}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white" title="Download">
                                                <Download size={16} />
                                            </button>
                                            <button className="p-1.5 hover:bg-rose-500/20 rounded text-zinc-400 hover:text-rose-400" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white" title="More">
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
        </div>
    );
};

export default FileManager;
