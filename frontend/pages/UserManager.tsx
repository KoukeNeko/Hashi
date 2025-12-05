import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { UserManagementService } from '../services/api';
import { UserInfo } from '../types';
import { 
    Users, Plus, Trash2, Key, Terminal, Save, 
    Loader2, Shield, Home, UserPlus
} from 'lucide-react';
import {
    Dialog, DialogBody, DialogFooter,
    ConfirmDialog, FormInput, FormSelect, FormCheckbox,
    FormError, Toast, ActionButton
} from '../components/ui';

// ==================== Create User Dialog ====================
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

    const shells = [
        { value: '/bin/bash', label: '/bin/bash' },
        { value: '/bin/sh', label: '/bin/sh' },
        { value: '/bin/zsh', label: '/bin/zsh' },
        { value: '/usr/bin/fish', label: '/usr/bin/fish' },
        { value: '/sbin/nologin', label: '/sbin/nologin' }
    ];

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Create New User"
            titleIcon={<UserPlus size={20} className="text-emerald-400" />}
        >
            <form onSubmit={handleSubmit}>
                <DialogBody>
                    {error && <FormError message={error} />}
                    <FormInput
                        label="Username"
                        value={username}
                        onChange={(v) => setUsername(v.toLowerCase())}
                        placeholder="johndoe"
                        required
                        hint="Lowercase letters, numbers, underscores, hyphens"
                    />
                    <FormInput
                        label="Password"
                        type="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="••••••••"
                        required
                    />
                    <FormInput
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="••••••••"
                        required
                    />
                    <FormSelect
                        label="Shell"
                        value={shell}
                        onChange={setShell}
                        options={shells}
                    />
                    <FormCheckbox
                        id="createHome"
                        label="Create home directory"
                        checked={createHome}
                        onChange={setCreateHome}
                    />
                    <DialogFooter>
                        <ActionButton variant="ghost" onClick={onClose}>
                            Cancel
                        </ActionButton>
                        <ActionButton
                            type="submit"
                            variant="primary"
                            loading={saving}
                            icon={<Save size={16} />}
                            loadingIcon={<Loader2 size={16} className="animate-spin" />}
                        >
                            Create User
                        </ActionButton>
                    </DialogFooter>
                </DialogBody>
            </form>
        </Dialog>
    );
};

// ==================== Change Password Dialog ====================
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
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Change Password"
            titleIcon={<Key size={20} className="text-amber-400" />}
        >
            <form onSubmit={handleSubmit}>
                <DialogBody>
                    <p className="text-sm text-zinc-400">
                        Change password for user: <span className="text-white font-medium">{username}</span>
                    </p>
                    {error && <FormError message={error} />}
                    <FormInput
                        label="New Password"
                        type="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="••••••••"
                        required
                    />
                    <FormInput
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="••••••••"
                        required
                    />
                    <DialogFooter>
                        <ActionButton variant="ghost" onClick={onClose}>
                            Cancel
                        </ActionButton>
                        <ActionButton
                            type="submit"
                            variant="warning"
                            loading={saving}
                            icon={<Key size={16} />}
                            loadingIcon={<Loader2 size={16} className="animate-spin" />}
                        >
                            Change Password
                        </ActionButton>
                    </DialogFooter>
                </DialogBody>
            </form>
        </Dialog>
    );
};

// ==================== Delete User Dialog ====================
const DeleteUserDialog: React.FC<{
    isOpen: boolean;
    user: UserInfo | null;
    onClose: () => void;
    onConfirm: (removeHome: boolean) => void;
}> = ({ isOpen, user, onClose, onConfirm }) => {
    const [removeHome, setRemoveHome] = useState(false);

    useEffect(() => {
        if (isOpen) setRemoveHome(false);
    }, [isOpen]);

    if (!user) return null;

    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={() => onConfirm(removeHome)}
            title="Delete User"
            message={
                <>
                    Are you sure you want to delete user <span className="text-white font-bold">{user.username}</span>?
                    <p className="text-xs text-zinc-500 mt-2">
                        UID: {user.uid} | Home: {user.homeDir}
                    </p>
                </>
            }
            confirmText="Delete User"
            confirmIcon={<Trash2 size={16} />}
        >
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded">
                <FormCheckbox
                    id="removeHome"
                    label="Also delete home directory and mail spool"
                    checked={removeHome}
                    onChange={setRemoveHome}
                    color="rose"
                />
            </div>
        </ConfirmDialog>
    );
};

// ==================== Main Component ====================
const UserManager: React.FC = () => {
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="User Management"
                icon={Users}
                description="Manage system users and permissions."
                actions={
                    <ActionButton
                        onClick={() => setCreateDialogOpen(true)}
                        icon={<Plus size={16} />}
                        className="shadow-lg"
                    >
                        Add User
                    </ActionButton>
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
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setPasswordDialogOpen(true);
                                                }}
                                                className="p-2 hover:bg-amber-500/20 hover:text-amber-400 rounded transition-colors"
                                                title="Change Password"
                                            >
                                                <Key size={16} />
                                            </button>
                                            {user.uid !== 0 && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setDeleteDialogOpen(true);
                                                    }}
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

            {/* Dialogs */}
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
            <DeleteUserDialog
                isOpen={deleteDialogOpen}
                user={selectedUser}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteUser}
            />

            {/* Toast */}
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
