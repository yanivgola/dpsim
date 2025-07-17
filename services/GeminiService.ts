

import { GoogleGenAI, GenerateContentResponse, Chat, Content } from "@google/genai";
import { UI_TEXT, GEMINI_MODEL_TEXT, MOCK_POLICE_DATABASE_RECORDS, MOCK_GENERAL_KNOWLEDGE_BASE, MOCK_INTERNAL_ARCHIVES_RECORDS, MOCK_FORENSIC_REPORTS } from '@/constants'; 
import { 
    Scenario, ChatMessage, Feedback, GeminiJsonScenario, GeminiChat, InterrogateeRole, DifficultyLevel, 
    SuspectProfile, AIResponseWithDirectives, AvatarControlPayload, ToolCallRequest, ToolCallResult, ToolName,
    SimpleChatMessage, UserCommand, UserCommandType, TriggerInterruptionPayload, InterruptionTypeDisplay,
    LoadedAIAgent,
    CheckPoliceDatabaseToolInput,
    GeneralKnowledgeCheckToolInput,
    SearchInternalArchivesToolInput,
    RequestForensicAnalysisToolInput,
    KnowledgeDocument
} from '@/types';

const API_KEY = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error(UI_TEXT.errorApiKeyMissing);
}

const parseJsonFromResponse = <T,>(responseText: string): T | null => {
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(\w*json)?\s*\n?(.*?)\n?\s*```$/s; 
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Original text:", responseText);
    try {
        const textMatch = jsonStr.match(/"textResponse"\s*:\s*"((?:\\.|[^"\\])*)"/); 
        if (textMatch && textMatch[1]) {
            return { textResponse: textMatch[1].replace(/\\"/g, '"') } as unknown as T; 
        }
    } catch (extractionError) {
        console.error("Failed to extract textResponse after initial parsing error:", extractionError);
    }
    return { textResponse: responseText } as unknown as T;
  }
};

const getKnowledgeContextPrompt = (agent: LoadedAIAgent, allDocs: KnowledgeDocument[]): string => {
    if (!agent.knowledgeBaseIds || agent.knowledgeBaseIds.length === 0) {
        return "";
    }
    const relevantDocs = allDocs.filter(doc => agent.knowledgeBaseIds.includes(doc.id));

    if (relevantDocs.length === 0) {
        return "";
    }

    const context = relevantDocs.map(doc => 
        `### מסמך: ${doc.name} ###\n${doc.content}`
    ).join('\n\n---\n\n');

    return `\nבנוסף למידע על הדמות, עליך להתבסס באופן מוחלט על המידע מהמסמכים הבאים. השתמש בידע זה כדי לענות לשאלות רלוונטיות. אם אין לך תשובה במסמכים, ציין שאין לך את המידע.\n\n--- DOCUMENT CONTEXT START ---\n${context}\n--- DOCUMENT CONTEXT END ---\n`;
};


