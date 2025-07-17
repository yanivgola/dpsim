import React from 'react';
import LastSessionWidget from './widgets/LastSessionWidget';
import WeeklyChallengeWidget from './widgets/WeeklyChallengeWidget';
import PersonalProgressWidget from './widgets/PersonalProgressWidget';
import AchievementsWidget from './widgets/AchievementsWidget';

const Dashboard: React.FC<{ onNavigate: (view: 'achievements') => void }> = ({ onNavigate }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200">דשבורד ראשי</h1>
        <button onClick={() => onNavigate('achievements')} className="text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200">
          כל ההישגים
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <LastSessionWidget />
        <WeeklyChallengeWidget />
        <PersonalProgressWidget />
        <AchievementsWidget unlockedAchievements={[]} />
      </div>
    </div>
  );
};

export default Dashboard;
