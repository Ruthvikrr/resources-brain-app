"use client";

import { useState, useRef, useEffect } from "react";
import { Brain, LayoutGrid, List, Search, GitBranch, Briefcase, Wrench, FileText, Video, FileCheck, RefreshCw, Paperclip, X, Bot, User, Trash2 } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({ total: 0, jobs: 0, tools: 0, documents: 0 });
  const [resources, setResources] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [focusedResource, setFocusedResource] = useState<any | null>(null);

  // Load the real database stats
  const refreshStats = async () => {
    const { data, error } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("Supabase fetch error:", error);
    }
    if (data) {
      console.log("Supabase fetch success data:", data);
      setResources(data);
      setStats({
        total: data.length,
        documents: data.filter(r => r.category === 'PDF' || r.source_type === 'document').length,
        jobs: data.filter(r => r.category === 'Job').length,
        tools: data.filter(r => r.category === 'Tool').length,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to completely erase this memory from your brain?")) return;
    
    // Natively delete the row via Supabase UUID
    await supabase.from('resources').delete().eq('id', id);
    
    // Refresh the live grid and AI dynamic sidebars!
    refreshStats();
  };

  useEffect(() => {
    refreshStats();
  }, []);

  // Hook up exactly to our new Retriever Agent API endpoint!
  const { messages, input: chatInput, handleInputChange: handleChatInput, handleSubmit, isLoading: isChatting, setMessages } = useChat({
    api: '/api/chat',
    body: {
      resourceId: focusedResource?.id // 🧠 Targeted Chat payload!
    }
  });

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Stop the browser from doing a nasty 'GET /?' page reload!
    if (!chatInput || !chatInput.trim()) return;
    handleSubmit(e);
  };

  const handleAnalyze = async () => {
    if (!inputValue && !file) {
      alert("Please provide a web link or attach a document first!");
      return;
    }
    
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else if (inputValue) {
        formData.append("url", inputValue);
      }

      // Send to the AI Backend using FormData
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      
      if (json.success) {
        alert(`✅ Success!\n\nCategory: ${json.data.category}\nTags: ${json.data.tags.join(', ')}\nSummary: ${json.data.summary}`);
        setInputValue("");
        setFile(null);
        refreshStats(); // Immediately update the UI grids!
      } else {
        alert(`Error: ${json.error}`);
      }
    } catch (e: any) {
      alert(`API Error: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg text-text-primary font-sans">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[220px] fixed top-0 left-0 bottom-0 bg-surface border-r border-border flex-col py-6 z-10">
        <div className="px-5 pb-6 border-b border-border mb-5">
          <div className="font-syne text-[18px] font-bold flex items-center gap-2">
            <span className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-sm">
              🧠
            </span>
            Resource Brain
          </div>
        </div>

        <div className="px-3 mb-2">
          <div className="text-[10px] font-medium tracking-widest text-text-3 uppercase px-2 mb-2">
            Dynamic Categories
          </div>
          
          <nav className="space-y-1">
            <NavItem 
              icon={<LayoutGrid size={15} />} 
              label="All Resources" 
              count={resources.length}
              active={activeCategory === "All"} 
              onClick={() => setActiveCategory("All")}
            />
            {/* Dynamically generate sidebar from AI's custom categories */}
            {Array.from(new Set(resources.map(r => r.category))).map(cat => (
               <NavItem 
                 key={cat}
                 icon={<FileText size={15} />} 
                 label={cat as string} 
                 count={resources.filter(r => r.category === cat).length}
                 active={activeCategory === cat} 
                 onClick={() => setActiveCategory(cat as string)}
               />
            ))}
          </nav>
        </div>

        <div className="mt-auto px-5 pt-4 border-t border-border">
          <p className="text-[11px] text-text-3 leading-relaxed">
            AI dynamic category indexing active. Awaiting new links &amp; documents.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-0 md:ml-[220px] flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <div className="sticky top-0 z-10 px-4 md:px-8 py-3 md:py-5 border-b border-border flex items-center gap-2 md:gap-4 bg-[#0a0a0f]/85 backdrop-blur-md">
          <form className="flex-1 max-w-full md:max-w-[550px] relative flex items-center gap-2" onSubmit={handleChatSubmit}>
            <div className="w-full relative flex items-center bg-surface-2 border border-border rounded-lg outline-none focus-within:border-accent transition-all overflow-hidden p-1.5 focus-within:ring-2 ring-accent/20">
              <Search className="absolute left-3.5 text-text-3 pointer-events-none" size={14} />
              
              {/* Targeted Chat UI Indicator */}
              {focusedResource && (
                <div className="ml-8 mr-1 flex items-center gap-1.5 bg-accent text-white text-[11px] font-semibold tracking-wide px-2 py-1 rounded-md shrink-0">
                  <Bot size={12} />
                  <span>Targeted: {focusedResource.title.substring(0, 20)}</span>
                  <X size={12} className="cursor-pointer ml-1 hover:text-white/70" onClick={() => {
                    setFocusedResource(null);
                    setMessages([]);
                  }} />
                </div>
              )}

              <input 
                type="text" 
                value={chatInput}
                onChange={handleChatInput}
                placeholder={focusedResource ? "Ask a targeted question about this..." : "Ask the AI anything about your entire brain..."} 
                className={`w-full bg-transparent text-text-primary text-[13px] py-1 pl-[12px] pr-2 outline-none ${focusedResource ? 'ml-0' : 'pl-8'}`}
              />
            </div>
          </form>
          <div className="hidden sm:flex bg-surface-2 border border-border rounded-lg overflow-hidden ml-auto shrink-0">
            <div className="px-3 py-1.5 md:px-3.5 md:py-2 cursor-pointer bg-accent-dim text-accent-2 transition-all">
              <LayoutGrid size={16} />
            </div>
            <div className="px-3 py-1.5 md:px-3.5 md:py-2 cursor-pointer text-text-3 hover:bg-surface-3 transition-all">
              <List size={16} />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-8 flex-1 w-full max-w-[100vw] overflow-x-hidden border-box">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-syne text-[26px] font-bold text-text-primary">
                {activeCategory === "All" ? "All Resources" : activeCategory}
              </h1>
              <p className="text-[13px] text-text-2 mt-1">Your autonomous second brain — processed and indexed by AI.</p>
            </div>
            
            {/* Mobile Category Nav (renders only on small screens) */}
            <div className="md:hidden w-full flex overflow-x-auto gap-2 pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              <button onClick={() => setActiveCategory("All")} className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${activeCategory === "All" ? 'bg-accent text-white border border-accent' : 'bg-surface border border-border text-text-2'}`}>All</button>
              {Array.from(new Set(resources.map(r => r.category))).map(cat => (
                 <button key={cat as string} onClick={() => setActiveCategory(cat as string)} className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${activeCategory === cat ? 'bg-accent text-white border border-accent' : 'bg-surface border border-border text-text-2'}`}>{cat as string}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
            <StatCard label="Total Saved" num={stats.total.toString()} sub="resources" />
            <StatCard label="Knowledge Vectors" num={stats.total.toString()} sub="embedded" />
            <StatCard label="AI Tag Types" num={Array.from(new Set(resources.flatMap(r => r.tags))).length.toString()} sub="unique tags" />
            <StatCard label="Categorizations" num={Array.from(new Set(resources.map(r => r.category))).length.toString()} sub="dynamic branches" />
          </div>

          {/* Add Panel */}
          <div className="bg-surface border border-border rounded-[14px] p-5 mb-7">
            <h2 className="font-syne text-[14px] font-semibold flex items-center gap-2 mb-3.5">
              <span className="w-1 h-1 bg-accent rounded-full inline-block"></span>
              Add Knowledge to Brain
            </h2>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center relative">
              {/* If a file is selected, show the file name instead of the input box */}
              {file ? (
                <div className="w-full sm:flex-1 flex items-center justify-between bg-accent-dim border border-accent rounded-lg py-2.5 px-3.5">
                  <div className="flex items-center gap-2 text-accent-2 text-[13px] font-medium overflow-hidden">
                    <FileText size={16} />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <button onClick={() => setFile(null)} className="text-accent-2 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-full sm:flex-1 relative flex items-center">
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Paste any URL here..." 
                    className="w-full bg-surface-2 border border-border rounded-lg text-[13px] py-2.5 pl-3.5 pr-12 outline-none focus:border-accent transition-colors text-text-primary"
                  />
                  {/* Paperclip button for documents */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-2 text-text-3 hover:text-accent transition-colors p-1"
                    title="Upload PDF or Document"
                  >
                    <Paperclip size={18} />
                  </button>
                </div>
              )}

              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.doc,.docx,.txt"
              />

              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full sm:w-auto justify-center bg-accent hover:bg-accent-2 text-white font-syne font-semibold text-[13px] h-[40px] px-6 rounded-lg transition-all flex items-center gap-2 hover:-translate-y-[1px] active:scale-95 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed shrink-0"
              >
                <RefreshCw size={14} className={isAnalyzing ? "animate-spin" : "opacity-70"} />
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </div>

          {/* Chat Interface Layer */}
          {messages.length > 0 && (
            <div className="border border-border rounded-[14px] bg-surface overflow-hidden mb-7 flex flex-col">
              <div className="bg-surface-2 px-5 py-3 border-b border-border flex items-center gap-2">
                <Bot size={16} className="text-accent" />
                <span className="font-syne font-semibold text-[13px]">Chat with your Brain</span>
              </div>
              <div className="p-5 max-h-[500px] overflow-y-auto flex flex-col gap-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex gap-3 text-[14px] ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role !== 'user' && (
                      <div className="w-8 h-8 rounded-full bg-accent-dim flex items-center justify-center shrink-0">
                        <Brain size={14} className="text-accent-2" />
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl max-w-[85%] leading-relaxed ${m.role === 'user' ? 'bg-surface-2 border border-border rounded-tr-sm text-text-1' : 'bg-[#15151e] border border-border rounded-tl-sm text-text-2'}`}>
                      {m.content}
                    </div>
                    {m.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-surface-3 border border-border flex items-center justify-center shrink-0">
                        <User size={14} className="text-text-3" />
                      </div>
                    )}
                  </div>
                ))}
                {isChatting && (
                  <div className="flex gap-3 text-[14px] justify-start opacity-70">
                    <div className="w-8 h-8 rounded-full bg-accent-dim flex items-center justify-center shrink-0">
                      <Brain size={14} className="text-accent-2 animate-pulse" />
                    </div>
                    <div className="p-4 rounded-2xl max-w-[85%] bg-[#15151e] border border-border rounded-tl-sm text-text-3">
                      Searching knowledge database...
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* The Data Grid */}
          {messages.length === 0 && resources.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {resources
                 .filter(r => activeCategory === "All" || r.category === activeCategory)
                 .map((item) => (
                   <div key={item.id} className="bg-surface border border-border rounded-xl p-5 hover:border-accent transition-colors flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-accent-2 bg-accent-dim px-2 py-1 rounded inline-block">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-3 text-text-3">
                          <button 
                            onClick={() => {
                              setFocusedResource(item);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`${focusedResource?.id === item.id ? 'text-accent' : 'hover:text-accent'} transition-colors flex items-center gap-1 text-[11px] font-semibold`}
                            title="Chat strictly with this document"
                          >
                            <Bot size={13} /> Focus
                          </button>
                          <span className="text-[10px]">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="hover:text-red-500 transition-colors p-1"
                            title="Delete Memory"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <h3 className="font-syne font-bold text-lg mb-2 text-text-primary truncate" title={item.title}>
                        {item.title}
                      </h3>
                      <p className="text-text-2 text-[13px] mb-4 flex-1 line-clamp-3">
                        {item.summary}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {item.tags?.map((tag: string, index: number) => (
                           <span key={index} className="text-[11px] bg-surface-2 text-text-3 px-2 py-1 rounded border border-border">
                             #{tag}
                           </span>
                        ))}
                      </div>
                   </div>
               ))}
            </div>
          )}

          {/* Empty State */}
          {messages.length === 0 && resources.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4 opacity-40">🧠</div>
              <h3 className="font-syne text-[18px] font-semibold text-text-2 mb-2">Your brain is active</h3>
              <p className="text-[13px] text-text-3 max-w-[300px] mx-auto text-center leading-relaxed">
                Paste a link or upload a document to let the AI start parsing, tagging, and indexing your knowledge. Or, ask a question above!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, count = 0, active = false, onClick }: { icon: React.ReactNode, label: string, count?: number, active?: boolean, onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] font-medium transition-all select-none
      ${active ? 'bg-accent-dim text-accent-2' : 'text-text-2 hover:bg-surface-2 hover:text-text-primary'}`}
    >
      <div className="w-[18px] flex justify-center">{icon}</div>
      <span className="truncate">{label}</span>
      <div className={`ml-auto text-[11px] px-2 py-0.5 rounded-full shrink-0
        ${active ? 'bg-accent-dim/50' : 'bg-surface-3 text-text-3'}`}
      >
        {count}
      </div>
    </div>
  );
}

function StatCard({ label, num, sub }: { label: string, num: string, sub: string }) {
  return (
    <div className="bg-surface border border-border hover:border-border-2 rounded-[14px] p-4 transition-colors">
      <div className="text-[11px] text-text-3 font-medium tracking-[0.04em] uppercase mb-2">{label}</div>
      <div className="font-syne text-[28px] font-bold leading-none mb-1 text-text-primary">{num}</div>
      <div className="text-[11px] text-text-3">{sub}</div>
    </div>
  );
}
