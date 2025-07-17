import { AIAgentModel } from '../models/AIAgent.model';
import { AIAgent } from '../types';

export const getAgents = async (): Promise<AIAgent[]> => {
    const agents = await AIAgentModel.find();
    return agents.map(a => {
        const agentObject: any = a.toObject({ versionKey: false });
        agentObject.id = agentObject._id.toString();
        delete agentObject._id;
        return agentObject;
    });
};

export const addAgent = async (agent: AIAgent): Promise<AIAgent> => {
    const newAgent = new AIAgentModel(agent);
    await newAgent.save();
    const agentObject: any = newAgent.toObject({ versionKey: false });
    agentObject.id = agentObject._id.toString();
    delete agentObject._id;
    return agentObject;
};

export const updateAgent = async (agentId: string, agent: AIAgent): Promise<AIAgent | null> => {
    const updatedAgent = await AIAgentModel.findByIdAndUpdate(agentId, agent, { new: true });
    if (!updatedAgent) {
        return null;
    }
    const agentObject: any = updatedAgent.toObject({ versionKey: false });
    agentObject.id = agentObject._id.toString();
    delete agentObject._id;
    return agentObject;
};

export const deleteAgent = async (agentId: string): Promise<void> => {
    await AIAgentModel.findByIdAndDelete(agentId);
};
