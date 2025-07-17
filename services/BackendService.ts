
import { MockTrainee, InvestigationSession, Theme, AIAgent, Scenario, LoadedAIAgent, User, UserRole, AIAgentType, KnowledgeDocument } from '@/types';
import { DEFAULT_AGENT_ID } from '@/constants';

// --- In-Memory State (Simulates a Database) ---
let users: MockTrainee[] = [];
let aiAgentsFromFile: AIAgent[] = [];
let customAgents: AIAgent[] = [];
let manualScenarios: Scenario[] = [];
let knowledgeDocuments: KnowledgeDocument[] = [];
let defaultPromptOverride: string | null = null;
let currentUser: User | null = null;
let theme: ThemeName = ThemeName.DEFAULT;

const MOCK_TRAINEES_DATA: MockTrainee[] = [
    { id: 'trainer1', name: 'אבירם המנהל', email: 'admin@example.com', password: 'password', role: UserRole.SYSTEM_ADMIN, sessions: [] },
    { id: 'trainer2', name: 'גלית המדריכה', email: 'trainer@example.com', password: 'password', role: UserRole.TRAINER, sessions: [] },
    { id: 'trainee1', name: 'שירלי החניכה', email: 'trainee1@example.com', password: 'password', role: UserRole.TRAINEE, sessions: [] },
    { id: 'trainee2', name: 'יוסי החניך', email: 'trainee2@example.com', password: 'password', role: UserRole.TRAINEE, sessions: [] },
];

// --- Helper for simulated network latency ---
const delay = (ms: number = Math.random() * 150 + 50) => new Promise(res => setTimeout(res, ms));


// --- Initialization ---
const initializeBackend = async () => {
    console.log("Initializing Mock Backend Service...");
    users = MOCK_TRAINEES_DATA; // Start with default users
    
    try {
        const response = await fetch('/assets/ai-agents.json');
        if (response.ok) {
            aiAgentsFromFile = await response.json();
        } else {
            console.error(`Error fetching ai-agents.json: ${response.status}`);
        }
    } catch (e) {
        console.error("Error fetching or parsing 'ai-agents.json':", e);
    }

    try {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme && Object.values(ThemeName).includes(storedTheme as ThemeName)) {
            theme = storedTheme as ThemeName;
        }

        const storedCurrentUser = localStorage.getItem('currentUser');
         if (storedCurrentUser) currentUser = JSON.parse(storedCurrentUser);
    } catch (e) {
        console.warn("Could not load initial state from localStorage for mock backend.", e);
    }
    
    console.log("Mock Backend Initialized.");
};

initializeBackend();


// --- Auth ---
export const login = async (email: string, password: string): Promise<User | null> => {
    await delay();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (foundUser) {
        currentUser = { id: foundUser.id, name: foundUser.name, email: foundUser.email, role: foundUser.role };
        localStorage.setItem('currentUser', JSON.stringify(currentUser)); // For persistence on reload
        return { ...currentUser };
    }
    return null;
};

export const signup = async (fullName: string, email: string, password: string): Promise<{ user: User | null, error?: string }> => {
    await delay();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { user: null, error: 'Email exists' };
    }
    const newUser: MockTrainee = {
        id: `user-${Date.now()}`, name: fullName, email, password, role: UserRole.TRAINEE, sessions: []
    };
    users.push(newUser);
    const loggedInUser = await login(email, password);
    return { user: loggedInUser };
};

export const getCurrentUser = async (): Promise<User | null> => {
    await delay(10); // Very short delay for this one
    return currentUser ? { ...currentUser } : null;
};

export const logout = async (): Promise<void> => {
    await delay();
    currentUser = null;
    localStorage.removeItem('currentUser');
};


// --- User Management ---
export const getUsers = async (): Promise<MockTrainee[]> => {
    await delay();
    return [...users];
};
export const addUser = async (user: MockTrainee): Promise<void> => {
    await delay();
    users.push(user);
};
export const deleteUser = async (userId: string): Promise<void> => {
    await delay();
    users = users.filter(u => u.id !== userId);
};
export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
    await delay();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].role = role;
    }
};
export const resetUsersToDefault = async (): Promise<void> => {
    await delay();
    users = MOCK_TRAINEES_DATA;
    currentUser = null;
    localStorage.removeItem('currentUser');
};


// --- Session Management ---
export const getAllSessions = async (): Promise<InvestigationSession[]> => {
    await delay();
    return users.flatMap(user => user.sessions || []);
};

export const saveSession = async (session: InvestigationSession): Promise<void> => {
    await delay();
    const userIndex = users.findIndex(u => u.id === session.traineeId);
    if (userIndex !== -1) {
        const sessionIndex = users[userIndex].sessions.findIndex(s => s.id === session.id);
        if (sessionIndex !== -1) {
            users[userIndex].sessions[sessionIndex] = session;
        } else {
            users[userIndex].sessions.push(session);
        }
    }
};
export const clearAllSessions = async (): Promise<void> => {
    await delay();
    users.forEach(user => user.sessions = []);
};


// --- Investigation Log ---
const investigationLogs: Record<string, string> = {};
export const saveInvestigationLog = async (sessionId: string, log: string): Promise<void> => {
    await delay(10);
    investigationLogs[sessionId] = log;
};
export const getInvestigationLog = async (sessionId: string): Promise<string> => {
    await delay(10);
    return investigationLogs[sessionId] || "";
};


