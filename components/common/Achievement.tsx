import React from 'react';
import Badge from './Badge';

interface AchievementProps {
  name: string;
  description: string;
  unlocked: boolean;
}

const Achievement: React.FC<AchievementProps> = ({ name, description, unlocked }) => {
  return (
    <div className={`p-4 rounded-lg ${unlocked ? 'bg-green-100 dark:bg-green-900' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${unlocked ? 'text-green-800 dark:text-green-200' : 'text-neutral-800 dark:text-neutral-200'}`}>{name}</h3>
        {unlocked && <Badge label="Unlocked" color="success" />}
      </div>
      <p className={`mt-2 text-sm ${unlocked ? 'text-green-600 dark:text-green-400' : 'text-neutral-600 dark:text-neutral-400'}`}>{description}</p>
    </div>
  );
};

export default Achievement;
