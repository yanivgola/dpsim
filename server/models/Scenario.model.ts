import { Schema, model } from 'mongoose';
import { Scenario as IScenario, InterrogateeRole, DifficultyLevel, AIAgentType } from '../types';

const scenarioSchema = new Schema<IScenario>({
    caseType: { type: String, required: true },
    fullCaseDescription: { type: String, required: true },
    interrogateeRole: { type: String, enum: Object.values(InterrogateeRole) },
    interrogateeProfile: { type: Schema.Types.Mixed },
    evidence: { type: Schema.Types.Mixed },
    fullSystemPromptForChat: { type: String },
    userSelectedDifficulty: { type: String, enum: Object.values(DifficultyLevel) },
    userSelectedTopic: { type: String },
    customAgentId: { type: String, required: true },
    agentType: { type: String, enum: Object.values(AIAgentType), required: true },
    investigationGoals: [{ type: String }],
    isManuallyCreated: { type: Boolean, default: false },
});

export const ScenarioModel = model<IScenario>('Scenario', scenarioSchema);
