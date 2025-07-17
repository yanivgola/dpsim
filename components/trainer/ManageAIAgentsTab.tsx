

import React, { useState, useEffect } from 'react';
import { Theme, LoadedAIAgent, AIAgent } from '@/types';
import * as ApiService from '@/services/ApiService';
import { UI_TEXT, DEFAULT_AGENT_ID } from '@/constants';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Textarea from '@/components/common/Textarea';
import AgentFormModal from '@/components/trainer/AgentFormModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface ManageAIAgentsTabProps {
  theme: Theme;
}

const ManageAIAgentsTab: React.FC<ManageAIAgentsTabProps> = ({ theme }) => {
  const [agents, setAgents] = useState<LoadedAIAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDefaultPromptModalOpen, setIsDefaultPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  
  const [isAgentFormModalOpen, setIsAgentFormModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
        const loadedAgents = await ApiService.getAiAgents();
        setAgents(loadedAgents);
    } catch (e) {
        console.error("Failed to load AI agents:", e);
        setStatusMessage(UI_TEXT.errorLoadingData);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleOpenEditDefaultPrompt = () => {
    const defaultAgent = agents.find(a => a.id === DEFAULT_AGENT_ID);
    if (defaultAgent) {
      setEditingPrompt(defaultAgent.baseSystemPrompt);
      setIsDefaultPromptModalOpen(true);
    }
  };

  const handleSaveDefaultPrompt = async () => {
    await ApiService.saveDefaultPromptOverride(editingPrompt);
    setStatusMessage(UI_TEXT.defaultAgentOverrideSaved);
    setIsDefaultPromptModalOpen(false);
    await loadAgents(); // Reload to reflect changes
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleResetDefaultPrompt = async () => {
    await ApiService.removeDefaultPromptOverride();
    setStatusMessage(UI_TEXT.settingsTab_defaultAgentOverrideResetSuccess);
    setIsDefaultPromptModalOpen(false);
    await loadAgents(); // Reload
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleCloneAgent = async (agentToClone: LoadedAIAgent) => {
    const newAgent: AIAgent = {
      ...agentToClone,
      id: `custom-clone-${Date.now()}`, // to distinguish from new
      name: `${agentToClone.name} ${UI_TEXT.clonedAgentNameSuffix}`,
      isDefault: false,
      isEditable: true,
    };
    await ApiService.addCustomAgent(newAgent);
    await loadAgents();
  };
  
  const handleDeleteAgent = async (agentId: string) => {
    const agentToDelete = agents.find(a => a.id === agentId);
    if (!agentToDelete || agentToDelete.isDefault || !agentToDelete.isEditable) return;
    if (window.confirm(UI_TEXT.confirmDeleteAgentMessage(agentToDelete.name))) {
        await ApiService.deleteCustomAgent(agentId);
        await loadAgents();
    }
  };
  
  const handleAddNewAgent = () => {
    setEditingAgent(null);
    setIsAgentFormModalOpen(true);
  };

  const handleEditAgent = (agent: AIAgent) => {
    setEditingAgent(agent);
    setIsAgentFormModalOpen(true);
  };

  const handleSaveAgent = async (agentToSave: AIAgent) => {
    if (agentToSave.id && agentToSave.id.startsWith('custom-')) {
        await ApiService.updateCustomAgent(agentToSave);
    } else {
        await ApiService.addCustomAgent(agentToSave);
    }
    await loadAgents();
    setIsAgentFormModalOpen(false);
  };

  return (
    <div className={`p-4 rounded-lg space-y-4 ${theme === 'light' ? 'bg-white border' : 'themed-card'}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{UI_TEXT.agentManagementTitle}</h3>
        <div className="space-x-2 rtl:space-x-reverse">
          <Button onClick={handleAddNewAgent} variant="primary" isLoading={isLoading}>
            {UI_TEXT.addNewAgentButton}
          </Button>
          <Button onClick={handleOpenEditDefaultPrompt} variant="secondary" isLoading={isLoading}>
            {UI_TEXT.viewOrEditDefaultAgentPromptButton}
          </Button>
        </div>
      </div>
      {statusMessage && <p className="text-sm text-green-500">{statusMessage}</p>}
      
      {isLoading ? <LoadingSpinner /> : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y themed-border">
            <thead className={theme === 'light' ? 'bg-secondary-50' : 'bg-secondary-700'}>
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">שם הסוכן</th>
                <th className="px-6 py-3 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">תיאור</th>
                <th className="px-6 py-3 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">סוג</th>
                <th className="px-6 py-3 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y themed-border">
              {agents.map(agent => (
                <tr key={agent.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{agent.name}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm themed-text-content">{agent.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm themed-text-content">{UI_TEXT.getAgentTypeDisplay(agent.agentType)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {agent.isDefault ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">ברירת מחדל</span>
                    ) : (
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${agent.id.startsWith('custom-') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {agent.id.startsWith('custom-') ? 'מותאם אישית' : 'נטען מקובץ'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2 space-x-reverse">
                     {!agent.isDefault && agent.isEditable && (
                        <Button onClick={() => handleEditAgent(agent)} variant="ghost" size="sm" title={UI_TEXT.ariaLabelEditAgent(agent.name)}>
                          {UI_TEXT.edit}
                        </Button>
                     )}
                     <Button onClick={() => handleCloneAgent(agent)} variant="ghost" size="sm" title={UI_TEXT.ariaLabelCloneAgent(agent.name)}>
                      {UI_TEXT.cloneAgentButton}
                    </Button>
                    {!agent.isDefault && agent.isEditable && (
                      <Button onClick={() => handleDeleteAgent(agent.id)} variant="ghost" size="sm" className='text-red-500 hover:bg-red-100' title={UI_TEXT.ariaLabelDeleteAgent(agent.name)}>
                        {UI_TEXT.delete}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isDefaultPromptModalOpen} onClose={() => setIsDefaultPromptModalOpen(false)} title={UI_TEXT.editDefaultAgentPromptTitle} size="2xl">
        <div className="space-y-4">
          <p className="text-sm themed-text-secondary">{UI_TEXT.defaultAgentOverrideNotice}</p>
          <Textarea
            value={editingPrompt}
            onChange={(e) => setEditingPrompt(e.target.value)}
            rows={20}
            className="w-full text-xs font-mono"
          />
        </div>
        <div className="mt-4 flex justify-between">
           <Button variant="danger" onClick={handleResetDefaultPrompt}>{UI_TEXT.resetToOriginalButton}</Button>
           <div className='space-x-2 space-x-reverse'>
             <Button variant="secondary" onClick={() => setIsDefaultPromptModalOpen(false)}>{UI_TEXT.cancel}</Button>
             <Button onClick={handleSaveDefaultPrompt}>{UI_TEXT.saveLocalOverrideButton}</Button>
           </div>
        </div>
      </Modal>

      {isAgentFormModalOpen && (
        <AgentFormModal
          isOpen={isAgentFormModalOpen}
          onClose={() => setIsAgentFormModalOpen(false)}
          onSave={handleSaveAgent}
          agent={editingAgent}
        />
      )}
    </div>
  );
};

export default ManageAIAgentsTab;