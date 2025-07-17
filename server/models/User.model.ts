import { Schema, model } from 'mongoose';
import { User as IUser, UserRole } from '../types';

const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.TRAINEE },
});

export const UserModel = model<IUser>('User', userSchema);
