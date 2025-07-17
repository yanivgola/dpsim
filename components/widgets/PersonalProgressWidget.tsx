import React from 'react';
import Widget from '../common/Widget';

const PersonalProgressWidget: React.FC = () => {
  return (
    <Widget title="התקדמות אישית">
      <p className="text-neutral-600 dark:text-neutral-400">אין נתוני התקדמות זמינים.</p>
    </Widget>
  );
};

export default PersonalProgressWidget;
