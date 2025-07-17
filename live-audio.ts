/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { createAudioBlobForLiveAPI, decodePCMToAudioBuffer, decode as decodeBase64 } from '@/live-audio-utils';

const LIVE_API_MODEL_NAME = 'gemini-2.5-flash-preview-native-audio-dialog';
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000; // Gemini typically outputs at 24kHz for this model
const AUDIO_CHANNELS = 1;
const SCRIPT_PROCESSOR_BUFFER_SIZE = 256; // Matching example's buffer size
const API_KEY_MISSING_ERROR_TEXT = "מפתח API של Gemini חסר. הפונקציונליות תהיה מוגבלת.";

export enum LiveAudioState {
    IDLE = 'idle',
    REQUESTING_MIC = 'requesting_mic',
    MIC_ACCESS_GRANTED = 'mic_access_granted',
    CONNECTING_AI = 'connecting_ai',
    AI_SESSION_OPEN = 'ai_session_open',
    STREAMING_USER_AUDIO = 'streaming_user_audio',
    PLAYING_AI_AUDIO = 'playing_ai_audio',
    PROCESSING_AI_MESSAGE = 'processing_ai_message',
    ERROR = 'error',
    CLOSING_SESSION = 'closing_session',
    // Added missing states
    MIC_ACCESS_DENIED = 'mic_access_denied',
    AI_SESSION_CONNECT_FAILED = 'ai_session_connect_failed',
    API_SESSION_ERROR_CALLBACK = 'api_session_error_callback',
    API_KEY_MISSING = 'api_key_missing',
    AI_SDK_INIT_FAILED = 'ai_sdk_init_failed',
    AUDIOCONTEXT_FAILURE = 'audiocontext_failure',
    AUDIO_SEND_ERROR = 'audio_send_error',
    AI_AUDIO_PLAY_ERROR = 'ai_audio_play_error',
    NO_SYSTEM_PROMPT = 'no_system_prompt',
}

export class GdmLiveAudio extends HTMLElement {
    private client: GoogleGenAI | null = null; 
    private liveSession: Session | null = null; 
    
    private inputAudioContext: AudioContext | null = null;
    private outputAudioContext: AudioContext | null = null;
    
    private mediaStream: MediaStream | null = null;
    private mediaStreamSourceNode: MediaStreamAudioSourceNode | null = null;
    private scriptProcessorNode: ScriptProcessorNode | null = null;
    
    private nextAiAudioStartTime = 0;
    private activeAiAudioSources = new Set<AudioBufferSourceNode>();

    public inputNodeForVisualizer: GainNode | null = null;
    public outputNodeForVisualizer: GainNode | null = null;

    private _initialSystemPrompt: string | undefined;
    private _state: LiveAudioState = LiveAudioState.IDLE;
    private isRecordingUserAudio = false;

    static get observedAttributes() {
        return ['initial-system-prompt'];
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string |null) {
        if (name === 'initial-system-prompt' && newValue !== oldValue) {
            this.initialSystemPrompt = newValue || undefined;
        }
    }

    public get initialSystemPrompt(): string | undefined { return this._initialSystemPrompt; }
    public set initialSystemPrompt(value: string | undefined) {
        if (this._initialSystemPrompt === value) return;
        this._initialSystemPrompt = value;
        console.log('[GdmLiveAudio] Initial system prompt set/updated.');
    }
    
    constructor() {
        super();
        console.log('[GdmLiveAudio] Constructor called (using example API pattern).');
        this.initializeGeminiClient();
    }

    private initializeGeminiClient() {
        const apiKey = process.env.API_KEY;
        if (apiKey) {
            try {
                this.client = new GoogleGenAI({ apiKey: apiKey });
                this.setState(LiveAudioState.IDLE, "AI SDK initialized.");
            } catch (e) {
                console.error("[GdmLiveAudio] Error initializing GoogleGenAI:", e);
                this.client = null;
                this.setState(LiveAudioState.ERROR, `שגיאה באתחול AI SDK: ${(e as Error).message}`, LiveAudioState.AI_SDK_INIT_FAILED, (e as Error).message);
            }
        } else {
            console.error(API_KEY_MISSING_ERROR_TEXT + " (GdmLiveAudio)");
            this.setState(LiveAudioState.ERROR, API_KEY_MISSING_ERROR_TEXT, LiveAudioState.API_KEY_MISSING, API_KEY_MISSING_ERROR_TEXT);
        }
    }
    
    private setState(newState: LiveAudioState, statusText?: string, code?: LiveAudioState | string, error?: string) {
        const oldState = this._state;
        this._state = newState;
        const statusDetail = statusText || this.getDefaultStatusText(newState);
        
        this.dispatchEvent(new CustomEvent('live-audio-status', {
          detail: { status: statusDetail, code: code || newState, error: error, oldState: oldState },
          bubbles: true,
          composed: true
        }));
    }

