"use client";

import { useState } from "react";
import { LayoutGrid, MessageSquare, Briefcase, Activity, Settings, Bell, Search, Globe, Shield, Flame, CheckCircle, Circle, Gift, BookOpen, Lock, Unlock, Brain, Target, Coffee, Zap } from "lucide-react";
import Link from "next/link";

export default function CollabDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [myMood, setMyMood] = useState("Focus Mode 🎯");
  
  // Tasks (Dual-Sync Accountability Board)
  const [tasks, setTasks] = useState([
    { id: 1, title: "Finish Backend API Routes", creator: "R", assignee: "R", completed: true, gift: null },
    { id: 2, title: "Review Figma Mockups", creator: "R", assignee: "K", completed: false, gift: { text: "I'll buy the coffee today ☕", revealed: false } },
    { id: 3, title: "Deploy UI to Vercel (Production)", creator: "K", assignee: "Both", completed: false, gift: null },
  ]);

  const [courseUrl, setCourseUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [courseQuestions, setCourseQuestions] = useState<{q: string, a: string}[]>([]);

  // Mock Presence Data
  const onlineUsers = [
    { id: 1, name: "Ruthvik", role: "Admin", status: "online", avatar: "R", mood: myMood },
    { id: 2, name: "Partner (K)", role: "Co-Pilot", status: "online", avatar: "K", mood: "Researching 📚" },
  ];

  const handleTickTask = (id: number) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const completed = !t.completed;
        const gift = t.gift ? { ...t.gift, revealed: completed } : null;
        return { ...t, completed, gift };
      }
      return t;
    }));
  };

  const analyzeCourse = () => {
    if (!courseUrl) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setCourseQuestions([
        { q: "What is the primary difference between Client and Server Components?", a: "" },
        { q: "Explain how real-time caching handles background revalidation.", a: "" },
        { q: "How does 'Shared vs Solo' architecture improve accountability?", a: "" },
      ]);
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-bg text-text-primary font-sans">
      {/* Dynamic Collapsible Sidebar */}
      <aside className="hidden md:flex w-[240px] fixed top-0 left-0 bottom-0 bg-surface border-r border-border flex-col py-6 z-10 transition-all duration-300">
        <div className="px-5 pb-6 border-b border-border mb-5">
          <div className="font-syne text-[18px] font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-sm text-white shadow-lg">
                <Globe size={14} />
              </span>
              CollabSpace
            </div>
          </div>
        </div>

        <div className="px-3 mb-6 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          <div className="text-[10px] font-medium tracking-widest text-text-3 uppercase px-2 mb-3">
            Dashboards
          </div>
          <nav className="space-y-1 mb-6">
            <div className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-[13px] font-medium transition-all ${activeTab === 'Overview' ? 'bg-accent-dim text-accent-2 font-semibold' : 'text-text-3 hover:bg-surface-2'}`} onClick={() => setActiveTab('Overview')}>
              <div className="flex items-center gap-3">
                <LayoutGrid size={16} className={activeTab === 'Overview' ? 'text-accent-2' : ''} />
                Bento Workspace
              </div>
            </div>
            <div className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-[13px] font-medium transition-all ${activeTab === 'Messages' ? 'bg-accent-dim text-accent-2 font-semibold' : 'text-text-3 hover:bg-surface-2'}`} onClick={() => setActiveTab('Messages')}>
              <div className="flex items-center gap-3">
                <MessageSquare size={16} className={activeTab === 'Messages' ? 'text-accent-2' : ''} />
                Live Messaging
              </div>
              <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full">3</span>
            </div>
            <div className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-[13px] font-medium transition-all ${activeTab === 'Tasks' ? 'bg-accent-dim text-accent-2 font-semibold' : 'text-text-3 hover:bg-surface-2'}`} onClick={() => setActiveTab('Tasks')}>
              <div className="flex items-center gap-3">
                <Briefcase size={16} className={activeTab === 'Tasks' ? 'text-accent-2' : ''} />
                Shared Tasks
              </div>
            </div>
          </nav>

          <div className="text-[10px] font-medium tracking-widest text-text-3 uppercase px-2 mb-3">
            Presence & Security
          </div>
          <nav className="space-y-1">
            {onlineUsers.map(user => (
              <div key={user.id} className="flex flex-col gap-1 px-3 py-2 rounded-md hover:bg-surface-2 transition-colors">
                <div className="flex items-center gap-3 text-[13px] text-text-2">
                  <div className="relative">
                    <div className="w-6 h-6 bg-accent-dim text-accent font-bold rounded-full flex items-center justify-center text-[11px]">{user.avatar}</div>
                    <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-surface ${user.status === 'online' ? 'bg-green' : 'bg-text-3'}`}></div>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-text-primary">{user.name}</span>
                    <span className="text-[10px] text-text-3">{user.role}</span>
                  </div>
                </div>
                {/* Live Mood Pill */}
                <div className="ml-9 inline-flex items-center bg-surface border border-border px-2 py-0.5 rounded-md text-[10px] text-text-2 w-max">
                  {user.mood}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-auto px-5 pt-4 border-t border-border flex flex-col gap-3 shrink-0">
          <div className="bg-surface-2 border border-border p-3 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] text-text-3 font-semibold uppercase tracking-wider">Duo-Code Key</span>
            <span className="text-[12px] font-mono text-accent">RUTH-K-940X</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-text-3">
              <Shield size={12} className="text-green" />
              E2E Encrypted
            </div>
            <Settings size={14} className="text-text-3 cursor-pointer hover:text-accent transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-0 md:ml-[240px] flex-1 flex flex-col min-h-screen bg-bg">
        {/* Topbar */}
        <div className="sticky top-0 z-10 px-8 py-5 border-b border-border flex items-center justify-between bg-surface/90 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="font-syne text-xl font-bold text-text-primary hidden md:block">
              {activeTab}
            </h1>
            
            {/* Dashboard Switcher */}
            <div className="flex items-center bg-surface-2 p-1 rounded-lg border border-border shrink-0">
              <Link href="/" className="px-4 py-1.5 text-text-3 hover:text-text-primary rounded-md text-[13px] font-medium transition-colors">
                Resource Brain
              </Link>
              <div className="px-4 py-1.5 bg-accent text-white rounded-md text-[13px] font-semibold shadow-sm cursor-default">
                CollabSpace
              </div>
            </div>

            <span className="px-2 py-1 bg-green-dim text-green text-[11px] font-semibold rounded-md flex items-center gap-1">
              <Activity size={10} /> Live Socket.io Sync
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Selector */}
            <select 
              value={myMood}
              onChange={(e) => setMyMood(e.target.value)}
              className="bg-surface-2 border border-border text-[12px] text-text-primary rounded-md px-2 py-1.5 outline-none cursor-pointer hover:border-accent transition-colors"
            >
              <option value="Focus Mode 🎯">Focus Mode 🎯</option>
              <option value="Taking a Break ☕">Taking a Break ☕</option>
              <option value="Researching 📚">Researching 📚</option>
              <option value="Available 🟢">Available 🟢</option>
            </select>

            <button className="relative p-2 rounded-lg bg-surface-2 border border-border hover:border-accent transition-colors text-text-2 hover:text-accent">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral rounded-full"></span>
            </button>
            <div className="w-9 h-9 bg-accent text-white rounded-lg flex items-center justify-center font-bold shadow-md cursor-pointer">
              R
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 md:p-8">
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* TOP LEFT: Shared Streak & Analytics */}
              <div className="col-span-1 flex flex-col gap-6">
                <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-accent/50 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-coral/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-coral/20 transition-all"></div>
                  <Flame size={48} className="text-coral mb-3 filter drop-shadow-[0_0_8px_rgba(255,107,107,0.5)] animate-pulse" />
                  <h3 className="font-syne text-3xl font-bold text-text-primary">12 Day</h3>
                  <p className="text-[13px] text-text-3 mt-1 font-medium tracking-wide uppercase">Duo Streak Active</p>
                  
                  <div className="mt-5 w-full bg-surface-2 border border-border rounded-lg p-3">
                    <div className="flex justify-between items-center text-[11px] mb-2">
                      <span className="text-text-3">Weekly Goal</span>
                      <span className="text-accent font-semibold">14 / 20 Tasks</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
                   <h3 className="font-syne text-[15px] font-bold text-text-primary mb-4 flex items-center gap-2"><Target size={16} className="text-accent"/> Performance Analytics</h3>
                   <div className="h-32 flex items-end gap-2 justify-between mt-2">
                     {/* Mock Chart */}
                     {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                       <div key={i} className="w-full bg-accent-dim rounded-t-sm relative group cursor-pointer hover:bg-accent transition-colors" style={{ height: h + "%" }}>
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-border text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                           {h} Tasks
                         </div>
                       </div>
                     ))}
                   </div>
                   <div className="flex justify-between mt-2 text-[10px] text-text-3 font-medium px-1">
                     <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                   </div>
                </div>
              </div>

              {/* CENTER: Accountability Board (Task Engine) */}
              <div className="col-span-1 md:col-span-1 lg:col-span-1 bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-syne text-[16px] font-bold text-text-primary flex items-center gap-2">
                    <Briefcase size={16} className="text-accent" />
                    Accountability Board
                  </h3>
                  <button className="text-accent text-[11px] font-semibold hover:underline">+ New Task</button>
                </div>

                <div className="flex gap-2 mb-4">
                  <button className="px-3 py-1 bg-accent text-white text-[11px] font-semibold rounded-full shadow-sm">All Tasks</button>
                  <button className="px-3 py-1 bg-surface-2 border border-border text-text-3 hover:text-text-primary text-[11px] font-semibold rounded-full transition-colors">Shared (Both)</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                  {tasks.map(task => (
                    <div key={task.id} className={"p-3 rounded-lg border transition-all " + (task.completed ? 'bg-surface-2/50 border-border opacity-60' : 'bg-surface-2 border-border hover:border-accent/50')}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => handleTickTask(task.id)} className="mt-0.5 flex-shrink-0 text-text-3 hover:text-green transition-colors">
                          {task.completed ? <CheckCircle size={16} className="text-green" /> : <Circle size={16} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={"text-[13px] font-medium truncate " + (task.completed ? 'line-through text-text-3' : 'text-text-primary')}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {/* Ownership Tags */}
                            <span className={"text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 " + (task.assignee === 'Both' ? 'bg-coral-dim text-coral' : task.assignee === 'R' ? 'bg-accent-dim text-accent' : 'bg-blue-dim text-blue')}>
                              {task.assignee === 'Both' ? 'Dual Task' : "[ " + task.assignee + " ]"}
                            </span>
                            
                            {/* Gift Reveal System */}
                            {task.gift && (
                              <div className={"flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded " + (task.gift.revealed ? 'bg-green-dim text-green' : 'bg-surface border border-dashed border-text-3 text-text-3')}>
                                {task.gift.revealed ? <Unlock size={10} /> : <Lock size={10} />}
                                {task.gift.revealed ? task.gift.text : 'Mystery Gift'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: AI Course Analyzer */}
              <div className="col-span-1 flex flex-col gap-6">
                <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-syne text-[16px] font-bold text-text-primary flex items-center gap-2">
                      <Brain size={16} className="text-blue" />
                      Study Buddy AI
                    </h3>
                  </div>

                  <p className="text-[12px] text-text-3 mb-4 leading-relaxed">
                    Paste a course link or article. The AI will summarize it and generate active-recall questions to quiz your partner.
                  </p>

                  <div className="flex gap-2 mb-6">
                    <input 
                      type="text" 
                      value={courseUrl}
                      onChange={(e) => setCourseUrl(e.target.value)}
                      placeholder="https://..." 
                      className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-[12px] outline-none focus:border-blue transition-colors"
                    />
                    <button 
                      onClick={analyzeCourse}
                      disabled={isAnalyzing || !courseUrl}
                      className="px-4 py-2 bg-blue text-white rounded-lg text-[12px] font-semibold hover:bg-blue/90 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[80px]"
                    >
                      {isAnalyzing ? <span className="animate-spin text-lg leading-none">⚙</span> : 'Analyze'}
                    </button>
                  </div>

                  {courseQuestions.length > 0 && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <h4 className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <Zap size={12} className="text-coral" /> Generated Quiz
                      </h4>
                      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                        {courseQuestions.map((q, i) => (
                          <div key={i} className="bg-surface-2 border border-border rounded-lg p-3 group cursor-pointer hover:border-blue/50 transition-colors">
                            <p className="text-[12px] font-medium text-text-primary mb-2">Q: {q.q}</p>
                            <button className="text-[10px] font-semibold text-blue flex items-center gap-1">
                              <MessageSquare size={10} /> Send to Partner
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {courseQuestions.length === 0 && !isAnalyzing && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                      <BookOpen size={32} className="text-text-3 mb-2" />
                      <p className="text-[11px] text-text-3 max-w-[150px]">Awaiting material for analysis...</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'Messages' && (
            <div className="bg-surface rounded-xl border border-border h-[600px] flex shadow-sm overflow-hidden">
              <div className="w-1/3 border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                  <input type="text" placeholder="Search chats..." className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-accent" />
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 border-b border-border bg-surface-2 cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-[13px] text-text-primary">Partner (K)</span>
                      <span className="text-[10px] text-accent font-medium">Just now</span>
                    </div>
                    <p className="text-[12px] text-text-2 truncate">I answered the quiz on Server Components!</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col bg-bg">
                <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent-dim text-accent font-bold rounded-full flex items-center justify-center">K</div>
                    <div>
                      <div className="text-[13px] font-semibold text-text-primary">Partner (K)</div>
                      <div className="text-[11px] text-green flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green rounded-full"></span> Researching 📚</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-text-3">
                    <Settings size={16} className="cursor-pointer hover:text-accent" />
                  </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                  <div className="self-center bg-surface border border-border rounded-full px-3 py-1 text-[10px] text-text-3 font-medium">Today</div>
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-6 h-6 rounded-full bg-surface-2 flex shrink-0 items-center justify-center text-xs font-bold">K</div>
                    <div className="bg-surface border border-border rounded-2xl rounded-tl-sm p-3 shadow-sm">
                      <p className="text-[13px] text-text-primary">I answered the quiz on Server Components! They render on the server to reduce client bundle size.</p>
                      <span className="text-[9px] text-text-3 mt-1 block">10:42 AM</span>
                    </div>
                  </div>
                  <div className="flex gap-3 max-w-[80%] self-end flex-row-reverse">
                    <div className="w-6 h-6 rounded-full bg-accent text-white flex shrink-0 items-center justify-center text-xs font-bold">R</div>
                    <div className="bg-accent text-white rounded-2xl rounded-tr-sm p-3 shadow-sm">
                      <p className="text-[13px]">Spot on! Ticking off your task now so you can get the mystery gift 👀</p>
                      <span className="text-[9px] text-white/70 mt-1 block text-right">10:45 AM</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-border bg-surface">
                  <div className="relative flex items-center">
                    <input type="text" placeholder="Type a message... (Live Socket Sync)" className="w-full bg-surface-2 border border-border rounded-full py-2.5 pl-4 pr-12 text-[13px] outline-none focus:border-accent" />
                    <button className="absolute right-2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center hover:bg-accent-2 transition-colors">
                      <Zap size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
