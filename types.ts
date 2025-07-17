

import { Chat, Content, Part } from "@google/genai";
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

export enum UserRole {
  TRAINEE = 'trainee',
  TRAINER = 'trainer',
  SYSTEM_ADMIN = 'system_admin', // New role for system administrator
  NONE = 'none',
}

export enum InterrogateeRole {
  SUSPECT = 'חשוד',
  WITNESS = 'עד',
  VICTIM = 'קורבן',
}

export enum DifficultyLevel {
  EASY = 'קל',
  MEDIUM = 'בינוני',
  HARD = 'קשה',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface MockTrainee extends User {
  password?: string;
  sessions: InvestigationSession[];
}

export interface SuspectProfile {
  name: string;
  age: number;
  occupation: string;
  address?: string;
  criminalRecord?: { title: string; details: string };
  intel?: { title: string; details: string };
  victimDetails?: string;
  witnessDetails?: string;
  underlyingMotivation?: string;
  behavioralDynamics?: { // New field for complex behaviors
    potentialShifts?: string; // Description of how behavior might change
    hiddenTruths?: string[]; // Key info the character is hiding
  };
}

// New type for AI Agent Type
export type AIAgentType = 'interrogation' | 'information_retrieval' | 'custom_task';
export const AIAgentTypeValues: AIAgentType[] = ['interrogation', 'information_retrieval', 'custom_task'];

// --- New Visual Scenario Builder Types ---
export type ScenarioNodeType = 'info' | 'lie' | 'event' | 'goal' | 'start';

export interface ScenarioNode {
  id: string;
  type: ScenarioNodeType;
  title: string;
  details: string;
  position: { x: number; y: number }; // Position on the canvas
}

export interface ScenarioEdge {
  id: string;   // Unique ID for the edge
  from: string; // from node id
  to: string;   // to node id
  label?: string; // Optional label for conditional logic description
}

export interface ScenarioFlow {
  nodes: ScenarioNode[];
  edges: ScenarioEdge[];
}


export interface Scenario {
  id: string;
  caseType: string; // For interrogation agents, this is AI-generated. For others, might be agent name or N/A.
  fullCaseDescription: string; // For interrogation agents, AI-generated. For others, might be agent desc or N/A.
  interrogateeRole: InterrogateeRole | 'N/A'; // N/A for non-interrogation agents
  interrogateeProfile: SuspectProfile | Partial<SuspectProfile>; // Allow partial for non-interrogation
  evidence: { title: string; items: string[] } | { title: string; items: ['N/A'] }; // N/A for non-interrogation
  fullSystemPromptForChat?: string;
  userSelectedDifficulty: DifficultyLevel | 'N/A'; // N/A for non-interrogation agents
  userSelectedTopic: string; // For interrogation, the topic. For others, might be agent purpose or N/A.
  location?: string;
  dateTime?: string;
  isAIManaged?: boolean;
  originalAIScenarioId?: string;
  customAgentId: string;
  agentType: AIAgentType; 
  investigationGoals?: string[]; // New: Goals for the investigation
  isManuallyCreated?: boolean; // Flag for manually created scenarios
  flow?: ScenarioFlow; // NEW: For the visual builder
}

export type ChatMessageSubType = 'intervention_notification' | 'hint_response' | 'tool_communication' | 'interruption_event';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: number;
  subType?: ChatMessageSubType;
}

export interface SimpleChatMessage {
  speaker: 'user' | 'ai';
  text: string;
}

export interface SessionContextV1 {
  sessionId: string;
  scenarioId: string;
  interrogateeRole: InterrogateeRole;
  difficultyLevel: DifficultyLevel;
  investigationTopic: string;
  chatHistory: SimpleChatMessage[];
}

export interface SessionContextV2 extends SessionContextV1 {
  interrogateeEmotionalStateHint?: string;
  currentInvestigationFocus?: string;
  trainerInterventionHint?: string; // MCP Next Step: For trainer commands
}

// New structure for avatar control directives
export interface AvatarControlPayload {
    avatarExpression?: string; // e.g., "neutral", "happy", "angry", "surprised"
    avatarGesture?: string;    // e.g., "shrug", "nod", "shake_head", "facepalm", "wave_dismiss"
}


