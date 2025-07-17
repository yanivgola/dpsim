

import React, { useState, useEffect } from 'react';
import { Theme, Scenario } from '@/types';
import * as ApiService from '@/services/ApiService';
import { UI_TEXT } from '@/constants';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1H8.75zM10 4.5a.75.75 0 01.75.75v8.5a.75.75 0 01-1.5 0v-8.5A.75.75 0 0110 4.5z" clipRule="evenodd" /></svg>;


interface ManualScenarioBuilderTabProps {
  theme: Theme;
  onEdit: (scenario: Scenario) => void;
  onAddNew: () => void;
}

const ManualScenarioBuilderTab: React.FC<ManualScenarioBuilderTabProps> = ({ theme, onEdit, onAddNew }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadScenarios = async () => {
    setIsLoading(true);
    setScenarios(await ApiService.getManualScenarios());
    setIsLoading(false);
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  const handleDelete = async (e: React.MouseEvent, scenarioId: string) => {
    e.stopPropagation(); // Prevent card click
    const scenarioToDelete = scenarios.find(s => s.id === scenarioId);
    if (scenarioToDelete && window.confirm(UI_TEXT.confirmDeleteManualScenarioMessage(scenarioToDelete.caseType))) {
      await ApiService.deleteManualScenario(scenarioId);
      await loadScenarios();
    }
  };

  return (
    <div className={`p-4 rounded-lg space-y-4 ${theme === 'light' ? 'bg-white border' : 'bg-secondary-900/50'}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{UI_TEXT.manualScenariosTitle}</h3>
        <Button onClick={onAddNew} isLoading={isLoading}>{UI_TEXT.addNewManualScenarioButton}</Button>
      </div>

      {isLoading ? <LoadingSpinner /> : (
          scenarios.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map(scenario => (
                <div key={scenario.id} onClick={() => onEdit(scenario)}
                     className="themed-card rounded-lg shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between p-4 min-h-[120px]">
                  <div>
                    <h4 className="font-bold themed-text-primary truncate">{scenario.caseType}</h4>
                    <p className="text-xs themed-text-secondary mt-1">
                      {scenario.interrogateeRole} - {scenario.userSelectedDifficulty}
                    </p>
                  </div>
                  <div className="flex justify-end items-center mt-3 space-x-1 rtl:space-x-reverse">
                     <button onClick={(e) => handleDelete(e, scenario.id)} className="p-1.5 rounded-full text-red-400 hover:bg-red-500/20 transition-colors" title={UI_TEXT.delete}>
                       <DeleteIcon/>
                     </button>
                      <button onClick={() => onEdit(scenario)} className="p-1.5 rounded-full themed-text-secondary hover:bg-primary-500/20 transition-colors" title={UI_TEXT.edit}>
                       <EditIcon/>
                     </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-10 border-2 border-dashed themed-border rounded-lg">
                <p className="themed-text-secondary">{UI_TEXT.noDataAvailable}</p>
                <Button onClick={onAddNew} className="mt-4">{UI_TEXT.addNewManualScenarioButton}</Button>
            </div>
          )
      )}
    </div>
  );
};

export default ManualScenarioBuilderTab;