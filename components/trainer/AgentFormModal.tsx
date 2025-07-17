

import React, { useState, useEffect } from 'react';
import { AIAgent, AIAgentType, AIAgentTypeValues, KnowledgeDocument } from '@/types';
import * as ApiService from '@/services/ApiService';
import { UI_TEXT } from '@/constants';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import Textarea from '@/components/common/Textarea';

interface AgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: AIAgent) => void;
  agent: AIAgent | null;
}

const emptyAgent: Omit<AIAgent, 'id'> = {
  name: '',
  description: '',
  baseSystemPrompt: '',
  agentType: 'interrogation',
  personalityTraits: [],
  knowledgeBaseIds: [],
  isDefault: false,
  isEditable: true,
};


const AgentFormModal: React.FC<AgentFormModalProps> = ({ isOpen, onClose, onSave, agent }) => {
  const [formData, setFormData] = useState<AIAgent>(agent || { ...emptyAgent, id: '' });
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        if (isOpen) {
            setIsLoading(true);
            const initialData = agent 
                ? { ...emptyAgent, ...agent, knowledgeBaseIds: agent.knowledgeBaseIds || [] } 
                : { ...emptyAgent, id: '' };
            setFormData(initialData);
            
            const docs = await ApiService.getKnowledgeDocuments();
            setKnowledgeDocs(docs);
            setIsLoading(false);
        }
    };
    loadData();
  }, [agent, isOpen]);
  
  const handleChange = (field: keyof AIAgent, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleTraitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const traits = e.target.value.split(',').map(trait => trait.trim()).filter(Boolean);
    handleChange('personalityTraits', traits);
  };
  
  const handleKnowledgeDocToggle = (docId: string) => {
    const currentIds = formData.knowledgeBaseIds || [];
    const newIds = currentIds.includes(docId)
        ? currentIds.filter(id => id !== docId)
        : [...currentIds, docId];
    handleChange('knowledgeBaseIds', newIds);
  };


  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.baseSystemPrompt.trim()) {
      alert('Please fill in at least the agent name and base system prompt.');
      return;
    }
    onSave(formData);
  };
  
  const agentTypeOptions = AIAgentTypeValues.map(type => ({
      value: type,
      label: UI_TEXT.getAgentTypeDisplay(type)
  }));
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={agent ? UI_TEXT.agentFormTitleEdit : UI_TEXT.agentFormTitleAdd} 
      size="3xl"
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto p-2">
        <Input 
          label={UI_TEXT.agentNameLabel} 
          value={formData.name} 
          onChange={(e) => handleChange('name', e.target.value)} 
          required 
        />
        <Textarea 
          label={UI_TEXT.agentDescriptionLabel} 
          value={formData.description} 
          onChange={(e) => handleChange('description', e.target.value)} 
          rows={2} 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
                label={UI_TEXT.agentTypeLabel}
                value={formData.agentType}
                onChange={(e) => handleChange('agentType', e.target.value as AIAgentType)}
                options={agentTypeOptions}
            />
            <Input 
              label={UI_TEXT.agentPersonalityTraitsLabel} 
              value={formData.personalityTraits?.join(', ') || ''} 
              onChange={handleTraitsChange}
            />
        </div>

        <Textarea
          label={UI_TEXT.agentBasePromptLabel}
          value={formData.baseSystemPrompt}
          onChange={(e) => handleChange('baseSystemPrompt', e.target.value)}
          rows={15}
          required
        />
        
        <div className="pt-2 border-t themed-border">
            <h4 className="text-md font-semibold mb-2">{UI_TEXT.agentKnowledgeBaseLabel}</h4>
            {isLoading ? <p>טוען מסמכים...</p> : (
              knowledgeDocs.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto p-2 border themed-border rounded-md">
                      {knowledgeDocs.map(doc => (
                          <div key={doc.id} className="flex items-center">
                              <input
                                  type="checkbox"
                                  id={`kb-doc-${doc.id}`}
                                  checked={(formData.knowledgeBaseIds || []).includes(doc.id)}
                                  onChange={() => handleKnowledgeDocToggle(doc.id)}
                                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <label htmlFor={`kb-doc-${doc.id}`} className="ml-2 rtl:mr-2 text-sm themed-text-content truncate" title={doc.name}>
                                  {doc.name}
                              </label>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-sm themed-text-secondary">{UI_TEXT.agentNoKnowledgeDocs}</p>
              )
            )}
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
        <Button variant="secondary" onClick={onClose}>{UI_TEXT.cancel}</Button>
        <Button onClick={handleSubmit}>{UI_TEXT.save}</Button>
      </div>
    </Modal>
  );
};

export default AgentFormModal;