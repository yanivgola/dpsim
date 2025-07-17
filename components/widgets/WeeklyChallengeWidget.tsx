import React from 'react';
import Widget from '../common/Widget';

const WeeklyChallengeWidget: React.FC = () => {
  return (
    <Widget title="אתגר השבוע">
      <p className="text-neutral-600 dark:text-neutral-400">אין אתגרים זמינים כרגע.</p>
    </Widget>
  );
};

export default WeeklyChallengeWidget;
