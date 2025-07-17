import { ScenarioModel } from '../models/Scenario.model';
import { Scenario } from '../types';

export const getScenarios = async (): Promise<Scenario[]> => {
    const scenarios = await ScenarioModel.find();
    return scenarios.map(s => s.toObject());
};

export const getScenarioById = async (id: string): Promise<Scenario | null> => {
    const scenario = await ScenarioModel.findById(id);
    return scenario ? scenario.toObject() : null;
};

export const addScenario = async (scenario: Scenario): Promise<Scenario> => {
    const newScenario = new ScenarioModel(scenario);
    await newScenario.save();
    return newScenario.toObject();
};

export const updateScenario = async (id: string, scenario: Scenario): Promise<Scenario | null> => {
    const updatedScenario = await ScenarioModel.findByIdAndUpdate(id, scenario, { new: true });
    return updatedScenario ? updatedScenario.toObject() : null;
};

export const deleteScenario = async (id: string): Promise<void> => {
    await ScenarioModel.findByIdAndDelete(id);
};