export const generateScenario = async (
  interrogateeRole: InterrogateeRole,
  difficulty: DifficultyLevel,
  topic: string,
  customAgentId: string,
  allAgents: LoadedAIAgent[],
  allDocs: KnowledgeDocument[]
): Promise<Scenario | null> => {
  if (!ai) throw new Error(UI_TEXT.errorApiKeyMissing);
  
  try {
    const agentToUse = allAgents.find(agent => agent.id === customAgentId) || allAgents.find(a => a.isDefault);
    if (!agentToUse) throw new Error("Default agent not found");

    let personalityTraitsPromptSection = agentToUse.personalityTraits.length > 0
        ? `\nתכונות אישיות מיוחדות לדמותך: ${agentToUse.personalityTraits.join(', ')}.\n`
        : "";
    
    const knowledgeContextPrompt = getKnowledgeContextPrompt(agentToUse, allDocs);

    const generationPrompt = UI_TEXT.generateScenarioPrompt
      .replace('{{INTERROGATEE_ROLE}}', interrogateeRole)
      .replace('{{DIFFICULTY_LEVEL}}', difficulty)
      .replace('{{INVESTIGATION_TOPIC}}', topic)
      .replace('{{AI_PERSONALITY_TRAITS_PROMPT_SECTION}}', personalityTraitsPromptSection);


    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: generationPrompt,
      config: { responseMimeType: "application/json" },
    });
    
    const geminiScenario = parseJsonFromResponse<GeminiJsonScenario>(response.text);
    if (!geminiScenario) return null;

    let scenarioDetailsForAI = `
תפקידך הוא: ${interrogateeRole}
נושא החקירה: ${geminiScenario.caseType}
תיאור המקרה המלא: ${geminiScenario.fullCaseDescription}
פרופיל ה${interrogateeRole} (את/ה):
  שם: ${geminiScenario.interrogateeProfile.name}
  גיל: ${geminiScenario.interrogateeProfile.age}
  עיסוק: ${geminiScenario.interrogateeProfile.occupation}
  `;
    if (geminiScenario.interrogateeProfile.criminalRecord) {
        scenarioDetailsForAI += `  ${geminiScenario.interrogateeProfile.criminalRecord.title} ${geminiScenario.interrogateeProfile.criminalRecord.details}\n`;
    }
    if (geminiScenario.interrogateeProfile.intel) {
        scenarioDetailsForAI += `  ${geminiScenario.interrogateeProfile.intel.title} ${geminiScenario.interrogateeProfile.intel.details}\n`;
    }
    
    const fullSystemPrompt = agentToUse.baseSystemPrompt
        .replace(/{{INTERROGATEE_ROLE}}/g, interrogateeRole)
        .replace(/{{DIFFICULTY_LEVEL}}/g, difficulty)
        .replace(/{{SCENARIO_DETAILS_FOR_AI}}/g, scenarioDetailsForAI.trim())
        .replace(/{{EVIDENCE_DETAILS_FOR_AI}}/g, geminiScenario.evidence.items.map(item => `- ${item}`).join('\n'))
        .replace(/{{AI_PERSONALITY_TRAITS_PROMPT_SECTION}}/g, personalityTraitsPromptSection)
        .replace(/{{KNOWLEDGE_BASE_CONTEXT_SECTION}}/g, knowledgeContextPrompt);

    return {
      id: `scenario-${Date.now()}`,
      caseType: geminiScenario.caseType,
      fullCaseDescription: geminiScenario.fullCaseDescription,
      interrogateeRole: interrogateeRole,
      interrogateeProfile: geminiScenario.interrogateeProfile,
      evidence: geminiScenario.evidence,
      fullSystemPromptForChat: fullSystemPrompt,
      userSelectedDifficulty: difficulty,
      userSelectedTopic: topic,
      customAgentId: agentToUse.id, 
      agentType: agentToUse.agentType, 
      investigationGoals: geminiScenario.investigationGoals || [],
    };

  } catch (error) {
    console.error("Error generating scenario:", error);
    return null;
  }
};

