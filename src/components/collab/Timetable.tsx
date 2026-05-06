"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Trash2, Calendar, Clock, CheckCircle, Circle, PlayCircle } from "lucide-react";

export default function Timetable({ activeUser }: { activeUser: any }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [daysCount, setDaysCount] = useState("1");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'collab_timetable'), (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const getTodayDateStr = () => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  };

  const todayStr = getTodayDateStr();

  const handleAddTask = async () => {
    if (!title || !startTime || !endTime || !daysCount) return;
    await addDoc(collection(db, 'collab_timetable'), {
      title,
      startTime,
      endTime,
      startDate: todayStr,
      daysCount: parseInt(daysCount, 10),
      completedDates: [],
      addedBy: activeUser?.avatar || 'Unknown',
      createdAt: Date.now()
    });
    setTitle(""); setStartTime(""); setEndTime(""); setDaysCount("1"); setIsAdding(false);
  };

  const toggleTaskForToday = async (taskId: string, completedDates: string[]) => {
    const isCompleted = completedDates.includes(todayStr);
    let newDates = [...completedDates];
    if (isCompleted) {
      newDates = newDates.filter(d => d !== todayStr);
    } else {
      newDates.push(todayStr);
    }
    await updateDoc(doc(db, 'collab_timetable', taskId), { completedDates: newDates });
  };

  const getDaysDiff = (date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
  };

  // Filter tasks that are active today
  const todaysTasks = tasks.filter(t => {
    if (!t.startDate) return false;
    const diff = getDaysDiff(t.startDate, todayStr);
    return diff >= 0 && diff < t.daysCount;
  });

  // Sort by start time
  todaysTasks.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
      <div className="p-6 md:p-8 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-syne text-2xl font-bold text-text-primary flex items-center gap-2">
            <Calendar className="text-blue" /> Daily Timetable
          </h2>
          <p className="text-[13px] text-text-3 mt-1">Your auto-arranging daily schedule.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-blue text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-blue/90 transition-colors flex items-center gap-2 shadow-sm">
          <Plus size={16} /> New Routine
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-bg relative">
        <div className="max-w-4xl mx-auto">
          {isAdding && (
            <div className="bg-surface border border-border rounded-xl p-5 mb-8 shadow-sm">
              <h3 className="font-syne text-[15px] font-bold text-text-primary mb-4">Create Recurring Block</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-4">
                  <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">Task Title</label>
                  <input type="text" placeholder="e.g. Lunch break or Learn n8n (4 videos)" value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-[13px] outline-none focus:border-blue" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">Start Time</label>
                  <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-[13px] outline-none focus:border-blue" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">End Time</label>
                  <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-[13px] outline-none focus:border-blue" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">Repeat for (Days)</label>
                  <input type="number" min="1" placeholder="e.g. 7" value={daysCount} onChange={e=>setDaysCount(e.target.value)} className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-[13px] outline-none focus:border-blue" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsAdding(false)} className="px-5 py-2 text-[13px] font-bold text-text-3">Cancel</button>
                <button onClick={handleAddTask} className="px-6 py-2 bg-blue text-white text-[13px] font-bold rounded-lg shadow-sm">Add to Schedule</button>
              </div>
            </div>
          )}

          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-syne text-[18px] font-bold text-text-primary">Today's Agenda</h3>
            <span className="text-[12px] font-bold text-text-3 tracking-widest uppercase">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>

          <div className="relative border-l-2 border-border ml-4 space-y-8 pb-10">
            {todaysTasks.map(task => {
              const isCompleted = task.completedDates?.includes(todayStr);
              
              // Calculate remaining days
              const diff = getDaysDiff(task.startDate, todayStr);
              const daysLeft = task.daysCount - diff;

              return (
                <div key={task.id} className="relative pl-8 group">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-bg flex items-center justify-center transition-colors ${isCompleted ? 'bg-green' : 'bg-blue'}`}>
                    {isCompleted && <div className="w-2 h-2 bg-bg rounded-full"></div>}
                  </div>

                  <div className={`bg-surface border ${isCompleted ? 'border-green/30 bg-green/5' : 'border-border'} rounded-xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isCompleted ? 'text-green' : 'text-blue'}`}>
                          <Clock size={14} /> {task.startTime} - {task.endTime}
                        </span>
                        <span className="text-[10px] text-text-3 font-medium bg-surface-2 px-2 py-0.5 rounded-full border border-border">Day {diff + 1} of {task.daysCount}</span>
                      </div>
                      <h4 className={`font-syne text-[16px] font-bold ${isCompleted ? 'text-text-3 line-through' : 'text-text-primary'}`}>
                        {task.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => toggleTaskForToday(task.id, task.completedDates || [])}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-green text-white shadow-lg shadow-green/20' : 'bg-surface-2 border border-border text-text-3 hover:text-blue hover:border-blue'}`}
                      >
                        {isCompleted ? <CheckCircle size={20} /> : <Circle size={20} />}
                      </button>
                      
                      <button onClick={async () => {
                        if(confirm('Delete this routine completely?')) {
                          await deleteDoc(doc(db, 'collab_timetable', task.id));
                        }
                      }} className="text-text-3 hover:text-coral opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16}/>
                      </button>
                    </div>

                  </div>
                </div>
              )
            })}

            {todaysTasks.length === 0 && (
              <div className="pl-8 py-10 text-text-3 text-[14px]">Your schedule is clear for today. Add a new routine block to get started!</div>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="font-syne text-[15px] font-bold text-text-3 mb-4">All Active Routines</h3>
            <div className="space-y-2">
              {tasks.filter(t => {
                if (!t.startDate) return false;
                return getDaysDiff(t.startDate, todayStr) < t.daysCount;
              }).map(t => (
                <div key={t.id} className="flex items-center justify-between bg-surface-2 rounded-lg px-4 py-3 border border-border text-[12px]">
                  <span className="font-bold text-text-primary">{t.title}</span>
                  <div className="flex items-center gap-4 text-text-3 font-medium">
                    <span>{t.startTime} - {t.endTime}</span>
                    <span className="w-16 text-right">{t.daysCount} Days</span>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <div className="text-[12px] text-text-3">No active routines.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
