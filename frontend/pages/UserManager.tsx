import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { UserManagementService } from '../services/api';
import { UserInfo, GroupInfo } from '../types';
import { 
    Users, Plus, Trash2, Edit, Key, Terminal, X, Save, 
    AlertCircle, CheckCircle, Loader2, Shield, Home, UserPlus
} from 'lucide-react';

// Toast 通知組件
const Toast: React.FC<{
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border animate-fade-in ${
            type === 'success' 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
        }`}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={16} /></button>
        </div>
    );
};

// 新增用戶彈窗
const CreateUserDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (username: string, password: string, shell: string, createHome: boolean) => Promise<void>;
}> = ({ isOpen, onClose, onSave }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [shell, setShell] = useState('/bin/bash');
    const [createHome, setCreateHome] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUsername('');
            setPassword('');
            setConfirmPassword('');
            setShell('/bin/bash');
            setCreateHome(true);
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim()) {
            setError('Username is required');
            return;
        }
        if (!/^[a-z_][a-z0-9_-]*$/.test(username)) {
            setError('Invalid username format');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setSaving(true);
        try {
            await onSave(username, password, shell, createHome);
            onClose();
        } catch {
            setError('Failed to create user');
        } finally {
            setSaving(false);
        }
    };

    const shells = ['/bin/bash', '/bin/sh', '/bin/zsh', '/usr/bin/fish', '/sbin/nologin'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                        <UserPlus size={20} className="text-emerald-400" />
                        Create New User
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3 rounded flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Username *</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase())}
                            placeholder="johndoe"
                            className="w-full bg-zinc-800 border border-border rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            required
                        />
                        <p className="mt-1 text-xs text-zinc-500">Lowercase letters, numbers, underscores, hyphens</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Password *</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-zinc-800 border border-border rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Confirm Password *</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-zinc-800 border border-border rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Shell</label>
                        <select
                            value={shell}
                            onChange={(e) => setShell(e.target.value)}
                            className="w-full bg-zinc-800 border border-border rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        >
                            {shells.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="createHome"
                            checked={createHome}
                            onChange={(e) => setCreateHome(e.target.checked)}
                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="createHome" className="text-sm text-zinc-400">Create home directory</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Create User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// 修改密碼彈窗
const ChangePasswordDialog: React.FC<{
    isOpen: boolean;
    username: string;
    onClose: () => void;
    onSave: (password: string) => Promise<void>;
}> = ({ isOpen, username, onClose, onSave }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setSaving(true);
        try {
            await onSave(password);
            onClose();
        } catch {
            setError('Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                        <Key size={20} className="text-amber-400" />
                        Change Password
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <p className="text-sm text-zinc-400">
                        Change password for user: <span className="text-white font-medium">{username}</span>
                    </p>
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm p-3 rounded flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">New Password *</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-zinc-800 border border-border rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Confirm Password *</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-zinc-800 border border-border rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                            Change Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// 刪除確認彈窗
const DeleteConfirmDialog: React.FC<{
    isOpen: boolean;
    user: UserInfo | null;
    onClose: () => void;
    onConfirm: (removeHome: boolean) => void;
}> = ({ isOpen, user, onClose, onConfirm }) => {
    const [removeHome, setRemoveHome] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRemoveHome(false);
        }
    }, [isOpen]);

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                        <AlertCircle size={20} />
                        Delete User
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <p className="text-sm text-zinc-300">
                        Are you sure you want to delete user <span className="text-white font-bold">{user.username}</span>?
                    </p>
                    <p className="text-xs text-zinc-500">
                        UID: {user.uid} | Home: {user.homeDir}
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded">
                        <input
                            type="checkbox"
                            id="removeHome"
                            checked={removeHome}
                            onChange={(e) => setRemoveHome(e.target.checked)}
                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-rose-600 focus:ring-rose-500"
                        />
                        <label htmlFor="removeHome" className="text-sm text-rose-300">
                            Also delete home directory and mail spool
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(removeHome)}
                            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                            <Trash2 size={16} />
                            Delete User
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserManager: React.FC = () => {
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // 彈窗狀態
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await UserManagementService.listUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
            setToast({ message: 'Failed to load users', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleCreateUser = async (username: string, password: string, shell: string, createHome: boolean) => {
        await UserManagementService.createUser(username, password, shell, createHome);
        setToast({ message: `User "${username}" created successfully`, type: 'success' });
        loadUsers();
    };

    const handleChangePassword = async (password: string) => {
        if (!selectedUser) return;
        await UserManagementService.changePassword(selectedUser.username, password);
        setToast({ message: `Password changed for "${selectedUser.username}"`, type: 'success' });
    };

    const handleDeleteUser = async (removeHome: boolean) => {
        if (!selectedUser) return;
        try {
            await UserManagementService.deleteUser(selectedUser.username, removeHome);
            setToast({ message: `User "${selectedUser.username}" deleted`, type: 'success' });
            setDeleteDialogOpen(false);
            loadUsers();
        } catch {
            setToast({ message: 'Failed to delete user', type: 'error' });
        }
    };

    const openPasswordDialog = (user: UserInfo) => {
        setSelectedUser(user);
        setPasswordDialogOpen(true);
    };

    const openDeleteDialog = (user: UserInfo) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="User Management"
                icon={Users}
                description="Manage system users and permissions."
                actions={
                    <button
                        onClick={() => setCreateDialogOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-medium text-sm transition-colors shadow-lg"
                    >
                        <Plus size={16} />
                        Add User
                    </button>
                }
            />

            <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-xl">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="animate-spin text-zinc-500" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                        <Users size={48} className="mb-4 opacity-50" />
                        <p className="text-sm">No users found</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900 border-b border-border text-xs uppercase text-zinc-500">
                                <th className="p-4 font-medium">User</th>
                                <th className="p-4 font-medium">UID / GID</th>
                                <th className="p-4 font-medium">Home Directory</th>
                                <th className="p-4 font-medium">Shell</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-border">
                            {users.map(user => (
                                <tr key={user.username} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                user.uid === 0 
                                                    ? 'bg-rose-500/20 text-rose-400' 
                                                    : 'bg-emerald-500/20 text-emerald-400'
                                            }`}>
                                                {user.uid === 0 ? <Shield size={16} /> : <Users size={16} />}
                                            </div>
                                            <div>
                                                <span className="font-medium text-zinc-100">{user.username}</span>
                                                {user.uid === 0 && (
                                                    <span className="ml-2 text-xs bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">
                                                        root
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-zinc-400 text-xs">
                                        {user.uid} / {user.gid}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <Home size={14} />
                                            <span className="font-mono text-xs">{user.homeDir}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <Terminal size={14} />
                                            <span className="font-mono text-xs">{user.shell}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => openPasswordDialog(user)}
                                                className="p-2 hover:bg-amber-500/20 hover:text-amber-400 rounded transition-colors"
                                                title="Change Password"
                                            >
                                                <Key size={16} />
                                            </button>
                                            {user.uid !== 0 && (
                                                <button
                                                    onClick={() => openDeleteDialog(user)}
                                                    className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 彈窗 */}
            <CreateUserDialog
                isOpen={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onSave={handleCreateUser}
            />

            <ChangePasswordDialog
                isOpen={passwordDialogOpen}
                username={selectedUser?.username || ''}
                onClose={() => setPasswordDialogOpen(false)}
                onSave={handleChangePassword}
            />

            <DeleteConfirmDialog
                isOpen={deleteDialogOpen}
                user={selectedUser}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteUser}
            />

            {/* Toast 通知 */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default UserManager;