const getSystemPromptForManualScenario = (scenario: Scenario): string => {
    const agent = { baseSystemPrompt: UI_TEXT.scenarioSystemPromptTemplate, personalityTraits: [] };
    let personalityTraitsPromptSection = "";

    const flowNodes = scenario.flow?.nodes || [];
    const flowEdges = scenario.flow?.edges || [];

    const flowContext = flowNodes
      .map(node => `* ${node.title} (${node.type}): ${node.details}`)
      .join('\n');
      
    let flowLogicContext = '';
    const logicDescriptions: string[] = [];

    flowNodes.forEach(node => {
        const outgoingEdges = flowEdges.filter(edge => edge.from === node.id);
        if (outgoingEdges.length > 0) {
            const edgeStrings = outgoingEdges.map(edge => {
                const toNode = flowNodes.find(n => n.id === edge.to);
                if (!toNode) return '';
                if (edge.label && edge.label.trim()) {
                    return `- אם '${edge.label}', הזרימה ממשיכה אל '${toNode.title}' (${toNode.type}).`;
                } else {
                    return `- הזרימה ממשיכה באופן ישיר אל '${toNode.title}' (${toNode.type}).`;
                }
            }).filter(Boolean);

            if (edgeStrings.length > 0) {
                logicDescriptions.push(`מצומת '${node.title}' (${node.type}):\n` + edgeStrings.join('\n'));
            }
        }
    });

    if (logicDescriptions.length > 0) {
        flowLogicContext = `\n\nהיגיון זרימת התרחיש (עקוב אחר קשרים אלה):\n${logicDescriptions.join('\n\n')}`;
    }
    
    let scenarioDetailsForAI = `
      תפקידך הוא: ${scenario.interrogateeRole}
      נושא החקירה: ${scenario.caseType}
      תיאור המקרה המלא: ${scenario.fullCaseDescription}
      פרופיל ה${scenario.interrogateeRole} (את/ה):
        שם: ${scenario.interrogateeProfile.name}
        גיל: ${(scenario.interrogateeProfile as SuspectProfile).age}
        עיסוק: ${scenario.interrogateeProfile.occupation}
      
      מידע על צמתי התרחיש (היצמד לפרטים אלה):
      ${flowContext || 'אין פרטי לוגיקה נוספים.'}
      ${flowLogicContext}
    `;

    const fullSystemPrompt = agent.baseSystemPrompt
        .replace(/{{INTERROGATEE_ROLE}}/g, scenario.interrogateeRole as string)
        .replace(/{{DIFFICULTY_LEVEL}}/g, scenario.userSelectedDifficulty as string)
        .replace(/{{SCENARIO_DETAILS_FOR_AI}}/g, scenarioDetailsForAI.trim())
        .replace(/{{EVIDENCE_DETAILS_FOR_AI}}/g, scenario.evidence.items.map(item => `- ${item}`).join('\n'))
        .replace(/{{AI_PERSONALITY_TRAITS_PROMPT_SECTION}}/g, personalityTraitsPromptSection)
        .replace(/{{KNOWLEDGE_BASE_CONTEXT_SECTION}}/g, "");

    return fullSystemPrompt;
};

export const getSystemPromptWithExtras = (
    baseSystemPrompt: string, 
    interventionHint: string | null
): string => {
    let prompt = baseSystemPrompt;
    if (interventionHint && interventionHint.trim() !== "") {
        const hintText = `\nהנחיית מדריך נוספת (לשקול בתגובתך הבאה): ${interventionHint}\n`;
        prompt = prompt.replace(/{{TRAINER_INTERVENTION_HINT}}/g, hintText);
    } else {
        prompt = prompt.replace(/{{TRAINER_INTERVENTION_HINT}}/g, "");
    }
    prompt = prompt.replace(/{{KNOWLEDGE_BASE_CONTEXT_SECTION}}/g, "");
    return prompt;
};

export const startChatWithSuspect = async (scenario: Scenario): Promise<GeminiChat | null> => {
    if (!ai) throw new Error(UI_TEXT.errorApiKeyMissing);
    try {
        let systemPrompt: string;
        if (scenario.isManuallyCreated && scenario.flow) {
            systemPrompt = getSystemPromptForManualScenario(scenario);
            // Also update the scenario object with this newly generated prompt if it wasn't there
            scenario.fullSystemPromptForChat = systemPrompt;
        } else {
            systemPrompt = scenario.fullSystemPromptForChat || '';
        }

        if (!systemPrompt) {
            console.error("System prompt is empty or missing.");
            return null;
        }

        const cleanSystemPrompt = getSystemPromptWithExtras(systemPrompt, null);
        const chat: GeminiChat = ai.chats.create({
            model: GEMINI_MODEL_TEXT,
            config: { systemInstruction: cleanSystemPrompt },
        });
        return chat;
    } catch (error) {
        console.error("Error starting chat:", error);
        return null;
    }
};

