import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { User, Theme, UserRole, MockTrainee, InvestigationSession, KnowledgeDocument, Scenario } from '@/types';
import { UI_TEXT, FEEDBACK_PARAMETER_NAMES } from '@/constants';
import * as ApiService from '@/services/ApiService';
import LiveInterventionTab from '@/components/trainer/LiveInterventionTab';
import ManageAIAgentsTab from '@/components/trainer/ManageAIAgentsTab';
import ManualScenarioBuilderTab from '@/components/trainer/ManualScenarioBuilderTab';
import ManageUsersTab from '@/components/trainer/ManageUsersTab';
import SettingsTab from '@/components/trainer/SettingsTab';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const ScenarioBuilderView = lazy(() => import('@/components/trainer/ScenarioBuilderView'));

interface TrainerViewProps {
    currentTrainer: User;
    theme: Theme;
}

type TrainerTabId = 'progress' | 'intervention' | 'agents' | 'knowledge_base' | 'scenarios' | 'users' | 'settings';
type ViewMode = 'dashboard' | 'scenario_builder';

const TrainerView: React.FC<TrainerViewProps> = ({ currentTrainer, theme }) => {
    const [activeTab, setActiveTab] = useState<TrainerTabId>('progress');
    const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
    const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);

    const allTabs: { id: TrainerTabId; label: string; roles: UserRole[] }[] = [
        { id: 'progress', label: UI_TEXT.traineeProgressTab, roles: [UserRole.TRAINER, UserRole.SYSTEM_ADMIN] },
        { id: 'intervention', label: UI_TEXT.liveInterventionTab, roles: [UserRole.TRAINER, UserRole.SYSTEM_ADMIN] },
        { id: 'agents', label: UI_TEXT.manageAIAgentsTab, roles: [UserRole.TRAINER, UserRole.SYSTEM_ADMIN] },
        { id: 'knowledge_base', label: UI_TEXT.knowledgeBaseTab, roles: [UserRole.TRAINER, UserRole.SYSTEM_ADMIN] },
        { id: 'scenarios', label: UI_TEXT.manualScenarioBuilderTab, roles: [UserRole.TRAINER, UserRole.SYSTEM_ADMIN] },
        { id: 'users', label: UI_TEXT.manageUsersTab, roles: [UserRole.SYSTEM_ADMIN] },
        { id: 'settings', label: UI_TEXT.settingsSystemTab, roles: [UserRole.SYSTEM_ADMIN] }
    ];
    
    const tabs = allTabs.filter(tab => tab.roles.includes(currentTrainer.role));
    
    useEffect(() => {
        if (!tabs.some(t => t.id === activeTab)) {
            setActiveTab(tabs[0]?.id || 'progress');
        }
    }, [currentTrainer.role, activeTab, tabs]);

    const handleEditScenario = (scenario: Scenario) => {
        setEditingScenario(scenario);
        setViewMode('scenario_builder');
    };

    const handleAddNewScenario = () => {
        setEditingScenario(null);
        setViewMode('scenario_builder');
    };

    const handleBackToDashboard = () => {
        setViewMode('dashboard');
        setEditingScenario(null);
    };

    const renderDashboardContent = () => {
        switch (activeTab) {
            case 'progress': return <TraineeProgressTab theme={theme} />;
            case 'intervention': return <LiveInterventionTab theme={theme} />;
            case 'agents': return <ManageAIAgentsTab theme={theme} />;
            case 'knowledge_base': return <KnowledgeBaseTab theme={theme} />;
            case 'scenarios': return <ManualScenarioBuilderTab theme={theme} onEdit={handleEditScenario} onAddNew={handleAddNewScenario} />;
            case 'users': return <ManageUsersTab theme={theme} />;
            case 'settings': return <SettingsTab theme={theme} />;
            default: return <div>{tabs.find(t => t.id === activeTab)?.label} content not implemented.</div>;
        }
    };

    if (viewMode === 'scenario_builder') {
        return (
            <Suspense fallback={<LoadingSpinner message="טוען את בונה התרחישים..." />}>
                <ScenarioBuilderView
                    scenario={editingScenario}
                    onBack={handleBackToDashboard}
                    theme={theme}
                />
            </Suspense>
        );
    }
    
    const inactiveTabClass = theme === 'light' 
        ? "text-secondary-600 hover:bg-secondary-200 hover:text-secondary-800 border-transparent" 
        : "text-secondary-300 hover:bg-secondary-700 hover:text-secondary-100 border-transparent";
    const activeTabClass = theme === 'light'
        ? "text-primary-600 border-primary-500 bg-primary-50"
        : "text-primary-400 border-primary-400 bg-secondary-700";
    const tabContainerClass = `flex space-x-1 rtl:space-x-reverse border-b ${theme === 'light' ? 'border-secondary-200' : 'border-secondary-700'} mb-4 overflow-x-auto`;

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
            <div className="py-4">
                <h1 className={`text-2xl font-bold ${theme === 'light' ? 'text-primary-700' : 'text-primary-300'}`}>{UI_TEXT.trainerDashboardTitle}</h1>
                <p className={`text-sm ${theme === 'light' ? 'text-secondary-600' : 'text-secondary-400'}`}>ברוך הבא, {currentTrainer.name}.</p>
            </div>
            
            <div className={tabContainerClass}>
                <nav className="flex-1 -mb-px flex space-x-1 rtl:space-x-reverse" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-3 px-4 text-center border-b-2 font-medium text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 rounded-t-md whitespace-nowrap ${activeTab === tab.id ? activeTabClass : inactiveTabClass}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-4">
                {renderDashboardContent()}
            </div>
        </div>
    );
};

