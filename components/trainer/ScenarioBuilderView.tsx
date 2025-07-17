import React, { useState, useEffect, useRef } from 'react';
import { Theme, Scenario, InterrogateeRole, DifficultyLevel, SuspectProfile, PREDEFINED_INVESTIGATION_TOPICS, ScenarioNode, ScenarioNodeType, ScenarioEdge } from '@/types';
import * as ApiService from '@/services/ApiService';
import { UI_TEXT } from '@/constants';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Textarea from '@/components/common/Textarea';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.878a.75.75 0 010 1.5H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" /></svg>;
const AddNodeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;

const emptyScenario: Omit<Scenario, 'id'> = {
  caseType: '',
  fullCaseDescription: '',
  interrogateeRole: InterrogateeRole.SUSPECT,
  interrogateeProfile: { name: '', age: 0, occupation: '' },
  evidence: { title: UI_TEXT.evidenceItemsTitle, items: [] },
  userSelectedDifficulty: DifficultyLevel.MEDIUM,
  userSelectedTopic: '',
  customAgentId: 'manual',
  agentType: 'interrogation',
  isManuallyCreated: true,
  investigationGoals: [],
  flow: { nodes: [], edges: [] },
};

interface ScenarioBuilderViewProps {
  scenario: Scenario | null;
  onBack: () => void;
  theme: Theme;
}

const getEdgePath = (startPos: { x: number; y: number }, endPos: { x: number; y: number }) => {
    const cpx1 = startPos.x;
    const cpy1 = startPos.y + 60;
    const cpx2 = endPos.x;
    const cpy2 = endPos.y - 60;
    return `M ${startPos.x},${startPos.y} C ${cpx1},${cpy1} ${cpx2},${cpy2} ${endPos.x},${endPos.y}`;
};

const NODE_WIDTH = 120;
const NODE_HEIGHT = 48;

