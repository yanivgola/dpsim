import { Schema, model } from 'mongoose';
import { AIAgent as IAIAgent } from '../types';

const aiAgentSchema = new Schema<IAIAgent>({
    name: { type: String, required: true },
    description: { type: String },
    baseSystemPrompt: { type: String, required: true },
    authorId: { type: String },
    isDefault: { type: Boolean, default: false },
    isEditable: { type: Boolean, default: true },
    personalityTraits: [{ type: String }],
    agentType: { type: String, default: 'interrogation' },
    conversationStarters: [{ type: String }],
    recommendedModel: { type: String },
    capabilities: {
        webSearch: { type: Boolean, default: false },
        imageGeneration: { type: Boolean, default: false },
        toolUsage: { type: Boolean, default: true },
    },
    knowledgeBaseIds: [{ type: String }],
    avatarUrl: { type: String },
});

export const AIAgentModel = model<IAIAgent>('AIAgent', aiAgentSchema);
