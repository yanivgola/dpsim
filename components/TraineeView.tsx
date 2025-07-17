
import '@/types';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Scenario, ChatMessage, Feedback, InvestigationSession, GeminiChat, InterrogateeRole, DifficultyLevel,
    PREDEFINED_INVESTIGATION_TOPICS, SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent,
    SpeechSynthesisVoice, SimpleChatMessage, AvatarControlPayload,
    UserCommand,
    LoadedAIAgent, KeyMoment, AIAgentType, SuspectProfile,
    Theme, ChatMessageSubType
} from '@/types';
import { UI_TEXT, DEFAULT_AGENT_ID } from '@/constants';
import * as ApiService from '@/services/ApiService';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ChatBubble from '@/components/ChatBubble';
import Modal from '@/components/common/Modal';
import Select from '@/components/common/Select';
import ToggleSwitch from '@/components/common/ToggleSwitch';
import Textarea from '@/components/common/Textarea';
import '@/live-audio';
import '@/live-audio-visuals-3d';
import { GdmLiveAudio, LiveAudioState } from '@/live-audio';
import { GdmLiveAudioVisuals3D } from '@/live-audio-visuals-3d';

const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const HintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a.75.75 0 01-.75-.75V6.32L6.002 9.42a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.062 0l5.25 5.25a.75.75 0 01-1.061 1.06L12.75 6.32v11.68a.75.75 0 01-.75-.75z" /></svg>;
const MicListeningIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.75 6.75 0 006.75-6.75v-1.5a6.75 6.75 0 00-13.5 0v1.5A6.75 6.75 0 0012 18.75zM12 7.5A2.25 2.25 0 0114.25 5.25v1.5A2.25 2.25 0 0112 9V7.5z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const ClearLogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.288.255A1.037 1.037 0 017.38 7.608l.008.007a1.037 1.037 0 001.036.953h.008a1.037 1.037 0 001.035-.953l.008-.007A1.037 1.037 0 0110.5 6.63l.008-.007M6.382 5.79A48.13 48.13 0 0112 5.135M12 5.135V4.5A2.25 2.25 0 0114.25 2.25h1.5A2.25 2.25 0 0118 4.5v.635m-6.382 0c-1.153 0-2.243.096-3.288.255A1.037 1.037 0 007.38 7.608l.008.007a1.037 1.037 0 011.036.953h.008a1.037 1.037 0 011.035-.953l.008-.007A1.037 1.037 0 0010.5 6.63l.008-.007M17.618 5.79A48.13 48.13 0 0012 5.135" /></svg>;


interface TraineeViewProps {
  traineeId: string;
  onSessionComplete: (session: InvestigationSession) => Promise<void>;
}

const TIPS = [
    "זכור לשמור על קשר עין, גם אם האווטאר לא באמת רואה אותך.",
    "שפת גוף היא המפתח. שים לב לתגובות האווטאר.",
    "שאלות פתוחות יכולות לחשוף מידע שלא ציפית לו.",
    "השתמש בשתיקה ככלי. לפעמים, שתיקה יכולה לגרום לנחקר לדבר.",
    "בנה אמון עם הנחקר לפני שאתה מתחיל לשאול שאלות קשות.",
];

type ViewState =
  'initial_setup_type_selection' |
  'initial_setup_manual_scenario_selection' |
  'initial_setup_agent_selection' |
  'initial_setup_interrogatee_role' |
  'initial_setup_difficulty' |
  'initial_setup_topic' |
  'initial_setup_review' |
  'generating_scenario' |
  'scenario_ready' |
  'investigation_active' |
  'generating_feedback' |
  'feedback_ready' |
  'error' |
  'generating_hint';

type LiveAudioVisualIndicatorState = LiveAudioState;
type ScenarioType = 'ai_generated' | 'manual';
type SidePanelTab = 'scenario' | 'log';

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechSynthesisAPI = window.speechSynthesis;

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const callable = (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return callable as (...args: Parameters<F>) => void;
}


const TraineeView: React.FC<TraineeViewProps> = ({ traineeId, onSessionComplete }) => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selectedScenarioType, setSelectedScenarioType] = useState<ScenarioType>('ai_generated');
  const [selectedManualScenarioId, setSelectedManualScenarioId] = useState<string>('');
  const [availableManualScenarios, setAvailableManualScenarios] = useState<Scenario[]>([]);

  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<InterrogateeRole | ''>(InterrogateeRole.SUSPECT);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | ''>(DifficultyLevel.MEDIUM);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [availableAgents, setAvailableAgents] = useState<LoadedAIAgent[]>([]);

  const [currentSession, setCurrentSession] = useState<InvestigationSession | null>(null);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [viewState, setViewState] = useState<ViewState>('initial_setup_type_selection');
  const [error, setError] = useState<string | null>(null);
  const [liveAudioError, setLiveAudioError] = useState<string | null>(null);

  const [geminiChatInstance, setGeminiChatInstance] = useState<GeminiChat | null>(null);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState<boolean>(false);
  const [isScenarioDetailsModalOpen, setIsScenarioDetailsModalOpen] = useState<boolean>(false);

  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechRecognitionInstance, setSpeechRecognitionInstance] = useState<SpeechRecognition | null>(null);
  const [speechSynthesisVoices, setSpeechSynthesisVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeechApiSupported, setIsSpeechApiSupported] = useState(true);
  const [microphonePermissionError, setMicrophonePermissionError] = useState<string | null>(null);

  const [isAISpeechOutputEnabled, setIsAISpeechOutputEnabled] = useState<boolean>(!!speechSynthesisAPI);
  const [isRegularTtsMuted, setIsRegularTtsMuted] = useState<boolean>(false);

  const [userWantsLiveAudio, setUserWantsLiveAudio] = useState<boolean>(false);
  const [isLiveAudioModeActive, setIsLiveAudioModeActive] = useState<boolean>(false);
  const [liveAudioVisualState, setLiveAudioVisualState] = useState<LiveAudioVisualIndicatorState>(LiveAudioState.IDLE);
  const liveAudioElementRef = useRef<GdmLiveAudio>(null);
  const visuals3dRef = useRef<GdmLiveAudioVisuals3D>(null);

  const [trainerInterventionForNextTurn, setTrainerInterventionForNextTurn] = useState<UserCommand | null>(null);

  const [inputAudioNodeForVisualizer, setInputAudioNodeForVisualizer] = useState<AudioNode | null>(null);
  const [outputAudioNodeForVisualizer, setOutputAudioNodeForVisualizer] = useState<AudioNode | null>(null);
  const [currentAvatarDirectives, setCurrentAvatarDirectives] = useState<AvatarControlPayload | null>(null);
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);

  const [usedHintsCount, setUsedHintsCount] = useState<number>(0);
  const [investigationLog, setInvestigationLog] = useState<string>("");
  const [investigationLogSearchTerm, setInvestigationLogSearchTerm] = useState<string>("");
  const [investigationLogSearchOccurrences, setInvestigationLogSearchOccurrences] = useState<number>(0);
  const [isClearLogConfirmModalOpen, setIsClearLogConfirmModalOpen] = useState<boolean>(false);
  const [transcriptSnippet, setTranscriptSnippet] = useState<{ quote: string, messages: ChatMessage[] } | null>(null);
  const [activeSidePanelTab, setActiveSidePanelTab] = useState<SidePanelTab>('scenario');

  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [agents, manualScenarios] = await Promise.all([
          ApiService.getAiAgents(),
          ApiService.getManualScenarios()
        ]);
        setAvailableAgents(agents);
        setAvailableManualScenarios(manualScenarios);
        const defaultAgent = agents.find(a => a.isDefault);
        if (defaultAgent) {
          setSelectedAgentId(defaultAgent.id);
        }
      } catch (err) {
        setError('שגיאה בטעינת נתונים ראשוניים.');
        setViewState('error');
      }
    };
    loadInitialData();

    const handleTrainerCommand = (event: Event) => {
        const customEvent = event as CustomEvent<{sessionId: string, command: UserCommand}>;
        if (currentSession && customEvent.detail.sessionId === currentSession.id) {
            setTrainerInterventionForNextTurn(customEvent.detail.command);
            const systemMessage: ChatMessage = {
                id: `sys-${Date.now()}`,
                sender: 'system',
                text: 'התקבלה התערבות מדריך.',
                subType: 'intervention_notification',
                timestamp: Date.now()
            };
            setChatMessages(prev => [...prev, systemMessage]);
        }
    };
    window.addEventListener('trainer-intervention-command', handleTrainerCommand);

    return () => {
        window.removeEventListener('trainer-intervention-command', handleTrainerCommand);
    };
  }, [currentSession]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (speechSynthesisAPI) {
        const getVoices = () => {
            const voices = speechSynthesisAPI.getVoices();
            if (voices.length > 0) {
                setSpeechSynthesisVoices(voices);
            }
        };
        getVoices();
        if (speechSynthesisAPI.onvoiceschanged !== undefined) {
            speechSynthesisAPI.onvoiceschanged = getVoices;
        }
    }
  }, []);

  const debouncedSaveLog = useCallback(debounce((id, log) => {
    ApiService.saveInvestigationLog(id, log);
  }, 1000), []);

  useEffect(() => {
    if (currentSession) {
      debouncedSaveLog(currentSession.id, investigationLog);
    }
  }, [investigationLog, currentSession, debouncedSaveLog]);

  useEffect(() => {
      if(investigationLogSearchTerm && investigationLog) {
          const regex = new RegExp(investigationLogSearchTerm, 'gi');
          const matches = investigationLog.match(regex);
          setInvestigationLogSearchOccurrences(matches ? matches.length : 0);
      } else {
          setInvestigationLogSearchOccurrences(0);
      }
  }, [investigationLogSearchTerm, investigationLog]);

  const handleStartNewSession = () => {
    setCurrentSession(null);
    setCurrentScenario(null);
    setChatMessages([]);
    setGeminiChatInstance(null);
    setError(null);
    setUsedHintsCount(0);
    setTrainerInterventionForNextTurn(null);
    setViewState('initial_setup_type_selection');
  };

  const handleNextStep = () => {
    const nextStateMap: Record<string, ViewState> = {
      initial_setup_type_selection: selectedScenarioType === 'manual' ? 'initial_setup_manual_scenario_selection' : 'initial_setup_agent_selection',
      initial_setup_manual_scenario_selection: 'initial_setup_review',
      initial_setup_agent_selection: 'initial_setup_interrogatee_role',
      initial_setup_interrogatee_role: 'initial_setup_difficulty',
      initial_setup_difficulty: 'initial_setup_topic',
      initial_setup_topic: 'initial_setup_review'
    };
    setViewState(nextStateMap[viewState]);
  };
  
  const handleBackStep = () => {
    const prevStateMap: Record<string, ViewState> = {
      initial_setup_manual_scenario_selection: 'initial_setup_type_selection',
      initial_setup_agent_selection: 'initial_setup_type_selection',
      initial_setup_interrogatee_role: 'initial_setup_agent_selection',
      initial_setup_difficulty: 'initial_setup_interrogatee_role',
      initial_setup_topic: 'initial_setup_difficulty',
      initial_setup_review: selectedScenarioType === 'manual' ? 'initial_setup_manual_scenario_selection' : 'initial_setup_topic'
    };
    setViewState(prevStateMap[viewState]);
  };

  const handleGenerateScenario = async () => {
    if (selectedScenarioType === 'ai_generated') {
      if (!selectedRole || !selectedDifficulty || !(selectedTopic || customTopic) || !selectedAgentId) {
        setError(UI_TEXT.errorMissingSetupSelection);
        return;
      }
      setViewState('generating_scenario');
      const topicToUse = customTopic || selectedTopic;
      const scenario = await ApiService.generateScenario(selectedRole, selectedDifficulty, topicToUse, selectedAgentId);
      if (scenario) {
        setCurrentScenario(scenario);
        setViewState('scenario_ready');
      } else {
        setError(UI_TEXT.errorGeneratingScenario);
        setViewState('error');
      }
    } else { // Manual scenario
        if(!selectedManualScenarioId) {
            setError(UI_TEXT.errorMissingSetupSelection);
            return;
        }
        setViewState('generating_scenario');
        const scenario = await ApiService.getManualScenarioById(selectedManualScenarioId);
         if (scenario) {
            setCurrentScenario(scenario);
            setViewState('scenario_ready');
        } else {
            setError(UI_TEXT.errorGeneratingScenario);
            setViewState('error');
        }
    }
  };

  const handleStartInvestigation = async () => {
    if (!currentScenario) {
      setError(UI_TEXT.noScenario);
      return;
    }

    const newSession: InvestigationSession = {
      id: `session-${Date.now()}`,
      traineeId: traineeId,
      scenario: currentScenario,
      chatTranscript: [],
      startTime: Date.now(),
      status: 'active',
      usedHintsCount: 0,
      initialSelections: {
          customAgentId: currentScenario.customAgentId,
          agentType: currentScenario.agentType,
          difficulty: currentScenario.userSelectedDifficulty as DifficultyLevel,
          interrogateeRole: currentScenario.interrogateeRole as InterrogateeRole,
          topic: currentScenario.userSelectedTopic,
      },
      investigationLog: ""
    };

    const chat = await ApiService.startChat(currentScenario);
    if (chat) {
      setGeminiChatInstance(chat);
      setCurrentSession(newSession);
      setViewState('investigation_active');
    } else {
      setError(UI_TEXT.errorStartingChat);
      setViewState('error');
    }
  };
  
  const speakAIResponse = (text: string, onEndCallback: () => void = () => {}) => {
    if (!isAISpeechOutputEnabled || isRegularTtsMuted || !speechSynthesisAPI || text.trim() === '') {
        onEndCallback();
        return;
    }
    speechSynthesisAPI.cancel(); // Cancel any previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    const hebrewVoice = speechSynthesisVoices.find(v => v.lang === 'he-IL');
    if (hebrewVoice) {
      utterance.voice = hebrewVoice;
    }
    utterance.onstart = () => setIsAiTyping(true); // Visually "typing" while speaking
    utterance.onend = () => {
        setIsAiTyping(false);
        onEndCallback();
    };
    utterance.onerror = (e) => {
        console.error("Speech synthesis error", e);
        setIsAiTyping(false);
        onEndCallback();
    };
    speechSynthesisAPI.speak(utterance);
  };
  
  const handleSendMessage = async () => {
    if (!userInput.trim() || !geminiChatInstance || !currentSession || isAiTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userInput,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsAiTyping(true);
    
    const { text, directives, toolCalledInfo } = await ApiService.sendMessage(geminiChatInstance, userMessage.text, currentSession.scenario, trainerInterventionForNextTurn);
    setIsAiTyping(false);
    
    if (trainerInterventionForNextTurn) {
        setTrainerInterventionForNextTurn(null);
    }
    
    if (toolCalledInfo) {
      const toolMessage: ChatMessage = {
        id: `sys-${Date.now()}-tool`, sender: 'system', subType: 'tool_communication',
        text: `הכלי '${toolCalledInfo.name}' הופעל.\nתוצאה: ${JSON.stringify(toolCalledInfo.output, null, 2)}`,
        timestamp: Date.now()
      };
       setChatMessages(prev => [...prev, toolMessage]);
    }

    if (text) {
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: text,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiMessage]);
      setCurrentAvatarDirectives(directives || null);
      if (!isLiveAudioModeActive) {
          speakAIResponse(text);
      }
    } else {
      setError(UI_TEXT.errorSendingMessage);
    }
  };

  const handleEndInvestigation = async (confirmed: boolean = false) => {
    if (!confirmed) {
      setShowEndConfirmModal(true);
      return;
    }

    setShowEndConfirmModal(false);
    if (!currentSession) return;
    
    if (currentSession.scenario.agentType === 'interrogation') {
        setViewState('generating_feedback');
        const feedback = await ApiService.generateFeedback(
            chatMessages,
            currentSession.scenario.interrogateeRole as InterrogateeRole,
            currentSession.scenario.userSelectedDifficulty as DifficultyLevel,
            currentSession.scenario.userSelectedTopic,
            usedHintsCount
        );

        const finalSession: InvestigationSession = {
            ...currentSession,
            chatTranscript: chatMessages,
            endTime: Date.now(),
            status: 'completed',
            feedback: feedback || undefined
        };
        await onSessionComplete(finalSession);
        setCurrentSession(finalSession);
        setViewState('feedback_ready');
    } else {
        const finalSession: InvestigationSession = {
            ...currentSession, chatTranscript: chatMessages, endTime: Date.now(), status: 'completed'
        };
        await onSessionComplete(finalSession);
        setCurrentSession(finalSession);
        setViewState('feedback_ready');
    }

    if (isLiveAudioModeActive) {
        liveAudioElementRef.current?.stopMicrophoneAndSessionAudio();
        setIsLiveAudioModeActive(false);
    }
  };

  const handleRequestHint = async () => {
    if(!currentSession) return;
    setViewState('generating_hint');
    setIsAiTyping(true);

    const history: SimpleChatMessage[] = chatMessages
      .filter(m => m.sender !== 'system')
      .map(m => ({ speaker: m.sender as 'user' | 'ai', text: m.text }));

    const hint = await ApiService.generateContextualHint(history, currentSession.scenario);
    
    const hintMessage: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'system',
        text: hint || UI_TEXT.errorGeneratingHint,
        subType: 'hint_response',
        timestamp: Date.now(),
    };
    setChatMessages(prev => [...prev, hintMessage]);
    setUsedHintsCount(prev => prev + 1);
    
    setViewState('investigation_active');
    setIsAiTyping(false);
  };
  
  const setupSpeechRecognition = () => {
    if (!SpeechRecognitionAPI) {
      setIsSpeechApiSupported(false);
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'he-IL';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setUserInput(prev => prev.trim() ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim());
      }
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicrophonePermissionError(UI_TEXT.featureMicrophonePermissionDenied);
      }
      setIsListening(false);
    };
    recognition.onend = () => {
      if (isListening) { // If it stops unexpectedly, try to restart it
          try {
             recognition.start();
          } catch(e) {
            console.error("Could not restart recognition", e);
            setIsListening(false);
          }
      }
    };
    setSpeechRecognitionInstance(recognition);
  };

  useEffect(setupSpeechRecognition, []);
  
  const toggleVoiceInput = () => {
    if (!speechRecognitionInstance) return;
    if (isListening) {
      speechRecognitionInstance.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognitionInstance.start();
        setIsListening(true);
        setMicrophonePermissionError(null);
      } catch (e) {
        console.error('Could not start speech recognition:', e);
        if((e as DOMException).name === 'NotAllowedError') {
             setMicrophonePermissionError(UI_TEXT.featureMicrophonePermissionDenied);
        }
      }
    }
  };

  useEffect(() => {
    const handleLiveAudioStatus = (e: Event) => {
        const { status, code, error } = (e as CustomEvent).detail;
        setLiveAudioVisualState(code);
        if (code === LiveAudioState.ERROR) {
            setLiveAudioError(`${status}: ${error}`);
        } else {
            setLiveAudioError(null);
        }
    };
    const handleAISpeech = (e: Event) => {
        const { text, directives } = (e as CustomEvent).detail;
        if (text) {
            const aiMessage: ChatMessage = { id: `ai-${Date.now()}`, sender: 'ai', text, timestamp: Date.now() };
            setChatMessages(prev => [...prev, aiMessage]);
        }
        setCurrentAvatarDirectives(directives || null);
    };

    const el = liveAudioElementRef.current;
    el?.addEventListener('live-audio-status', handleLiveAudioStatus);
    el?.addEventListener('ai-speech', handleAISpeech);

    return () => {
      el?.removeEventListener('live-audio-status', handleLiveAudioStatus);
      el?.removeEventListener('ai-speech', handleAISpeech);
    };
  }, [liveAudioElementRef.current]);

  const handleToggleLiveAudio = async (wantsAudio: boolean) => {
      setUserWantsLiveAudio(wantsAudio);
      if (wantsAudio && currentSession && liveAudioElementRef.current) {
          try {
            await liveAudioElementRef.current.activateMicrophoneAndStartSession();
            setIsLiveAudioModeActive(true);
            setInputAudioNodeForVisualizer(liveAudioElementRef.current.inputNodeForVisualizer);
            setOutputAudioNodeForVisualizer(liveAudioElementRef.current.outputNodeForVisualizer);
          } catch(e) {
            console.error("Failed to activate live audio session", e);
            setIsLiveAudioModeActive(false);
            setUserWantsLiveAudio(false);
          }
      } else if (!wantsAudio && isLiveAudioModeActive && liveAudioElementRef.current) {
          liveAudioElementRef.current.stopMicrophoneAndSessionAudio();
          setIsLiveAudioModeActive(false);
      }
  };
  
  const renderSetupWizard = () => (
    <div className="max-w-2xl mx-auto mt-4">
        <div className="themed-card rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold mb-4 themed-card-header pb-2">
                {
                    viewState === 'initial_setup_type_selection' ? 'שלב 1: בחר סוג תרחיש' :
                    viewState === 'initial_setup_manual_scenario_selection' ? 'שלב 2: בחר תרחיש ידני' :
                    viewState === 'initial_setup_agent_selection' ? 'שלב 2: בחר סוכן AI' :
                    viewState === 'initial_setup_interrogatee_role' ? UI_TEXT.setupStepInterrogateeRole :
                    viewState === 'initial_setup_difficulty' ? UI_TEXT.setupStepDifficulty :
                    viewState === 'initial_setup_topic' ? UI_TEXT.setupStepTopic :
                    UI_TEXT.setupStepReview
                }
            </h2>
            <div className="space-y-6">
                {viewState === 'initial_setup_type_selection' && (
                  <Select label="בחר את סוג התרחיש:" value={selectedScenarioType} onChange={e => setSelectedScenarioType(e.target.value as ScenarioType)} options={[{label: 'תרחיש מבוסס AI', value: 'ai_generated'}, {label: 'תרחיש ידני', value: 'manual'}]} />
                )}
                {viewState === 'initial_setup_manual_scenario_selection' && (
                    <Select label="בחר תרחיש ידני:" value={selectedManualScenarioId} onChange={e => setSelectedManualScenarioId(e.target.value)} options={availableManualScenarios.map(s => ({label: s.caseType, value: s.id}))} defaultEmptyOption="בחר מהרשימה..."/>
                )}
                {viewState === 'initial_setup_agent_selection' && (
                    <Select label={UI_TEXT.selectAIAgent} value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)} options={availableAgents.map(a => ({value: a.id, label: a.name}))} />
                )}
                {viewState === 'initial_setup_interrogatee_role' && (
                    <Select label={UI_TEXT.selectInterrogateeRole} value={selectedRole} onChange={e => setSelectedRole(e.target.value as InterrogateeRole)} options={Object.values(InterrogateeRole).map(r => ({value: r, label: r}))} />
                )}
                {viewState === 'initial_setup_difficulty' && (
                    <Select label={UI_TEXT.selectDifficulty} value={selectedDifficulty} onChange={e => setSelectedDifficulty(e.target.value as DifficultyLevel)} options={Object.values(DifficultyLevel).map(d => ({value: d, label: d}))} />
                )}
                {viewState === 'initial_setup_topic' && (
                    <>
                        <Select label={UI_TEXT.selectTopic} value={selectedTopic} onChange={e => {setSelectedTopic(e.target.value); setCustomTopic('');}} options={PREDEFINED_INVESTIGATION_TOPICS.map(t => ({value: t, label: t}))} defaultEmptyOption="בחר מהרשימה או הזן למטה..." />
                        <Input label={UI_TEXT.customTopicLabel} value={customTopic} onChange={e => {setCustomTopic(e.target.value); setSelectedTopic('');}} placeholder={UI_TEXT.topicPlaceholder}/>
                    </>
                )}
                {viewState === 'initial_setup_review' && (
                    <div className="space-y-2 text-sm">
                        <h3 className="font-semibold themed-text-primary">סיכום בחירות:</h3>
                        {selectedScenarioType === 'manual' ? (
                            <p>{UI_TEXT.manualScenariosTitle}: <span className="font-bold">{availableManualScenarios.find(s=>s.id === selectedManualScenarioId)?.caseType}</span></p>
                        ) : (
                            <>
                                <p>{UI_TEXT.reviewSelectedAgentLabel} <span className="font-bold">{availableAgents.find(a => a.id === selectedAgentId)?.name}</span></p>
                                <p>{UI_TEXT.reviewSelectedRoleLabel} <span className="font-bold">{selectedRole}</span></p>
                                <p>{UI_TEXT.reviewSelectedDifficultyLabel} <span className="font-bold">{selectedDifficulty}</span></p>
                                <p>{UI_TEXT.reviewSelectedTopicLabel} <span className="font-bold">{customTopic || selectedTopic}</span></p>
                            </>
                        )}
                    </div>
                )}
            </div>
             <div className="mt-8 flex justify-between items-center">
                {viewState !== 'initial_setup_type_selection' && <Button onClick={handleBackStep} variant="secondary">{UI_TEXT.backButton}</Button>}
                <div/>
                {viewState === 'initial_setup_review' ? (
                    <Button onClick={handleGenerateScenario}>{UI_TEXT.generateScenarioButton}</Button>
                ) : (
                    <Button onClick={handleNextStep}>{UI_TEXT.nextButton}</Button>
                )}
            </div>
        </div>
    </div>
  );
  
  const renderScenarioDetailsCard = (isModal: boolean = false) => {
    if (!currentScenario) return null;
    const { interrogateeProfile, fullCaseDescription, evidence, investigationGoals } = currentScenario as Scenario & { interrogateeProfile: SuspectProfile };

    return (
        <div className="space-y-4 text-sm themed-text-content">
            <h3 className="text-lg font-bold themed-text-primary">{currentScenario.caseType}</h3>
            <div>
                <h4 className="scenario-section-title">{UI_TEXT.caseDetails}</h4>
                <p>{fullCaseDescription}</p>
            </div>
            <div>
                <h4 className="scenario-section-title">{UI_TEXT.interrogateeProfileTitle}</h4>
                <p><strong>{UI_TEXT.profileNameLabel}:</strong> {interrogateeProfile.name}</p>
                <p><strong>{UI_TEXT.profileAgeLabel}:</strong> {interrogateeProfile.age}</p>
                <p><strong>{UI_TEXT.profileOccupationLabel}:</strong> {interrogateeProfile.occupation}</p>
            </div>
            {evidence?.items?.length > 0 && evidence.items[0] !== 'N/A' && (
              <div>
                <h4 className="scenario-section-title">{UI_TEXT.evidenceInHandTitle}</h4>
                <ul className="list-disc list-inside space-y-1 pr-4 rtl:pr-0 rtl:pl-4">
                  {evidence.items.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
            )}
            {investigationGoals && investigationGoals.length > 0 && (
                <div>
                    <h4 className="scenario-section-title">{UI_TEXT.investigationGoalsTitle}</h4>
                    <ul className="list-decimal list-inside space-y-1 pr-4 rtl:pr-0 rtl:pl-4">
                      {investigationGoals.map((goal, index) => <li key={index}>{goal}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
  };
  
  const renderInvestigationActiveView = () => (
      <div className={`flex-grow grid ${isFocusMode ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4 overflow-hidden h-full`}>
          {/* Side Panel */}
          <div className={`md:col-span-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 flex flex-col overflow-y-auto h-full ${isFocusMode ? 'hidden' : ''}`}>
              <div className="flex-shrink-0 border-b border-neutral-200 dark:border-neutral-700 mb-2">
                  <nav className="flex space-x-2 rtl:space-x-reverse">
                      <button onClick={() => setActiveSidePanelTab('scenario')} className={`py-2 px-4 text-sm font-medium rounded-t-md ${activeSidePanelTab === 'scenario' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500' : 'text-neutral-600 dark:text-neutral-300'}`}>פרטי תרחיש</button>
                      <button onClick={() => setActiveSidePanelTab('log')} className={`py-2 px-4 text-sm font-medium rounded-t-md ${activeSidePanelTab === 'log' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500' : 'text-neutral-600 dark:text-neutral-300'}`}>יומן חקירה</button>
                  </nav>
              </div>
              <div className="flex-grow overflow-y-auto pr-1">
                  {activeSidePanelTab === 'scenario' ? (
                      renderScenarioDetailsCard()
                  ) : (
                      <div className="flex flex-col h-full">
                          <h3 className="text-md font-semibold text-primary-600 dark:text-primary-400 mb-2">{UI_TEXT.investigationLogTitle}</h3>
                           <div className="flex-shrink-0 relative mb-2">
                               <Input value={investigationLogSearchTerm} onChange={e => setInvestigationLogSearchTerm(e.target.value)} placeholder={UI_TEXT.investigationLogSearchPlaceholder} className="pl-8" />
                               <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"><SearchIcon /></span>
                               {investigationLogSearchTerm && <span className="text-xs absolute -bottom-4 left-0 text-neutral-500 dark:text-neutral-400">{UI_TEXT.investigationLogSearchResults(investigationLogSearchOccurrences)}</span>}
                           </div>
                           <Textarea value={investigationLog} onChange={e => setInvestigationLog(e.target.value)} className="flex-grow w-full text-sm" rows={10} />
                           <div className="flex-shrink-0 mt-2 flex justify-end">
                              <Button variant="ghost" size="sm" onClick={() => setIsClearLogConfirmModalOpen(true)} icon={<ClearLogIcon/>}>נקה יומן</Button>
                           </div>
                      </div>
                  )}
              </div>
          </div>
          {/* Main Chat Panel */}
          <div className={`${isFocusMode ? 'col-span-1' : 'md:col-span-2'} rounded-lg flex flex-col overflow-hidden h-full relative`}>
              <div className="absolute inset-0 z-0">
                  <gdm-live-audio-visuals-3d
                      ref={visuals3dRef}
                      inputNode={inputAudioNodeForVisualizer}
                      outputNode={outputAudioNodeForVisualizer}
                      currentAvatarExpression={currentAvatarDirectives?.avatarExpression}
                      currentAvatarGesture={currentAvatarDirectives?.avatarGesture}
                      is-ai-responding={isAiTyping || isLiveAudioModeActive && liveAudioVisualState === LiveAudioState.PLAYING_AI_AUDIO}
                  ></gdm-live-audio-visuals-3d>
                  <gdm-live-audio ref={liveAudioElementRef} initial-system-prompt={currentSession?.scenario.fullSystemPromptForChat}></gdm-live-audio>
              </div>
              <div className="flex-grow overflow-y-auto p-4 flex flex-col justify-end bg-black/10 backdrop-blur-sm relative">
                <div className="overflow-y-auto">
                  {chatMessages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                  {isAiTyping && <ChatBubble key="typing" message={{id: 'typing', sender: 'ai', text: '...', timestamp: Date.now()}}/>}
                  <div ref={chatEndRef} />
                </div>
              </div>
              <div className="flex-shrink-0 p-4 bg-black/20">
                {isLiveAudioModeActive ? (
                  <div className="text-center p-2 rounded-lg bg-neutral-800 text-white">מצב שיחה קולית פעיל... ({liveAudioVisualState})</div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-start space-x-2 rtl:space-x-reverse">
                      <Textarea value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => {if(e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); handleSendMessage();}}} placeholder={UI_TEXT.typeYourMessage} className="flex-grow" rows={2} disabled={isAiTyping}/>
                      <Button type="submit" size="lg" disabled={isAiTyping || !userInput.trim()} title={UI_TEXT.sendMessage}><SendIcon/></Button>
                      <Button type="button" size="lg" variant={isListening ? 'danger' : 'secondary'} onClick={toggleVoiceInput} title={isListening? "הפסק זיהוי קולי" : "הפעל זיהוי קולי"}>{isListening ? <MicListeningIcon /> : <MicIcon />}</Button>
                  </form>
                )}
                 {microphonePermissionError && <p className="text-red-400 text-xs mt-1">{microphonePermissionError}</p>}
              </div>
              <div className="absolute top-4 right-4 flex space-x-2 rtl:space-x-reverse">
                  <Button onClick={() => handleEndInvestigation(false)} variant="danger">{UI_TEXT.endInvestigationCall}</Button>
                  <Button onClick={handleRequestHint} variant="secondary" icon={<HintIcon />} isLoading={viewState === 'generating_hint'}>{UI_TEXT.requestHintButton}</Button>
                  <Button onClick={() => setIsFocusMode(!isFocusMode)} variant="secondary" title={isFocusMode ? 'צא ממצב פוקוס' : 'עבור למצב פוקוס'}>
                      {isFocusMode ? 'צא ממצב פוקוס' : 'מצב פוקוס'}
                  </Button>
              </div>
          </div>
      </div>
  );

  const renderFeedbackView = () => {
      const feedback = currentSession?.feedback;
      const agentType = currentSession?.scenario.agentType;
      
      if (!currentSession) return <div>{UI_TEXT.errorGeneratingFeedback}</div>;

      if(agentType !== 'interrogation' || !feedback) {
          return (
              <div className="text-center max-w-md mx-auto mt-10">
                  <div className="themed-card p-6 rounded-lg shadow-xl">
                      <h2 className="text-xl font-bold themed-text-primary">{UI_TEXT.sessionEndedNoFeedback}</h2>
                      <Button onClick={handleStartNewSession} className="mt-6 w-full">{UI_TEXT.backToDashboard}</Button>
                  </div>
              </div>
          );
      }

      return (
          <div className="max-w-4xl mx-auto p-4">
              <h2 className="text-2xl font-bold text-center mb-4 themed-text-primary">{UI_TEXT.investigationFeedback}</h2>
              <div className="themed-card rounded-lg shadow-xl p-6 space-y-6">
                  <div className="text-center border-b themed-border pb-4">
                      <p className="themed-text-secondary">{UI_TEXT.overallScore}</p>
                      <p className="text-5xl font-bold themed-text-primary">{feedback.overallScore}</p>
                      <p className="themed-text-content mt-2">{feedback.summary}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {feedback.parameters.map((param, index) => (
                          <div key={index}>
                              <div className="flex justify-between items-baseline">
                                  <h4 className="font-semibold themed-text-content">{param.name}</h4>
                                  <span className="font-bold text-lg themed-text-primary">{param.score}/10</span>
                              </div>
                              <p className="text-sm themed-text-secondary mt-1">{param.evaluation}</p>
                          </div>
                      ))}
                  </div>
                  {feedback.keyMoments && feedback.keyMoments.length > 0 && (
                      <div className="border-t themed-border pt-4">
                          <h3 className="text-lg font-semibold mb-2 themed-text-primary">{UI_TEXT.feedbackKeyMomentsTitle}</h3>
                          <div className="space-y-4">
                              {feedback.keyMoments.map((moment, index) => (
                                  <div key={index} className="p-3 rounded-md bg-primary-500/10 border border-primary-500/20">
                                      <blockquote className="italic border-r-4 themed-border pr-3 rtl:border-r-0 rtl:border-l-4 rtl:pr-0 rtl:pl-3">
                                          "{moment.momentQuote || moment.momentDescription}"
                                      </blockquote>
                                      <p className="text-sm themed-text-secondary mt-2">{moment.significance}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
                  <Button onClick={handleStartNewSession} className="mt-6 w-full">{UI_TEXT.backToDashboard}</Button>
              </div>
          </div>
      );
  };
  
  const renderContent = () => {
    switch(viewState) {
        case 'initial_setup_type_selection':
        case 'initial_setup_manual_scenario_selection':
        case 'initial_setup_agent_selection':
        case 'initial_setup_interrogatee_role':
        case 'initial_setup_difficulty':
        case 'initial_setup_topic':
        case 'initial_setup_review':
            return renderSetupWizard();
            
        case 'generating_scenario':
        case 'generating_feedback':
        case 'generating_hint':
            const messages: Record<string, string> = {
                generating_scenario: UI_TEXT.generatingScenario,
                generating_feedback: UI_TEXT.generatingFeedback,
                generating_hint: UI_TEXT.generatingHint
            };
            return <div className="mt-10"><LoadingSpinner message={messages[viewState]} tips={TIPS} /></div>;
            
        case 'scenario_ready':
            return (
                <div className="max-w-2xl mx-auto mt-4">
                    <div className="themed-card rounded-lg shadow-xl p-6">
                       <div className="max-h-[60vh] overflow-y-auto p-2 scenario-details-content">
                         {renderScenarioDetailsCard()}
                       </div>
                       <Button onClick={handleStartInvestigation} className="w-full mt-6">{currentScenario?.agentType === 'interrogation' ? UI_TEXT.startInvestigationCall : UI_TEXT.startSessionCall}</Button>
                    </div>
                </div>
            );
            
        case 'investigation_active':
            return renderInvestigationActiveView();
            
        case 'feedback_ready':
            return renderFeedbackView();
            
        case 'error':
            return (
                <div className="text-center mt-10">
                    <p className="text-red-500">{error || 'An unknown error occurred.'}</p>
                    <Button onClick={handleStartNewSession} className="mt-4">חזור</Button>
                </div>
            );
            
        default:
             return <Button onClick={handleStartNewSession}>{UI_TEXT.startNewSimulation}</Button>
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-4">
      {renderContent()}
      
      <Modal isOpen={showEndConfirmModal} onClose={() => setShowEndConfirmModal(false)} title={currentSession?.scenario.agentType === 'interrogation' ? UI_TEXT.confirmEndInvestigation : UI_TEXT.confirmEndSession}>
          <p>{currentSession?.scenario.agentType === 'interrogation' ? UI_TEXT.confirmEndInvestigation : UI_TEXT.confirmEndSession}</p>
          <div className="mt-6 flex justify-end space-x-2 rtl:space-x-reverse">
              <Button variant="secondary" onClick={() => setShowEndConfirmModal(false)}>{UI_TEXT.cancel}</Button>
              <Button variant="danger" onClick={() => handleEndInvestigation(true)}>{UI_TEXT.yes}</Button>
          </div>
      </Modal>

       <Modal isOpen={isClearLogConfirmModalOpen} onClose={() => setIsClearLogConfirmModalOpen(false)} title={UI_TEXT.confirmClearLogTitle}>
          <p>{UI_TEXT.confirmClearLogMessage}</p>
           <div className="mt-6 flex justify-end space-x-2 rtl:space-x-reverse">
              <Button variant="secondary" onClick={() => setIsClearLogConfirmModalOpen(false)}>{UI_TEXT.cancel}</Button>
              <Button variant="danger" onClick={() => { setInvestigationLog(''); setIsClearLogConfirmModalOpen(false); }}>{UI_TEXT.yes}</Button>
          </div>
      </Modal>

    </div>
  );
};

export default TraineeView;
