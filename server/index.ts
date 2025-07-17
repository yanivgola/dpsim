import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { SpeechClient } from '@google-cloud/speech';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { InterrogateeRole, DifficultyLevel, Scenario, LoadedAIAgent, KnowledgeDocument, GeminiJsonScenario, User, UserRole, AIResponseWithDirectives, AIAgent } from './types';
import * as UserService from './services/UserService';
import * as AIAgentService from './services/AIAgentService';
import * as ScenarioService from './services/ScenarioService';
import { UI_TEXT, GEMINI_MODEL_TEXT } from './constants';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { SessionModel } from './models/Session.model';
import { UserModel } from './models/User.model';
import { AIAgentModel } from './models/AIAgent.model';
import { ScenarioModel } from './models/Scenario.model';

// --- Initial Setup ---
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 3001;

// --- Clients ---
const speechClient = new SpeechClient();
const API_KEY = process.env.GOOGLE_API_KEY;
let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error("Google API key is missing.");
}
const elevenLabsClient = new (require('@elevenlabs/elevenlabs-js').ElevenLabsClient)({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// --- Multer Setup ---
const vrmUpload = multer({ storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/vrm/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
}) });
const memoryUpload = multer({ storage: multer.memoryStorage() });

// --- Data Loading ---
let allDocs: KnowledgeDocument[] = [];
async function loadData() {
    // This will be replaced by DB calls
}

// --- Helper Functions ---
const parseJsonFromResponse = <T,>(responseText: string): T | null => {
    let jsonStr = responseText.trim().replace(/^```(json)?|```$/g, '');
    try {
        return JSON.parse(jsonStr) as T;
    } catch (e) {
        console.error("Failed to parse JSON response:", e, "Original text:", responseText);
        return null;
    }
};

const getKnowledgeContextPrompt = (agent: AIAgent, docs: KnowledgeDocument[]): string => {
    if (!agent.knowledgeBaseIds?.length) return "";
    const relevantDocs = docs.filter(doc => agent.knowledgeBaseIds!.includes(doc.id));
    if (!relevantDocs.length) return "";
    return `\nBased on the following documents:\n--- DOCUMENT CONTEXT START ---\n${relevantDocs.map(doc => `### Document: ${doc.name} ###\n${doc.content}`).join('\n\n---\n\n')}\n--- DOCUMENT CONTEXT END ---\n`;
};

// This is a mock function for now.
const executeToolCall = async (toolCallRequest: any) => {
    const { toolName, toolInput } = toolCallRequest;
    if (toolName === 'POINT_AT_OBJECT') {
        return {
            toolName,
            toolOutput: { success: true },
            directives: { avatarGesture: `point_at_${toolInput.objectName}` }
        };
    }
    return { toolName, toolOutput: { success: false, error: 'Tool not found' } };
};

// --- API Endpoints ---
app.get('/api/health', (req, res) => res.send({ status: 'ok' }));

// Auth
app.post('/api/users/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await UserService.login(email, password);
    if (user) {
        const payload = { id: user.id, name: user.name, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
        res.json({ token, user });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});
app.post('/api/users/signup', async (req, res) => {
    const { fullName, email, password } = req.body;
    const { user, error } = await UserService.signup(fullName, email, password);
    if (error) return res.status(409).json({ error });
    res.status(201).json(user);
});

// Users
app.get('/api/users', async (req, res) => res.json(await UserService.getUsers()));
app.delete('/api/users/:id', async (req, res) => {
    await UserService.deleteUser(req.params.id);
    res.status(204).send();
});
app.put('/api/users/:id/role', async (req, res) => {
    await UserService.updateUserRole(req.params.id, req.body.role);
    res.status(200).send();
});

// Agents
app.get('/api/agents', async (req, res) => res.json(await AIAgentService.getAgents()));
app.post('/api/agents', async (req, res) => res.status(201).json(await AIAgentService.addAgent(req.body)));
app.put('/api/agents/:id', async (req, res) => res.json(await AIAgentService.updateAgent(req.params.id, req.body)));
app.delete('/api/agents/:id', async (req, res) => {
    await AIAgentService.deleteAgent(req.params.id);
    res.status(204).send();
});

// Scenarios
app.get('/api/scenarios', async (req, res) => res.json(await ScenarioService.getScenarios()));
app.post('/api/scenarios', async (req, res) => res.status(201).json(await ScenarioService.addScenario(req.body)));
app.put('/api/scenarios/:id', async (req, res) => res.json(await ScenarioService.updateScenario(req.params.id, req.body)));
app.delete('/api/scenarios/:id', async (req, res) => {
    await ScenarioService.deleteScenario(req.params.id);
    res.status(204).send();
});

// Sessions
app.get('/api/sessions', async (req, res) => res.json(await SessionModel.find().populate('scenario')));
app.get('/api/sessions/stats', async (req, res) => {
    const stats = await SessionModel.aggregate([{ $group: { _id: null, averageScore: { $avg: "$feedback.overallScore" }, totalSessions: { $sum: 1 } } }]);
    res.json(stats[0] || { averageScore: 0, totalSessions: 0 });
});
app.post('/api/sessions/:sessionId/complete', async (req, res) => {
    const { userIds, agentId, chatTranscript } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !agentId || !chatTranscript) {
        return res.status(400).json({ error: 'userIds array, agentId, and chatTranscript are required.' });
    }

    for (const userId of userIds) {
        await UserService.addSessionToHistory(userId, agentId, req.params.sessionId);
    }

    if (ai) {
        const feedbackPrompt = `Analyze the following chat transcript and provide detailed feedback...\n\nTranscript:\n${JSON.stringify(chatTranscript, null, 2)}`;
        const result = await ai.models.generateContent({ model: GEMINI_MODEL_TEXT, contents: [{ role: 'user', parts: [{ text: feedbackPrompt }] }] });
        const feedbackResponse = result.response;
        const newSession = new SessionModel({ _id: req.params.sessionId, traineeIds: userIds, chatTranscript, endTime: Date.now(), status: 'completed', feedback: { summary: feedbackResponse.text() } });
        await newSession.save();
    }
    res.status(200).json({ message: 'Session completed.' });
});


// Marketplace
app.get('/api/marketplace', async (req, res) => {
    const agents = await AIAgentModel.find({ isDefault: { $ne: true } });
    const scenarios = await ScenarioModel.find({ isManuallyCreated: true });
    res.json({ agents, scenarios });
});

// --- LTI (Learning Tools Interoperability) ---
app.get('/api/lti/config', (req, res) => {
    const config = {
        title: "Interrogation Simulator",
        description: "An AI-powered interrogation training simulator.",
        launch_url: `${req.protocol}://${req.get('host')}/lti/launch`,
        icon_url: `${req.protocol}://${req.get('host')}/assets/logo.png`,
        scopes: ["openid", "profile", "email"],
    };
    res.json(config);
});

app.post('/lti/launch', async (req, res) => {
    const { email, given_name, family_name } = req.body;

    if (!email) {
        return res.status(400).send('Email is required for LTI launch.');
    }

    let user = await UserModel.findOne({ email });
    if (!user) {
        user = new UserModel({
            name: `${given_name} ${family_name}`,
            email: email,
            password: 'lti_generated_password',
            role: UserRole.TRAINEE
        });
        await user.save();
    }

    const payload = { id: user.id, name: user.name, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    res.redirect(`/?lti_token=${token}`);
});


// AI & Media
app.post('/api/tts', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required.' });
    try {
        const audio = await elevenLabsClient.generate({ voice: "Rachel", text, model_id: "eleven_multilingual_v2" });
        res.set('Content-Type', 'audio/mpeg');
        audio.pipe(res);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate TTS audio.' });
    }
});
app.post('/api/upload-vrm', vrmUpload.single('avatar'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    res.status(200).json({ filePath: `/uploads/vrm/${req.file.filename}` });
});
app.post('/api/analyze-tone', memoryUpload.single('audio'), async (req, res) => {
    if (!req.file) return res.status(400).send('No audio file uploaded.');
    try {
        const [response] = await speechClient.recognize({
            audio: { content: req.file.buffer.toString('base64') },
            config: { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: 'en-US' },
        });
        const transcription = response.results?.map(r => r.alternatives?.[0].transcript).join('\n');
        res.json({ transcription });
    } catch (error) {
        res.status(500).json({ error: 'Failed to analyze audio.' });
    }
});
app.post('/api/generate-scenario', async (req, res) => {
    if (!ai) return res.status(500).json({ error: 'AI client not initialized.' });
    const { role, difficulty, topic, agentId, userId } = req.body;
    if (!role || !difficulty || !topic || !agentId || !userId) return res.status(400).json({ error: 'Missing required fields.' });
    try {
        const agentToUse = await AIAgentModel.findById(agentId) || await AIAgentModel.findOne({ isDefault: true });
        if (!agentToUse) return res.status(404).json({ error: "Agent not found." });

        const user = await UserModel.findById(userId);
        const history = user?.interactionHistory?.find(h => h.agentId === agentId);
        const historyPrompt = history ? `\nYou have had ${history.sessionIds.length} previous sessions with this user.` : '';

        const generationPrompt = UI_TEXT.generateScenarioPrompt.replace('{{...}}', '...'); // simplified
        const result = await ai.models.generateContent({ model: GEMINI_MODEL_TEXT, contents: [{role: 'user', parts: [{text: generationPrompt}]}]});
        const response = result.response;
        const parsedResponse = parseJsonFromResponse<AIResponseWithDirectives>(response.text());
        if (!parsedResponse) return res.status(500).json({ error: "Failed to parse AI response." });

        if (parsedResponse.toolCallRequest) {
            const toolResult = await executeToolCall(parsedResponse.toolCallRequest);
            parsedResponse.directives = { ...parsedResponse.directives, ...toolResult.directives };
        }
        const geminiScenario = parseJsonFromResponse<GeminiJsonScenario>(parsedResponse.textResponse);
        if (!geminiScenario) return res.status(500).json({ error: "Failed to parse scenario text." });

        const fullSystemPrompt = UI_TEXT.scenarioSystemPromptTemplate.replace('{{...}}', '...'); // simplified
        const finalScenario: Scenario = { id: `scenario-${Date.now()}`, ...geminiScenario, fullSystemPromptForChat: fullSystemPrompt, customAgentId: agentToUse.id, agentType: agentToUse.agentType || 'interrogation', userSelectedDifficulty: difficulty, userSelectedTopic: topic, interrogateeRole: role };
        res.json(finalScenario);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate scenario.' });
    }
});

// --- DB Connection & Server Start ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/interrogation-simulator';
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log("Successfully connected to MongoDB.");
        app.listen(port, () => console.log(`Server is running at http://localhost:${port}`));
    })
    .catch(err => console.error("Could not connect to MongoDB.", err));
