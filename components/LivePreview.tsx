/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState, useRef } from 'react';
import { ArrowDownTrayIcon, PlusIcon, ViewColumnsIcon, DocumentIcon, CodeBracketIcon, XMarkIcon, ChatBubbleLeftRightIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Creation } from './CreationHistory';
import { PersonaChat } from './PersonaChat';

interface LivePreviewProps {
  creation: Creation | null;
  isLoading: boolean;
  isFocused: boolean;
  onReset: () => void;
}

// Add type definition for the global pdfjsLib
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const LoadingStep = ({ text, active, completed }: { text: string, active: boolean, completed: boolean }) => (
    <div className={`flex items-center space-x-3 transition-all duration-500 ${active || completed ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'}`}>
        <div className={`w-4 h-4 flex items-center justify-center ${completed ? 'text-green-400' : active ? 'text-blue-400' : 'text-zinc-700'}`}>
            {completed ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : active ? (
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
            ) : (
                <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full"></div>
            )}
        </div>
        <span className={`font-mono text-xs tracking-wide uppercase ${active ? 'text-zinc-200' : completed ? 'text-zinc-400 line-through' : 'text-zinc-600'}`}>{text}</span>
    </div>
);

const PdfRenderer = ({ dataUrl }: { dataUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPdf = async () => {
      if (!window.pdfjsLib) {
        setError("PDF library not initialized");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Load the document
        const loadingTask = window.pdfjsLib.getDocument(dataUrl);
        const pdf = await loadingTask.promise;
        
        // Get the first page
        const page = await pdf.getPage(1);
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        
        // Calculate scale to make it look good (High DPI)
        const viewport = page.getViewport({ scale: 2.0 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        setLoading(false);
      } catch (err) {
        console.error("Error rendering PDF:", err);
        setError("Could not render PDF preview.");
        setLoading(false);
      }
    };

    renderPdf();
  }, [dataUrl]);

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
            <DocumentIcon className="w-12 h-12 mb-3 opacity-50 text-red-400" />
            <p className="text-sm mb-2 text-red-400/80">{error}</p>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        )}
        <canvas 
            ref={canvasRef} 
            className={`max-w-full max-h-full object-contain shadow-xl border border-zinc-800/50 rounded transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
    </div>
  );
};

export const LivePreview: React.FC<LivePreviewProps> = ({ creation, isLoading, isFocused, onReset }) => {
    const [loadingStep, setLoadingStep] = useState(0);
    const [showLeftPanel, setShowLeftPanel] = useState(false);
    const [activeTab, setActiveTab] = useState<'source' | 'chat'>('source');
    const [isSpookyActive, setIsSpookyActive] = useState(false);

    // Handle loading animation steps
    useEffect(() => {
        if (isLoading) {
            setLoadingStep(0);
            const interval = setInterval(() => {
                setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
            }, 2000); 
            return () => clearInterval(interval);
        } else {
            setLoadingStep(0);
        }
    }, [isLoading]);

    // Default to Left Panel with Source tab when a new creation with an image is loaded
    useEffect(() => {
        setIsSpookyActive(false);
        if (creation?.originalImage) {
            setShowLeftPanel(true);
            setActiveTab('source');
        } else {
            setShowLeftPanel(false);
            setActiveTab('chat');
        }
    }, [creation]);

    const handleExport = () => {
        if (!creation) return;
        const dataStr = JSON.stringify(creation, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${creation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_artifact.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

  return (
    <div
      className={`
        fixed z-40 flex flex-col
        rounded-lg overflow-hidden border border-zinc-800 bg-[#0E0E10] shadow-2xl
        transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)
        ${isFocused
          ? 'inset-2 md:inset-4 opacity-100 scale-100'
          : 'top-1/2 left-1/2 w-[90%] h-[60%] -translate-x-1/2 -translate-y-1/2 opacity-0 scale-95 pointer-events-none'
        }
      `}
    >
      {/* Minimal Technical Header */}
      <div className="bg-[#121214] px-4 py-3 flex items-center justify-between border-b border-zinc-800 shrink-0">
        {/* Left: Controls */}
        <div className="flex items-center space-x-3 w-32">
           <div className="flex space-x-2 group/controls">
                <button 
                  onClick={onReset}
                  className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-red-500 hover:!bg-red-600 transition-colors flex items-center justify-center focus:outline-none"
                  title="Close Preview"
                >
                  <XMarkIcon className="w-2 h-2 text-black opacity-0 group-hover/controls:opacity-100" />
                </button>
                <div className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-yellow-500 transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-green-500 transition-colors"></div>
           </div>
        </div>
        
        {/* Center: Title */}
        <div className="flex items-center space-x-2 text-zinc-500">
            <CodeBracketIcon className="w-3 h-3" />
            <span className="text-[11px] font-mono uppercase tracking-wider">
                {isLoading ? 'System Processing...' : creation ? creation.name : 'Preview Mode'}
            </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end space-x-1 w-32">
            {!isLoading && creation && (
                <>
                    <button 
                        id="toggle_chat_btn"
                        onClick={() => {
                            if (showLeftPanel && activeTab === 'chat') {
                                setShowLeftPanel(false);
                            } else {
                                setShowLeftPanel(true);
                                setActiveTab('chat');
                            }
                        }}
                        title="Chat with Persona"
                        className={`p-1.5 rounded-md transition-all ${showLeftPanel && activeTab === 'chat' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                    >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    </button>

                    {creation.originalImage && (
                         <button 
                            id="toggle_source_btn"
                            onClick={() => {
                                if (showLeftPanel && activeTab === 'source') {
                                    setShowLeftPanel(false);
                                } else {
                                    setShowLeftPanel(true);
                                    setActiveTab('source');
                                }
                            }}
                            title={showLeftPanel && activeTab === 'source' ? "Hide Source Layout" : "View Source Layout"}
                            className={`p-1.5 rounded-md transition-all ${showLeftPanel && activeTab === 'source' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                        >
                            <ViewColumnsIcon className="w-4 h-4" />
                        </button>
                    )}

                    <button 
                        id="export_artifact_btn"
                        onClick={handleExport}
                        title="Export Artifact (JSON)"
                        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-md hover:bg-zinc-800"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>

                    <button 
                        id="new_upload_btn"
                        onClick={onReset}
                        title="New Upload"
                        className="ml-2 flex items-center space-x-1 text-xs font-bold bg-white text-black hover:bg-zinc-200 px-3 py-1.5 rounded-md transition-colors"
                    >
                        <PlusIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">New</span>
                    </button>
                </>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full flex-1 bg-[#09090b] flex overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 w-full">
             {/* Technical Loading State */}
             <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 mb-6 text-blue-500 animate-spin-slow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-zinc-100 font-mono text-lg tracking-tight">Constructing Environment</h3>
                    <p className="text-zinc-500 text-sm mt-2">Interpreting visual data...</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-[loading_3s_ease-in-out_infinite] w-1/3"></div>
                </div>

                 {/* Terminal Steps */}
                 <div className="border border-zinc-800 bg-black/50 rounded-lg p-4 space-y-3 font-mono text-sm">
                     <LoadingStep text="Analyzing visual inputs" active={loadingStep === 0} completed={loadingStep > 0} />
                     <LoadingStep text="Identifying UI patterns" active={loadingStep === 1} completed={loadingStep > 1} />
                     <LoadingStep text="Generating functional logic" active={loadingStep === 2} completed={loadingStep > 2} />
                     <LoadingStep text="Compiling preview" active={loadingStep === 3} completed={loadingStep > 3} />
                 </div>
             </div>
          </div>
        ) : creation?.html ? (
          <>
            {/* Split View: Left Panel (Original Image or Chat) */}
            {showLeftPanel && (
                <div className="w-full md:w-[420px] lg:w-[460px] h-1/2 md:h-full border-b md:border-b-0 md:border-r border-zinc-800 bg-[#0c0c0e] relative flex flex-col shrink-0 transition-all duration-300">
                    {/* Panel Tab Header */}
                    {creation.originalImage ? (
                        <div className="bg-[#0f0f11] px-3 py-2 flex border-b border-zinc-900 gap-1 shrink-0">
                            <button
                                onClick={() => setActiveTab('source')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all ${
                                    activeTab === 'source'
                                        ? 'bg-zinc-800 text-zinc-100'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                                }`}
                            >
                                <PhotoIcon className="w-3.5 h-3.5" />
                                <span>Source Sketch</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all ${
                                    activeTab === 'chat'
                                        ? 'bg-zinc-800 text-zinc-100'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                                }`}
                            >
                                <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                                <span>Persona Chat</span>
                            </button>
                        </div>
                    ) : (
                        <div className="bg-[#0f0f11] px-4 py-2 border-b border-zinc-900 flex items-center shrink-0">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Persona Chat</span>
                        </div>
                    )}

                    {/* Left Panel Content */}
                    <div className="flex-1 overflow-hidden relative">
                        {activeTab === 'source' && creation.originalImage ? (
                            <div className="w-full h-full p-6 flex items-center justify-center overflow-hidden">
                                <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur text-zinc-400 text-[10px] font-mono uppercase px-2 py-1 rounded border border-zinc-800">
                                    Input Source
                                </div>
                                {creation.originalImage.startsWith('data:application/pdf') ? (
                                    <PdfRenderer dataUrl={creation.originalImage} />
                                ) : (
                                    <img 
                                        src={creation.originalImage} 
                                        alt="Original Input" 
                                        className="max-w-full max-h-full object-contain shadow-xl border border-zinc-800/50 rounded"
                                    />
                                )}
                            </div>
                        ) : (
                            <PersonaChat 
                                creation={creation} 
                                isSpookyActive={isSpookyActive}
                                onSpookyTrigger={(active) => {
                                    setIsSpookyActive(active);
                                    if (active) {
                                        setShowLeftPanel(true);
                                        setActiveTab('chat');
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* App Preview Panel */}
            <div className={`relative h-full transition-all duration-500 flex-1 ${isSpookyActive ? 'bg-black' : 'bg-white'}`}>
                 <iframe
                    title="Gemini Live Preview"
                    srcDoc={creation.html}
                    className={`w-full h-full transition-all duration-500 ${isSpookyActive ? 'opacity-90 grayscale brightness-75 contrast-125' : ''}`}
                    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                />
                
                {isSpookyActive && (
                    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden bg-green-950/5 border-2 border-green-500/30 animate-pulse">
                        {/* CRT scanline effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px]"></div>
                        
                        {/* Spooky Glowing Corners */}
                        <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(34,197,94,0.35)]"></div>

                        {/* Active Cheat Mode Indicator */}
                        <div className="absolute top-4 right-4 bg-black/80 text-green-400 border border-green-500/20 text-[9px] font-mono uppercase px-2 py-1 rounded tracking-widest flex items-center gap-1.5 backdrop-blur shadow-lg">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                            <span>Haunted Active (Type 'exorcise' to clear)</span>
                        </div>

                        {/* Dynamic Spectral floating ghosts */}
                        <div className="absolute bottom-[-50px] left-[15%] text-2xl animate-float-ghost-1 opacity-60">👻</div>
                        <div className="absolute bottom-[-50px] left-[45%] text-3xl animate-float-ghost-2 opacity-50">👻</div>
                        <div className="absolute bottom-[-50px] left-[75%] text-2xl animate-float-ghost-3 opacity-60">💀</div>

                        {/* Style definitions for spectral drift */}
                        <style>{`
                            @keyframes floatGhost1 {
                                0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
                                10% { opacity: 0.6; }
                                90% { opacity: 0.6; }
                                100% { transform: translateY(-700px) translateX(30px) scale(1.2); opacity: 0; }
                            }
                            @keyframes floatGhost2 {
                                0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; }
                                15% { opacity: 0.5; }
                                85% { opacity: 0.5; }
                                100% { transform: translateY(-750px) translateX(-40px) scale(1.1); opacity: 0; }
                            }
                            @keyframes floatGhost3 {
                                0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
                                20% { opacity: 0.6; }
                                80% { opacity: 0.6; }
                                100% { transform: translateY(-650px) translateX(20px) scale(0.9); opacity: 0; }
                            }
                            .animate-float-ghost-1 {
                                animation: floatGhost1 8s infinite linear;
                            }
                            .animate-float-ghost-2 {
                                animation: floatGhost2 10s infinite linear;
                                animation-delay: 2s;
                            }
                            .animate-float-ghost-3 {
                                animation: floatGhost3 7s infinite linear;
                                animation-delay: 4.5s;
                            }
                        `}</style>
                    </div>
                )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
