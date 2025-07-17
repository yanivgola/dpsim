
import React from 'react';
import { ChatMessage, Theme, ChatMessageSubType } from '@/types'; // Import Theme and ChatMessageSubType

// Define icons for different system message subtypes
const InterventionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 flex-shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5v1.25a.75.75 0 00.75.75h.5a.75.75 0 00.75-.75V10.5a.75.75 0 00-.75-.75H9z" clipRule="evenodd" /></svg>;
const HintIconBubble = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 flex-shrink-0"><path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM8.879 5.093a.75.75 0 011.06 0l.793.792a.75.75 0 01-.53 1.28H9.793a.75.75 0 01-.53-1.28l.792-.792zM10 18a.75.75 0 01.75-.75h.01a.75.75 0 010 1.5H10.75a.75.75 0 01-.75-.75zM6.023 6.929a.75.75 0 010-1.06l.793-.793a.75.75 0 111.061 1.06l-.793.793a.75.75 0 01-1.06 0zM13.977 6.929a.75.75 0 01-1.06 0L12.12 6.136a.75.75 0 111.06-1.06l.794.793a.75.75 0 010 1.06zM10 6a4 4 0 100 8 4 4 0 000-8zM7.152 11.23a.75.75 0 101.06 1.061 1.99 1.99 0 012.316.745.75.75 011.28-.53L13.1 9.94a.75.75 0 00-1.06-1.06l-.37.37a1.99 1.99 0 01-2.316-.745.75.75 0 00-1.28.53l-.373.373z" /></svg>;
const ToolIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 flex-shrink-0"><path fillRule="evenodd" d="M11.09 2.222a.75.75 0 00-1.018-.088L4.35 6.014a.75.75 0 00-.35.65V13a.75.75 0 00.75.75h.75a.75.75 0 00.75-.75v-3.36l2.126 2.126a.75.75 0 001.06 0l2.126-2.126V13a.75.75 0 00.75.75h.75a.75.75 0 00.75-.75V6.664a.75.75 0 00-.35-.65L11.168 2.134a.75.75 0 00-.078-.046zM10 1.5a.75.75 0 01.75.75V4a.75.75 0 01-1.5 0V2.25A.75.75 0 0110 1.5z" clipRule="evenodd" /></svg>;

interface ChatBubbleProps {
  message: ChatMessage;
  theme: Theme;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, theme }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  // Base styles
  let bubbleClasses = "max-w-xl lg:max-w-2xl px-4 py-3 rounded-xl break-words shadow-lg"; 
  let containerClasses = "flex mb-4"; // Increased from mb-3 to mb-4
  let timeClasses = "text-xs mt-1.5";
  let SystemIconComponent: React.FC | null = null;

  if (isUser) {
    bubbleClasses += " bg-primary-500 text-white"; // Works for both themes
    containerClasses += " justify-end";
    timeClasses += " text-primary-100 text-left opacity-80"; 
  } else if (isSystem) {
    containerClasses += " justify-center my-4"; 
    // Default system message style
    let systemDefaultBg = theme === 'light' ? "bg-yellow-100 text-yellow-800 border-yellow-300" : "bg-secondary-700 text-yellow-300 border-secondary-600";
    let systemDefaultTime = theme === 'light' ? "text-yellow-700" : "text-yellow-400";

    if (message.subType === 'intervention_notification') {
      bubbleClasses += theme === 'light' ? " bg-blue-100 text-blue-800 border-blue-300" : " bg-blue-700 text-blue-100 border-blue-600";
      timeClasses += theme === 'light' ? " text-blue-700 text-center" : " text-blue-300 text-center";
      SystemIconComponent = InterventionIcon;
    } else if (message.subType === 'hint_response') {
      bubbleClasses += theme === 'light' ? " bg-green-100 text-green-800 border-green-300" : " bg-green-700 text-green-100 border-green-600";
      timeClasses += theme === 'light' ? " text-green-700 text-center" : " text-green-300 text-center";
      SystemIconComponent = HintIconBubble;
    } else if (message.subType === 'tool_communication') {
      bubbleClasses += theme === 'light' ? " bg-purple-100 text-purple-800 border-purple-300" : " bg-purple-700 text-purple-100 border-purple-600";
      timeClasses += theme === 'light' ? " text-purple-700 text-center" : " text-purple-300 text-center";
      SystemIconComponent = ToolIcon;
    } else { // Generic system message
      bubbleClasses += ` ${systemDefaultBg}`;
      timeClasses += ` ${systemDefaultTime} text-center`;
    }
     bubbleClasses += " flex items-start"; // Ensure icon and text align nicely for system messages
  } else { // AI sender
    if (theme === 'light') {
      bubbleClasses += " bg-secondary-200 text-secondary-800 border border-secondary-300";
      timeClasses += " text-secondary-500 text-right opacity-80";
    } else { // dark theme
      bubbleClasses += " bg-secondary-700 text-secondary-100 border border-secondary-600"; 
      timeClasses += " text-secondary-400 text-right opacity-80";
    }
    containerClasses += " justify-start";
  }

  const messageTextContent = (
    <div className="flex-grow">
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p> {/* Added leading-relaxed for line-height */}
      {!isSystem && (
          <p className={timeClasses}>
          {new Date(message.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </p>
      )}
    </div>
  );

  return (
    <div className={containerClasses}>
      <div 
        className={bubbleClasses} 
        role={isSystem ? "status" : undefined} 
        aria-live={isSystem ? "polite" : undefined}
      >
        {isSystem && SystemIconComponent && <SystemIconComponent />}
        {messageTextContent}
      </div>
    </div>
  );
};

export default ChatBubble;