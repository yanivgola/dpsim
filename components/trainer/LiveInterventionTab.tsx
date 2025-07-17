

import React, { useState, useEffect, useRef } from 'react';
import { Theme, InvestigationSession, UserCommandType, InterruptionType, InterruptionTypeDisplay } from '@/types';
import * as ApiService from '@/services/ApiService';
import { UI_TEXT } from '@/constants';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import ChatBubble from '@/components/ChatBubble';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface LiveInterventionTabProps {
  theme: Theme;
}

const LiveInterventionTab: React.FC<LiveInterventionTabProps> = ({ theme }) => {
  const [allSessions, setAllSessions] = useState<InvestigationSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<InvestigationSession[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  
  const [commandType, setCommandType] = useState<UserCommandType>(UserCommandType.SEND_WHISPER);
  const [payloadText, setPayloadText] = useState('');
  const [interruptionType, setInterruptionType] = useState<InterruptionType>(InterruptionType.PHONE_CALL);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const chatDisplayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            const [sessions, usersData] = await Promise.all([
                ApiService.getAllSessions(),
                ApiService.getUsers()
            ]);
            
            const active = sessions.filter(s => s.status === 'active');
            setAllSessions(sessions);
            setActiveSessions(active);
            setUsers(usersData);
        } catch (e) {
            console.error("Failed to load intervention data:", e);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();

    // Set up an interval to poll for new active sessions
    const intervalId = setInterval(loadData, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Effect to scroll chat to bottom when session changes or messages update
  useEffect(() => {
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [selectedSessionId, allSessions]);

  const handleSendCommand = () => {
    if (!selectedSessionId) {
      setStatusMessage(UI_TEXT.errorNoSessionSelected);
      return;
    }

    let payload: any = {};
    if (commandType === UserCommandType.TRIGGER_INTERRUPTION) {
      payload = { interruptionType, details: payloadText };
    } else if (commandType === UserCommandType.FORCE_EMOTIONAL_STATE) {
      payload = { emotionalState: payloadText };
    } else if (commandType === UserCommandType.REVEAL_SPECIFIC_INFO_HINT) {
      payload = { infoToRevealHint: payloadText };
    } else if (commandType === UserCommandType.SEND_WHISPER) {
      payload = { whisperText: payloadText };
    }

    ApiService.sendCommandToSession(selectedSessionId, { commandType, payload });
    
    setStatusMessage(commandType === UserCommandType.TRIGGER_INTERRUPTION ? UI_TEXT.interruptionCommandSentMessage : UI_TEXT.commandSentMessage);
    setPayloadText(''); // Clear input after sending
    setTimeout(() => setStatusMessage(null), 3000);
  };
  
  const isSendCommandDisabled = () => {
    if (!selectedSessionId) return true;
    const requiresText = [
        UserCommandType.FORCE_EMOTIONAL_STATE,
        UserCommandType.REVEAL_SPECIFIC_INFO_HINT,
        UserCommandType.SEND_WHISPER,
        UserCommandType.TRIGGER_INTERRUPTION,
    ].includes(commandType);
    return requiresText && !payloadText.trim();
  };

  const selectedSession = allSessions.find(s => s.id === selectedSessionId);

  if (isLoading) {
    return (
      <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-white border' : 'themed-card'}`}>
          <LoadingSpinner message="טוען סשנים פעילים..." />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Control Panel */}
      <div className={`p-4 rounded-lg space-y-4 ${theme === 'light' ? 'bg-white border' : 'themed-card'}`}>
        <h3 className="text-lg font-semibold">{UI_TEXT.liveInterventionTab}</h3>
        
        <Select
          label={UI_TEXT.selectActiveSessionPlaceholder}
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          options={activeSessions.map(s => {
            const trainee = users.find(u => u.id === s.traineeId);
            return {
              value: s.id,
              label: `${trainee?.name || 'Unknown Trainee'} - ${s.scenario.caseType} (Started: ${new Date(s.startTime).toLocaleTimeString()})`
            };
          })}
          defaultEmptyOption={activeSessions.length === 0 ? UI_TEXT.noActiveSessions : "בחר סימולציה..."}
        />

        <Select
          label="סוג פקודה:"
          value={commandType}
          onChange={(e) => setCommandType(e.target.value as UserCommandType)}
          options={Object.values(UserCommandType).map(ct => ({ value: ct, label: ct }))}
        />
        
        {commandType === UserCommandType.TRIGGER_INTERRUPTION ? (
            <div className='space-y-4'>
                <Select
                    label={UI_TEXT.interruptionTypeLabel}
                    value={interruptionType}
                    onChange={(e) => setInterruptionType(e.target.value as InterruptionType)}
                    options={Object.entries(InterruptionTypeDisplay).map(([key, label]) => ({value: key, label}))}
                />
                <Input
                    type="text"
                    value={payloadText}
                    onChange={(e) => setPayloadText(e.target.value)}
                    placeholder={UI_TEXT.interruptionDetailsPlaceholder}
                />
            </div>
        ) : [UserCommandType.FORCE_EMOTIONAL_STATE, UserCommandType.REVEAL_SPECIFIC_INFO_HINT, UserCommandType.SEND_WHISPER].includes(commandType) ? (
          <Input
            type="text"
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            placeholder={
              commandType === UserCommandType.FORCE_EMOTIONAL_STATE ? UI_TEXT.enterEmotionalStatePlaceholder :
              commandType === UserCommandType.REVEAL_SPECIFIC_INFO_HINT ? UI_TEXT.enterInfoHintPlaceholder :
              UI_TEXT.enterWhisperPlaceholder
            }
          />
        ) : (
          <p className='text-sm themed-text-secondary'>אין צורך בפרמטרים נוספים עבור פקודה זו.</p>
        )}

        <Button onClick={handleSendCommand} disabled={isSendCommandDisabled()} className="w-full">
          {UI_TEXT.sendCommandButton}
        </Button>
        {statusMessage && <p className="text-sm text-green-500 text-center">{statusMessage}</p>}
      </div>

      {/* Chat View Panel */}
      <div className={`p-4 rounded-lg flex flex-col ${theme === 'light' ? 'bg-white border' : 'themed-card'}`}>
        <h3 className="text-lg font-semibold mb-2 flex-shrink-0">{UI_TEXT.trainerChatViewTitle}</h3>
        <div ref={chatDisplayRef} className="flex-grow overflow-y-auto border rounded-md p-2 min-h-[300px] themed-border bg-opacity-20"
          style={{backgroundColor: theme === 'light' ? '#f8fafc' : '#0f172a'}}>
          {selectedSession ? (
            selectedSession.chatTranscript.length > 0 ? (
              selectedSession.chatTranscript.map(msg => <ChatBubble key={msg.id} message={msg} theme={theme} />)
            ) : (
              <p className="text-sm text-center themed-text-secondary p-4">{UI_TEXT.trainerChatViewNoMessages}</p>
            )
          ) : (
            <p className="text-sm text-center themed-text-secondary p-4">{UI_TEXT.selectActiveSessionPlaceholder}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveInterventionTab;