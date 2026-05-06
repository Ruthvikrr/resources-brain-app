"use client";

import { useState } from "react";
import { Brain, Zap, Target, BookOpen, ChevronRight, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AILearningVault({ activeUser }: { activeUser: any }) {
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"Upload" | "Recap" | "Quiz" | "Teach">("Upload");
  
  const [recap, setRecap] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<any[]>([]);
  const [teachBae, setTeachBae] = useState<string | null>(null);

  const [dominanceScore, setDominanceScore] = useState(100);

  const processNotes = async () => {
    if (!notes.trim()) return;
    setIsProcessing(true);
    // Note: This mocks the Gemini API call based on the user's provided feature set.
    // In a real app, this would send `notes` to an API endpoint like `/api/gemini`.
    setTimeout(() => {
      setRecap("Here is a high-impact summary of your notes:\n\n• Key concept 1: Always simplify.\n• Key concept 2: Active recall beats passive reading.\n• The 80/20 rule applies to studying.");
      setQuiz([
        { q: "What beats passive reading?", options: ["Active recall", "Highlighting", "Re-reading"], a: "Active recall" },
        { q: "What rule applies to studying?", options: ["90/10", "80/20", "50/50"], a: "80/20" }
      ]);
      setTeachBae("Hey Bae! Here is what you need to know: Focus heavily on 'Active Recall'. It means pulling info from your brain instead of just reading it. Don't waste time highlighting everything, just focus on the 20% of concepts that yield 80% of the results!");
      setIsProcessing(false);
      setActiveTab("Recap");
    }, 2000);
  };

  const handleQuizAnswer = (qIndex: number, option: string) => {
    if (quiz[qIndex].a === option) {
      // Correct
      alert("Correct!");
    } else {
      // Wrong
      setDominanceScore(prev => Math.max(0, prev - 15));
      alert("Wrong! -15 HP. AI Revise Plan: Review 'Active Recall' again.");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="p-6 md:p-8 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-syne text-2xl font-bold text-text-primary flex items-center gap-2">
            <Brain className="text-accent" /> AI Learning Vault
          </h2>
          <p className="text-[13px] text-text-3 mt-1">Powered by Gemini AI. Turn notes into interactive learning.</p>
        </div>
        <div className="bg-surface-2 border border-border px-4 py-2 rounded-lg flex items-center gap-3 shadow-inner">
          <div className="text-[11px] font-bold text-text-3 uppercase tracking-wider">Dominance HP</div>
          <div className="w-32 bg-surface h-2.5 rounded-full overflow-hidden border border-border">
            <div className={`h-full rounded-full transition-all duration-500 ${dominanceScore > 50 ? 'bg-green' : 'bg-coral'}`} style={{ width: `${dominanceScore}%` }}></div>
          </div>
          <div className={`font-syne font-bold text-[14px] ${dominanceScore > 50 ? 'text-green' : 'text-coral'}`}>{dominanceScore}</div>
        </div>
      </div>

      {/* Internal Navigation */}
      <div className="flex border-b border-border px-6 md:px-8 bg-surface-2/30">
        {["Upload", "Recap", "Quiz", "Teach"].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-5 py-3 text-[12px] font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-text-3 hover:text-text-primary'}`}
          >
            {tab === "Teach" ? "Teach Bae" : tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-bg">
        {activeTab === "Upload" && (
          <div className="max-w-3xl mx-auto">
            <label className="text-[12px] font-bold text-text-primary mb-3 block flex items-center gap-2"><BookOpen size={16} className="text-blue"/> Paste your raw notes or concepts here:</label>
            <textarea 
              value={notes}
              onChange={e=>setNotes(e.target.value)}
              placeholder="e.g. Mitochondria is the powerhouse of the cell. DNA is a double helix..."
              className="w-full h-64 bg-surface-2 border border-border rounded-xl p-5 text-[14px] leading-relaxed outline-none focus:border-accent transition-colors custom-scrollbar resize-none mb-6 shadow-inner"
            />
            <button 
              onClick={processNotes}
              disabled={!notes.trim() || isProcessing}
              className="w-full py-4 bg-accent text-white font-syne text-[15px] font-bold rounded-xl shadow-lg hover:bg-accent-2 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? <Activity className="animate-spin" /> : <Zap size={18} />} 
              {isProcessing ? "Gemini is analyzing..." : "Generate AI Battle Cards"}
            </button>
          </div>
        )}

        {activeTab === "Recap" && (
          <div className="max-w-3xl mx-auto">
            {recap ? (
              <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
                <h3 className="font-syne text-xl font-bold text-text-primary mb-6 flex items-center gap-2"><Zap className="text-accent" /> AI Quick Recap</h3>
                <div className="text-[14px] text-text-2 leading-relaxed whitespace-pre-wrap">{recap}</div>
              </div>
            ) : (
              <div className="text-center text-text-3 py-20 text-[13px]">Upload notes first to generate a recap.</div>
            )}
          </div>
        )}

        {activeTab === "Quiz" && (
          <div className="max-w-3xl mx-auto space-y-6">
            {quiz.length > 0 ? (
              quiz.map((q, i) => (
                <div key={i} className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                  <h4 className="font-syne text-[16px] font-bold text-text-primary mb-4 flex items-start gap-2">
                    <span className="text-accent mt-0.5">Q{i+1}.</span> {q.q}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt: string, j: number) => (
                      <button 
                        key={j}
                        onClick={() => handleQuizAnswer(i, opt)}
                        className="bg-surface-2 hover:bg-accent/10 border border-border hover:border-accent text-left px-4 py-3 rounded-lg text-[13px] font-medium text-text-primary transition-colors flex items-center justify-between group"
                      >
                        {opt}
                        <ChevronRight size={14} className="text-text-3 opacity-0 group-hover:opacity-100 group-hover:text-accent transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-text-3 py-20 text-[13px]">Upload notes first to generate an adaptive quiz.</div>
            )}
          </div>
        )}

        {activeTab === "Teach" && (
          <div className="max-w-3xl mx-auto">
            {teachBae ? (
              <div className="bg-gradient-to-br from-surface to-surface-2 border border-border rounded-2xl p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-coral/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <h3 className="font-syne text-xl font-bold text-text-primary mb-6 flex items-center gap-2"><Target className="text-coral" /> "Teach Bae" Cheat Sheet</h3>
                <p className="text-[13px] text-text-3 mb-6">Send this AI-generated summary to your partner so they can catch up instantly!</p>
                <div className="bg-surface border border-border p-5 rounded-xl text-[14px] text-text-primary leading-relaxed font-medium">
                  "{teachBae}"
                </div>
                <button className="mt-6 w-full py-3 bg-coral text-white font-bold text-[13px] rounded-lg hover:bg-coral/90 transition-colors shadow-md">
                  Copy to Clipboard & Send to Bae 💌
                </button>
              </div>
            ) : (
              <div className="text-center text-text-3 py-20 text-[13px]">Upload notes first to generate the cheat sheet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
