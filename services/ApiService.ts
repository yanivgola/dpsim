import axios from 'axios';
import * as Backend from '@/services/BackendService'; // Keep for now for non-migrated functions

axios.interceptors.request.use(config => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
import { 
    User, MockTrainee, InvestigationSession, AIAgent, Scenario, LoadedAIAgent, 
    GeminiChat, InterrogateeRole, DifficultyLevel, UserCommand, ChatMessage, Feedback,
    SimpleChatMessage, KnowledgeDocument, UserRole
} from '@/types';

const API_BASE_URL = 'http://localhost:3001/api';

// --- AUTH ---
export const login = async (email: string, password: string): Promise<User | null> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/login`, { email, password });
        if (response.data.token) {
            localStorage.setItem('jwt_token', response.data.token);
        }
        return response.data.user;
    } catch (error) {
        console.error("Login failed:", error);
        return null;
    }
};

export const signup = async (fullName: string, email: string, password: string): Promise<{ user: User | null, error?: string }> => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/signup`, { fullName, email, password });
        return { user: response.data };
    } catch (error: any) {
        return { user: null, error: error.response?.data?.error || "Signup failed" };
    }
};

// This would be replaced by a call to a /me endpoint with a JWT
export const getCurrentUser = (): Promise<User | null> => Backend.getCurrentUser();
export const logout = (): Promise<void> => Backend.logout();


// --- USERS ---
export const getUsers = async (): Promise<MockTrainee[]> => {
    const response = await axios.get(`${API_BASE_URL}/users`);
    return response.data;
};

export const deleteUser = async (userId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/users/${userId}`);
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
    await axios.put(`${API_BASE_URL}/users/${userId}/role`, { role });
};

// These are local data management functions, they will be removed later
export const addUser = (user: MockTrainee): Promise<void> => Backend.addUser(user);
export const resetUsersToDefault = (): Promise<void> => Backend.resetUsersToDefault();


// --- SESSIONS ---
export const getAllSessions = (): Promise<InvestigationSession[]> => Backend.getAllSessions();
export const saveSession = (session: InvestigationSession): Promise<void> => Backend.saveSession(session);
export const clearAllSessions = (): Promise<void> => Backend.clearAllSessions();

// --- Investigation Log ---
export const saveInvestigationLog = (sessionId: string, log: string): Promise<void> => Backend.saveInvestigationLog(sessionId, log);
export const getInvestigationLog = (sessionId: string): Promise<string> => Backend.getInvestigationLog(sessionId);

// --- THEME ---
export const getTheme = Backend.getTheme;
export const saveTheme = Backend.saveTheme;

// --- SCENARIOS (Manual) ---
export const getManualScenarios = async (): Promise<Scenario[]> => {
    const response = await axios.get(`${API_BASE_URL}/scenarios`);
    return response.data;
};
export const getManualScenarioById = async (id: string): Promise<Scenario | null> => {
    const response = await axios.get(`${API_BASE_URL}/scenarios/${id}`);
    return response.data;
};
export const addManualScenario = async (scenario: Scenario): Promise<Scenario> => {
    const response = await axios.post(`${API_BASE_URL}/scenarios`, scenario);
    return response.data;
};
export const updateManualScenario = async (scenario: Scenario): Promise<void> => {
    await axios.put(`${API_BASE_URL}/scenarios/${scenario.id}`, scenario);
};
export const deleteManualScenario = async (scenarioId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/scenarios/${scenarioId}`);
};

// --- KNOWLEDGE BASE ---
// Not yet migrated, will be done in a future step
export const getKnowledgeDocuments = (): Promise<KnowledgeDocument[]> => Backend.getKnowledgeDocuments();
export const addKnowledgeDocument = (doc: { name: string, content: string }): Promise<void> => Backend.addKnowledgeDocument(doc);
export const deleteKnowledgeDocument = (docId: string): Promise<void> => Backend.deleteKnowledgeDocument(docId);


// --- AI AGENTS ---
export const getAiAgents = async (): Promise<LoadedAIAgent[]> => {
    const response = await axios.get(`${API_BASE_URL}/agents`);
    return response.data;
};
export const addCustomAgent = async (agent: AIAgent): Promise<void> => {
    await axios.post(`${API_BASE_URL}/agents`, agent);
};
export const updateCustomAgent = async (agent: AIAgent): Promise<void> => {
    await axios.put(`${API_BASE_URL}/agents/${agent.id}`, agent);
};
export const deleteCustomAgent = async (agentId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/agents/${agentId}`);
};

// These are local settings, they can remain as they are for now
export const saveDefaultPromptOverride = (prompt: string): Promise<void> => Backend.saveDefaultPromptOverride(prompt);
export const removeDefaultPromptOverride = (): Promise<void> => Backend.removeDefaultPromptOverride();


// --- GEMINI & CHAT (Migrating to Backend) ---

export const generateScenario = async (
    interrogateeRole: InterrogateeRole,
    difficulty: DifficultyLevel,
    topic: string,
    customAgentId: string
): Promise<Scenario | null> => {
    console.log("ApiService: Calling backend to generate scenario...");
    try {
        const response = await axios.post(`${API_BASE_URL}/generate-scenario`, {
            role: interrogateeRole,
            difficulty,
            topic,
            agentId: customAgentId
        });
        console.log("ApiService: Received scenario from backend:", response.data);
        return response.data;
    } catch (error) {
        console.error("ApiService: Error generating scenario from backend:", error);
        return null;
    }
};

export const startChat = async (scenario: Scenario): Promise<any | null> => {
    console.warn("startChat is not yet migrated to the backend.");
    return {
        sendMessage: async (message: string, sc: Scenario, cmd: UserCommand | null) => {
            console.warn("sendMessage is not yet migrated to the backend.");
            return { text: `Error: Chat not migrated. Your message was: "${message}"`, directives: null };
        }
    };
};

export const sendMessage = async (
    chat: any,
    message: string,
    scenario: Scenario,
    userCommand: UserCommand | null
): Promise<{ text: string | null; directives: any; toolCalledInfo?: any; }> => {
    return chat.sendMessage(message, scenario, userCommand);
};

export const generateFeedback = async (
    chatTranscript: ChatMessage[],
    interrogateeRole: InterrogateeRole,
    difficulty: DifficultyLevel,
    topic: string,
    usedHintsCount: number
): Promise<Feedback | null> => {
    console.warn("generateFeedback is not yet migrated to the backend.");
    return null;
};

export const generateContextualHint = async (history: SimpleChatMessage[], scenario: Scenario): Promise<string | null> => {
    console.warn("generateContextualHint is not yet migrated to the backend.");
    return "Hint generation has not been migrated to the backend yet.";
};

export const sendCommandToSession = (sessionId: string, command: UserCommand): void => {
    console.warn("sendCommandToSession is not yet migrated to the backend.");
};