// --- Knowledge Base Tab ---

const KnowledgeBaseTab: React.FC<{ theme: Theme }> = ({ theme }) => {
    const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState('');
    const [previewDoc, setPreviewDoc] = useState<KnowledgeDocument | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadDocuments = async () => {
        setIsLoading(true);
        const docs = await ApiService.getKnowledgeDocuments();
        setDocuments(docs);
        setIsLoading(false);
    };

    useEffect(() => {
        loadDocuments();
    }, []);
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            if (content) {
                await ApiService.addKnowledgeDocument({ name: file.name, content });
                setStatusMessage(UI_TEXT.fileUploadSuccess(file.name));
                await loadDocuments();
                setTimeout(() => setStatusMessage(''), 3000);
            } else {
                setStatusMessage(UI_TEXT.fileUploadError);
                 setTimeout(() => setStatusMessage(''), 3000);
            }
        };
        reader.onerror = () => {
            setStatusMessage(UI_TEXT.fileUploadError);
            setTimeout(() => setStatusMessage(''), 3000);
        };
        reader.readAsText(file);
        
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const handleDelete = async (docId: string) => {
        const doc = documents.find(d => d.id === docId);
        if (doc && window.confirm(UI_TEXT.confirmDeleteKnowledgeDocMessage(doc.name))) {
            await ApiService.deleteKnowledgeDocument(docId);
            await loadDocuments();
        }
    };

    return (
        <div className={`p-4 rounded-lg space-y-4 ${theme === 'light' ? 'bg-white border' : 'themed-card'}`}>
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{UI_TEXT.knowledgeBaseTitle}</h3>
                <Button onClick={() => fileInputRef.current?.click()} isLoading={isLoading}>{UI_TEXT.uploadFileButton}</Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.md" />
            </div>
             {statusMessage && <p className="text-sm text-green-500">{statusMessage}</p>}

             {isLoading ? <LoadingSpinner /> : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y themed-border">
                        <thead className={theme === 'light' ? 'bg-secondary-50' : 'bg-secondary-700'}>
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">{UI_TEXT.docName}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">{UI_TEXT.docDate}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium themed-text-secondary uppercase tracking-wider">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y themed-border">
                            {documents.map(doc => (
                                <tr key={doc.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{doc.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm themed-text-content">{new Date(doc.uploadedAt).toLocaleString('he-IL')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2 space-x-reverse">
                                        <Button onClick={() => setPreviewDoc(doc)} variant="ghost" size="sm">{UI_TEXT.preview}</Button>
                                        <Button onClick={() => handleDelete(doc.id)} variant="ghost" size="sm" className="text-red-500 hover:bg-red-100">{UI_TEXT.delete}</Button>
                                    </td>
                                </tr>
                            ))}
                            {documents.length === 0 && (
                                <tr><td colSpan={3} className="text-center py-4 text-sm themed-text-secondary">{UI_TEXT.noDataAvailable}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
             )}

            {previewDoc && (
                <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title={`${UI_TEXT.docPreviewTitle}: ${previewDoc.name}`} size="2xl">
                    <pre className="whitespace-pre-wrap bg-secondary-800 text-secondary-200 p-4 rounded-md max-h-[60vh] overflow-y-auto text-xs">
                        {previewDoc.content}
                    </pre>
                    <div className="mt-4 flex justify-end">
                        <Button onClick={() => setPreviewDoc(null)}>{UI_TEXT.closeButton}</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};


// --- Advanced Trainee Progress Tab ---

const TraineeProgressTab: React.FC<{ theme: Theme }> = ({ theme }) => {
    const [allTrainees, setAllTrainees] = useState<MockTrainee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTrainee, setSelectedTrainee] = useState<MockTrainee | null>(null);
    
    useEffect(() => {
        const fetchTrainees = async () => {
            setIsLoading(true);
            const users = await ApiService.getUsers();
            const trainees = users.filter(u => u.role === UserRole.TRAINEE);
            setAllTrainees(trainees);
            setIsLoading(false);
        };
        fetchTrainees();
    }, []);

    const calculateAverageScore = (sessions: InvestigationSession[]) => {
        const completedSessions = sessions.filter(s => s.status === 'completed' && s.feedback?.overallScore);
        if (completedSessions.length === 0) return 0;
        const totalScore = completedSessions.reduce((acc, s) => acc + (s.feedback?.overallScore || 0), 0);
        return totalScore / completedSessions.length;
    };

    const handleSelectTrainee = (traineeId: string) => {
        const trainee = allTrainees.find(t => t.id === traineeId);
        setSelectedTrainee(trainee || null);
    };

    const traineeProgressData = allTrainees.map(trainee => ({
        id: trainee.id,
        name: trainee.name,
        averageScore: calculateAverageScore(trainee.sessions),
        sessionCount: trainee.sessions.filter(s => s.status === 'completed' && s.scenario.agentType === 'interrogation').length
    }));
    
    return (
        <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-white border' : 'themed-card'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-secondary-800' : 'text-secondary-100'}`}>{UI_TEXT.traineeProgressChartTitle}</h3>
            {isLoading ? <LoadingSpinner /> : (
                traineeProgressData.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {traineeProgressData.map((trainee) => (
                            <button key={trainee.id} onClick={() => handleSelectTrainee(trainee.id)} className={`p-4 rounded-lg text-right themed-card shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-1`}>
                                <h4 className="font-bold text-lg themed-text-primary">{trainee.name}</h4>
                                <p className="themed-text-secondary text-sm mt-2">{UI_TEXT.averageScoreLabel}: <span className="font-bold">{trainee.averageScore.toFixed(1)}</span></p>
                                <p className="themed-text-secondary text-sm">{trainee.sessionCount} {UI_TEXT.simulationsCountSuffix}</p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="mt-2 text-sm text-center themed-text-secondary">{UI_TEXT.noDataAvailable}</p>
                )
            )}

            {selectedTrainee && (
                <Modal isOpen={!!selectedTrainee} onClose={() => setSelectedTrainee(null)} title={UI_TEXT.traineeProgressCardTitle(selectedTrainee.name)} size="3xl">
                    <TraineeAnalyticsContent trainee={selectedTrainee} theme={theme} />
                </Modal>
            )}
        </div>
    );
};

// --- Analytics Modal Content ---

const TraineeAnalyticsContent: React.FC<{ trainee: MockTrainee; theme: Theme }> = ({ trainee, theme }) => {
    const completedSessions = trainee.sessions
        .filter(s => s.status === 'completed' && s.feedback && s.scenario.agentType === 'interrogation')
        .sort((a, b) => a.startTime - b.startTime);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-secondary-50' : 'bg-secondary-800'}`}>
                    <h4 className="font-semibold text-center mb-2 themed-text-primary">{UI_TEXT.scoreTrendChartTitle}</h4>
                    {completedSessions.length > 1 ? (
                        <ScoreTrendChart sessions={completedSessions} theme={theme} />
                    ) : (
                        <p className="text-center text-sm themed-text-secondary h-48 flex items-center justify-center">
                            {completedSessions.length === 1 ? 'דרושה יותר מסימולציה אחת להצגת מגמה.' : 'אין מספיק נתונים להצגת גרף.'}
                        </p>
                    )}
                </div>
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-secondary-50' : 'bg-secondary-800'}`}>
                     <h4 className="font-semibold text-center mb-2 themed-text-primary">{UI_TEXT.skillsRadarChartTitle}</h4>
                    {completedSessions.length > 0 ? (
                        <ParameterRadarChart sessions={completedSessions} theme={theme} />
                     ) : (
                        <p className="text-center text-sm themed-text-secondary h-48 flex items-center justify-center">אין נתונים להצגת ניתוח מיומנויות.</p>
                     )}
                </div>
            </div>
            <div>
                <h4 className="font-semibold mb-2 themed-text-primary">{UI_TEXT.completedSessionsTitle}</h4>
                <div className="max-h-48 overflow-y-auto border themed-border rounded-md">
                    <table className="min-w-full divide-y themed-border">
                        <thead className={`sticky top-0 ${theme === 'light' ? 'bg-secondary-100' : 'bg-secondary-700'}`}>
                            <tr>
                                <th className="px-4 py-2 text-right text-xs font-medium themed-text-secondary uppercase">נושא</th>
                                <th className="px-4 py-2 text-right text-xs font-medium themed-text-secondary uppercase">{UI_TEXT.sessionDateLabel}</th>
                                <th className="px-4 py-2 text-right text-xs font-medium themed-text-secondary uppercase">{UI_TEXT.sessionScoreLabel}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y themed-border">
                            {completedSessions.map(session => (
                                <tr key={session.id}>
                                    <td className="px-4 py-2 text-sm">{session.scenario.caseType}</td>
                                    <td className="px-4 py-2 text-sm">{new Date(session.startTime).toLocaleDateString('he-IL')}</td>
                                    <td className="px-4 py-2 text-sm font-bold">{session.feedback?.overallScore}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {completedSessions.length === 0 && <p className="text-center p-4 text-sm themed-text-secondary">אין סשנים שהושלמו.</p>}
                </div>
            </div>
        </div>
    );
};

// --- SVG Chart Components ---

const ParameterRadarChart: React.FC<{ sessions: InvestigationSession[], theme: Theme }> = ({ sessions, theme }) => {
    const parameterAverages = FEEDBACK_PARAMETER_NAMES.map(name => {
        const scores = sessions
            .map(s => s.feedback?.parameters.find(p => p.name === name)?.score)
            .filter((s): s is number => s !== undefined && s > 0);
        if (scores.length === 0) return { name, average: 0 };
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return { name, average };
    });

    const width = 350, height = 200;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.75;
    const numAxes = FEEDBACK_PARAMETER_NAMES.length;
    const angleSlice = (Math.PI * 2) / numAxes;

    const getPoint = (value: number, index: number) => {
        const angle = angleSlice * index - Math.PI / 2;
        const r = (value / 10) * radius;
        return {
            x: centerX + r * Math.cos(angle),
            y: centerY + r * Math.sin(angle)
        };
    };

    const axisPoints = parameterAverages.map((_, i) => getPoint(10, i));
    const dataPoints = parameterAverages.map((param, i) => getPoint(param.average, i));
    const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';
    
    const textColor = theme === 'light' ? '#475569' : '#cbd5e1';
    const gridColor = theme === 'light' ? '#e2e8f0' : '#334155';
    const dataFillColor = theme === 'light' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(96, 165, 250, 0.4)';
    const dataStrokeColor = theme === 'light' ? '#2563eb' : '#60a5fa';

    return (
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={UI_TEXT.skillsRadarChartTitle}>
            {/* Grid and Axes */}
            <g>
                {[...Array(5)].map((_, i) => {
                    const level = (i + 1) * 2;
                    const levelPoints = axisPoints.map((_, j) => getPoint(level, j));
                    const levelPath = levelPoints.map((p, k) => `${k === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';
                    return <path key={i} d={levelPath} stroke={gridColor} fill="none" strokeWidth="0.5" />;
                })}
                {axisPoints.map((p, i) => (
                    <line key={i} x1={centerX} y1={centerY} x2={p.x} y2={p.y} stroke={gridColor} strokeWidth="0.5" />
                ))}
            </g>
            
            {/* Data Polygon */}
            <path d={dataPath} fill={dataFillColor} stroke={dataStrokeColor} strokeWidth="1.5" />

            {/* Labels */}
            {axisPoints.map((p, i) => {
                const labelAngle = angleSlice * i - Math.PI / 2;
                const labelRadius = radius * 1.15;
                const labelX = centerX + labelRadius * Math.cos(labelAngle);
                const labelY = centerY + labelRadius * Math.sin(labelAngle);
                let textAnchor = 'middle';
                if (labelX < centerX - 10) textAnchor = 'end';
                if (labelX > centerX + 10) textAnchor = 'start';
                
                // Heuristics to shorten long labels
                const shortName = parameterAverages[i].name
                    .replace('הערכת', '')
                    .replace('זיהוי', '')
                    .replace('שימוש', '')
                    .replace('ניהול', '')
                    .replace('בניית', '')
                    .replace('על ידי החוקר', '')
                    .replace('אפשריות (חוקר/נחקר)','')
                    .trim();

                return (
                    <text key={i} x={labelX} y={labelY} fill={textColor} fontSize="8" textAnchor={textAnchor} dominantBaseline="middle">
                        <title>{parameterAverages[i].name}</title>
                        {shortName}
                    </text>
                );
            })}
        </svg>
    );
};

const ScoreTrendChart: React.FC<{ sessions: InvestigationSession[], theme: Theme }> = ({ sessions, theme }) => {
    const width = 350, height = 200, padding = 30;
    const scores = sessions.map(s => s.feedback?.overallScore || 0);
    const pointCount = scores.length;
    
    const xForIndex = (i: number) => padding + i * (width - 2 * padding) / (pointCount - 1);
    const yForScore = (score: number) => height - padding - (score / 10) * (height - 2 * padding);
    
    const pathData = scores.map((score, i) => `${i === 0 ? 'M' : 'L'} ${xForIndex(i)} ${yForScore(score)}`).join(' ');

    const textColor = theme === 'light' ? '#475569' : '#cbd5e1';
    const lineColor = theme === 'light' ? '#94a3b8' : '#475569';
    const pointColor = theme === 'light' ? '#3b82f6' : '#60a5fa';

    return (
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={UI_TEXT.scoreTrendChartTitle}>
            {/* Y-Axis */}
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke={lineColor} />
            {[0, 5, 10].map(score => (
                <g key={score}>
                    <line x1={padding - 5} y1={yForScore(score)} x2={padding} y2={yForScore(score)} stroke={lineColor} />
                    <text x={padding - 10} y={yForScore(score) + 3} fill={textColor} textAnchor="end" fontSize="10">{score}</text>
                </g>
            ))}
            {/* X-Axis */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={lineColor} />
            {scores.map((_, i) => (
                <g key={i}>
                    <line x1={xForIndex(i)} y1={height-padding} x2={xForIndex(i)} y2={height - padding + 5} stroke={lineColor} />
                </g>
            ))}
            {/* Data Line and Points */}
            <path d={pathData} fill="none" stroke={pointColor} strokeWidth="2" />
            {scores.map((score, i) => (
                <circle key={i} cx={xForIndex(i)} cy={yForScore(score)} r="3" fill={pointColor} />
            ))}
        </svg>
    );
};

export default TrainerView;
