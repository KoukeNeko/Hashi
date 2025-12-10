import React, { useState, useEffect } from 'react';
import { FtpService } from '../../../services/api';
import { FtpUser, FtpServerType, CreateFtpUserRequest } from '../../../types';
import { ActionButton } from '../../../components';
import { FormDialog, ConfirmDialog } from '../../../components/ui';
import { Plus, Trash2, Loader2, RefreshCw, User, FolderOpen, Edit } from 'lucide-react';

interface FtpUsersPanelProps {
    serverType: FtpServerType;
    onToast: (toast: { message: string; type: 'success' | 'error' }) => void;
}

const FtpUsersPanel: React.FC<FtpUsersPanelProps> = ({ serverType, onToast }) => {
    const [users, setUsers] = useState<FtpUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<FtpUser | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<FtpUser | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await FtpService.listUsers(serverType);
            setUsers(data);
        } catch (err) {
            console.error('Failed to load users:', err);
            onToast({ message: 'Failed to load FTP users', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [serverType]);

    const handleAddUser = async (values: { username: string; password: string; homeDir: string }) => {
        try {
            const request: CreateFtpUserRequest = {
                username: values.username.trim(),
                password: values.password,
                homeDir: values.homeDir?.trim() || undefined
            };
            await FtpService.addUser(serverType, request);
            onToast({ message: `User "${values.username}" created successfully`, type: 'success' });
            loadUsers();
        } catch (err) {
            console.error('Failed to add user:', err);
            throw new Error('Failed to create FTP user');
        }
    };

    const handleEditClick = (user: FtpUser) => {
        setUserToEdit(user);
        setEditDialogOpen(true);
    };

    const handleEditUser = async (values: { password?: string; homeDir: string; moveContent: boolean }) => {
        if (!userToEdit) return;
        try {
            await FtpService.updateUser(serverType, userToEdit.username, {
                password: values.password,
                homeDir: values.homeDir,
                moveContent: values.moveContent
            });
            onToast({ message: `User "${userToEdit.username}" updated successfully`, type: 'success' });
            loadUsers();
            setEditDialogOpen(false);
            setUserToEdit(null);
        } catch (err) {
            console.error('Failed to update user:', err);
            throw new Error('Failed to update FTP user');
        }
    };

    const handleDeleteClick = (user: FtpUser) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;

        try {
            setDeleting(true);
            await FtpService.deleteUser(serverType, userToDelete.username);
            onToast({ message: `User "${userToDelete.username}" deleted`, type: 'success' });
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            loadUsers();
        } catch (err) {
            console.error('Failed to delete user:', err);
            onToast({ message: 'Failed to delete user', type: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">{users.length} users</p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadUsers}
                        disabled={loading}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <ActionButton onClick={() => setAddDialogOpen(true)} icon={<Plus size={16} />}>
                        Add User
                    </ActionButton>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-lg">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="animate-spin text-zinc-500" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                        <User size={40} className="mb-3 opacity-50" />
                        <p className="text-sm">No FTP users found</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900 border-b border-border text-xs uppercase text-zinc-500">
                                <th className="p-4 font-medium">Username</th>
                                <th className="p-4 font-medium">Home Directory</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-border">
                            {users.map(user => (
                                <tr key={user.username} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-zinc-500" />
                                            <span className="font-medium text-zinc-200">{user.username}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <FolderOpen size={14} />
                                            <span className="font-mono text-xs">{user.homeDir}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditClick(user)}
                                                className="text-zinc-500 hover:text-emerald-400 transition-colors"
                                                title="Edit user"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(user)}
                                                className="text-zinc-500 hover:text-rose-400 transition-colors"
                                                title="Delete user"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add User Dialog */}
            <FormDialog<{ username: string; password: string; homeDir: string }>
                isOpen={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                onSubmit={handleAddUser}
                title="Add FTP User"
                titleIcon={<User size={20} className="text-orange-400" />}
                submitText="Create User"
                fields={[
                    { name: 'username', label: 'Username', required: true, placeholder: 'ftpuser' },
                    { name: 'password', label: 'Password', type: 'password', required: true },
                    { name: 'homeDir', label: 'Home Directory', placeholder: '/home/ftpuser', hint: 'Leave empty for default' }
                ]}
            />

            {/* Edit User Dialog */}
            <FormDialog<{ password?: string; homeDir: string; moveContent: boolean }>
                isOpen={editDialogOpen}
                onClose={() => {
                    setEditDialogOpen(false);
                    setUserToEdit(null);
                }}
                onSubmit={handleEditUser}
                title={`Edit User: ${userToEdit?.username}`}
                titleIcon={<User size={20} className="text-emerald-400" />}
                submitText="Update User"
                initialValues={{
                    homeDir: userToEdit?.homeDir || '',
                    moveContent: false
                }}
                fields={[
                    { name: 'password', label: 'New Password', type: 'password', placeholder: 'Leave empty to keep current', hint: 'Optional' },
                    { name: 'homeDir', label: 'Home Directory', required: true, placeholder: '/home/ftpuser' },
                    { name: 'moveContent', label: 'Move existing content to new home directory', type: 'checkbox' }
                ]}
            />

            {/* Delete Confirm Dialog */}
            {userToDelete && (
                <ConfirmDialog
                    isOpen={deleteDialogOpen}
                    onClose={() => {
                        setDeleteDialogOpen(false);
                        setUserToDelete(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="Delete FTP User"
                    message={<>Are you sure you want to delete user <strong>{userToDelete.username}</strong>?</>}
                    confirmText="Delete"
                    confirmColor="red"
                    confirmIcon={deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                />
            )}
        </div>
    );
};

export default FtpUsersPanel;
