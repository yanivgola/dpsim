import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { InterrogateeRole, DifficultyLevel, Scenario, LoadedAIAgent, KnowledgeDocument, GeminiJsonScenario } from './types';
import { UI_TEXT, GEMINI_MODEL_TEXT } from './constants';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // Allow requests from the frontend development server
const port = process.env.PORT || 3001;

const API_KEY = process.env.GOOGLE_API_KEY;
let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error("Google API key is missing. Please set it in the .env file.");
}

// --- Data Loading (simulating database for now) ---
let allAgents: LoadedAIAgent[] = [];
let allDocs: KnowledgeDocument[] = [];

async function loadData() {
    try {
        const agentsFilePath = path.join(__dirname, '../public/assets/ai-agents.json');
        const agentsData = await fs.readFile(agentsFilePath, 'utf-8');
        // A more robust implementation would validate this data against the LoadedAIAgent type
        allAgents = JSON.parse(agentsData) as LoadedAIAgent[];
        console.log("Successfully loaded AI agents data.");
    } catch (error) {
        console.error("Error loading AI agents data:", error);
        // In a real app, you might want to stop the server from starting
    }
    // In the future, we'll load knowledge documents here as well
}

// --- Helper Functions ---
const parseJsonFromResponse = <T,>(responseText: string): T | null => {
    let jsonStr = responseText.trim();
    const fenceRegex = /^```(\w*json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }
    try {
        return JSON.parse(jsonStr) as T;
    } catch (e) {
        console.error("Failed to parse JSON response:", e, "Original text:", responseText);
        return null;
    }
};

const getKnowledgeContextPrompt = (agent: LoadedAIAgent, docs: KnowledgeDocument[]): string => {
    if (!agent.knowledgeBaseIds || agent.knowledgeBaseIds.length === 0) return "";
    const relevantDocs = docs.filter(doc => agent.knowledgeBaseIds.includes(doc.id));
    if (relevantDocs.length === 0) return "";
    const context = relevantDocs.map(doc => `### Document: ${doc.name} ###\n${doc.content}`).join('\n\n---\n\n');
    return `\nBased on the following documents:\n--- DOCUMENT CONTEXT START ---\n${context}\n--- DOCUMENT CONTEXT END ---\n`;
};


// --- API Endpoints ---
app.get('/api/health', (req, res) => {
  res.send({ status: 'ok' });
});

app.post('/api/generate-scenario', async (req, res) => {
    if (!ai) {
        return res.status(500).json({ error: 'AI client not initialized. Check API key.' });
    }

    const { role, difficulty, topic, agentId } = req.body as { role: InterrogateeRole, difficulty: DifficultyLevel, topic: string, agentId: string };

    if (!role || !difficulty || !topic || !agentId) {
        return res.status(400).json({ error: 'Missing required parameters for scenario generation.' });
    }

    try {
        const agentToUse = allAgents.find(agent => agent.id === agentId) || allAgents.find(a => a.isDefault);
        if (!agentToUse) {
            return res.status(404).json({ error: "Could not find the specified or a default AI agent." });
        }

        let personalityTraitsPromptSection = agentToUse.personalityTraits.length > 0
            ? `\nYour character's personality traits: ${agentToUse.personalityTraits.join(', ')}.\n`
            : "";

        const knowledgeContextPrompt = getKnowledgeContextPrompt(agentToUse, allDocs);

        const generationPrompt = UI_TEXT.generateScenarioPrompt
            .replace('{{INTERROGATEE_ROLE}}', role)
            .replace('{{DIFFICULTY_LEVEL}}', difficulty)
            .replace('{{INVESTIGATION_TOPIC}}', topic)
            .replace('{{AI_PERSONALITY_TRAITS_PROMPT_SECTION}}', personalityTraitsPromptSection);

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: [{role: 'user', parts: [{text: generationPrompt}]}],
            generationConfig: { responseMimeType: "application/json" },
        });

        const geminiScenario = parseJsonFromResponse<GeminiJsonScenario>(response.response.text());
        if (!geminiScenario) {
            return res.status(500).json({ error: "Failed to parse scenario from AI response." });
        }

        let scenarioDetailsForAI = `Role: ${role}\nTopic: ${geminiScenario.caseType}\nCase Description: ${geminiScenario.fullCaseDescription}\nProfile (${role}):\n  Name: ${geminiScenario.interrogateeProfile.name}\n  Age: ${geminiScenario.interrogateeProfile.age}\n  Occupation: ${geminiScenario.interrogateeProfile.occupation}`;

        const fullSystemPrompt = UI_TEXT.scenarioSystemPromptTemplate
            .replace(/{{INTERROGATEE_ROLE}}/g, role)
            .replace(/{{DIFFICULTY_LEVEL}}/g, difficulty)
            .replace(/{{SCENARIO_DETAILS_FOR_AI}}/g, scenarioDetailsForAI.trim())
            .replace(/{{EVIDENCE_DETAILS_FOR_AI}}/g, geminiScenario.evidence.items.map(item => `- ${item}`).join('\n'))
            .replace(/{{AI_PERSONALITY_TRAITS_PROMPT_SECTION}}/g, personalityTraitsPromptSection)
            .replace(/{{KNOWLEDGE_BASE_CONTEXT_SECTION}}/g, knowledgeContextPrompt);

        const finalScenario: Scenario = {
            id: `scenario-${Date.now()}`,
            caseType: geminiScenario.caseType,
            fullCaseDescription: geminiScenario.fullCaseDescription,
            interrogateeRole: role,
            interrogateeProfile: geminiScenario.interrogateeProfile,
            evidence: geminiScenario.evidence,
            fullSystemPromptForChat: fullSystemPrompt,
            userSelectedDifficulty: difficulty,
            userSelectedTopic: topic,
            customAgentId: agentToUse.id,
            agentType: agentToUse.agentType,
            investigationGoals: geminiScenario.investigationGoals || [],
        };

        res.json(finalScenario);

    } catch (error) {
        console.error("Error generating scenario:", error);
        res.status(500).json({ error: 'Failed to generate scenario from AI.' });
    }
});


// Start the server
loadData().then(() => {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
});