const executeToolCall = async (toolCallRequest: ToolCallRequest): Promise<ToolCallResult> => {
    const { toolName, toolInput } = toolCallRequest;
    let toolOutput: ToolCallResult['toolOutput'] | null = null;
    let error: string | undefined;

    try {
        switch (toolName) {
            case ToolName.GET_CURRENT_TIME_AND_DATE:
                toolOutput = {
                    formattedDateTime: new Date().toLocaleString('he-IL', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })
                };
                break;
            case ToolName.CHECK_POLICE_DATABASE:
                const dbInput = toolInput as CheckPoliceDatabaseToolInput;
                const record = MOCK_POLICE_DATABASE_RECORDS.find(r => r.identifier.toLowerCase() === dbInput.query.toLowerCase());
                toolOutput = {
                    found: !!record,
                    details: record ? record.details : `לא נמצאו תוצאות עבור '${dbInput.query}'.`
                };
                break;
            case ToolName.GENERAL_KNOWLEDGE_CHECK:
                const knowledgeInput = toolInput as GeneralKnowledgeCheckToolInput;
                const answer = MOCK_GENERAL_KNOWLEDGE_BASE[knowledgeInput.question];
                toolOutput = {
                    answer: answer || "אין לי מידע בנושא זה במאגר הידע הכללי שלי.",
                    source: "simulated_knowledge_base"
                };
                break;
            case ToolName.SEARCH_INTERNAL_ARCHIVES:
                const archiveInput = toolInput as SearchInternalArchivesToolInput;
                const results = MOCK_INTERNAL_ARCHIVES_RECORDS.filter(r => 
                    r.keywords?.some(k => archiveInput.keywords.toLowerCase().includes(k.toLowerCase())) ||
                    r.title?.toLowerCase().includes(archiveInput.keywords.toLowerCase()) ||
                    r.details.toLowerCase().includes(archiveInput.keywords.toLowerCase())
                );
                toolOutput = {
                    resultsFound: results.length > 0,
                    summary: results.length > 0 ? `נמצאו ${results.length} מסמכים רלוונטיים.` : "לא נמצאו מסמכים התואמים לשאילתה.",
                    documentExcerpts: results.map(r => ({ title: r.title || 'Untitled', excerpt: r.details.substring(0, 150) + '...' }))
                };
                break;
             case ToolName.REQUEST_FORENSIC_ANALYSIS:
                const forensicInput = toolInput as RequestForensicAnalysisToolInput;
                const existingReport = MOCK_FORENSIC_REPORTS.find(r => r.keywords?.includes(forensicInput.evidenceItemId));
                 toolOutput = {
                    reportId: `FR-${Date.now()}`,
                    preliminaryFindings: existingReport ? existingReport.details : `בדיקה ראשונית החלה עבור פריט '${forensicInput.evidenceItemId}'. אין ממצאים מיידיים.`,
                    estimatedCompletionTime: "48-72 שעות"
                };
                break;
            default:
                error = `הכלי '${toolName}' אינו נתמך.`;
        }
    } catch (e) {
        console.error(`Error executing tool ${toolName}:`, e);
        error = `שגיאה בביצוע הכלי: ${(e as Error).message}`;
    }
    
    if (!toolOutput && !error) {
        error = "שגיאה לא צפויה בביצוע הכלי.";
    }

    return {
        toolName,
        toolOutput: toolOutput!, // We ensure it's not null or there is an error
        error
    };
};