export enum ToolName {
  CHECK_POLICE_DATABASE = 'CHECK_POLICE_DATABASE',
  GET_CURRENT_TIME_AND_DATE = 'GET_CURRENT_TIME_AND_DATE',
  GENERAL_KNOWLEDGE_CHECK = 'GENERAL_KNOWLEDGE_CHECK',
  SEARCH_INTERNAL_ARCHIVES = 'SEARCH_INTERNAL_ARCHIVES', // New Tool
  REQUEST_FORENSIC_ANALYSIS = 'REQUEST_FORENSIC_ANALYSIS', // New Tool
}

export interface CheckPoliceDatabaseToolInput {
  query: string;
  queryType: 'vehicle_plate' | 'person_name' | 'phone_number';
}

export interface CheckPoliceDatabaseToolOutput {
  found: boolean;
  details: string;
}

export interface GetCurrentTimeAndDateToolInput {
  // No specific input needed, AI just calls the tool
}

export interface GetCurrentTimeAndDateToolOutput {
  formattedDateTime: string; // e.g., "יום שלישי, 23 ביולי 2024, 14:30"
}

export interface GeneralKnowledgeCheckToolInput {
    question: string;
}

export interface GeneralKnowledgeCheckToolOutput {
    answer: string;
    source: string; // e.g., "simulated_knowledge_base"
}

export interface SearchInternalArchivesToolInput {
  keywords: string; // Keywords to search for in internal archives
  archiveType: 'past_cases' | 'internal_memos' | 'department_protocols';
}

export interface SearchInternalArchivesToolOutput {
  resultsFound: boolean;
  summary?: string; // Summary of findings
  documentExcerpts?: Array<{title: string; excerpt: string; relevanceScore?: number}>;
}

export interface RequestForensicAnalysisToolInput {
  evidenceItemId: string; // ID or description of the evidence item
  analysisType: 'fingerprints' | 'dna' | 'ballistics' | 'digital_media';
}

export interface RequestForensicAnalysisToolOutput {
  reportId: string;
  preliminaryFindings: string; // e.g., "Partial fingerprint match found for known associate.", "No DNA match in current database."
  estimatedCompletionTime: string; // e.g., "24-48 hours", "5 business days"
}


export interface MockPoliceRecord {
  id: string;
  type: 'vehicle' | 'person' | 'archive_document' | 'forensic_report';
  identifier: string; // For vehicle, person, phone
  title?: string; // For archive_document, forensic_report
  keywords?: string[]; // For archive_document
  details: string;
  linkedRecords?: string[];
  tags?: string[];
}


export interface ToolCallRequest {
  toolName: ToolName;
  toolInput: CheckPoliceDatabaseToolInput | GetCurrentTimeAndDateToolInput | GeneralKnowledgeCheckToolInput | SearchInternalArchivesToolInput | RequestForensicAnalysisToolInput;
}

export interface ToolCallResult {
  toolName: ToolName;
  toolOutput: CheckPoliceDatabaseToolOutput | GetCurrentTimeAndDateToolOutput | GeneralKnowledgeCheckToolOutput | SearchInternalArchivesToolOutput | RequestForensicAnalysisToolOutput;
  error?: string;
}

export interface AIResponseWithDirectives {
    textResponse: string;
    directives?: AvatarControlPayload; 
    toolCallRequest?: ToolCallRequest;
}

export enum InterruptionType {
    PHONE_CALL = 'phone_call',
    KNOCK_ON_DOOR = 'knock_on_door',
    POWER_OUTAGE_SHORT = 'power_outage_short',
    ALARM_NEARBY = 'alarm_nearby',
    SUSPECT_NEEDS_BREAK = 'suspect_needs_break',
    CUSTOM = 'custom',
}
export const InterruptionTypeDisplay: Record<InterruptionType, string> = {
    [InterruptionType.PHONE_CALL]: "שיחת טלפון נכנסת",
    [InterruptionType.KNOCK_ON_DOOR]: "דפיקה בדלת",
    [InterruptionType.POWER_OUTAGE_SHORT]: "הפסקת חשמל קצרה",
    [InterruptionType.ALARM_NEARBY]: "אזעקה נשמעת בקרבת מקום",
    [InterruptionType.SUSPECT_NEEDS_BREAK]: "הנחקר מבקש הפסקה",
    [InterruptionType.CUSTOM]: "הפרעה מותאמת אישית",
};


