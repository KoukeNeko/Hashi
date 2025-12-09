import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Tabs, TabItem } from '../../components/Tabs';
import { UserManagementService } from '../../services/api';
import { UserInfo, GroupInfo } from '../../types';
import { Users, UsersRound, Plus, Loader2, Trash2 } from 'lucide-react';
import { ConfirmDialog, Toast, ActionButton } from '../../components/ui';
import {
    CreateUserDialog,
    ChangePasswordDialog,
    CreateGroupDialog,
    DeleteUserDialog,
    ManageMembersDialog,
    EditUserDialog,
    UsersTab,
    GroupsTab
} from './components/UserDialogs';

// ==================== Tab Configuration ====================
const tabs: TabItem[] = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'groups', label: 'Groups', icon: UsersRound }
];


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
