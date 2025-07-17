import { Schema, model } from 'mongoose';
import { InvestigationSession as ISession } from '../types';

const sessionSchema = new Schema<ISession>({
    traineeIds: [{ type: String, required: true }],
    scenario: { type: Schema.Types.ObjectId, ref: 'Scenario' },
    chatTranscript: [{ type: Schema.Types.Mixed }],
    startTime: { type: Number, required: true },
    endTime: { type: Number },
    status: { type: String, required: true },
    feedback: { type: Schema.Types.Mixed },
    initialSelections: { type: Schema.Types.Mixed },
    usedHintsCount: { type: Number, default: 0 },
    investigationLog: { type: String },
});

export const SessionModel = model<ISession>('Session', sessionSchema);
