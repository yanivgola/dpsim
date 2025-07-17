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
    interactionHistory?: {
        agentId: string;
        sessionIds: string[];
    }[];
}

export interface UserWithPassword extends User {
    password?: string;
}

export interface SuspectProfile {
    name: string;
    age: number;
    occupation: string;
}

export type AIAgentType = 'interrogation' | 'information_retrieval' | 'custom_task';

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  baseSystemPrompt: string;
  authorId?: string;
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
  avatarUrl?: string;
}

export interface Scenario {
    id: string;
    caseType: string;
    fullCaseDescription: string;
    authorId?: string;
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

export interface InvestigationSession {
    id: string;
    traineeIds: string[];
    scenario: Scenario;
    chatTranscript: any[];
    startTime: number;
    endTime?: number;
    status: string;
    feedback?: any;
    initialSelections: any;
    usedHintsCount: number;
    investigationLog?: string;
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

export enum ToolName {
  CHECK_POLICE_DATABASE = 'CHECK_POLICE_DATABASE',
  GET_CURRENT_TIME_AND_DATE = 'GET_CURRENT_TIME_AND_DATE',
  GENERAL_KNOWLEDGE_CHECK = 'GENERAL_KNOWLEDGE_CHECK',
  SEARCH_INTERNAL_ARCHIVES = 'SEARCH_INTERNAL_ARCHIVES',
  REQUEST_FORENSIC_ANALYSIS = 'REQUEST_FORENSIC_ANALYSIS',
  POINT_AT_OBJECT = 'POINT_AT_OBJECT',
}

export interface AIResponseWithDirectives {
    textResponse: string;
    directives?: {
        avatarExpression?: string;
        avatarGesture?: string;
    };
    toolCallRequest?: any;
}

export interface GeminiJsonScenario {
    caseType: string;
    fullCaseDescription: string;
    interrogateeProfile: SuspectProfile;
    evidence: { title: string; items: string[] };
    investigationGoals?: string[];
}
