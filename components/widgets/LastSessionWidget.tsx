import React from 'react';
import Widget from '../common/Widget';

const LastSessionWidget: React.FC = () => {
  return (
    <Widget title="הסימולציה האחרונה שלך">
      <p className="text-neutral-600 dark:text-neutral-400">אין נתוני סימולציה אחרונים.</p>
    </Widget>
  );
};

export default LastSessionWidget;
