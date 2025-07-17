import mongoose from 'mongoose';
import * as AIAgentService from '../services/AIAgentService';
import { AIAgentModel } from '../models/AIAgent.model';
import { AIAgent } from '../types';

describe('AIAgentService', () => {
    const agentData: Omit<AIAgent, 'id'> = {
        name: 'Test Agent',
        description: 'A test agent',
        baseSystemPrompt: 'You are a test agent.',
        agentType: 'interrogation',
    };

    it('should add a new agent', async () => {
        const newAgent = await AIAgentService.addAgent(agentData as AIAgent);
        expect(newAgent).toBeDefined();
        expect(newAgent.name).toBe('Test Agent');

        const dbAgent = await AIAgentModel.findById(newAgent.id);
        expect(dbAgent).toBeDefined();
    });

    it('should get all agents', async () => {
        await AIAgentService.addAgent(agentData as AIAgent);
        await AIAgentService.addAgent({ ...agentData, name: 'Test Agent 2' } as AIAgent);

        const agents = await AIAgentService.getAgents();
        expect(agents).toHaveLength(2);
    });

    it('should update an agent', async () => {
        const newAgent = await AIAgentService.addAgent(agentData as AIAgent);
        const updatedData = {
            name: newAgent.name,
            description: 'An updated description',
            baseSystemPrompt: newAgent.baseSystemPrompt,
            agentType: newAgent.agentType,
        };
        const updatedAgent = await AIAgentService.updateAgent(newAgent.id, updatedData as any);

        expect(updatedAgent).toBeDefined();
        expect(updatedAgent?.description).toBe('An updated description');
    });

    it('should delete an agent', async () => {
        const newAgent = await AIAgentService.addAgent(agentData as AIAgent);
        await AIAgentService.deleteAgent(newAgent.id);

        const dbAgent = await AIAgentModel.findById(newAgent.id);
        expect(dbAgent).toBeNull();
    });
});