// MCP Next Step: Define UserCommand types for trainer intervention
export enum UserCommandType {
    FORCE_EMOTIONAL_STATE = 'FORCE_EMOTIONAL_STATE',
    REVEAL_SPECIFIC_INFO_HINT = 'REVEAL_SPECIFIC_INFO_HINT', // AI should hint or lead to this info
    INCREASE_RESISTANCE = 'INCREASE_RESISTANCE',
    DECREASE_RESISTANCE = 'DECREASE_RESISTANCE',
    SEND_WHISPER = 'SEND_WHISPER', // New command type for generic trainer whisper
    TRIGGER_INTERRUPTION = 'TRIGGER_INTERRUPTION', // New command for triggering interruptions
}

export interface UserCommandPayloadBase {
    targetSessionId?: string; // To specify which session this is for (future use with live sessions)
}

export interface ForceEmotionalStatePayload extends UserCommandPayloadBase {
    emotionalState: string; // e.g., "לחוץ", "משתף פעולה", "עוין"
}

export interface RevealSpecificInfoHintPayload extends UserCommandPayloadBase {
    infoToRevealHint: string; // Text hint for the AI, e.g., "רמוז על מיקום המפתח הנסתר"
}

export interface SendWhisperPayload extends UserCommandPayloadBase {
    whisperText: string; // Generic text for the AI
}

export interface ChangeResistancePayload extends UserCommandPayloadBase {
    // No specific payload beyond base for simple increase/decrease
}

export interface TriggerInterruptionPayload extends UserCommandPayloadBase {
    interruptionType: InterruptionType;
    details: string; // e.g., "הנחקר מקבל שיחת טלפון מאשתו, נראה לחוץ." or "דפיקה חזקה בדלת."
}


export interface UserCommand {
    commandType: UserCommandType;
    payload: ForceEmotionalStatePayload | RevealSpecificInfoHintPayload | ChangeResistancePayload | SendWhisperPayload | TriggerInterruptionPayload;
}


export interface FeedbackParameter {
  name: string;
  evaluation: string;
  score: number; // Score from 1-10, can be 0 if not applicable or not scored
}

export interface KeyMoment {
  momentDescription: string; // Description of the key moment from the transcript
  momentQuote?: string; // New: A direct quote from the transcript to help locate the moment
  significance: string; // AI's explanation of why this moment was key (positive or negative)
}

export interface Feedback {
  parameters: FeedbackParameter[];
  overallScore: number;
  summary: string;
  keyMoments?: KeyMoment[]; // New: Optional array for key moments
}

export interface GeminiJsonSuspectProfile {
    name: string;
    age: number;
    occupation: string;
    address?: string;
    criminalRecord?: { title: string; details: string };
    intel?: { title: string; details: string };
    victimDetails?: string;
    witnessDetails?: string;
    underlyingMotivation?: string;
    behavioralDynamics?: { // New field for complex behaviors
        potentialShifts?: string; 
        hiddenTruths?: string[]; 
    };
}

export interface GeminiJsonScenario {
    caseType: string;
    fullCaseDescription: string;
    interrogateeProfile: GeminiJsonSuspectProfile;
    evidence: { title: string; items: string[] };
    investigationGoals?: string[]; // New: Goals for the investigation
    // Personality traits for the AI to adopt, if provided by the selected agent
    personalityTraits?: string[]; 
}

export const PREDEFINED_INVESTIGATION_TOPICS: string[] = [
  "עבירות סמים (סחר, שימוש, החזקה)",
  "אלימות במשפחה",
  "עבירות רכוש (גניבה, פריצה, שוד)",
  "הונאה ועבירות מרמה",
  "עבירות תנועה חמורות (תאונות פגע וברח, נהיגה בשכרות)",
  "אלימות ברשת ובריונות",
  "עבירות מין (הטרדה, תקיפה)",
  "הימורים לא חוקיים",
  "עבירות נשק (החזקה, סחר)",
  "עבירות סייבר (פריצה למחשבים, הפצת וירוסים)",
  "אירועי סדר ציבורי (קטטות, התפרעויות)",
  "שוחד ושחיתות",
];

export interface InitialSelections {
    customAgentId?: string; // Made optional as it might not always be applicable upfront
    agentType: AIAgentType;
    interrogateeRole?: InterrogateeRole; // Optional for non-interrogation agents
    difficulty?: DifficultyLevel; // Optional
    topic?: string; // Optional
}

