import { Schema, model } from 'mongoose';
import { Scenario as IScenario, InterrogateeRole, DifficultyLevel } from '../types';

const scenarioSchema = new Schema<IScenario>({
    caseType: { type: String, required: true },
    fullCaseDescription: { type: String, required: true },
    authorId: { type: String },
    interrogateeRole: { type: String, enum: Object.values(InterrogateeRole) },
    interrogateeProfile: { type: Schema.Types.Mixed },
    evidence: { type: Schema.Types.Mixed },
    fullSystemPromptForChat: { type: String },
    userSelectedDifficulty: { type: String, enum: Object.values(DifficultyLevel) },
    userSelectedTopic: { type: String },
    customAgentId: { type: String, required: true },
    agentType: { type: String, required: true },
    investigationGoals: [{ type: String }],
    isManuallyCreated: { type: Boolean, default: false },
});

export const ScenarioModel = model<IScenario>('Scenario', scenarioSchema);
