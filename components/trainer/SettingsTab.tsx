

import React, { useState } from 'react';
import { Theme } from '@/types';
import * as ApiService from '@/services/ApiService';
import { UI_TEXT } from '@/constants';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';

interface SettingsTabProps {
  theme: Theme;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ theme }) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<{ action: () => Promise<void>; message: string; } | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleActionClick = (action: () => Promise<void>, message: string) => {
    setActionToConfirm({ action, message });
    setIsConfirmModalOpen(true);
  };

  const handleConfirm = async () => {
    if (actionToConfirm) {
      setIsActionLoading(true);
      await actionToConfirm.action();
      setIsActionLoading(false);
    }
    setIsConfirmModalOpen(false);
    setActionToConfirm(null);
  };

  const handleClearAllSessions = async () => {
    await ApiService.clearAllSessions();
    setStatusMessage(UI_TEXT.sessionsClearedSuccessfully);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleResetUsers = async () => {
    await ApiService.resetUsersToDefault();
    setStatusMessage(UI_TEXT.mockUsersResetSuccess);
    setTimeout(() => {
        // Note: this will log out the current admin. A real app might handle this better.
        window.location.reload(); 
    }, 1000);
  };
  
  const handleResetDefaultAgent = async () => {
    await ApiService.removeDefaultPromptOverride();
    setStatusMessage(UI_TEXT.settingsTab_defaultAgentOverrideResetSuccess);
    setTimeout(() => setStatusMessage(''), 3000);
  };
  
  const apiKeyStatus = process.env.API_KEY ? UI_TEXT.apiKeyLoaded : UI_TEXT.apiKeyMissing;
  const apiKeyStatusColor = process.env.API_KEY ? "text-green-500" : "text-red-500";

  return (
    <div className={`p-4 rounded-lg space-y-6 ${theme === 'light' ? 'bg-white border' : 'themed-card'}`}>
      <div>
        <h3 className="text-lg font-semibold">{UI_TEXT.dataManagementSectionTitle}</h3>
        <p className="text-sm themed-text-secondary mt-1">פעולות אלו משפיעות על הנתונים השמורים בדפדפן זה בלבד.</p>
        
        {statusMessage && <p className="text-sm text-green-500 mt-2">{statusMessage}</p>}
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button variant="danger" onClick={() => handleActionClick(handleClearAllSessions, UI_TEXT.confirmClearAllSessionsMessage)} isLoading={isActionLoading}>
            {UI_TEXT.clearAllSessionsButton}
          </Button>
          <Button variant="danger" onClick={() => handleActionClick(handleResetUsers, UI_TEXT.confirmResetMockUsersMessage)} isLoading={isActionLoading}>
            {UI_TEXT.resetMockUsersButton}
          </Button>
           <Button variant="danger" onClick={() => handleActionClick(handleResetDefaultAgent, UI_TEXT.confirmResetDefaultAgentOverrideMessage)} isLoading={isActionLoading}>
            {UI_TEXT.resetDefaultAgentOverrideButton}
          </Button>
        </div>
      </div>
      
       <div>
        <h3 className="text-lg font-semibold">{UI_TEXT.apiStatusTitle}</h3>
        <div className={`mt-2 p-3 rounded-md ${theme === 'light' ? 'bg-secondary-50' : 'bg-secondary-800'}`}>
            <p className="text-sm">
                <span>{UI_TEXT.apiKeyStatusLabel}</span>
                <span className={`font-bold ml-2 ${apiKeyStatusColor}`}>{apiKeyStatus}</span>
            </p>
        </div>
      </div>

      {isConfirmModalOpen && actionToConfirm && (
        <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="אישור פעולה">
          <p>{actionToConfirm.message}</p>
          <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
            <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)} disabled={isActionLoading}>{UI_TEXT.cancel}</Button>
            <Button variant="danger" onClick={handleConfirm} isLoading={isActionLoading}>{UI_TEXT.yes}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SettingsTab;