export interface TrainerCommandLogEntry {
  command: UserCommand;
  timestamp: number;
}

export interface InvestigationSession {
  id: string;
  traineeId: string;
  scenario: Scenario;
  chatTranscript: ChatMessage[];
  startTime: number;
  endTime?: number;
  status: 'scenario_ready' | 'active' | 'completed' | 'error';
  feedback?: Feedback;
  initialSelections: InitialSelections;
  usedHintsCount: number;
  lastTrainerCommand?: UserCommand | null;
  investigationLog?: string; // New for trainee notes
  trainerCommandLog?: TrainerCommandLogEntry[]; // New for trainer command history
}

export enum FeatureIdent {
  VOICE_INPUT = 'voice_input',
  LIVESTREAM_AUDIO = 'livestream_audio',
  AVATAR_INTERACTION = 'avatar_interaction',
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
  readonly interpretation?: any;
  readonly emma?: any;
}

export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

export interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
  prototype: SpeechRecognition;
}
export interface SpeechRecognition extends EventTarget {
  grammars: any;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI?: string;

  start(): void;
  stop(): void;
  abort(): void;

  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

export interface SpeechSynthesisVoice {
  readonly default: boolean;
  readonly lang: string;
  readonly localService: boolean;
  readonly name: string;
  readonly voiceURI: string;
}

export interface SpeechRecognitionEventInit extends EventInit {
  resultIndex?: number;
  results?: SpeechRecognitionResultList;
  interpretation?: any;
  emma?: any;
}

export type GeminiPart = Part;

// Window augmentations to define custom element properties for JSX.
// This is done without importing the component classes to break the circular dependency.
declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionStatic;
        webkitSpeechRecognition: SpeechRecognitionStatic;
        SpeechRecognitionEvent: {
          new(type: string, eventInitDict: SpeechRecognitionEventInit): SpeechRecognitionEvent;
          prototype: SpeechRecognitionEvent;
        };
        SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance;
        readonly speechSynthesis: SpeechSynthesis;
        webkitAudioContext?: typeof AudioContext;
    }
    namespace JSX {
        interface IntrinsicElements {
          'gdm-live-audio': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
              'initial-system-prompt'?: string;
          };
          'gdm-live-audio-visuals-3d': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
              inputNode?: AudioNode | null;
              outputNode?: AudioNode | null;
              currentAvatarExpression?: string;
              currentAvatarGesture?: string;
              'is-ai-responding'?: boolean;
          };
        }
    }
}

export type GeminiChat = Chat;


// New interface for AI Agent Management
export interface AIAgent {
  id: string;
  name: string;
  description: string;
  baseSystemPrompt: string;
  isDefault?: boolean;
  isEditable?: boolean; // To control if the prompt can be edited by trainer
  personalityTraits?: string[]; // New: Array of personality traits for the agent
  agentType?: AIAgentType; // New: Type of agent to determine setup flow
  conversationStarters?: string[]; // Added
  recommendedModel?: string;      // Added
  capabilities?: {                // Added
    webSearch?: boolean;
    imageGeneration?: boolean;
    toolUsage?: boolean;
  };
  knowledgeBaseIds?: string[]; // New: For RAG
  avatarUrl?: string; // New: URL to the VRM file
}

// Type for agents returned by loadAiAgents, ensuring isDefault and isEditable are always present.
export type LoadedAIAgent = Omit<AIAgent, 'isDefault' | 'isEditable' | 'personalityTraits' | 'agentType' | 'conversationStarters' | 'recommendedModel' | 'capabilities' | 'knowledgeBaseIds'> & {
    isDefault: boolean;
    isEditable: boolean;
    personalityTraits: string[]; 
    agentType: AIAgentType; 
    conversationStarters: string[]; // Ensure it's always an array
    recommendedModel?: string;
    capabilities: { // Ensure it's always an object, even if with default falsy values
        webSearch: boolean;
        imageGeneration: boolean;
        toolUsage: boolean;
    };
    knowledgeBaseIds: string[]; // Ensure it's always an array
};

export type Theme = 'light' | 'dark';

// New: For RAG feature
export interface KnowledgeDocument {
  id: string;
  name: string;
  content: string;
  uploadedAt: number;
}