export enum UserRole {
    TRAINEE = 'trainee',
    TRAINER = 'trainer',
    SYSTEM_ADMIN = 'system_admin',
    NONE = 'none',
}

export enum InterrogateeRole {
    SUSPECT = 'חשוד',
    WITNESS = 'עד',
    VICTIM = 'קורבן',
}

export enum DifficultyLevel {
    EASY = 'קל',
    MEDIUM = 'בינוני',
    HARD = 'קשה',
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export interface SuspectProfile {
    name: string;
    age: number;
    occupation: string;
}

export type AIAgentType = 'interrogation' | 'information_retrieval' | 'custom_task';

export interface Scenario {
    id: string;
    caseType: string;
    fullCaseDescription: string;
    interrogateeRole: InterrogateeRole | 'N/A';
    interrogateeProfile: SuspectProfile | Partial<SuspectProfile>;
    evidence: { title: string; items: string[] } | { title: string; items: ['N/A'] };
    fullSystemPromptForChat?: string;
    userSelectedDifficulty: DifficultyLevel | 'N/A';
    userSelectedTopic: string;
    customAgentId: string;
    agentType: AIAgentType;
    investigationGoals?: string[];
    isManuallyCreated?: boolean;
}

export interface GeminiJsonScenario {
    caseType: string;
    fullCaseDescription: string;
    interrogateeProfile: SuspectProfile;
    evidence: { title: string; items: string[] };
    investigationGoals?: string[];
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  baseSystemPrompt: string;
  isDefault?: boolean;
  isEditable?: boolean;
  personalityTraits?: string[];
  agentType?: AIAgentType;
  conversationStarters?: string[];
  recommendedModel?: string;
  capabilities?: {
    webSearch?: boolean;
    imageGeneration?: boolean;
    toolUsage?: boolean;
  };
  knowledgeBaseIds?: string[];
}

export interface LoadedAIAgent extends AIAgent {
    isDefault: boolean;
    isEditable: boolean;
    personalityTraits: string[];
    agentType: AIAgentType;
    conversationStarters: string[];
    capabilities: {
        webSearch: boolean;
        imageGeneration: boolean;
        toolUsage: boolean;
    };
    knowledgeBaseIds: string[];
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  content: string;
  uploadedAt: number;
}
