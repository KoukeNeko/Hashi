import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Tabs, TabItem } from '../components/Tabs';
import { UserManagementService } from '../services/api';
import { UserInfo, GroupInfo } from '../types';
import { 
    Users, UsersRound, Plus, Trash2, Key, Terminal, Save, 
    Loader2, Shield, Home, UserPlus, UserMinus, Lock, Unlock, Edit3
} from 'lucide-react';
import {
    Dialog, DialogBody, DialogFooter,
    ConfirmDialog, FormInput, FormSelect, FormCheckbox,
    FormError, Toast, ActionButton,
    FormDialog, useFormDialog
} from '../components/ui';

// ==================== Tab Configuration ====================
const tabs: TabItem[] = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'groups', label: 'Groups', icon: UsersRound }
];

// ==================== Shell Options ====================
const defaultShells = [
    { value: '/bin/bash', label: '/bin/bash' },
    { value: '/bin/sh', label: '/bin/sh' },
    { value: '/bin/zsh', label: '/bin/zsh' },
    { value: '/usr/bin/fish', label: '/usr/bin/fish' },
    { value: '/sbin/nologin', label: '/sbin/nologin' }
];

// ==================== Create User Dialog ====================
const CreateUserDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (username: string, password: string, shell: string, createHome: boolean) => Promise<void>;
}> = ({ isOpen, onClose, onSave }) => {
    interface CreateUserForm {
        username: string;
        password: string;
        confirmPassword: string;
        shell: string;
        createHome: boolean;
    }

    const validate = (values: CreateUserForm): string | null => {
        if (!/^[a-z_][a-z0-9_-]*$/.test(values.username)) {
            return 'Invalid username format';
        }
        if (values.password.length < 6) {
            return 'Password must be at least 6 characters';
        }
        if (values.password !== values.confirmPassword) {
            return 'Passwords do not match';
        }
        return null;
    };

    const handleSubmit = async (values: CreateUserForm) => {
        await onSave(values.username, values.password, values.shell, values.createHome);
    };

    return (
        <FormDialog<CreateUserForm>
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleSubmit}
            title="Create New User"
            titleIcon={<UserPlus size={20} className="text-emerald-400" />}
            submitText="Create User"
            fields={[
                { name: 'username', label: 'Username', required: true, placeholder: 'johndoe', hint: 'Lowercase letters, numbers, underscores, hyphens', transform: (v) => v.toLowerCase() },
                { name: 'password', label: 'Password', type: 'password', required: true, placeholder: '••••••••' },
                { name: 'confirmPassword', label: 'Confirm Password', type: 'password', required: true, placeholder: '••••••••' },
                { name: 'shell', label: 'Shell', type: 'select', options: defaultShells, defaultValue: '/bin/bash' },
                { name: 'createHome', label: 'Create home directory', type: 'checkbox', defaultValue: true }
            ]}
            validate={validate}
        />
    );
};

// ==================== Change Password Dialog ====================
const ChangePasswordDialog: React.FC<{
    isOpen: boolean;
    username: string;
    onClose: () => void;
    onSave: (password: string) => Promise<void>;
}> = ({ isOpen, username, onClose, onSave }) => {
    interface ChangePasswordForm {
        password: string;
        confirmPassword: string;
    }

    const validate = (values: ChangePasswordForm): string | null => {
        if (values.password.length < 6) {
            return 'Password must be at least 6 characters';
        }
        if (values.password !== values.confirmPassword) {
            return 'Passwords do not match';
        }
        return null;
    };

    return (
        <FormDialog<ChangePasswordForm>
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={(values) => onSave(values.password)}
            title="Change Password"
            titleIcon={<Key size={20} className="text-amber-400" />}
            submitText="Change Password"
            submitVariant="warning"
            submitIcon={<Key size={16} />}
            header={
                <p className="text-sm text-zinc-400 mb-2">
                    Change password for user: <span className="text-white font-medium">{username}</span>
                </p>
            }
            fields={[
                { name: 'password', label: 'New Password', type: 'password', required: true, placeholder: '••••••••' },
                { name: 'confirmPassword', label: 'Confirm Password', type: 'password', required: true, placeholder: '••••••••' }
            ]}
            validate={validate}
        />
    );
};

