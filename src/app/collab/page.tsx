"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, MessageSquare, Briefcase, Activity, Settings, Bell, Search, Globe, Shield, Flame, CheckCircle, Circle, Gift, BookOpen, Lock, Unlock, Brain, Target, Coffee, Zap, X, Library, FileText, Link as LinkIcon, Plus, Trash2, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

export default function CollabDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeUser, setActiveUser] = useState<{id: number, name: string, role: string, avatar: string} | null>(null);
  
  const [activeTab, setActiveTab] = useState("Overview");
  const [myMood, setMyMood] = useState("Focus Mode 🎯");
  
  // Tasks (Dual-Sync Accountability Board)
  const [tasks, setTasks] = useState<any[]>([]);

  const [courseUrl, setCourseUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [courseQuestions, setCourseQuestions] = useState<{q: string, a: string}[]>([]);

  // Modal State for Tasks
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("Both");
  const [newTaskGift, setNewTaskGift] = useState("");

  // Learning Vault State
  const [vaultSessions, setVaultSessions] = useState<any[]>([]);
  const [activeVaultSessionId, setActiveVaultSessionId] = useState<string | null>(null);

  const [isNewPathModalOpen, setIsNewPathModalOpen] = useState(false);
  const [newPathTitle, setNewPathTitle] = useState("");

  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
  const [newTopicTitles, setNewTopicTitles] = useState("");

  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceType, setNewResourceType] = useState("link");
  const [newResourceUrl, setNewResourceUrl] = useState("");

  // Mock Presence Data
  const onlineUsers = [
    { id: 1, name: "Ruthvik", role: "Admin", status: "online", avatar: "R", mood: myMood },
    { id: 2, name: "Babe (Keer) ❤️", role: "Co-Pilot", status: "online", avatar: "K", mood: "Researching 📚" },
  ];

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubTasks = onSnapshot(collection(db, 'collab_tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubVault = onSnapshot(collection(db, 'collab_vault_sessions'), (snapshot) => {
      const loadedSessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVaultSessions(loadedSessions);
      if (loadedSessions.length > 0 && !activeVaultSessionId) {
         setActiveVaultSessionId(loadedSessions[0].id);
      }
    });
    return () => { unsubTasks(); unsubVault(); };
  }, [isAuthenticated, activeVaultSessionId]);

  const handleTickTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const completed = !task.completed;
    const gift = task.gift ? { ...task.gift, revealed: completed } : null;
    await updateDoc(doc(db, 'collab_tasks', id), { completed, gift });
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

  const handleCreateTask = async () => {
    if (!newTaskTitle) return;
    try {
      await addDoc(collection(db, 'collab_tasks'), {
        title: newTaskTitle,
        creator: activeUser?.avatar || "R",
        assignee: newTaskAssignee,
        completed: false,
        gift: newTaskGift ? { text: newTaskGift, revealed: false } : null,
        createdAt: Date.now()
      });
      setIsNewTaskModalOpen(false);
      setNewTaskTitle("");
      setNewTaskGift("");
    } catch (e: any) {
      console.error(e);
      alert("Error: " + e.message);
    }
  };

  const handleToggleTopic = async (sessionId: string, topicId: number) => {
    const session = vaultSessions.find(s => s.id === sessionId);
    if (!session) return;
    const newTopics = session.topics.map((t: any) => t.id === topicId ? { ...t, completed: !t.completed } : t);
    const completedCount = newTopics.filter((t: any) => t.completed).length;
    const progress = Math.round((completedCount / newTopics.length) * 100) || 0;
    await updateDoc(doc(db, 'collab_vault_sessions', sessionId), { topics: newTopics, progress });
  };

  const handleCreateVaultSession = async () => {
    if (!newPathTitle) return;
    const newDoc = await addDoc(collection(db, 'collab_vault_sessions'), {
      title: newPathTitle,
      progress: 0,
      topics: [],
      resources: [],
      createdAt: Date.now()
    });
    setActiveVaultSessionId(newDoc.id);
    setIsNewPathModalOpen(false);
    setNewPathTitle("");
  };

  const handleLogin = () => {
    if (usernameInput === "ruthvik" && passwordInput === "123456") {
      setActiveUser({ id: 1, name: "Ruthvik", role: "Admin", avatar: "R" });
      setIsAuthenticated(true);
      setLoginError("");
    } else if (usernameInput === "keer" && passwordInput === "123456") {
      setActiveUser({ id: 2, name: "Babe (Keer) ❤️", role: "Co-Pilot", avatar: "K" });
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Invalid username or password");
    }
  };

  const handleAddTopics = async () => {
    if (!newTopicTitles.trim() || !activeVaultSessionId) return;
    const titles = newTopicTitles.split('\n').map(t => t.trim()).filter(t => t);
    if (titles.length === 0) return;
    const session = vaultSessions.find(s => s.id === activeVaultSessionId);
    if (!session) return;
    const newTopicsList = [...session.topics];
    titles.forEach(t => {
      newTopicsList.push({ id: Date.now() + Math.random(), title: t, completed: false });
    });
    const progress = Math.round((newTopicsList.filter(t => t.completed).length / newTopicsList.length) * 100) || 0;
    await updateDoc(doc(db, 'collab_vault_sessions', activeVaultSessionId), { topics: newTopicsList, progress });
    setIsAddTopicModalOpen(false);
    setNewTopicTitles("");
  };

  const handleAddResource = async () => {
    if (!newResourceTitle.trim() || !activeVaultSessionId) return;
    const session = vaultSessions.find(s => s.id === activeVaultSessionId);
    if (!session) return;
    const newResources = [...session.resources, {
      id: Date.now(),
      title: newResourceTitle,
      type: newResourceType,
      url: newResourceUrl || "#"
    }];
    await updateDoc(doc(db, 'collab_vault_sessions', activeVaultSessionId), { resources: newResources });
    setIsAddResourceModalOpen(false);
    setNewResourceTitle("");
    setNewResourceUrl("");
  };

  const handleDeleteTask = async (id: string) => {
    await deleteDoc(doc(db, 'collab_tasks', id));
  };

  const handleDeleteVaultSession = async (id: string) => {
    await deleteDoc(doc(db, 'collab_vault_sessions', id));
    if (activeVaultSessionId === id) setActiveVaultSessionId(null);
  };

  const handleDeleteTopic = async (sessionId: string, topicId: number) => {
    const session = vaultSessions.find(s => s.id === sessionId);
    if (!session) return;
    const newTopics = session.topics.filter((t: any) => t.id !== topicId);
    const completedCount = newTopics.filter((t: any) => t.completed).length;
    const progress = newTopics.length ? Math.round((completedCount / newTopics.length) * 100) : 0;
    await updateDoc(doc(db, 'collab_vault_sessions', sessionId), { topics: newTopics, progress });
  };

  const handleDeleteResource = async (sessionId: string, resourceId: number) => {
    const session = vaultSessions.find(s => s.id === sessionId);
    if (!session) return;
    const newResources = session.resources.filter((r: any) => r.id !== resourceId);
    await updateDoc(doc(db, 'collab_vault_sessions', sessionId), { resources: newResources });
  };

  // --- REAL-TIME CALCULATIONS ---
  const completedTasksCount = tasks.filter((t: any) => t.completed).length;
  const totalTasksCount = tasks.length;
  const weeklyGoalTotal = Math.max(20, Math.ceil(totalTasksCount / 10) * 10);
  const progressPercent = totalTasksCount === 0 ? 0 : Math.round((completedTasksCount / weeklyGoalTotal) * 100);
  const activeStreak = Math.floor(completedTasksCount / 3) + 1;

  const getGraphData = () => {
    const days = [0, 0, 0, 0, 0, 0, 0];
    const getMappedDay = (dayIndex: number) => (dayIndex + 6) % 7; 
    
    tasks.forEach((t: any) => {
      if (t.createdAt) {
         const d = new Date(t.createdAt);
         if (Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000) {
            days[getMappedDay(d.getDay())]++;
         }
      } else {
         days[3]++; // Fallback for tasks created before tracking createdAt
      }
    });
    return days;
  };
  const taskCounts = getGraphData();
  const maxTasks = Math.max(...taskCounts, 5);
  const graphHeights = taskCounts.map(count => Math.round((count / maxTasks) * 100));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-text-primary font-sans relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-coral/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="bg-surface border border-border p-10 rounded-2xl shadow-xl w-full max-w-md text-center relative z-10 backdrop-blur-md">
          <div className="w-16 h-16 bg-gradient-to-br from-coral to-accent text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-coral/20">
            <HeartHandshake size={32} />
          </div>
          <h1 className="font-syne text-2xl font-bold mb-2">Join CollabSpace</h1>
          <p className="text-[13px] text-text-3 mb-8">Login to sync with your partner's dashboard in real-time.</p>
          
          <div className="space-y-4 mb-8">
            <div className="text-left">
              <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-1 block">Username</label>
              <input 
                type="text" 
                placeholder="e.g. ruthvik" 
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-[14px] outline-none focus:border-accent font-mono transition-colors" 
                value={usernameInput} 
                onChange={e => setUsernameInput(e.target.value)} 
              />
            </div>
            <div className="text-left">
              <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-1 block">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-surface-2 border border-border rounded-lg px-4 py-3 text-[14px] outline-none focus:border-accent transition-colors" 
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
              />
            </div>
            {loginError && <div className="text-[12px] text-coral text-center font-bold">{loginError}</div>}
          </div>
          
          <button 
            onClick={handleLogin} 
            className="w-full bg-accent text-white font-bold py-3.5 rounded-lg shadow-md hover:bg-accent-2 transition-all hover:-translate-y-0.5"
          >
            Connect to Workspace
          </button>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-text-3">
            <Shield size={12} className="text-green" /> E2E Encrypted Connection
          </div>
          
          <Link href="/" className="inline-block mt-6 text-[12px] font-medium text-text-3 hover:text-accent transition-colors border-t border-border w-full pt-6">
            ← Return to Resource Brain
          </Link>
        </div>
      </div>
    );
  }

  const renderAccountabilityBoard = () => (
    <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-syne text-[16px] font-bold text-text-primary flex items-center gap-2">
          <Briefcase size={16} className="text-accent" />
          Accountability Board
        </h3>
        <button onClick={() => setIsNewTaskModalOpen(true)} className="text-accent text-[11px] font-semibold hover:underline bg-accent/10 px-3 py-1.5 rounded-md hover:bg-accent/20 transition-colors">
          + New Task
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button className="px-3 py-1 bg-accent text-white text-[11px] font-semibold rounded-full shadow-sm">All Tasks</button>
        <button className="px-3 py-1 bg-surface-2 border border-border text-text-3 hover:text-text-primary text-[11px] font-semibold rounded-full transition-colors">Shared (Both)</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
        {tasks.map((task: any) => (
          <div key={task.id} className={"p-3 rounded-lg border transition-all " + (task.completed ? 'bg-surface-2/50 border-border opacity-60' : 'bg-surface-2 border-border hover:border-accent/50')}>
            <div className="flex items-start gap-3 group/task">
              <button onClick={() => handleDeleteTask(task.id)} className="mt-0.5 flex-shrink-0 text-text-3 opacity-0 group-hover/task:opacity-100 hover:text-coral transition-all">
                <Trash2 size={16} />
              </button>
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
        {tasks.length === 0 && (
          <div className="py-10 text-center text-text-3 text-[13px]">
            No shared tasks yet. Create one!
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg text-text-primary font-sans relative">
      {/* Dynamic Collapsible Sidebar */}
      <aside className="hidden md:flex w-[240px] fixed top-0 left-0 bottom-0 bg-surface border-r border-border flex-col py-6 z-10 transition-all duration-300">
        <div className="px-5 pb-6 border-b border-border mb-5">
          <div className="font-syne text-[18px] font-bold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 bg-gradient-to-br from-coral to-accent rounded-lg flex items-center justify-center text-sm text-white shadow-lg">
                <HeartHandshake size={14} />
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
            <div className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-[13px] font-medium transition-all ${activeTab === 'Learning Vault' ? 'bg-accent-dim text-accent-2 font-semibold' : 'text-text-3 hover:bg-surface-2'}`} onClick={() => setActiveTab('Learning Vault')}>
              <div className="flex items-center gap-3">
                <Library size={16} className={activeTab === 'Learning Vault' ? 'text-accent-2' : ''} />
                Learning Vault
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
            <span className="text-[10px] text-text-3 font-semibold uppercase tracking-wider">Couples Sync Key</span>
            <span className="text-[12px] font-mono text-accent">{"RUTH-K-940X"}</span>
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
        <div className="p-6 md:p-8 flex-1 flex flex-col">
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* TOP LEFT: Shared Streak & Analytics */}
              <div className="col-span-1 flex flex-col gap-6">
                <div className="bg-surface rounded-xl border border-border p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-accent/50 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-coral/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-coral/20 transition-all"></div>
                  <Flame size={48} className="text-coral mb-3 filter drop-shadow-[0_0_8px_rgba(255,107,107,0.5)] animate-pulse" />
                  <h3 className="font-syne text-3xl font-bold text-text-primary">{activeStreak} Day</h3>
                  <p className="text-[13px] text-text-3 mt-1 font-medium tracking-wide uppercase">Duo Streak Active</p>
                  
                  <div className="mt-5 w-full bg-surface-2 border border-border rounded-lg p-3">
                    <div className="flex justify-between items-center text-[11px] mb-2">
                      <span className="text-text-3">Weekly Goal</span>
                      <span className="text-accent font-semibold">{completedTasksCount} / {weeklyGoalTotal} Tasks</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
                   <h3 className="font-syne text-[15px] font-bold text-text-primary mb-4 flex items-center gap-2"><Target size={16} className="text-accent"/> Performance Analytics</h3>
                   <div className="h-32 flex items-end gap-2 justify-between mt-2">
                     {graphHeights.map((h, i) => (
                       <div key={i} className="w-full bg-accent-dim rounded-t-sm relative group cursor-pointer hover:bg-accent transition-colors" style={{ height: h + "%" }}>
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-border text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                           {taskCounts[i]} Tasks
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
              <div className="col-span-1 md:col-span-1 lg:col-span-1">
                {renderAccountabilityBoard()}
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

          {activeTab === 'Tasks' && (
            <div className="flex-1 max-w-4xl w-full mx-auto pb-8">
              {renderAccountabilityBoard()}
            </div>
          )}
          
          {activeTab === 'Learning Vault' && (
            <div className="flex flex-1 gap-6 max-h-[calc(100vh-140px)]">
              {/* Sidebar for Vault Sessions */}
              <div className="w-1/3 bg-surface rounded-xl border border-border flex flex-col overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border flex justify-between items-center bg-surface-2/50 shrink-0">
                  <h3 className="font-syne font-bold text-[14px] flex items-center gap-2"><Library size={14} className="text-accent" /> Learning Paths</h3>
                  <button onClick={() => setIsNewPathModalOpen(true)} className="text-accent text-[12px] font-semibold hover:underline bg-accent/10 px-2 py-1 rounded">+ New Path</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {vaultSessions.map((session: any) => (
                     <div 
                       key={session.id} 
                       className={`p-4 rounded-xl border transition-all relative group/session ${activeVaultSessionId === session.id ? 'bg-accent/5 border-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]' : 'bg-surface-2 border-border hover:border-accent/50'}`}
                     >
                       <button onClick={(e) => { e.stopPropagation(); handleDeleteVaultSession(session.id); }} className="absolute top-3 right-3 text-text-3 opacity-0 group-hover/session:opacity-100 hover:text-coral transition-all z-10">
                         <Trash2 size={14} />
                       </button>
                       <div onClick={() => setActiveVaultSessionId(session.id)} className="cursor-pointer">
                         <h4 className="font-semibold text-[13px] mb-3 pr-6 leading-tight">{session.title}</h4>
                         <div className="flex justify-between text-[10px] font-semibold text-text-3 mb-1.5">
                           <span>Progress</span>
                           <span className="text-accent">{session.progress}%</span>
                         </div>
                         <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border/50">
                           <div className="h-full bg-accent rounded-full transition-all duration-500 ease-out" style={{ width: session.progress + '%' }}></div>
                         </div>
                       </div>
                     </div>
                  ))}
                </div>
              </div>

              {/* Content of Active Session */}
              <div className="flex-1 bg-surface rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
                {(() => {
                  const session = vaultSessions.find(s => s.id === activeVaultSessionId);
                  if (!session) return <div className="m-auto text-text-3 text-[13px] font-medium">Select a learning path to view details.</div>;
                  return (
                    <>
                      <div className="p-6 border-b border-border bg-gradient-to-r from-accent/5 to-transparent shrink-0">
                        <h2 className="font-syne text-[22px] font-bold text-text-primary mb-3">{session.title}</h2>
                        <div className="flex gap-4 text-[12px] text-text-3 font-medium">
                          <span className="flex items-center gap-1.5 bg-surface px-2 py-1 rounded border border-border"><BookOpen size={12} className="text-accent"/> {session.topics.length} Topics</span>
                          <span className="flex items-center gap-1.5 bg-surface px-2 py-1 rounded border border-border"><FileText size={12} className="text-blue"/> {session.resources.length} Saved Resources</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
                        {/* Tracker */}
                        <div>
                           <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                             <h3 className="font-bold text-[14px] flex items-center gap-2 text-text-primary"><Target size={16} className="text-accent"/> Syllabus & Progress Tracker</h3>
                             <button onClick={() => setIsAddTopicModalOpen(true)} className="text-[11px] font-semibold text-text-3 hover:text-accent flex items-center gap-1"><Plus size={12}/> Add Topic</button>
                           </div>
                           <div className="space-y-2">
                             {session.topics.map((topic: any) => (
                               <div key={topic.id} className="flex items-center gap-3 p-2 hover:bg-surface-2 rounded-lg transition-colors group">
                                 <button onClick={() => handleToggleTopic(session.id, topic.id)} className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${topic.completed ? 'bg-green border-green text-white shadow-sm' : 'border-text-3 bg-surface group-hover:border-accent'}`}>
                                   {topic.completed && <CheckCircle size={10} />}
                                 </button>
                                 <span className={`text-[13px] flex-1 ${topic.completed ? 'line-through text-text-3' : 'text-text-primary font-medium'}`}>{topic.title}</span>
                                 <button onClick={() => handleDeleteTopic(session.id, topic.id)} className="text-text-3 opacity-0 group-hover:opacity-100 hover:text-coral transition-all">
                                   <Trash2 size={14} />
                                 </button>
                               </div>
                             ))}
                           </div>
                        </div>

                        {/* Resources */}
                        <div>
                           <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                             <h3 className="font-bold text-[14px] flex items-center gap-2 text-text-primary"><Globe size={16} className="text-blue"/> Vault Storage</h3>
                             <button onClick={() => setIsAddResourceModalOpen(true)} className="text-[11px] font-semibold text-text-3 hover:text-blue flex items-center gap-1"><Plus size={12}/> Upload Resource</button>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                             {session.resources.map((res: any) => (
                               <div key={res.id} className="relative group/resource">
                                 <a href={res.url} target="_blank" className="flex items-center gap-3 p-3 border border-border rounded-xl bg-surface-2 hover:border-blue/50 hover:shadow-sm transition-all h-full">
                                   <div className="w-10 h-10 rounded-lg bg-blue/10 text-blue flex items-center justify-center shrink-0 group-hover/resource:bg-blue group-hover/resource:text-white transition-colors">
                                     {res.type === 'link' ? <LinkIcon size={16}/> : <FileText size={16}/>}
                                   </div>
                                   <div className="min-w-0 pr-6">
                                     <p className="text-[13px] font-bold truncate text-text-primary group-hover/resource:text-blue transition-colors">{res.title}</p>
                                     <p className="text-[10px] text-text-3 font-semibold uppercase tracking-wide mt-0.5">{res.type}</p>
                                   </div>
                                 </a>
                                 <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteResource(session.id, res.id); }} className="absolute top-1/2 -translate-y-1/2 right-3 text-text-3 opacity-0 group-hover/resource:opacity-100 hover:text-coral transition-all z-10 p-1 bg-surface-2 rounded-md border border-border/50">
                                   <Trash2 size={12} />
                                 </button>
                               </div>
                             ))}
                           </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {activeTab === 'Messages' && (
            <div className="bg-surface rounded-xl border border-border h-[600px] flex shadow-sm overflow-hidden">
              <div className="w-1/3 border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                  <input type="text" placeholder="Search chats..." className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-accent" />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="p-4 border-b border-border bg-surface-2 cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-[13px] text-text-primary">Babe (Keer) ❤️</span>
                      <span className="text-[10px] text-accent font-medium">Just now</span>
                    </div>
                    <p className="text-[12px] text-text-2 truncate">I answered the quiz on Server Components!</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col bg-bg">
                <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-coral/10 text-coral font-bold rounded-full flex items-center justify-center">K</div>
                    <div>
                      <div className="text-[13px] font-semibold text-text-primary">Babe (Keer) ❤️</div>
                      <div className="text-[11px] text-green flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green rounded-full"></span> Researching 📚</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-text-3">
                    <Settings size={16} className="cursor-pointer hover:text-accent" />
                  </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
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

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-2/50">
              <h3 className="font-syne text-lg font-bold text-text-primary">Create Shared Task</h3>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="text-text-3 hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">Task Title</label>
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?" 
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">Assign To</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setNewTaskAssignee("R")}
                    className={"py-2 px-3 rounded-lg border text-[12px] font-medium transition-colors " + (newTaskAssignee === 'R' ? 'bg-accent/10 border-accent text-accent' : 'bg-surface-2 border-border text-text-3 hover:border-text-3')}
                  >
                    Me (R)
                  </button>
                  <button 
                    onClick={() => setNewTaskAssignee("K")}
                    className={"py-2 px-3 rounded-lg border text-[12px] font-medium transition-colors " + (newTaskAssignee === 'K' ? 'bg-blue/10 border-blue text-blue' : 'bg-surface-2 border-border text-text-3 hover:border-text-3')}
                  >
                    Partner (K)
                  </button>
                  <button 
                    onClick={() => setNewTaskAssignee("Both")}
                    className={"py-2 px-3 rounded-lg border text-[12px] font-medium transition-colors " + (newTaskAssignee === 'Both' ? 'bg-coral/10 border-coral text-coral' : 'bg-surface-2 border-border text-text-3 hover:border-text-3')}
                  >
                    Both (Dual)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block flex items-center gap-1"><Gift size={12}/> Attach Mystery Gift (Optional)</label>
                <input 
                  type="text" 
                  value={newTaskGift}
                  onChange={(e) => setNewTaskGift(e.target.value)}
                  placeholder="e.g. I'll buy you coffee tomorrow!" 
                  className="w-full bg-surface border border-dashed border-border rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-accent transition-colors"
                />
                <p className="text-[10px] text-text-3 mt-1.5">The gift will remain locked until the task is checked off.</p>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface-2/50 flex justify-end gap-3">
              <button onClick={() => setIsNewTaskModalOpen(false)} className="px-4 py-2 text-[13px] font-semibold text-text-3 hover:text-text-primary transition-colors">Cancel</button>
              <button 
                onClick={handleCreateTask}
                disabled={!newTaskTitle}
                className="px-6 py-2 bg-accent text-white rounded-lg text-[13px] font-semibold hover:bg-accent-2 transition-colors disabled:opacity-50 shadow-sm"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Path Modal */}
      {isNewPathModalOpen && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-2/50">
              <h3 className="font-syne text-lg font-bold text-text-primary">Create Learning Path</h3>
              <button onClick={() => setIsNewPathModalOpen(false)} className="text-text-3 hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">Path Title</label>
                <input 
                  type="text" 
                  value={newPathTitle}
                  onChange={(e) => setNewPathTitle(e.target.value)}
                  placeholder="e.g. Advanced AI Agents" 
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface-2/50 flex justify-end gap-3">
              <button onClick={() => setIsNewPathModalOpen(false)} className="px-4 py-2 text-[13px] font-semibold text-text-3 hover:text-text-primary transition-colors">Cancel</button>
              <button 
                onClick={handleCreateVaultSession}
                disabled={!newPathTitle}
                className="px-6 py-2 bg-accent text-white rounded-lg text-[13px] font-semibold hover:bg-accent-2 transition-colors disabled:opacity-50 shadow-sm"
              >
                Create Path
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {isAddTopicModalOpen && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-2/50">
              <h3 className="font-syne text-lg font-bold text-text-primary">Add Syllabus Topics</h3>
              <button onClick={() => setIsAddTopicModalOpen(false)} className="text-text-3 hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">Topics (One per line)</label>
                <textarea 
                  value={newTopicTitles}
                  onChange={(e) => setNewTopicTitles(e.target.value)}
                  placeholder="E.g.&#10;Introduction to Vectors&#10;Matrix Multiplication&#10;Eigenvalues" 
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-accent transition-colors min-h-[120px] resize-y custom-scrollbar"
                />
                <p className="text-[10px] text-text-3 mt-1.5">You can paste multiple topics at once. Each new line will be added as a separate checkbox.</p>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface-2/50 flex justify-end gap-3">
              <button onClick={() => setIsAddTopicModalOpen(false)} className="px-4 py-2 text-[13px] font-semibold text-text-3 hover:text-text-primary transition-colors">Cancel</button>
              <button 
                onClick={handleAddTopics}
                disabled={!newTopicTitles.trim()}
                className="px-6 py-2 bg-accent text-white rounded-lg text-[13px] font-semibold hover:bg-accent-2 transition-colors disabled:opacity-50 shadow-sm"
              >
                Add Topics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {isAddResourceModalOpen && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-2/50">
              <h3 className="font-syne text-lg font-bold text-text-primary">Upload to Vault Storage</h3>
              <button onClick={() => setIsAddResourceModalOpen(false)} className="text-text-3 hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">Resource Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setNewResourceType("link")}
                    className={"py-2 px-3 rounded-lg border text-[12px] font-medium transition-colors flex items-center justify-center gap-2 " + (newResourceType === 'link' ? 'bg-blue/10 border-blue text-blue' : 'bg-surface-2 border-border text-text-3 hover:border-text-3')}
                  >
                    <LinkIcon size={14} /> Web Link
                  </button>
                  <button 
                    onClick={() => setNewResourceType("doc")}
                    className={"py-2 px-3 rounded-lg border text-[12px] font-medium transition-colors flex items-center justify-center gap-2 " + (newResourceType === 'doc' ? 'bg-accent/10 border-accent text-accent' : 'bg-surface-2 border-border text-text-3 hover:border-text-3')}
                  >
                    <FileText size={14} /> Document / File
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">Resource Title</label>
                <input 
                  type="text" 
                  value={newResourceTitle}
                  onChange={(e) => setNewResourceTitle(e.target.value)}
                  placeholder="e.g. Official React Documentation" 
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-accent transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">{newResourceType === 'link' ? 'URL' : 'File URL / Path'}</label>
                <input 
                  type="text" 
                  value={newResourceUrl}
                  onChange={(e) => setNewResourceUrl(e.target.value)}
                  placeholder={newResourceType === 'link' ? "https://..." : "Provide a link to the document"} 
                  className="w-full bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface-2/50 flex justify-end gap-3">
              <button onClick={() => setIsAddResourceModalOpen(false)} className="px-4 py-2 text-[13px] font-semibold text-text-3 hover:text-text-primary transition-colors">Cancel</button>
              <button 
                onClick={handleAddResource}
                disabled={!newResourceTitle.trim()}
                className="px-6 py-2 bg-blue text-white rounded-lg text-[13px] font-semibold hover:bg-blue/90 transition-colors disabled:opacity-50 shadow-sm"
              >
                Save Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