const ScenarioBuilderView: React.FC<ScenarioBuilderViewProps> = ({ scenario: initialScenario, onBack, theme }) => {
    const [scenario, setScenario] = useState<Scenario>(emptyScenario as Scenario);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [draggingNode, setDraggingNode] = useState<{ id: string; offset: { x: number; y: number } } | null>(null);
    const [connectionDrag, setConnectionDrag] = useState<{ startNodeId: string; startPos: { x: number; y: number }; mousePos: { x: number; y: number } } | null>(null);

    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadScenario = async () => {
            setIsLoading(true);
            let loadedScenario: Scenario | null = null;
            if (initialScenario?.id) {
                loadedScenario = await ApiService.getManualScenarioById(initialScenario.id);
            }
            const finalScenario = loadedScenario || initialScenario || { ...emptyScenario, id: '' };
            if (!finalScenario.flow) finalScenario.flow = { nodes: [], edges: [] };
            if (!finalScenario.flow.edges) finalScenario.flow.edges = [];

            setScenario(finalScenario as Scenario);
            setIsLoading(false);
        };
        loadScenario();
    }, [initialScenario]);

    const handleScenarioChange = (field: keyof Scenario, value: any) => {
        setScenario(prev => ({ ...prev, [field]: value }));
    };

    const handleProfileChange = (field: keyof SuspectProfile, value: any) => {
        setScenario(prev => ({
            ...prev,
            interrogateeProfile: { ...prev.interrogateeProfile, [field]: value }
        }));
    };
    
    const handleNodeChange = (nodeId: string, field: keyof ScenarioNode, value: any) => {
        setScenario(prev => {
            const newNodes = prev.flow!.nodes.map(n => n.id === nodeId ? { ...n, [field]: value } : n);
            return { ...prev, flow: { ...prev.flow!, nodes: newNodes } };
        });
    };
    
    const handleEdgeChange = (edgeId: string, field: keyof ScenarioEdge, value: any) => {
        setScenario(prev => {
            const newEdges = prev.flow!.edges.map(e => e.id === edgeId ? { ...e, [field]: value } : e);
            return { ...prev, flow: { ...prev.flow!, edges: newEdges } };
        });
    };

    const handleNodeMouseDown = (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => {
        e.stopPropagation();
        setSelectedNodeId(nodeId);
        setSelectedEdgeId(null);
        const node = scenario.flow?.nodes.find(n => n.id === nodeId);
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!node || !canvasRect) return;

        const offsetX = e.clientX - canvasRect.left - node.position.x;
        const offsetY = e.clientY - canvasRect.top - node.position.y;
        setDraggingNode({ id: nodeId, offset: { x: offsetX, y: offsetY } });
    };

    const handleHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>, nodeId: string, handleType: 'input' | 'output') => {
        e.stopPropagation();
        if (handleType === 'input') return; // Only drag from output handle
        const node = scenario.flow!.nodes.find(n => n.id === nodeId)!;
        const startPos = { x: node.position.x + NODE_WIDTH / 2, y: node.position.y + NODE_HEIGHT };
        setConnectionDrag({ startNodeId: nodeId, startPos, mousePos: startPos });
    };
    
    const handleCanvasMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        setDraggingNode(null);
        setConnectionDrag(null);
    };

    const handleHandleMouseUp = (e: React.MouseEvent<HTMLDivElement>, nodeId: string, handleType: 'input' | 'output') => {
        e.stopPropagation();
        if (handleType === 'output' || !connectionDrag) return;
        
        if (connectionDrag.startNodeId !== nodeId && !scenario.flow!.edges.some(edge => edge.from === connectionDrag.startNodeId && edge.to === nodeId)) {
            const newEdge: ScenarioEdge = { id: `edge-${Date.now()}`, from: connectionDrag.startNodeId, to: nodeId, label: '' };
            handleScenarioChange('flow', { ...scenario.flow!, edges: [...scenario.flow!.edges, newEdge] });
        }
        setConnectionDrag(null);
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return;
        const mouseX = e.clientX - canvasRect.left;
        const mouseY = e.clientY - canvasRect.top;

        if (draggingNode) {
            const newX = Math.max(0, mouseX - draggingNode.offset.x);
            const newY = Math.max(0, mouseY - draggingNode.offset.y);
            handleNodeChange(draggingNode.id, 'position', { x: newX, y: newY });
        } else if (connectionDrag) {
            setConnectionDrag(prev => ({ ...prev!, mousePos: { x: mouseX, y: mouseY } }));
        }
    };
    
    const handleCanvasClick = () => {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
    };

    const handleEdgeClick = (e: React.MouseEvent, edgeId: string) => {
        e.stopPropagation();
        setSelectedEdgeId(edgeId);
        setSelectedNodeId(null);
    };

    const addNode = (type: ScenarioNodeType) => {
        const newNode: ScenarioNode = {
            id: `node-${Date.now()}`,
            type: type,
            title: `צומת ${type} חדש`,
            details: '',
            position: { x: 50, y: 50 + (scenario.flow?.nodes.length || 0) * 80 },
        };
        setScenario(prev => ({ ...prev, flow: { ...prev.flow!, nodes: [...(prev.flow?.nodes || []), newNode] }}));
        setSelectedNodeId(newNode.id);
        setSelectedEdgeId(null);
    };

    const deleteNode = (nodeId: string) => {
        setScenario(prev => ({
            ...prev,
            flow: { 
                ...prev.flow!, 
                nodes: prev.flow!.nodes.filter(n => n.id !== nodeId),
                edges: prev.flow!.edges.filter(e => e.from !== nodeId && e.to !== nodeId),
            }
        }));
        if (selectedNodeId === nodeId) setSelectedNodeId(null);
    };

    const deleteEdge = (edgeId: string) => {
        setScenario(prev => ({
            ...prev,
            flow: {
                ...prev.flow!,
                edges: prev.flow!.edges.filter(e => e.id !== edgeId)
            }
        }));
        if (selectedEdgeId === edgeId) setSelectedEdgeId(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        if (scenario.id) {
            await ApiService.updateManualScenario(scenario);
        } else {
            const newScenario = await ApiService.addManualScenario(scenario);
            setScenario(newScenario); // update state with new ID
        }
        setIsSaving(false);
        onBack();
    };
    
    const selectedNode = scenario.flow?.nodes.find(n => n.id === selectedNodeId);
    const selectedEdge = scenario.flow?.edges.find(e => e.id === selectedEdgeId);

    const getNodeStyles = (node: ScenarioNode) => {
        const colors = {
            start: 'bg-green-500', info: 'bg-blue-500', lie: 'bg-red-500', event: 'bg-yellow-500', goal: 'bg-purple-500'
        };
        const borderColors = {
            start: 'ring-green-400', info: 'ring-blue-400', lie: 'ring-red-400', event: 'ring-yellow-400', goal: 'ring-purple-400'
        };
        return {
            base: `absolute p-2 rounded-lg text-white shadow-lg cursor-grab active:cursor-grabbing transition-all duration-200 flex flex-col items-center justify-center text-center`,
            color: colors[node.type] || 'bg-gray-500',
            border: selectedNodeId === node.id ? `ring-2 ring-offset-2 ${theme==='light' ? 'ring-offset-gray-100' : 'ring-offset-gray-800'} ${borderColors[node.type]}` : ''
        };
    };
    const handleClass = 'absolute w-3 h-3 rounded-full bg-white border-2 hover:scale-125 transition-transform';

    if (isLoading) return <LoadingSpinner message="טוען תרחיש..." />;

    return (
        <div className="flex flex-col h-screen" dir="rtl">
            <header className={`flex-shrink-0 p-3 flex justify-between items-center border-b ${theme === 'light' ? 'bg-white border-secondary-200' : 'bg-secondary-800 border-secondary-700'}`}>
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <Button variant="ghost" onClick={onBack} icon={<BackIcon />}>{UI_TEXT.backToDashboard}</Button>
                    <h1 className="text-xl font-bold themed-text-primary hidden sm:block">בונה התרחישים הוויזואלי</h1>
                </div>
                <Button onClick={handleSave} isLoading={isSaving}>{UI_TEXT.save}</Button>
            </header>

            <div className="flex-grow flex flex-row overflow-hidden">
                <aside className={`w-1/4 min-w-[300px] max-w-[400px] p-4 border-l overflow-y-auto ${theme === 'light' ? 'bg-secondary-50 border-secondary-200' : 'bg-secondary-900 border-secondary-700'}`}>
                    <h2 className="text-lg font-bold mb-4 themed-text-primary">{UI_TEXT.manualScenarioSettingsTitle || "הגדרות תרחיש"}</h2>
                    <div className="space-y-4">
                        <Input label={UI_TEXT.manualScenarioNameLabel} value={scenario.caseType} onChange={(e) => handleScenarioChange('caseType', e.target.value)} required />
                        <Textarea label={UI_TEXT.manualScenarioDescriptionLabel} value={scenario.fullCaseDescription} onChange={(e) => handleScenarioChange('fullCaseDescription', e.target.value)} rows={2} />
                        <Select label={UI_TEXT.manualScenarioInterrogateeRoleLabel} value={scenario.interrogateeRole} onChange={(e) => handleScenarioChange('interrogateeRole', e.target.value as InterrogateeRole)} options={Object.values(InterrogateeRole).map(r => ({ value: r, label: r }))} />
                        <Select label={UI_TEXT.manualScenarioDifficultyLabel} value={scenario.userSelectedDifficulty} onChange={(e) => handleScenarioChange('userSelectedDifficulty', e.target.value as DifficultyLevel)} options={Object.values(DifficultyLevel).map(d => ({ value: d, label: d }))} />
                        <Select label={UI_TEXT.manualScenarioTopicLabel} value={scenario.userSelectedTopic} onChange={(e) => handleScenarioChange('userSelectedTopic', e.target.value)} options={PREDEFINED_INVESTIGATION_TOPICS.map(t => ({ value: t, label: t }))} defaultEmptyOption="בחר נושא..." />
                        <Input label={UI_TEXT.profileNameLabel} value={scenario.interrogateeProfile.name} onChange={(e) => handleProfileChange('name', e.target.value)} required />
                    </div>
                </aside>

                <main ref={canvasRef} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onClick={handleCanvasClick} className={`flex-grow relative overflow-hidden ${theme === 'light' ? 'bg-secondary-100' : 'bg-secondary-800'}`}>
                    <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                       <defs>
                         <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                           <path d="M 0 0 L 10 5 L 0 10 z" fill={theme === 'light' ? '#64748b' : '#94a3b8'} />
                         </marker>
                         <marker id="arrow-selected" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                           <path d="M 0 0 L 10 5 L 0 10 z" fill="#60a5fa" />
                         </marker>
                       </defs>
                       {scenario.flow?.edges.map((edge) => {
                           const fromNode = scenario.flow!.nodes.find(n => n.id === edge.from);
                           const toNode = scenario.flow!.nodes.find(n => n.id === edge.to);
                           if (!fromNode || !toNode) return null;
                           const startPos = { x: fromNode.position.x + NODE_WIDTH / 2, y: fromNode.position.y + NODE_HEIGHT };
                           const endPos = { x: toNode.position.x + NODE_WIDTH / 2, y: toNode.position.y };
                           const pathData = getEdgePath(startPos, endPos);
                           const isSelected = selectedEdgeId === edge.id;
                           const pathId = `path-${edge.id}`;
                           const strokeColor = isSelected ? "#60a5fa" : (theme === 'light' ? '#64748b' : '#94a3b8');

                           return (
                             <g key={edge.id}>
                               <path d={pathData} stroke="transparent" strokeWidth="20" fill="none" onClick={(e) => handleEdgeClick(e, edge.id)} style={{ cursor: 'pointer' }} />
                               <path id={pathId} d={pathData} stroke={strokeColor} strokeWidth={isSelected ? "3" : "2"} fill="none" markerEnd={isSelected ? "url(#arrow-selected)" : "url(#arrow)"} />
                               {edge.label && (
                                   <text dy="-5" fontSize="10px" style={{paintOrder: 'stroke', stroke: theme === 'light' ? '#f1f5f9' : '#1e293b', strokeWidth: '3px', strokeLinecap: 'butt', strokeLinejoin: 'miter'}}>
                                       <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle" fill={theme === 'light' ? '#0f172a' : '#f1f5f9'}>
                                           {edge.label}
                                       </textPath>
                                   </text>
                               )}
                             </g>
                           );
                       })}
                       {connectionDrag && (
                           <path d={getEdgePath(connectionDrag.startPos, connectionDrag.mousePos)} stroke="#60a5fa" strokeWidth="2" fill="none" strokeDasharray="5,5" />
                       )}
                    </svg>

                    {scenario.flow?.nodes.map(node => {
                        const style = getNodeStyles(node);
                        return (
                             <div key={node.id} onMouseDown={(e) => handleNodeMouseDown(e, node.id)} className={`${style.base} ${style.color} ${style.border}`} style={{ top: `${node.position.y}px`, left: `${node.position.x}px`, width: `${NODE_WIDTH}px`, height: `${NODE_HEIGHT}px`, zIndex: 1 }}>
                                <div onMouseUp={(e) => handleHandleMouseUp(e, node.id, 'input')} className={`${handleClass} border-cyan-400`} style={{ top: '-6px', left: 'calc(50% - 6px)' }}></div>
                                <p className="font-bold text-sm truncate max-w-full px-1 pointer-events-none">{node.title}</p>
                                <div onMouseDown={(e) => handleHandleMouseDown(e, node.id, 'output')} className={`${handleClass} border-pink-400`} style={{ bottom: '-6px', left: 'calc(50% - 6px)' }}></div>
                            </div>
                        )
                    })}
                </main>

                <aside className={`w-1/4 min-w-[300px] max-w-[400px] p-4 border-r overflow-y-auto ${theme === 'light' ? 'bg-secondary-50 border-secondary-200' : 'bg-secondary-900 border-secondary-700'}`}>
                    {selectedNode && (
                        <div className="space-y-4">
                             <h2 className="text-lg font-bold themed-text-primary">{UI_TEXT.nodeInspectorTitle || "פרטי צומת"}</h2>
                             <Input label={UI_TEXT.nodeTitleLabel || "כותרת"} value={selectedNode.title} onChange={(e) => handleNodeChange(selectedNodeId!, 'title', e.target.value)} />
                             <Select label={UI_TEXT.nodeTypeLabel || "סוג"} value={selectedNode.type} onChange={e => handleNodeChange(selectedNodeId!, 'type', e.target.value as ScenarioNodeType)} options={[
                                {value: 'start', label: 'נקודת התחלה'}, {value: 'info', label: 'מידע'}, {value: 'lie', label: 'שקר'}, {value: 'event', label: 'אירוע'}, {value: 'goal', label: 'מטרה'}
                             ]} />
                             <Textarea label={UI_TEXT.nodeDetailsLabel || "פרטים"} value={selectedNode.details} onChange={e => handleNodeChange(selectedNodeId!, 'details', e.target.value)} rows={8} />
                             <Button variant="danger" size="sm" onClick={() => deleteNode(selectedNodeId!)}>מחק צומת</Button>
                        </div>
                    )}
                    {selectedEdge && (
                         <div className="space-y-4">
                             <h2 className="text-lg font-bold themed-text-primary">פרטי חיבור</h2>
                             <Textarea 
                                label="תווית תנאי (אופציונלי)" 
                                placeholder="לדוגמה: אם החשוד מכחיש"
                                value={selectedEdge.label || ''} 
                                onChange={e => handleEdgeChange(selectedEdgeId!, 'label', e.target.value)} 
                                rows={3}
                            />
                             <Button variant="danger" size="sm" onClick={() => deleteEdge(selectedEdgeId!)}>מחק חיבור</Button>
                        </div>
                    )}
                    {!selectedNode && !selectedEdge && (
                        <div className="text-center themed-text-secondary pt-10">
                            <h2 className="text-lg font-bold mb-4">{UI_TEXT.addNodePrompt || "הוסף צומת חדש"}</h2>
                             <div className="grid grid-cols-2 gap-2">
                                 <Button onClick={() => addNode('start')} icon={<AddNodeIcon/>}>התחלה</Button>
                                 <Button onClick={() => addNode('info')} icon={<AddNodeIcon/>}>מידע</Button>
                                 <Button onClick={() => addNode('lie')} icon={<AddNodeIcon/>}>שקר</Button>
                                 <Button onClick={() => addNode('event')} icon={<AddNodeIcon/>}>אירוע</Button>
                                 <Button onClick={() => addNode('goal')} icon={<AddNodeIcon/>}>מטרה</Button>
                             </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default ScenarioBuilderView;