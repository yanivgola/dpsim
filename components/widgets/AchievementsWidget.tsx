import React from 'react';
import Widget from '../common/Widget';

const AchievementsWidget: React.FC<{ unlockedAchievements: string[] }> = ({ unlockedAchievements }) => {
  return (
    <Widget title="הישגים">
      <p className="text-neutral-600 dark:text-neutral-400">פתחת {unlockedAchievements.length} מתוך 4 הישגים.</p>
    </Widget>
  );
};

export default AchievementsWidget;