export const sendChatMessage = async (
    chat: GeminiChat, 
    messageText: string,
    scenario: Scenario, 
    userCommand?: UserCommand | null 
    ): Promise<{ text: string | null; directives: AvatarControlPayload | null | undefined; toolCalledInfo?: { name: ToolName; output: any; } }> => {
  if (!ai) throw new Error(UI_TEXT.errorApiKeyMissing);
  try {
    let interventionHintForSystemPrompt: string | null = null;
    if (userCommand) {
        let hintParts: string[] = [];
        switch (userCommand.commandType) {
            case UserCommandType.FORCE_EMOTIONAL_STATE: hintParts.push(`התנהג כאילו מצבך הרגשי הוא '${(userCommand.payload as any).emotionalState}'.`); break;
            case UserCommandType.REVEAL_SPECIFIC_INFO_HINT: hintParts.push(`נסה לרמוז על: "${(userCommand.payload as any).infoToRevealHint}".`); break;
            case UserCommandType.INCREASE_RESISTANCE: hintParts.push(`הגבר התנגדות.`); break;
            case UserCommandType.DECREASE_RESISTANCE: hintParts.push(`הפחת התנגדות.`); break;
            case UserCommandType.SEND_WHISPER: hintParts.push((userCommand.payload as any).whisperText); break;
            case UserCommandType.TRIGGER_INTERRUPTION:
                const p = userCommand.payload as TriggerInterruptionPayload;
                hintParts.push(`התרחשה הפרעה: ${InterruptionTypeDisplay[p.interruptionType]}. ${p.details} הגב לכך.`);
                break;
        }
        interventionHintForSystemPrompt = hintParts.join(' ');
    }
    
    const baseSystemPrompt = (scenario.isManuallyCreated && scenario.flow)
      ? getSystemPromptForManualScenario(scenario)
      : (scenario.fullSystemPromptForChat || '');

    const updatedSystemInstruction = getSystemPromptWithExtras(baseSystemPrompt, interventionHintForSystemPrompt);

    const response: GenerateContentResponse = await chat.sendMessage({ 
        message: messageText,
        config: { systemInstruction: updatedSystemInstruction }
    });
    const parsedResponse = parseJsonFromResponse<AIResponseWithDirectives>(response.text);

    if (parsedResponse?.toolCallRequest) {
        const toolCallRequest = parsedResponse.toolCallRequest;
        const toolCallResult = await executeToolCall(toolCallRequest);
        
        const responsePayload = toolCallResult.error
            ? { error: toolCallResult.error }
            : toolCallResult.toolOutput;

        const toolResponseResult: GenerateContentResponse = await chat.sendMessage({
            message: [{ functionResponse: { name: toolCallResult.toolName, response: responsePayload as Record<string, unknown> } }]
        });

        const finalParsed = parseJsonFromResponse<AIResponseWithDirectives>(toolResponseResult.text);
        
        return {
            text: finalParsed?.textResponse || toolResponseResult.text,
            directives: finalParsed?.directives,
            toolCalledInfo: { name: toolCallResult.toolName, output: toolCallResult.toolOutput }
        };

    } else if (parsedResponse) {
      return { text: parsedResponse.textResponse || null, directives: parsedResponse.directives || null };
    }
    return { text: response.text || "שגיאה בעיבוד תגובת ה-AI.", directives: null };

  } catch (error) {
    console.error("Error sending message:", error);
    return { text: null, directives: null };
  }
};

export const generateFeedbackForSession = async (
    chatTranscript: ChatMessage[], 
    interrogateeRole: InterrogateeRole, 
    difficulty: DifficultyLevel, 
    topic: string,
    usedHintsCount: number 
    ): Promise<Feedback | null> => {
  if (!ai) throw new Error(UI_TEXT.errorApiKeyMissing);
  try {
    const transcriptJsonString = JSON.stringify(chatTranscript.map(msg => ({sender: msg.sender, text: msg.text })));
    const prompt = UI_TEXT.generateFeedbackPromptTemplate
        .replace('{{CHAT_TRANSCRIPT_JSON_STRING}}', transcriptJsonString)
        .replace('{{INTERROGATEE_ROLE}}', interrogateeRole)
        .replace('{{DIFFICULTY_LEVEL}}', difficulty)
        .replace('{{INVESTIGATION_TOPIC}}', topic)
        .replace('{{USED_HINTS_COUNT}}', usedHintsCount.toString()); 
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    return parseJsonFromResponse<Feedback>(response.text);

  } catch (error) {
    console.error("Error generating feedback:", error);
    return null;
  }
};

export const sendCommandToSession = (sessionId: string, command: UserCommand): void => {
    window.dispatchEvent(new CustomEvent('trainer-intervention-command', {
        detail: { sessionId, command }
    }));
};

export const generateContextualHint = async (
    chatHistory: SimpleChatMessage[],
    scenario: Scenario
): Promise<string | null> => {
    if (!ai) throw new Error(UI_TEXT.errorApiKeyMissing);
    try {
        const transcriptJsonString = JSON.stringify(chatHistory);
        const prompt = UI_TEXT.generateContextualHintPromptTemplate
            .replace('{{CHAT_TRANSCRIPT_JSON_STRING}}', transcriptJsonString)
            .replace('{{INTERROGATEE_ROLE}}', (scenario.interrogateeRole as string) || 'דמות')
            .replace('{{DIFFICULTY_LEVEL}}', (scenario.userSelectedDifficulty as string) || 'בינוני')
            .replace('{{INVESTIGATION_TOPIC}}', scenario.userSelectedTopic || 'כללי')
            .replace('{{FULL_CASE_DESCRIPTION}}', scenario.fullCaseDescription);

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: GEMINI_MODEL_TEXT,
            contents: prompt,
        });
        
        return response.text;

    } catch (error) {
        console.error("Error generating contextual hint:", error);
        return UI_TEXT.errorGeneratingHint;
    }
};