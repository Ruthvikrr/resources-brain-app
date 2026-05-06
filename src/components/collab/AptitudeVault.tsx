"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { Plus, Trash2, Folder, BookOpen, CheckCircle, Circle, Lock, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";

export default function AptitudeVault({ activeUser }: { activeUser: any }) {
  const [folders, setFolders] = useState<any[]>([]);
  const [activeFolder, setActiveFolder] = useState<any>(null);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [topicName, setTopicName] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'collab_aptitude'), orderBy('createdAt', 'desc')), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFolders(data);
      if (data.length > 0 && !activeFolder) {
        setActiveFolder(data[0]);
      } else if (activeFolder) {
        const updated = data.find(f => f.id === activeFolder.id);
        if (updated) setActiveFolder(updated);
      }
    });
    return () => unsub();
  }, [activeFolder]);

  const handleAddFolder = async () => {
    if (!folderName) return;
    await addDoc(collection(db, 'collab_aptitude'), {
      name: folderName,
      topics: [],
      createdAt: Date.now()
    });
    setFolderName(""); setIsAddingFolder(false);
  };

  const handleAddTopic = async () => {
    if (!topicName || !activeFolder) return;
    const newTopics = [...activeFolder.topics, {
      id: Date.now(),
      name: topicName,
      readBy: []
    }];
    await updateDoc(doc(db, 'collab_aptitude', activeFolder.id), { topics: newTopics });
    setTopicName(""); setIsAddingTopic(false);
  };

  const toggleReadStatus = async (topicId: number) => {
    if (!activeUser || !activeFolder) return;
    const newTopics = activeFolder.topics.map((t: any) => {
      if (t.id === topicId) {
        let readBy = t.readBy || [];
        if (readBy.includes(activeUser.avatar)) {
          readBy = readBy.filter((u: string) => u !== activeUser.avatar);
        } else {
          readBy = [...readBy, activeUser.avatar];
        }
        return { ...t, readBy };
      }
      return t;
    });
    await updateDoc(doc(db, 'collab_aptitude', activeFolder.id), { topics: newTopics });
  };

  const allTopicsRead = activeFolder?.topics.length > 0 && activeFolder.topics.every((t: any) => t.readBy?.includes('R') && t.readBy?.includes('K'));

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden animate-in fade-in duration-300">
      {/* Sidebar - Folders */}
      <div className="w-full lg:w-64 border-r border-border bg-surface-2/30 flex flex-col min-h-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-syne font-bold text-[13px] uppercase tracking-wider text-text-2 flex items-center gap-2">
            <Folder size={14} /> Vaults
          </h3>
          <button onClick={() => setIsAddingFolder(true)} className="text-text-3 hover:text-accent transition-colors"><Plus size={16}/></button>
        </div>
        
        {isAddingFolder && (
          <div className="p-3 bg-surface border-b border-border">
            <input type="text" placeholder="Folder Name..." value={folderName} onChange={e=>setFolderName(e.target.value)} className="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-[12px] outline-none mb-2" />
            <div className="flex gap-2">
              <button onClick={handleAddFolder} className="flex-1 bg-accent text-white text-[10px] font-bold py-1.5 rounded">Save</button>
              <button onClick={() => setIsAddingFolder(false)} className="flex-1 bg-surface-2 border border-border text-text-3 text-[10px] font-bold py-1.5 rounded">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {folders.map(folder => (
            <div 
              key={folder.id} 
              onClick={() => setActiveFolder(folder)}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group ${activeFolder?.id === folder.id ? 'bg-accent/10 border border-accent/20 text-accent' : 'hover:bg-surface-2 text-text-primary border border-transparent'}`}
            >
              <div className="flex items-center gap-2 text-[13px] font-medium truncate">
                <Folder size={14} className={activeFolder?.id === folder.id ? 'text-accent' : 'text-text-3'} />
                {folder.name}
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, 'collab_aptitude', folder.id)); }} className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-coral transition-opacity"><Trash2 size={12}/></button>
            </div>
          ))}
          {folders.length === 0 && <div className="text-[11px] text-text-3 text-center mt-10">No folders. Create one to start!</div>}
        </div>
      </div>

      {/* Main Content - Topics */}
      <div className="flex-1 flex flex-col min-h-0 bg-bg relative">
        {activeFolder ? (
          <>
            <div className="p-6 md:p-8 border-b border-border flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-10">
              <div>
                <h2 className="font-syne text-2xl font-bold text-text-primary mb-1">{activeFolder.name}</h2>
                <p className="text-[12px] text-text-3">Mark topics as read. Duo Quiz unlocks when both partners finish all topics.</p>
              </div>
              <button onClick={() => setIsAddingTopic(true)} className="bg-surface-2 border border-border text-text-primary px-4 py-2 rounded-lg text-[12px] font-bold hover:border-accent transition-colors flex items-center gap-2">
                <Plus size={14} /> Add Topic
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-3 custom-scrollbar">
              {isAddingTopic && (
                <div className="bg-surface border border-border rounded-xl p-4 mb-4 flex gap-3">
                  <input type="text" placeholder="Topic name (e.g. Percentage & Ratios)" value={topicName} onChange={e=>setTopicName(e.target.value)} className="flex-1 bg-surface-2 border border-border rounded px-4 py-2 text-[13px] outline-none focus:border-accent" />
                  <button onClick={handleAddTopic} className="bg-accent text-white px-4 py-2 rounded font-bold text-[12px]">Add</button>
                  <button onClick={() => setIsAddingTopic(false)} className="bg-surface-2 border border-border px-4 py-2 rounded font-bold text-[12px] text-text-3">Cancel</button>
                </div>
              )}

              {activeFolder.topics.map((topic: any) => {
                const rRead = topic.readBy?.includes('R');
                const kRead = topic.readBy?.includes('K');
                return (
                  <div key={topic.id} className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <BookOpen size={16} className="text-text-3" />
                      <span className="text-[14px] font-medium text-text-primary">{topic.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* R Status */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-text-3 uppercase">Ruthvik</span>
                        {rRead ? <CheckCircle size={18} className="text-blue" /> : <Circle size={18} className="text-border" />}
                      </div>
                      
                      {/* K Status */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-text-3 uppercase">Keer</span>
                        {kRead ? <CheckCircle size={18} className="text-coral" /> : <Circle size={18} className="text-border" />}
                      </div>

                      {/* Action Button */}
                      <button 
                        onClick={() => toggleReadStatus(topic.id)}
                        className="ml-4 px-3 py-1.5 bg-surface-2 hover:bg-surface border border-border rounded-md text-[11px] font-bold text-text-primary transition-colors"
                      >
                        {topic.readBy?.includes(activeUser?.avatar) ? 'Unmark' : 'Mark as Read'}
                      </button>

                      <button onClick={async () => {
                        const newTopics = activeFolder.topics.filter((t: any) => t.id !== topic.id);
                        await updateDoc(doc(db, 'collab_aptitude', activeFolder.id), { topics: newTopics });
                      }} className="text-text-3 hover:text-coral opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {activeFolder.topics.length === 0 && !isAddingTopic && (
                <div className="text-center py-10 text-[13px] text-text-3">Folder is empty. Add some topics to study!</div>
              )}
            </div>

            {/* Duo Quiz Bottom Bar */}
            <div className="p-6 border-t border-border bg-surface-2/30 backdrop-blur-md shrink-0">
              {allTopicsRead ? (
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-4 bg-gradient-to-r from-accent to-blue text-white rounded-xl font-syne text-lg font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  <BrainCircuit size={20} /> START DUO QUIZ BATTLE
                </motion.button>
              ) : (
                <button disabled className="w-full py-4 bg-surface border border-dashed border-border text-text-3 rounded-xl font-syne text-[15px] font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                  <Lock size={16} /> DUO QUIZ LOCKED (Finish all topics first)
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-3 text-[13px]">Select or create a vault to begin.</div>
        )}
      </div>
    </div>
  );
}
