"use client";

import { useState } from "react";
import { Users, LayoutGrid, MessageSquare, Briefcase, Activity, Settings, Bell, Search, Globe, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CollabDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");

  // Mock Presence Data
  const onlineUsers = [
    { id: 1, name: "Alex R.", role: "Admin", status: "online", avatar: "👨‍💻" },
    { id: 2, name: "Sarah M.", role: "Editor", status: "online", avatar: "👩‍🎨" },
    { id: 3, name: "Duo Partner", role: "Co-Pilot", status: "offline", avatar: "🤖" },
  ];

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

        <div className="px-3 mb-6">
          <div className="text-[10px] font-medium tracking-widest text-text-3 uppercase px-2 mb-3">
            Dashboards
          </div>
          <nav className="space-y-1">
            <div className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-[13px] font-medium transition-all ${activeTab === 'Overview' ? 'bg-accent-dim text-accent-2 font-semibold' : 'text-text-3 hover:bg-surface-2'}`} onClick={() => setActiveTab('Overview')}>
              <div className="flex items-center gap-3">
                <LayoutGrid size={16} className={activeTab === 'Overview' ? 'text-accent-2' : ''} />
                Workspace Overview
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
        </div>

        <div className="px-3 mb-2">
          <div className="text-[10px] font-medium tracking-widest text-text-3 uppercase px-2 mb-3">
            Presence & Security
          </div>
          <nav className="space-y-1">
            {onlineUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-text-2">
                <div className="relative">
                  <div className="w-6 h-6 bg-surface-2 rounded-full flex items-center justify-center text-sm">{user.avatar}</div>
                  <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-surface ${user.status === 'online' ? 'bg-green' : 'bg-text-3'}`}></div>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-text-primary">{user.name}</span>
                  <span className="text-[10px] text-text-3">{user.role}</span>
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-auto px-5 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-text-3">
            <Shield size={12} className="text-green" />
            JWT Secured Session
          </div>
          <Settings size={14} className="text-text-3 cursor-pointer hover:text-accent transition-colors" />
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
            <div className="relative flex items-center bg-surface-2 border border-border rounded-lg outline-none focus-within:border-accent transition-all overflow-hidden p-1.5 focus-within:ring-2 ring-accent/20 w-[250px]">
              <Search className="absolute left-3 text-text-3 pointer-events-none" size={14} />
              <input 
                type="text" 
                placeholder="Search workspace..." 
                className="w-full bg-transparent text-text-primary text-[13px] py-1 pl-8 pr-2 outline-none"
              />
            </div>
            <button className="relative p-2 rounded-lg bg-surface-2 border border-border hover:border-accent transition-colors text-text-2 hover:text-accent">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral rounded-full"></span>
            </button>
            <div className="w-9 h-9 bg-accent text-white rounded-lg flex items-center justify-center font-bold shadow-md cursor-pointer">
              ME
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-8">
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 md:col-span-2 space-y-6">
                <div className="bg-surface rounded-xl border border-border p-6 shadow-sm relative overflow-hidden group hover:border-accent/50 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent-dim rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-accent/20 transition-all"></div>
                  <h2 className="font-syne text-lg font-bold mb-1 text-text-primary">Welcome to CollabSpace, Admin.</h2>
                  <p className="text-sm text-text-3 mb-6 max-w-md">Your workspace is securely synced. Role-based access ensures Dous only see what they need to.</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-surface-2 border border-border rounded-lg p-4">
                      <div className="text-text-3 text-[11px] uppercase tracking-wider font-semibold mb-1">Active Projects</div>
                      <div className="text-2xl font-bold text-text-primary">12</div>
                    </div>
                    <div className="bg-surface-2 border border-border rounded-lg p-4">
                      <div className="text-text-3 text-[11px] uppercase tracking-wider font-semibold mb-1">Pending Tasks</div>
                      <div className="text-2xl font-bold text-text-primary">5</div>
                    </div>
                    <div className="bg-surface-2 border border-border rounded-lg p-4">
                      <div className="text-text-3 text-[11px] uppercase tracking-wider font-semibold mb-1">Data Transfers</div>
                      <div className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        24 <span className="text-green text-xs flex items-center"><Activity size={10} className="mr-0.5"/> Live</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
                  <h3 className="font-syne text-md font-bold mb-4 text-text-primary flex items-center justify-between">
                    Recent Activity 
                    <span className="text-xs font-normal text-accent cursor-pointer hover:underline">View All</span>
                  </h3>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0">👩‍🎨</div>
                        <div>
                          <p className="text-[13px] text-text-primary"><span className="font-semibold">Sarah M.</span> updated the design system document.</p>
                          <p className="text-[11px] text-text-3 mt-0.5">2 minutes ago</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-1 space-y-6">
                <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
                  <h3 className="font-syne text-md font-bold mb-4 text-text-primary">Duo Partners</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-surface-2 rounded-lg p-3 border border-border hover:border-accent/30 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-accent-dim text-accent rounded-full flex items-center justify-center">👨‍💻</div>
                        <div>
                          <div className="text-[13px] font-semibold text-text-primary">Dev Team A</div>
                          <div className="text-[11px] text-green flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green rounded-full"></span> Online</div>
                        </div>
                      </div>
                      <MessageSquare size={14} className="text-text-3" />
                    </div>
                    <div className="flex items-center justify-between bg-surface-2 rounded-lg p-3 border border-border hover:border-accent/30 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-dim text-blue rounded-full flex items-center justify-center">👩‍🎨</div>
                        <div>
                          <div className="text-[13px] font-semibold text-text-primary">Design Duo</div>
                          <div className="text-[11px] text-green flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green rounded-full"></span> Online</div>
                        </div>
                      </div>
                      <MessageSquare size={14} className="text-text-3" />
                    </div>
                  </div>
                  <button className="w-full mt-4 py-2 border border-dashed border-border rounded-lg text-[13px] text-text-3 font-medium hover:text-text-primary hover:border-text-primary transition-all">
                    + Invite New Duo
                  </button>
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
                      <span className="font-semibold text-[13px] text-text-primary">Design Duo</span>
                      <span className="text-[10px] text-accent font-medium">Just now</span>
                    </div>
                    <p className="text-[12px] text-text-2 truncate">I've updated the Figma file, can you check?</p>
                  </div>
                  <div className="p-4 border-b border-border cursor-pointer hover:bg-surface-2/50">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-[13px] text-text-primary">Dev Team A</span>
                      <span className="text-[10px] text-text-3 font-medium">2h ago</span>
                    </div>
                    <p className="text-[12px] text-text-3 truncate">The API routes are deployed successfully.</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col bg-bg">
                <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-dim text-blue rounded-full flex items-center justify-center">👩‍🎨</div>
                    <div>
                      <div className="text-[13px] font-semibold text-text-primary">Design Duo</div>
                      <div className="text-[11px] text-green flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green rounded-full"></span> Active Now</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-text-3">
                    <Briefcase size={16} className="cursor-pointer hover:text-accent" />
                    <Settings size={16} className="cursor-pointer hover:text-accent" />
                  </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                  <div className="self-center bg-surface border border-border rounded-full px-3 py-1 text-[10px] text-text-3 font-medium">Today</div>
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-6 h-6 rounded-full bg-surface-2 flex shrink-0 items-center justify-center text-xs">👩‍🎨</div>
                    <div className="bg-surface border border-border rounded-2xl rounded-tl-sm p-3 shadow-sm">
                      <p className="text-[13px] text-text-primary">Hey! The new dark mode colors look great. I've updated the Figma file with the 100% contrast requirements, can you check?</p>
                      <span className="text-[9px] text-text-3 mt-1 block">10:42 AM</span>
                    </div>
                  </div>
                  <div className="flex gap-3 max-w-[80%] self-end flex-row-reverse">
                    <div className="w-6 h-6 rounded-full bg-accent text-white flex shrink-0 items-center justify-center text-xs font-bold">ME</div>
                    <div className="bg-accent text-white rounded-2xl rounded-tr-sm p-3 shadow-sm">
                      <p className="text-[13px]">Just checked it! The contrast is perfect now. Pushing the CSS updates via Next.js API.</p>
                      <span className="text-[9px] text-white/70 mt-1 block text-right">10:45 AM</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-border bg-surface">
                  <div className="relative flex items-center">
                    <input type="text" placeholder="Type a message... (Live Socket Sync)" className="w-full bg-surface-2 border border-border rounded-full py-2.5 pl-4 pr-12 text-[13px] outline-none focus:border-accent" />
                    <button className="absolute right-2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center hover:bg-accent-2 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
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