    private getDefaultStatusText(state: LiveAudioState): string {
        switch (state) {
            case LiveAudioState.IDLE: return "מוכן (LiveAPI).";
            case LiveAudioState.REQUESTING_MIC: return "מבקש גישה למיקרופון...";
            case LiveAudioState.MIC_ACCESS_GRANTED: return "גישה למיקרופון אושרה.";
            case LiveAudioState.CONNECTING_AI: return "מתחבר ל-LiveAPI...";
            case LiveAudioState.AI_SESSION_OPEN: return "סשן LiveAPI פתוח. ניתן לדבר.";
            case LiveAudioState.STREAMING_USER_AUDIO: return "מקליט ושולח אודיו...";
            case LiveAudioState.PLAYING_AI_AUDIO: return "AI מדבר...";
            case LiveAudioState.PROCESSING_AI_MESSAGE: return "מעבד הודעת AI...";
            case LiveAudioState.ERROR: return "שגיאת LiveAPI.";
            case LiveAudioState.CLOSING_SESSION: return "סוגר סשן LiveAPI...";
            default: return "מצב לא ידוע.";
        }
    }

    private ensureAudioContexts(): boolean {
        try {
            if (!this.inputAudioContext || this.inputAudioContext.state === 'closed') {
                this.inputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
                if(this.inputAudioContext) {
                    this.inputNodeForVisualizer = this.inputAudioContext.createGain();
                 } else throw new Error("Failed to create input AudioContext");
            }
            if (!this.outputAudioContext || this.outputAudioContext.state === 'closed') {
                this.outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
                 if(this.outputAudioContext) {
                    this.outputNodeForVisualizer = this.outputAudioContext.createGain();
                    this.outputNodeForVisualizer.connect(this.outputAudioContext.destination);
                 } else throw new Error("Failed to create output AudioContext");
            }
            if (this.inputAudioContext.state === 'suspended') this.inputAudioContext.resume();
            if (this.outputAudioContext.state === 'suspended') this.outputAudioContext.resume();
            this.nextAiAudioStartTime = this.outputAudioContext.currentTime;
            return true;
        } catch (e) {
            console.error("[GdmLiveAudio] Error ensuring AudioContexts:", e);
            this.setState(LiveAudioState.ERROR, `שגיאה באתחול AudioContext: ${(e as Error).message}`, LiveAudioState.AUDIOCONTEXT_FAILURE, (e as Error).message);
            return false;
        }
    }
    
    connectedCallback() {
        console.log('[GdmLiveAudio] Component connected to DOM.');
    }

    disconnectedCallback() {
        console.log('[GdmLiveAudio] Component disconnected from DOM.');
        this.stopMicrophoneAndSessionAudio(false); 
        this.inputAudioContext?.close().catch(e => console.warn("Error closing input audio context:", e));
        this.outputAudioContext?.close().catch(e => console.warn("Error closing output audio context:", e));
        this.inputAudioContext = null;
        this.outputAudioContext = null;
    }
    
