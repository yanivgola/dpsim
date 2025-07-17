

import React, { useState, useEffect } from 'react';
import { Theme, MockTrainee, UserRole } from '@/types';
import * as ApiService from '@/services/ApiService';
import { UI_TEXT } from '@/constants';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ManageUsersTabProps {
  theme: Theme;
}

const ManageUsersTab: React.FC<ManageUsersTabProps> = ({ theme }) => {
  const [users, setUsers] = useState<MockTrainee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<MockTrainee> | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setUsers(await ApiService.getUsers());
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAddUser = () => {
    setEditingUser({});
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser?.name || !editingUser.email || !editingUser.password || !editingUser.role) {
      alert(UI_TEXT.errorFieldsMissing);
      return;
    }

    const newUser: MockTrainee = {
      id: `user-${Date.now()}`,
      name: editingUser.name,
      email: editingUser.email,
      password: editingUser.password,
      role: editingUser.role,
      sessions: [],
    };
    
    await ApiService.addUser(newUser);
    await loadUsers();
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if(userToDelete && window.confirm(UI_TEXT.confirmDeleteUserMessage(userToDelete.name))) {
        await ApiService.deleteUser(userId);
        await loadUsers();
    }
  };
  
  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    const userToChange = users.find(u => u.id === userId);
    if(userToChange && window.confirm(UI_TEXT.confirmRoleChangeMessage(userToChange.name, newRole))) {
      await ApiService.updateUserRole(userId, newRole);
      await loadUsers();
    }
  };

  const roleOptions = [
    { value: UserRole.TRAINEE, label: UI_TEXT.roleTrainee },
    { value: UserRole.TRAINER, label: UI_TEXT.roleTrainer },
    { value: UserRole.SYSTEM_ADMIN, label: UI_TEXT.roleSystemAdmin },
  ];

  return (
    <div className={`p-4 rounded-lg space-y-4 ${theme === 'light' ? 'bg-white border' : 'themed-card'}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{UI_TEXT.manageUsersTab}</h3>
        <Button onClick={handleOpenAddUser} isLoading={isLoading}>{UI_TEXT.addUserButton}</Button>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y themed-border">
            <thead className={theme === 'light' ? 'bg-secondary-50' : 'bg-secondary-700'}>
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">שם</th>
                <th className="px-6 py-3 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">אימייל</th>
                <th className="px-6 py-3 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">תפקיד</th>
                <th className="px-6 py-3 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y themed-border">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm themed-text-content">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Select 
                          value={user.role} 
                          onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                          options={roleOptions}
                          className="text-xs"
                      />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      onClick={() => handleDeleteUser(user.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-100"
                      title={UI_TEXT.ariaLabelDeleteUser(user.name)}
                    >
                      {UI_TEXT.delete}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingUser && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={UI_TEXT.addNewUserModalTitle}>
            <div className="space-y-4">
                <Input label={UI_TEXT.fullNameLabel} value={editingUser.name || ''} onChange={(e) => setEditingUser(u => ({...u, name: e.target.value}))} />
                <Input label={UI_TEXT.emailLabel} type="email" value={editingUser.email || ''} onChange={(e) => setEditingUser(u => ({...u, email: e.target.value}))} />
                <Input label={UI_TEXT.passwordLabel} type="password" value={editingUser.password || ''} onChange={(e) => setEditingUser(u => ({...u, password: e.target.value}))} />
                <Select label={UI_TEXT.userRole} value={editingUser.role || ''} onChange={(e) => setEditingUser(u => ({...u, role: e.target.value as UserRole}))} options={roleOptions} />
            </div>
            <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{UI_TEXT.cancel}</Button>
                <Button onClick={handleSaveUser}>{UI_TEXT.save}</Button>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageUsersTab;