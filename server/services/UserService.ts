import { UserModel } from '../models/User.model';
import { User, UserRole } from '../types';
import bcrypt from 'bcryptjs';

export const login = async (email: string, password: string): Promise<User | null> => {
    const user = await UserModel.findOne({ email });
    if (!user) {
        return null;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return null;
    }
    return user.toObject();
};

export const signup = async (fullName: string, email: string, password: string): Promise<{ user: User | null, error?: string }> => {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
        return { user: null, error: 'Email exists' };
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new UserModel({ name: fullName, email, password: hashedPassword, role: UserRole.TRAINEE });
    await newUser.save();
    return { user: newUser.toObject() };
};

export const getUsers = async (): Promise<User[]> => {
    const users = await UserModel.find();
    return users.map(u => u.toObject());
};

export const addUser = async (user: User): Promise<void> => {
    const newUser = new UserModel(user);
    await newUser.save();
};

export const deleteUser = async (userId: string): Promise<void> => {
    await UserModel.findByIdAndDelete(userId);
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
    await UserModel.findByIdAndUpdate(userId, { role });
};
