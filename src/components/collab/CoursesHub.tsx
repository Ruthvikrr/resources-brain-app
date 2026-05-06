"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { Plus, Trash2, ArrowRight, Gift, Unlock, Lock, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CoursesHub({ activeUser }: { activeUser: any }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [isAddingCourse, setIsAddingCourse] = useState(false);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [assignee, setAssignee] = useState("R");
  const [giftText, setGiftText] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'collab_courses'), orderBy('createdAt', 'desc')), (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleAddCourse = async () => {
    if (!title || !url) return;
    await addDoc(collection(db, 'collab_courses'), {
      title, url, assignee, giftText,
      progress: 0,
      giftRevealed: false,
      addedBy: activeUser?.avatar || 'Unknown',
      createdAt: Date.now()
    });
    setTitle(""); setUrl(""); setGiftText(""); setIsAddingCourse(false);
  };

  const advanceProgress = async (courseId: string, current: number) => {
    const newProgress = Math.min(100, current + 25);
    await updateDoc(doc(db, 'collab_courses', courseId), { progress: newProgress });
  };

  const revealGift = async (courseId: string) => {
    await updateDoc(doc(db, 'collab_courses', courseId), { giftRevealed: true });
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6 md:p-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-syne text-2xl font-bold text-text-primary flex items-center gap-2"><Target className="text-accent" /> Duo Learning Hub</h2>
          <p className="text-[13px] text-text-3 mt-1">Assign courses and unlock mystery gifts.</p>
        </div>
        <button onClick={() => setIsAddingCourse(true)} className="bg-accent text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-accent-2 transition-colors flex items-center gap-2">
          <Plus size={16} /> Assign Mission
        </button>
      </div>

      {isAddingCourse && (
        <div className="bg-surface border border-border rounded-xl p-5 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2">
            <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">Mission Title</label>
            <input type="text" placeholder="e.g. Complete Next.js Course" value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">Course Link</label>
            <input type="text" placeholder="https://..." value={url} onChange={e=>setUrl(e.target.value)} className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-[13px] outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">Assign To</label>
            <div className="flex gap-2">
              <button onClick={() => setAssignee('R')} className={`flex-1 py-2 text-[12px] font-bold rounded border ${assignee === 'R' ? 'bg-blue/10 border-blue text-blue' : 'bg-surface-2 border-border text-text-3'}`}>Ruthvik (R)</button>
              <button onClick={() => setAssignee('K')} className={`flex-1 py-2 text-[12px] font-bold rounded border ${assignee === 'K' ? 'bg-coral/10 border-coral text-coral' : 'bg-surface-2 border-border text-text-3'}`}>Keer (K)</button>
            </div>
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="text-[11px] font-bold text-text-2 uppercase tracking-wider mb-2 block">Mystery Gift (Incentive)</label>
            <input type="text" placeholder="e.g. Coffee treat this weekend!" value={giftText} onChange={e=>setGiftText(e.target.value)} className="w-full bg-surface-2 border border-dashed border-accent/50 rounded px-3 py-2 text-[13px] outline-none" />
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-2">
            <button onClick={() => setIsAddingCourse(false)} className="px-4 py-2 text-[13px] font-bold text-text-3">Cancel</button>
            <button onClick={handleAddCourse} className="px-6 py-2 bg-accent text-white text-[13px] font-bold rounded-lg shadow-sm">Save Mission</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 custom-scrollbar">
        {courses.map(course => (
          <div key={course.id} className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col group relative">
            <button onClick={() => deleteDoc(doc(db, 'collab_courses', course.id))} className="absolute top-4 right-4 z-20 text-text-3 hover:text-coral opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={16} />
            </button>
            
            <div className="p-5 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${course.assignee === 'R' ? 'bg-blue' : 'bg-coral'}`}>{course.assignee}</span>
                <span className="text-[10px] text-text-3 font-bold uppercase tracking-wider">Mission</span>
              </div>
              <h3 className="font-syne text-[16px] font-bold text-text-primary mb-2 line-clamp-2">{course.title}</h3>
              <a href={course.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-accent hover:underline flex items-center gap-1 mb-6">Open Course <ArrowRight size={12}/></a>
              
              {/* Progress Bar */}
              <div className="mb-2 flex items-center justify-between text-[11px] font-bold">
                <span className="text-text-3">Progress</span>
                <span className={course.progress === 100 ? 'text-green' : 'text-accent'}>{course.progress}%</span>
              </div>
              <div className="w-full bg-surface-2 h-2 rounded-full overflow-hidden mb-4">
                <div className={`h-full transition-all duration-500 rounded-full ${course.progress === 100 ? 'bg-green' : 'bg-gradient-to-r from-blue to-accent'}`} style={{ width: `${course.progress}%` }}></div>
              </div>

              {course.progress < 100 ? (
                <button 
                  onClick={() => advanceProgress(course.id, course.progress)}
                  className="w-full py-2 bg-surface-2 hover:bg-surface border border-border rounded-lg text-[12px] font-bold text-text-primary transition-colors disabled:opacity-50"
                  disabled={activeUser?.avatar !== course.assignee}
                >
                  Advance Mission (+25%)
                </button>
              ) : (
                <div className="w-full">
                  {!course.giftRevealed ? (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if(activeUser?.avatar === course.assignee) {
                          alert("Only your partner can reveal this gift!");
                        } else {
                          revealGift(course.id);
                        }
                      }}
                      className="w-full py-3 bg-gradient-to-r from-accent to-coral text-white rounded-lg text-[13px] font-bold shadow-lg shadow-coral/20 flex flex-col items-center justify-center gap-1"
                    >
                      <Gift size={20} className="animate-bounce" />
                      Tap to Reveal Gift
                    </motion.button>
                  ) : (
                    <AnimatePresence>
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="w-full p-4 bg-green/10 border border-green/20 rounded-lg text-center"
                      >
                        <Unlock size={24} className="text-green mx-auto mb-2" />
                        <span className="text-[10px] text-green font-bold uppercase tracking-widest block mb-1">Gift Unlocked!</span>
                        <span className="text-[13px] font-medium text-text-primary">{course.giftText}</span>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {courses.length === 0 && <div className="col-span-full py-20 text-center text-text-3">No missions assigned yet. Start learning!</div>}
      </div>
    </div>
  );
}