    public async activateMicrophoneAndStartSession(): Promise<void> {
        console.log('[GdmLiveAudio] Activating microphone and starting session (example API pattern)...');
        if (!this.client) {
            this.setState(LiveAudioState.ERROR, API_KEY_MISSING_ERROR_TEXT, LiveAudioState.API_KEY_MISSING, API_KEY_MISSING_ERROR_TEXT);
            throw new Error(API_KEY_MISSING_ERROR_TEXT);
        }
        // System prompt is no longer sent directly in config here.
        // if (!this.initialSystemPrompt) { 
        //     this.setState(LiveAudioState.ERROR, "Initial system prompt not set.", "NO_SYSTEM_PROMPT", "Initial system prompt not set.");
        //     throw new Error("Initial system prompt not set.");
        // }
        if (!this.ensureAudioContexts() || !this.inputAudioContext || !this.outputAudioContext) {
            throw new Error("AudioContext initialization failed.");
        }

        this.setState(LiveAudioState.REQUESTING_MIC);
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: INPUT_SAMPLE_RATE, channelCount: AUDIO_CHANNELS, echoCancellation: true, noiseSuppression: true }, video: false });
            this.setState(LiveAudioState.MIC_ACCESS_GRANTED);
        } catch (e) {
            console.error('[GdmLiveAudio] Microphone access denied or error:', e);
            this.setState(LiveAudioState.ERROR, `שגיאה בגישה למיקרופון: ${(e as Error).message}`, LiveAudioState.MIC_ACCESS_DENIED, (e as Error).message);
            throw e;
        }

        this.mediaStreamSourceNode = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
        this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, AUDIO_CHANNELS, AUDIO_CHANNELS);
        this.scriptProcessorNode.onaudioprocess = this.processAudioInput.bind(this);
        
        this.mediaStreamSourceNode.connect(this.scriptProcessorNode);
        this.scriptProcessorNode.connect(this.inputAudioContext.destination); 

        if (this.inputNodeForVisualizer) {
            this.mediaStreamSourceNode.connect(this.inputNodeForVisualizer);
        }

        this.setState(LiveAudioState.CONNECTING_AI);
        try {
            this.liveSession = await this.client.live.connect({
                model: LIVE_API_MODEL_NAME,
                callbacks: {
                    onopen: () => {
                        this.setState(LiveAudioState.AI_SESSION_OPEN, "Live API session opened.");
                        this.isRecordingUserAudio = true;
                        this.setState(LiveAudioState.STREAMING_USER_AUDIO, "Capturing audio for LiveAPI.");
                        if (this.initialSystemPrompt) {
                          this.liveSession?.sendRealtimeInput({ text: this.initialSystemPrompt });
                        }
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        this.handleLiveApiResponse(message);
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('[GdmLiveAudio] Live API Session Error:', e.message);
                        this.setState(LiveAudioState.ERROR, `שגיאת סשן Live API: ${e.message}`, LiveAudioState.API_SESSION_ERROR_CALLBACK, e.message);
                        this.stopMicrophoneAndSessionAudio();
                    },
                    onclose: (e?: CloseEvent) => { 
                        this.setState(LiveAudioState.IDLE, `Live API session closed: ${e?.reason || 'No reason provided'}`);
                        this.stopMicrophoneAndSessionAudio(false);
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO], 
                    speechConfig: { 
                        voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Orus'}},
                    },
                },
            });
        } catch (e) {
            console.error('[GdmLiveAudio] Error connecting to Live API:', e);
            this.setState(LiveAudioState.ERROR, `שגיאה ביצירת סשן Live API: ${(e as Error).message}`, LiveAudioState.AI_SESSION_CONNECT_FAILED, (e as Error).message);
            this.stopMicrophoneAndSessionAudio(false);
            throw e;
        }
    }

    public stopMicrophoneAndSessionAudio(dispatchClosingEvent = true): void {
        console.log('[GdmLiveAudio] Stopping microphone and session audio.');
        this.isRecordingUserAudio = false;
        
        if (this.scriptProcessorNode) {
            this.scriptProcessorNode.disconnect();
            this.scriptProcessorNode = null;
        }
        if (this.mediaStreamSourceNode) {
            this.mediaStreamSourceNode.disconnect();
            this.mediaStreamSourceNode = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        this.activeAiAudioSources.forEach(source => source.stop());
        this.activeAiAudioSources.clear();
        this.nextAiAudioStartTime = 0;

        if (this.liveSession) {
            if (dispatchClosingEvent && this._state !== LiveAudioState.CLOSING_SESSION && this._state !== LiveAudioState.IDLE) {
                 this.setState(LiveAudioState.CLOSING_SESSION);
            }
            try {
                this.liveSession.close();
                console.log('[GdmLiveAudio] Live API session.close() called.');
            } catch (e) {
                console.warn('[GdmLiveAudio] Error calling close on Live API session:', e);
            }
            this.liveSession = null;
        }
        if (this._state !== LiveAudioState.ERROR && this._state !== LiveAudioState.IDLE) {
             this.setState(LiveAudioState.IDLE);
        }
    }

    private async analyzeAndSendAudio(audioData: Float32Array) {
        const audioBlob = new Blob([audioData], { type: 'audio/l16' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
            const response = await fetch('/api/analyze-tone', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            console.log('Tone analysis response:', data);
        } catch (error) {
            console.error('Error analyzing tone:', error);
        }
    }

    private processAudioInput(event: AudioProcessingEvent): void {
        if (!this.isRecordingUserAudio || !this.liveSession) return;
        if (this._state !== LiveAudioState.STREAMING_USER_AUDIO && this._state !== LiveAudioState.AI_SESSION_OPEN && this._state !== LiveAudioState.PLAYING_AI_AUDIO) {
            return;
        }

        const inputData = event.inputBuffer.getChannelData(0);
        this.analyzeAndSendAudio(inputData); // Analyze tone in parallel

        const audioBlobForLiveApi = createAudioBlobForLiveAPI(inputData);
        
        try {
            this.liveSession.sendRealtimeInput({ media: audioBlobForLiveApi });
        } catch (e) {
             console.error('[GdmLiveAudio] Error sending audio to Live API:', e);
             this.setState(LiveAudioState.ERROR, `שגיאה בשליחת אודיו: ${(e as Error).message}`, LiveAudioState.AUDIO_SEND_ERROR, (e as Error).message);
             this.stopMicrophoneAndSessionAudio();
        }
    }

    private handleLiveApiResponse(message: LiveServerMessage): void {
        let messageDescription = 'server message';
        if (message.serverContent?.modelTurn) messageDescription = 'model response';
        else if (message.serverContent?.interrupted) messageDescription = 'interruption';
        
        this.setState(LiveAudioState.PROCESSING_AI_MESSAGE, `Processing ${messageDescription}`);
        console.log('[GdmLiveAudio] Received Live API message:', message);

        let aiText: string | null = null;
        
        const modelTurn = message.serverContent?.modelTurn;
        if (modelTurn && modelTurn.parts && modelTurn.parts.length > 0) {
            const firstPart = modelTurn.parts[0];
            if (firstPart.text) {
                aiText = firstPart.text;
            }
            if (firstPart.inlineData?.data && firstPart.inlineData?.mimeType?.startsWith('audio/')) {
                this.playAiAudio(firstPart.inlineData.data, OUTPUT_SAMPLE_RATE); 
            }
        }
        
        if (message.serverContent?.interrupted) {
            console.log('[GdmLiveAudio] AI Speech interrupted.');
            this.activeAiAudioSources.forEach(source => source.stop());
            this.activeAiAudioSources.clear();
            this.nextAiAudioStartTime = 0; 
        }

        if (aiText !== null) { 
            this.dispatchEvent(new CustomEvent('ai-speech', {
                detail: { text: aiText, directives: null }, 
                bubbles: true,
                composed: true,
            }));
        } else if (modelTurn && modelTurn.parts && modelTurn.parts.length > 0 && modelTurn.parts[0].inlineData?.data) {
            console.log('[GdmLiveAudio] AI audio received, but no corresponding text part in this message.');
        }


        if (this.isRecordingUserAudio && this._state !== LiveAudioState.ERROR && this._state !== LiveAudioState.CLOSING_SESSION) {
            if (!this.activeAiAudioSources.size) { 
                 this.setState(LiveAudioState.STREAMING_USER_AUDIO);
            }
        } else if (this._state !== LiveAudioState.ERROR && this._state !== LiveAudioState.CLOSING_SESSION && this._state !== LiveAudioState.IDLE) {
            if (!this.activeAiAudioSources.size) {
                 this.setState(LiveAudioState.AI_SESSION_OPEN); 
            }
        }
    }

    private async playAiAudio(base64AudioData: string, sampleRate: number): Promise<void> {
        if (!this.outputAudioContext || !this.outputNodeForVisualizer) {
            console.error('[GdmLiveAudio] Output AudioContext not available for playing AI audio.');
            this.setState(LiveAudioState.ERROR, "Output AudioContext not ready.", LiveAudioState.AI_AUDIO_PLAY_ERROR, "Output AudioContext not ready.");
            return;
        }
        this.setState(LiveAudioState.PLAYING_AI_AUDIO);

        try {
            const audioBytes = decodeBase64(base64AudioData);
            const audioBuffer = await decodePCMToAudioBuffer(audioBytes, this.outputAudioContext, sampleRate, AUDIO_CHANNELS);
            
            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputNodeForVisualizer); 
            
            const currentTime = this.outputAudioContext.currentTime;
            const startTime = Math.max(currentTime, this.nextAiAudioStartTime);
            source.start(startTime);
            this.nextAiAudioStartTime = startTime + audioBuffer.duration;

            this.activeAiAudioSources.add(source);
            source.onended = () => {
                this.activeAiAudioSources.delete(source);
                source.disconnect(); 
                if (this.activeAiAudioSources.size === 0) { 
                    if (this.isRecordingUserAudio && this._state !== LiveAudioState.ERROR && this._state !== LiveAudioState.CLOSING_SESSION) {
                        this.setState(LiveAudioState.STREAMING_USER_AUDIO);
                    } else if (this._state !== LiveAudioState.ERROR && this._state !== LiveAudioState.CLOSING_SESSION && this._state !== LiveAudioState.IDLE) {
                         this.setState(LiveAudioState.AI_SESSION_OPEN);
                    }
                }
            };
        } catch (e) {
            console.error('[GdmLiveAudio] Error playing AI audio:', e);
            this.setState(LiveAudioState.ERROR, `שגיאה בניגון אודיו מה-AI: ${(e as Error).message}`, LiveAudioState.AI_AUDIO_PLAY_ERROR, (e as Error).message);
        }
    }

    public resetConnectionAndSession(): void {
        console.log('[GdmLiveAudio] Resetting connection and session explicitly.');
        this.stopMicrophoneAndSessionAudio(true); 
        this.initializeGeminiClient(); 
    }
}

if (!customElements.get('gdm-live-audio')) {
    customElements.define('gdm-live-audio', GdmLiveAudio);
}