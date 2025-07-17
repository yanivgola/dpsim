import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { InterrogateeRole, DifficultyLevel, Scenario, LoadedAIAgent, KnowledgeDocument, GeminiJsonScenario, User, UserRole } from './types';
import * as UserService from './services/UserService';
import { UI_TEXT, GEMINI_MODEL_TEXT } from './constants';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';

// --- Multer Setup for VRM uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/vrm/')
    },
    filename: function (req, file, cb) {
        // We can add logic here to prevent overwrites and sanitize filenames
        cb(null, `${Date.now()}-${file.originalname}`)
    }
});
const upload = multer({ storage: storage });

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

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenLabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

app.post('/api/tts', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    try {
        const audio = await elevenLabsClient.generate({
            voice: "Rachel", // This can be customized later
            text,
            model_id: "eleven_multilingual_v2"
        });

        res.set('Content-Type', 'audio/mpeg');
        audio.pipe(res);

    } catch (error) {
        console.error("Error generating TTS audio:", error);
        res.status(500).json({ error: 'Failed to generate TTS audio.' });
    }
});

app.post('/api/upload-vrm', upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.status(200).json({
        message: 'File uploaded successfully',
        filePath: `/uploads/vrm/${req.file.filename}`
    });
});

import jwt from 'jsonwebtoken';

import * as AIAgentService from './services/AIAgentService';
import * as ScenarioService from './services/ScenarioService';

// --- User Management Endpoints ---
app.post('/api/users/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await UserService.login(email, password);
    if (user) {
        const payload = { id: user.id, name: user.name, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_default_secret', { expiresIn: '1h' });
        res.json({ token, user });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/users/signup', async (req, res) => {
    const { fullName, email, password } = req.body;
    const { user, error } = await UserService.signup(fullName, email, password);
    if (error) {
        return res.status(409).json({ error });
    }
    res.status(201).json(user);
});

app.get('/api/users', async (req, res) => {
    const users = await UserService.getUsers();
    res.json(users);
});

app.delete('/api/users/:id', async (req, res) => {
    await UserService.deleteUser(req.params.id);
    res.status(204).send();
});

app.put('/api/users/:id/role', async (req, res) => {
    const { role } = req.body;
    await UserService.updateUserRole(req.params.id, role);
    res.status(200).send();
});


// --- AI Agent Endpoints ---
app.get('/api/agents', async (req, res) => {
    const agents = await AIAgentService.getAgents();
    res.json(agents);
});

app.post('/api/agents', async (req, res) => {
    const newAgent = await AIAgentService.addAgent(req.body);
    res.status(201).json(newAgent);
});

app.put('/api/agents/:id', async (req, res) => {
    const updatedAgent = await AIAgentService.updateAgent(req.params.id, req.body);
    res.json(updatedAgent);
});

app.delete('/api/agents/:id', async (req, res) => {
    await AIAgentService.deleteAgent(req.params.id);
    res.status(204).send();
});

// --- Scenario Endpoints ---
app.get('/api/scenarios', async (req, res) => {
    const scenarios = await ScenarioService.getScenarios();
    res.json(scenarios);
});

app.post('/api/scenarios', async (req, res) => {
    const newScenario = await ScenarioService.addScenario(req.body);
    res.status(201).json(newScenario);
});

app.put('/api/scenarios/:id', async (req, res) => {
    const updatedScenario = await ScenarioService.updateScenario(req.params.id, req.body);
    res.json(updatedScenario);
});

app.delete('/api/scenarios/:id', async (req, res) => {
    await ScenarioService.deleteScenario(req.params.id);
    res.status(204).send();
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


import mongoose from 'mongoose';

// --- Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/interrogation-simulator';

mongoose.connect(MONGODB_URI)
    .then(() => console.log("Successfully connected to MongoDB."))
    .catch(err => console.error("Could not connect to MongoDB.", err));


// Start the server
loadData().then(() => {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
});
