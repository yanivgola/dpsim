import { Schema, model } from 'mongoose';
import { UserWithPassword as IUserWithPassword, UserRole } from '../types';

const userSchema = new Schema<IUserWithPassword>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.TRAINEE },
    interactionHistory: [{
        agentId: { type: String, required: true },
        sessionIds: [{ type: String }],
    }]
});

export const UserModel = model<IUserWithPassword>('User', userSchema);
