import React from 'react';
import Achievement from './common/Achievement';

const achievements = [
  { id: 'first_session', name: 'בלש מתחיל', description: 'השלם את הסימולציה הראשונה שלך.' },
  { id: 'five_sessions', name: 'חוקר ותיק', description: 'השלם 5 סימולציות.' },
  { id: 'perfect_score', name: 'אמן החקירות', description: 'קבל ציון 10 בסימולציה.' },
  { id: 'lie_detector', name: 'אמן השקרים', description: 'חשוף את כל השקרים בתרחיש.' },
];

const Achievements: React.FC<{ unlockedAchievements: string[] }> = ({ unlockedAchievements }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200 mb-6">הישגים</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map(achievement => (
          <Achievement
            key={achievement.id}
            name={achievement.name}
            description={achievement.description}
            unlocked={unlockedAchievements.includes(achievement.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Achievements;