// ==================== Create Group Dialog ====================
const CreateGroupDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => Promise<void>;
}> = ({ isOpen, onClose, onSave }) => {
    interface CreateGroupForm {
        name: string;
    }

    const validate = (values: CreateGroupForm): string | null => {
        if (!/^[a-z_][a-z0-9_-]*$/.test(values.name)) {
            return 'Invalid group name format';
        }
        return null;
    };

    return (
        <FormDialog<CreateGroupForm>
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={(values) => onSave(values.name)}
            title="Create New Group"
            titleIcon={<UsersRound size={20} className="text-emerald-400" />}
            submitText="Create Group"
            fields={[
                { name: 'name', label: 'Group Name', required: true, placeholder: 'developers', hint: 'Lowercase letters, numbers, underscores, hyphens', transform: (v) => v.toLowerCase() }
            ]}
            validate={validate}
        />
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

// ==================== Manage Group Members Dialog ====================
const ManageMembersDialog: React.FC<{
    isOpen: boolean;
    group: GroupInfo | null;
    users: UserInfo[];
    onClose: () => void;
    onAddMember: (groupName: string, username: string) => Promise<void>;
    onRemoveMember: (groupName: string, username: string) => Promise<void>;
}> = ({ isOpen, group, users, onClose, onAddMember, onRemoveMember }) => {
    const [selectedUser, setSelectedUser] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) setSelectedUser('');
    }, [isOpen]);

    if (!group) return null;

    const nonMembers = users.filter(u => !group.members.includes(u.username));

    const handleAdd = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            await onAddMember(group.name, selectedUser);
            setSelectedUser('');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (username: string) => {
        setSaving(true);
        try {
            await onRemoveMember(group.name, username);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={`Manage Members: ${group.name}`}
            titleIcon={<UsersRound size={20} className="text-blue-400" />}
            maxWidth="max-w-lg"
        >
            <DialogBody>
                {/* Add Member */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <FormSelect
                            label="Add Member"
                            value={selectedUser}
                            onChange={setSelectedUser}
                            options={[
                                { value: '', label: 'Select a user...' },
                                ...nonMembers.map(u => ({ value: u.username, label: u.username }))
                            ]}
                        />
                    </div>
                    <div className="flex items-end">
                        <ActionButton
                            onClick={handleAdd}
                            disabled={!selectedUser || saving}
                            icon={<UserPlus size={16} />}
                            loading={saving}
                        >
                            Add
                        </ActionButton>
                    </div>
                </div>

                {/* Current Members */}
                <div className="mt-4">
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                        Current Members ({group.members.length})
                    </label>
                    {group.members.length === 0 ? (
                        <p className="text-sm text-zinc-500 italic">No members in this group</p>
                    ) : (
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {group.members.map(member => (
                                <div 
                                    key={member} 
                                    className="flex items-center justify-between p-2 bg-zinc-800/50 rounded border border-border"
                                >
                                    <div className="flex items-center gap-2">
                                        <Users size={14} className="text-zinc-500" />
                                        <span className="text-sm text-zinc-200">{member}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(member)}
                                        disabled={saving}
                                        className="p-1 hover:bg-rose-500/20 hover:text-rose-400 rounded transition-colors disabled:opacity-50"
                                        title="Remove member"
                                    >
                                        <UserMinus size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogBody>
            <DialogFooter>
                <ActionButton variant="ghost" onClick={onClose}>
                    Close
                </ActionButton>
            </DialogFooter>
        </Dialog>
    );
};

// ==================== Edit User Dialog ====================
const EditUserDialog: React.FC<{
    isOpen: boolean;
    user: UserInfo | null;
    groups: GroupInfo[];
    onClose: () => void;
    onSave: (updates: {
        uid?: number;
        gid?: number;
        shell?: string;
        gecos?: string;
        homeDir?: string;
        expireDate?: string | null;
    }) => Promise<void>;
    onRefresh: () => void;
}> = ({ isOpen, user, groups, onClose, onSave, onRefresh }) => {
    const [uid, setUid] = useState('');
    const [gid, setGid] = useState('');
    const [shell, setShell] = useState('');
    const [gecos, setGecos] = useState('');
    const [homeDir, setHomeDir] = useState('');
    const [expireDate, setExpireDate] = useState('');
    const [shells, setShells] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            setUid(user.uid.toString());
            setGid(user.gid.toString());
            setShell(user.shell || '/bin/bash');
            setGecos(user.gecos || '');
            setHomeDir(user.homeDir || '');
            setExpireDate(user.expireDate || '');
            setError('');
            
            // 載入可用的 shells
            UserManagementService.getAvailableShells()
                .then(setShells)
                .catch(() => setShells(['/bin/bash', '/bin/sh', '/usr/sbin/nologin']));
        }
    }, [isOpen, user]);

    if (!user) return null;

    // 建立 GID 選項 (群組列表)
    const gidOptions = groups.map(g => ({ 
        value: g.gid.toString(), 
        label: `${g.name} (${g.gid})` 
    }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // 驗證 UID
        const newUid = parseInt(uid);
        if (isNaN(newUid) || newUid < 0) {
            setError('Invalid UID');
            return;
        }

        // 驗證 GID
        const newGid = parseInt(gid);
        if (isNaN(newGid) || newGid < 0) {
            setError('Invalid GID');
            return;
        }

        setSaving(true);

        try {
            const updates: { uid?: number; gid?: number; shell?: string; gecos?: string; homeDir?: string; expireDate?: string | null } = {};
            
            if (newUid !== user.uid) updates.uid = newUid;
            if (newGid !== user.gid) updates.gid = newGid;
            if (shell !== user.shell) updates.shell = shell;
            if (gecos !== (user.gecos || '')) updates.gecos = gecos;
            if (homeDir !== user.homeDir) updates.homeDir = homeDir;
            if (expireDate !== (user.expireDate || '')) {
                updates.expireDate = expireDate || null;
            }

            if (Object.keys(updates).length === 0) {
                onClose();
                return;
            }

            await onSave(updates);
            onRefresh();
            onClose();
        } catch {
            setError('Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit User: ${user.username}`}
            titleIcon={<Edit3 size={20} className="text-blue-400" />}
        >
            <form onSubmit={handleSubmit}>
                <DialogBody>
                    {error && <FormError message={error} />}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="UID"
                            type="text"
                            value={uid}
                            onChange={setUid}
                            placeholder="1000"
                            hint="User ID (changing may affect file ownership)"
                        />
                        <FormSelect
                            label="Primary Group (GID)"
                            value={gid}
                            onChange={setGid}
                            options={gidOptions}
                        />
                    </div>

                    <FormInput
                        label="Full Name (GECOS)"
                        value={gecos}
                        onChange={setGecos}
                        placeholder="John Doe"
                    />

                    <FormSelect
                        label="Shell"
                        value={shell}
                        onChange={setShell}
                        options={shells.map(s => ({ value: s, label: s }))}
                    />

                    <FormInput
                        label="Home Directory"
                        value={homeDir}
                        onChange={setHomeDir}
                        placeholder="/home/username"
                    />

                    <FormInput
                        label="Account Expire Date"
                        type="date"
                        value={expireDate}
                        onChange={setExpireDate}
                        hint="Leave empty for no expiration"
                    />

                    {user.groups && user.groups.length > 0 && (
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2">
                                Groups
                            </label>
                            <div className="flex flex-wrap gap-1">
                                {user.groups.map(g => (
                                    <span key={g} className="text-xs bg-zinc-700 px-2 py-1 rounded">
                                        {g}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogBody>
                <DialogFooter>
                    <ActionButton variant="ghost" onClick={onClose}>
                        Cancel
                    </ActionButton>
                    <ActionButton
                        type="submit"
                        variant="primary"
                        loading={saving}
                        icon={<Save size={16} />}
                    >
                        Save Changes
                    </ActionButton>
                </DialogFooter>
            </form>
        </Dialog>
    );
};

// ==================== Users Tab Content ====================
const UsersTab: React.FC<{
    users: UserInfo[];
    loading: boolean;
    onCreateUser: () => void;
    onChangePassword: (user: UserInfo) => void;
    onDeleteUser: (user: UserInfo) => void;
    onLockUser: (user: UserInfo) => void;
    onUnlockUser: (user: UserInfo) => void;
    onEditUser: (user: UserInfo) => void;
}> = ({ users, loading, onChangePassword, onDeleteUser, onLockUser, onUnlockUser, onEditUser }) => {
    // 過濾掉系統使用者 (UID < 1000)，可以選擇顯示
    const [showSystem, setShowSystem] = useState(false);
    const displayUsers = showSystem ? users : users.filter(u => u.uid >= 1000 || u.uid === 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div>
            {/* Filter Toggle */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-zinc-900/50">
                <FormCheckbox
                    id="showSystemUsers"
                    label="Show system users (UID < 1000)"
                    checked={showSystem}
                    onChange={setShowSystem}
                />
                <span className="text-xs text-zinc-500">
                    Showing {displayUsers.length} of {users.length} users
                </span>
            </div>

            {displayUsers.length === 0 ? (
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
                            <th className="p-4 font-medium">Groups</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-border">
                        {displayUsers.map(user => (
                            <tr key={user.username} className="hover:bg-zinc-800/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            user.uid === 0 
                                                ? 'bg-rose-500/20 text-rose-400' 
                                                : user.uid < 1000
                                                    ? 'bg-amber-500/20 text-amber-400'
                                                    : 'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                            {user.uid === 0 ? <Shield size={16} /> : <Users size={16} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-zinc-100">{user.username}</span>
                                                {user.uid === 0 && (
                                                    <span className="text-xs bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">
                                                        root
                                                    </span>
                                                )}
                                                {user.uid > 0 && user.uid < 1000 && (
                                                    <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                                                        system
                                                    </span>
                                                )}
                                                {user.locked && (
                                                    <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        <Lock size={10} /> locked
                                                    </span>
                                                )}
                                            </div>
                                            {user.gecos && (
                                                <span className="text-xs text-zinc-500">{user.gecos}</span>
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
                                    {user.groups && user.groups.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {user.groups.slice(0, 3).map(g => (
                                                <span key={g} className="text-xs bg-zinc-700 px-1.5 py-0.5 rounded">
                                                    {g}
                                                </span>
                                            ))}
                                            {user.groups.length > 3 && (
                                                <span className="text-xs text-zinc-500">+{user.groups.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-1">
                                        {user.uid >= 1000 && (
                                            <button
                                                onClick={() => onEditUser(user)}
                                                className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onChangePassword(user)}
                                            className="p-2 hover:bg-amber-500/20 hover:text-amber-400 rounded transition-colors"
                                            title="Change Password"
                                        >
                                            <Key size={16} />
                                        </button>
                                        {user.uid !== 0 && user.uid >= 1000 && (
                                            <>
                                                {user.locked ? (
                                                    <button
                                                        onClick={() => onUnlockUser(user)}
                                                        className="p-2 hover:bg-emerald-500/20 hover:text-emerald-400 rounded transition-colors"
                                                        title="Unlock User"
                                                    >
                                                        <Unlock size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => onLockUser(user)}
                                                        className="p-2 hover:bg-orange-500/20 hover:text-orange-400 rounded transition-colors"
                                                        title="Lock User"
                                                    >
                                                        <Lock size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onDeleteUser(user)}
                                                    className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

// ==================== Groups Tab Content ====================
const GroupsTab: React.FC<{
    groups: GroupInfo[];
    loading: boolean;
    onCreateGroup: () => void;
    onManageMembers: (group: GroupInfo) => void;
    onDeleteGroup: (group: GroupInfo) => void;
}> = ({ groups, loading, onCreateGroup, onManageMembers, onDeleteGroup }) => {
    // 過濾掉系統群組 (GID < 1000)，可以選擇顯示
    const [showSystem, setShowSystem] = useState(false);
    const displayGroups = showSystem ? groups : groups.filter(g => g.gid >= 1000);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div>
            {/* Filter Toggle */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-zinc-900/50">
                <FormCheckbox
                    id="showSystem"
                    label="Show system groups (GID < 1000)"
                    checked={showSystem}
                    onChange={setShowSystem}
                />
                <span className="text-xs text-zinc-500">
                    Showing {displayGroups.length} of {groups.length} groups
                </span>
            </div>

            {displayGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                    <UsersRound size={48} className="mb-4 opacity-50" />
                    <p className="text-sm">No groups found</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-900 border-b border-border text-xs uppercase text-zinc-500">
                            <th className="p-4 font-medium">Group Name</th>
                            <th className="p-4 font-medium">GID</th>
                            <th className="p-4 font-medium">Members</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-border">
                        {displayGroups.map(group => (
                            <tr key={group.name} className="hover:bg-zinc-800/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            group.gid < 1000 
                                                ? 'bg-amber-500/20 text-amber-400' 
                                                : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                            <UsersRound size={16} />
                                        </div>
                                        <div>
                                            <span className="font-medium text-zinc-100">{group.name}</span>
                                            {group.gid < 1000 && (
                                                <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                                                    system
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 font-mono text-zinc-400 text-xs">
                                    {group.gid}
                                </td>
                                <td className="p-4">
                                    {group.members.length === 0 ? (
                                        <span className="text-zinc-500 text-xs italic">No members</span>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {group.members.slice(0, 5).map(m => (
                                                <span key={m} className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                                                    {m}
                                                </span>
                                            ))}
                                            {group.members.length > 5 && (
                                                <span className="text-xs text-zinc-500">
                                                    +{group.members.length - 5} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => onManageMembers(group)}
                                            className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded transition-colors"
                                            title="Manage Members"
                                        >
                                            <Users size={16} />
                                        </button>
                                        {group.gid >= 1000 && (
                                            <button
                                                onClick={() => onDeleteGroup(group)}
                                                className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded transition-colors"
                                                title="Delete Group"
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
    );
};

// ==================== Main Component ====================
const UserManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [groups, setGroups] = useState<GroupInfo[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // User dialogs
    const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
    const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

    // Group dialogs
    const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
    const [manageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);
    const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const data = await UserManagementService.listUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
            setToast({ message: 'Failed to load users', type: 'error' });
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadGroups = async () => {
        try {
            setLoadingGroups(true);
            const data = await UserManagementService.listGroups();
            setGroups(data);
        } catch (error) {
            console.error('Failed to load groups:', error);
            setToast({ message: 'Failed to load groups', type: 'error' });
        } finally {
            setLoadingGroups(false);
        }
    };

    useEffect(() => {
        loadUsers();
        loadGroups();
    }, []);

    // User handlers
    const handleCreateUser = async (username: string, password: string, shell: string, createHome: boolean) => {
        await UserManagementService.createUser({ username, password, shell, createHome });
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
            await UserManagementService.deleteUser(selectedUser.username, removeHome, false);
            setToast({ message: `User "${selectedUser.username}" deleted`, type: 'success' });
            setDeleteUserDialogOpen(false);
            loadUsers();
        } catch {
            setToast({ message: 'Failed to delete user', type: 'error' });
        }
    };

    const handleLockUser = async (user: UserInfo) => {
        try {
            await UserManagementService.lockUser(user.username);
            setToast({ message: `User "${user.username}" locked`, type: 'success' });
            loadUsers();
        } catch {
            setToast({ message: 'Failed to lock user', type: 'error' });
        }
    };

    const handleUnlockUser = async (user: UserInfo) => {
        try {
            await UserManagementService.unlockUser(user.username);
            setToast({ message: `User "${user.username}" unlocked`, type: 'success' });
            loadUsers();
        } catch {
            setToast({ message: 'Failed to unlock user', type: 'error' });
        }
    };

    const handleEditUser = async (updates: { uid?: number; gid?: number; shell?: string; gecos?: string; homeDir?: string; expireDate?: string | null }) => {
        if (!selectedUser) return;
        
        try {
            if (updates.uid !== undefined) {
                await UserManagementService.changeUid(selectedUser.username, updates.uid);
            }
            if (updates.gid !== undefined) {
                await UserManagementService.changePrimaryGroup(selectedUser.username, updates.gid);
            }
            if (updates.shell) {
                await UserManagementService.changeShell(selectedUser.username, updates.shell);
            }
            if (updates.gecos !== undefined) {
                await UserManagementService.changeGecos(selectedUser.username, updates.gecos);
            }
            if (updates.homeDir) {
                await UserManagementService.changeHomeDir(selectedUser.username, updates.homeDir, false);
            }
            if (updates.expireDate !== undefined) {
                await UserManagementService.setExpireDate(selectedUser.username, updates.expireDate);
            }
            
            setToast({ message: `User "${selectedUser.username}" updated`, type: 'success' });
        } catch {
            setToast({ message: 'Failed to update user', type: 'error' });
            throw new Error('Failed to update user');
        }
    };

    // Group handlers
    const handleCreateGroup = async (name: string) => {
        await UserManagementService.createGroup({ name });
        setToast({ message: `Group "${name}" created successfully`, type: 'success' });
        loadGroups();
    };

    const handleDeleteGroup = async () => {
        if (!selectedGroup) return;
        try {
            await UserManagementService.deleteGroup(selectedGroup.name);
            setToast({ message: `Group "${selectedGroup.name}" deleted`, type: 'success' });
            setDeleteGroupDialogOpen(false);
            loadGroups();
        } catch {
            setToast({ message: 'Failed to delete group', type: 'error' });
        }
    };

    const handleAddMember = async (groupName: string, username: string) => {
        await UserManagementService.addMemberToGroup(groupName, username);
        setToast({ message: `Added "${username}" to group "${groupName}"`, type: 'success' });
        loadGroups();
    };

    const handleRemoveMember = async (groupName: string, username: string) => {
        await UserManagementService.removeMemberFromGroup(groupName, username);
        setToast({ message: `Removed "${username}" from group "${groupName}"`, type: 'success' });
        loadGroups();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="User & Group Management"
                icon={Users}
                description="Manage system users, groups, and permissions."
                actions={
                    <ActionButton
                        onClick={() => activeTab === 'users' ? setCreateUserDialogOpen(true) : setCreateGroupDialogOpen(true)}
                        icon={<Plus size={16} />}
                        className="shadow-lg"
                    >
                        {activeTab === 'users' ? 'Add User' : 'Add Group'}
                    </ActionButton>
                }
            />

            {/* Tabs */}
            <Tabs items={tabs} activeId={activeTab} onChange={setActiveTab} />

            {/* Content */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-xl">
                {activeTab === 'users' ? (
                    <UsersTab
                        users={users}
                        loading={loadingUsers}
                        onCreateUser={() => setCreateUserDialogOpen(true)}
                        onChangePassword={(user) => {
                            setSelectedUser(user);
                            setPasswordDialogOpen(true);
                        }}
                        onDeleteUser={(user) => {
                            setSelectedUser(user);
                            setDeleteUserDialogOpen(true);
                        }}
                        onLockUser={handleLockUser}
                        onUnlockUser={handleUnlockUser}
                        onEditUser={(user) => {
                            setSelectedUser(user);
                            setEditUserDialogOpen(true);
                        }}
                    />
                ) : (
                    <GroupsTab
                        groups={groups}
                        loading={loadingGroups}
                        onCreateGroup={() => setCreateGroupDialogOpen(true)}
                        onManageMembers={(group) => {
                            setSelectedGroup(group);
                            setManageMembersDialogOpen(true);
                        }}
                        onDeleteGroup={(group) => {
                            setSelectedGroup(group);
                            setDeleteGroupDialogOpen(true);
                        }}
                    />
                )}
            </div>

            {/* User Dialogs */}
            <CreateUserDialog
                isOpen={createUserDialogOpen}
                onClose={() => setCreateUserDialogOpen(false)}
                onSave={handleCreateUser}
            />
            <ChangePasswordDialog
                isOpen={passwordDialogOpen}
                username={selectedUser?.username || ''}
                onClose={() => setPasswordDialogOpen(false)}
                onSave={handleChangePassword}
            />
            <DeleteUserDialog
                isOpen={deleteUserDialogOpen}
                user={selectedUser}
                onClose={() => setDeleteUserDialogOpen(false)}
                onConfirm={handleDeleteUser}
            />
            <EditUserDialog
                isOpen={editUserDialogOpen}
                user={selectedUser}
                groups={groups}
                onClose={() => setEditUserDialogOpen(false)}
                onSave={handleEditUser}
                onRefresh={loadUsers}
            />

            {/* Group Dialogs */}
            <CreateGroupDialog
                isOpen={createGroupDialogOpen}
                onClose={() => setCreateGroupDialogOpen(false)}
                onSave={handleCreateGroup}
            />
            <ManageMembersDialog
                isOpen={manageMembersDialogOpen}
                group={selectedGroup}
                users={users}
                onClose={() => setManageMembersDialogOpen(false)}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
            />
            <ConfirmDialog
                isOpen={deleteGroupDialogOpen}
                onClose={() => setDeleteGroupDialogOpen(false)}
                onConfirm={handleDeleteGroup}
                title="Delete Group"
                message={
                    selectedGroup ? (
                        <>
                            Are you sure you want to delete group <span className="text-white font-bold">{selectedGroup.name}</span>?
                            <p className="text-xs text-zinc-500 mt-2">
                                GID: {selectedGroup.gid} | Members: {selectedGroup.members.length}
                            </p>
                        </>
                    ) : null
                }
                confirmText="Delete Group"
                confirmIcon={<Trash2 size={16} />}
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
