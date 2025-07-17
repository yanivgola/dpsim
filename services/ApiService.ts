

import * as Backend from '@/services/BackendService'; // Changed from StorageService to BackendService
import * as Gemini from '@/services/GeminiService';
import { 
    User, MockTrainee, InvestigationSession, AIAgent, Scenario, LoadedAIAgent, 
    GeminiChat, InterrogateeRole, DifficultyLevel, UserCommand, ChatMessage, Feedback,
    SimpleChatMessage, KnowledgeDocument, UserRole
} from '@/types';

// This file acts as the single interface to the "backend" 
// (now a simulated BackendService).
// All components should use this service instead of StorageService or GeminiService directly.

// --- AUTH ---

export const login = (email: string, password: string): Promise<User | null> => Backend.login(email, password);

export const signup = (fullName: string, email: string, password: string): Promise<{ user: User | null, error?: string }> => Backend.signup(fullName, email, password);

export const getCurrentUser = (): Promise<User | null> => Backend.getCurrentUser();

export const logout = (): Promise<void> => Backend.logout();


// --- USERS ---

export const getUsers = (): Promise<MockTrainee[]> => Backend.getUsers();
export const addUser = (user: MockTrainee): Promise<void> => Backend.addUser(user);
export const deleteUser = (userId: string): Promise<void> => Backend.deleteUser(userId);
export const updateUserRole = (userId: string, role: UserRole): Promise<void> => Backend.updateUserRole(userId, role);
export const resetUsersToDefault = (): Promise<void> => Backend.resetUsersToDefault();

// --- SESSIONS ---

export const getAllSessions = (): Promise<InvestigationSession[]> => Backend.getAllSessions();
export const saveSession = (session: InvestigationSession): Promise<void> => Backend.saveSession(session);
export const clearAllSessions = (): Promise<void> => Backend.clearAllSessions();

// --- Investigation Log ---
export const saveInvestigationLog = (sessionId: string, log: string): Promise<void> => Backend.saveInvestigationLog(sessionId, log);
export const getInvestigationLog = (sessionId: string): Promise<string> => Backend.getInvestigationLog(sessionId);

// --- THEME ---
export const getTheme = Backend.getTheme; // Theme is sync, stays with localStorage for immediate UI response
export const saveTheme = Backend.saveTheme;

// --- SCENARIOS (Manual) ---

export const getManualScenarios = (): Promise<Scenario[]> => Backend.getManualScenarios();
export const getManualScenarioById = (id: string): Promise<Scenario | null> => Backend.getManualScenarioById(id);
export const addManualScenario = (scenario: Scenario): Promise<Scenario> => Backend.addManualScenario(scenario);
export const updateManualScenario = (scenario: Scenario): Promise<void> => Backend.updateManualScenario(scenario);
export const deleteManualScenario = (scenarioId: string): Promise<void> => Backend.deleteManualScenario(scenarioId);

// --- KNOWLEDGE BASE ---
export const getKnowledgeDocuments = (): Promise<KnowledgeDocument[]> => Backend.getKnowledgeDocuments();
export const addKnowledgeDocument = (doc: { name: string, content: string }): Promise<void> => Backend.addKnowledgeDocument(doc);
export const deleteKnowledgeDocument = (docId: string): Promise<void> => Backend.deleteKnowledgeDocument(docId);


// --- AI AGENTS ---

export const getAiAgents = (): Promise<LoadedAIAgent[]> => Backend.getAiAgents();
export const addCustomAgent = (agent: AIAgent): Promise<void> => Backend.addCustomAgent(agent);
export const updateCustomAgent = (agent: AIAgent): Promise<void> => Backend.updateCustomAgent(agent);
export const deleteCustomAgent = (agentId: string): Promise<void> => Backend.deleteCustomAgent(agentId);
export const saveDefaultPromptOverride = (prompt: string): Promise<void> => Backend.saveDefaultPromptOverride(prompt);
export const removeDefaultPromptOverride = (): Promise<void> => Backend.removeDefaultPromptOverride();


// --- GEMINI & CHAT (These are already async and call the real external service) ---

export const generateScenario = async (
    interrogateeRole: InterrogateeRole,
    difficulty: DifficultyLevel,
    topic: string,
    customAgentId: string
): Promise<Scenario | null> => {
    const allAgents = await Backend.getAiAgents();
    const allDocs = await Backend.getKnowledgeDocuments();
    return Gemini.generateScenario(interrogateeRole, difficulty, topic, customAgentId, allAgents, allDocs);
};

export const startChat = Gemini.startChatWithSuspect;
export const sendMessage = Gemini.sendChatMessage;
export const generateFeedback = Gemini.generateFeedbackForSession;
export const generateContextualHint = Gemini.generateContextualHint;
export const sendCommandToSession = Gemini.sendCommandToSession;