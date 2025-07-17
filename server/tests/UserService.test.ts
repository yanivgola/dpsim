import mongoose from 'mongoose';
import * as UserService from '../services/UserService';
import { UserModel } from '../models/User.model';

describe('UserService', () => {
    it('should allow a user to sign up', async () => {
        const { user } = await UserService.signup('Test User', 'test@example.com', 'password123');
        expect(user).toBeDefined();
        expect(user?.email).toBe('test@example.com');

        const dbUser = await UserModel.findById((user as any)?._id);
        expect(dbUser).toBeDefined();
    });

    it('should not allow signing up with a duplicate email', async () => {
        await UserService.signup('Test User', 'test@example.com', 'password123');
        const { user, error } = await UserService.signup('Another User', 'test@example.com', 'password456');
        expect(user).toBeNull();
        expect(error).toBe('Email exists');
    });

    it('should allow a registered user to log in with correct credentials', async () => {
        await UserService.signup('Test User', 'test@example.com', 'password123');
        const user = await UserService.login('test@example.com', 'password123');
        expect(user).toBeDefined();
    });

    it('should not allow a registered user to log in with incorrect credentials', async () => {
        await UserService.signup('Test User', 'test@example.com', 'password123');
        const user = await UserService.login('test@example.com', 'wrongpassword');
        expect(user).toBeNull();
    });
});