// --- Theme Management (Still sync with localStorage for instant UI feedback) ---
export const getTheme = (): ThemeName => theme;
export const saveTheme = (newTheme: ThemeName): void => {
    theme = newTheme;
    localStorage.setItem('theme', newTheme);
};


// --- Scenario Management ---
export const getManualScenarios = async (): Promise<Scenario[]> => {
    await delay();
    return [...manualScenarios];
};
export const getManualScenarioById = async (id: string): Promise<Scenario | null> => {
    await delay();
    const scenario = manualScenarios.find(s => s.id === id);
    return scenario ? { ...scenario } : null;
};
export const addManualScenario = async (scenario: Scenario): Promise<Scenario> => {
    await delay();
    const newScenario = { ...scenario, id: `manual-${Date.now()}` };
    manualScenarios.push(newScenario);
    return newScenario;
};
export const updateManualScenario = async (updatedScenario: Scenario): Promise<void> => {
    await delay();
    const index = manualScenarios.findIndex(s => s.id === updatedScenario.id);
    if (index !== -1) {
        manualScenarios[index] = updatedScenario;
    }
};
export const deleteManualScenario = async (scenarioId: string): Promise<void> => {
    await delay();
    manualScenarios = manualScenarios.filter(s => s.id !== scenarioId);
};


// --- Knowledge Base Management ---
export const getKnowledgeDocuments = async (): Promise<KnowledgeDocument[]> => {
    await delay();
    return [...knowledgeDocuments];
};
export const addKnowledgeDocument = async (doc: { name: string, content: string }): Promise<void> => {
    await delay();
    const newDoc: KnowledgeDocument = {
        id: `doc-${Date.now()}`, name: doc.name, content: doc.content, uploadedAt: Date.now()
    };
    knowledgeDocuments.push(newDoc);
};
export const deleteKnowledgeDocument = async (docId: string): Promise<void> => {
    await delay();
    knowledgeDocuments = knowledgeDocuments.filter(d => d.id !== docId);
};


// --- AI Agent Management ---
export const getCustomAgents = async (): Promise<AIAgent[]> => {
    await delay();
    return [...customAgents];
};
export const saveCustomAgents = async (agents: AIAgent[]): Promise<void> => {
    await delay();
    customAgents = agents;
};
export const addCustomAgent = async (agent: AIAgent): Promise<void> => {
    await delay();
    const newAgent = { ...agent, id: `custom-${Date.now()}`, isDefault: false, isEditable: true };
    customAgents.push(newAgent);
};
export const updateCustomAgent = async (updatedAgent: AIAgent): Promise<void> => {
    await delay();
    const index = customAgents.findIndex(a => a.id === updatedAgent.id);
    if (index !== -1) {
        customAgents[index] = updatedAgent;
    }
};
export const deleteCustomAgent = async (agentId: string): Promise<void> => {
    await delay();
    customAgents = customAgents.filter(a => a.id !== agentId);
};
export const getDefaultPromptOverride = async (): Promise<string | null> => {
    await delay(10);
    return defaultPromptOverride;
};
export const saveDefaultPromptOverride = async (prompt: string): Promise<void> => {
    await delay();
    defaultPromptOverride = prompt;
};
export const removeDefaultPromptOverride = async (): Promise<void> => {
    await delay();
    defaultPromptOverride = null;
};

export const getAiAgents = async (): Promise<LoadedAIAgent[]> => {
    await delay();
    const defaultCapabilities = { webSearch: false, imageGeneration: false, toolUsage: true };

    let agentsToReturn: LoadedAIAgent[] = aiAgentsFromFile.map((agent: any) => ({
        id: agent.id || `file-agent-${Date.now()}`,
        name: agent.name || "Unnamed Agent",
        description: agent.description || "No description.",
        baseSystemPrompt: agent.baseSystemPrompt || "You are a helpful assistant.",
        isDefault: agent.id === DEFAULT_AGENT_ID,
        isEditable: agent.id !== DEFAULT_AGENT_ID,
        personalityTraits: agent.personalityTraits || [],
        agentType: agent.agentType || 'interrogation',
        conversationStarters: agent.conversationStarters || [],
        recommendedModel: agent.recommendedModel,
        capabilities: { ...defaultCapabilities, ...(agent.capabilities || {}) },
        knowledgeBaseIds: agent.knowledgeBaseIds || [],
    }));

    const promptOverride = await getDefaultPromptOverride();
    const defaultAgent = agentsToReturn.find(a => a.id === DEFAULT_AGENT_ID);
    if (defaultAgent && promptOverride) {
        defaultAgent.baseSystemPrompt = promptOverride;
    }
    
    const currentCustomAgents = await getCustomAgents();
    currentCustomAgents.forEach(customAgent => {
        if (!agentsToReturn.some(a => a.id === customAgent.id)) {
            agentsToReturn.push({
                ...customAgent,
                isDefault: false,
                isEditable: true,
                personalityTraits: customAgent.personalityTraits || [],
                agentType: customAgent.agentType || 'interrogation',
                conversationStarters: customAgent.conversationStarters || [],
                capabilities: { ...defaultCapabilities, ...(customAgent.capabilities || {}) },
                knowledgeBaseIds: customAgent.knowledgeBaseIds || [],
            });
        }
    });

    return agentsToReturn;
};