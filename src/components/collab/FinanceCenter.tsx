"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Target, Coins, History } from "lucide-react";
import { motion } from "framer-motion";

export default function FinanceCenter({ activeUser }: { activeUser: any }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [jars, setJars] = useState<any[]>([]);
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [isAddingJar, setIsAddingJar] = useState(false);

  // Tx form
  const [txDesc, setTxDesc] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"income" | "expense">("expense");

  // Jar form
  const [jarName, setJarName] = useState("");
  const [jarTarget, setJarTarget] = useState("");

  useEffect(() => {
    const unsubTx = onSnapshot(query(collection(db, 'collab_finance_tx'), orderBy('createdAt', 'desc')), (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubJars = onSnapshot(collection(db, 'collab_finance_jars'), (snap) => {
      setJars(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubTx(); unsubJars(); };
  }, []);

  const handleAddTx = async () => {
    if (!txDesc || !txAmount) return;
    await addDoc(collection(db, 'collab_finance_tx'), {
      desc: txDesc,
      amount: Number(txAmount),
      type: txType,
      addedBy: activeUser?.avatar || 'Unknown',
      createdAt: Date.now()
    });
    setTxDesc(""); setTxAmount(""); setIsAddingTx(false);
  };

  const handleAddJar = async () => {
    if (!jarName || !jarTarget) return;
    await addDoc(collection(db, 'collab_finance_jars'), {
      name: jarName,
      target: Number(jarTarget),
      current: 0,
      createdAt: Date.now()
    });
    setJarName(""); setJarTarget(""); setIsAddingJar(false);
  };

  const addFundsToJar = async (jarId: string, current: number, target: number) => {
    const amt = prompt("How much to add?");
    if (!amt || isNaN(Number(amt))) return;
    const newAmt = Math.min(target, current + Number(amt));
    await updateDoc(doc(db, 'collab_finance_jars', jarId), { current: newAmt });
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const jarSavings = jars.reduce((acc, j) => acc + j.current, 0);
  const availableBalance = totalIncome - totalExpense - jarSavings;

  return (
    <div className="flex flex-col h-full gap-6 p-6 md:p-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Balance Card */}
        <div className="bg-gradient-to-br from-surface to-surface-2 border border-border p-6 rounded-2xl shadow-sm flex-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h2 className="text-[12px] font-bold tracking-widest uppercase text-text-3 mb-2 flex items-center gap-2">
            <Coins size={14} /> Shared Available Balance
          </h2>
          <div className="font-syne text-5xl font-bold text-text-primary mb-6">
            ₹{availableBalance.toLocaleString()}
          </div>
          
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-text-3 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowUpRight size={10} className="text-green"/> Total Income</span>
              <span className="text-green font-bold">₹{totalIncome.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-3 uppercase tracking-wider mb-1 flex items-center gap-1"><ArrowDownRight size={10} className="text-coral"/> Total Expenses</span>
              <span className="text-coral font-bold">₹{totalExpense.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-3 uppercase tracking-wider mb-1 flex items-center gap-1"><Target size={10} className="text-blue"/> In Jars</span>
              <span className="text-blue font-bold">₹{jarSavings.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Transactions */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col min-h-0 relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne text-[15px] font-bold text-text-primary flex items-center gap-2">
              <History size={16} className="text-accent" /> Recent Activity
            </h3>
            <button onClick={() => setIsAddingTx(true)} className="text-[11px] font-bold bg-accent/10 text-accent px-3 py-1.5 rounded-md hover:bg-accent/20 transition-colors flex items-center gap-1">
              <Plus size={12} /> Log Tx
            </button>
          </div>

          {isAddingTx && (
            <div className="mb-4 bg-surface-2 p-3 rounded-lg border border-border space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setTxType('expense')} className={`flex-1 py-1.5 text-[11px] font-bold rounded ${txType === 'expense' ? 'bg-coral text-white' : 'bg-surface border border-border'}`}>Expense</button>
                <button onClick={() => setTxType('income')} className={`flex-1 py-1.5 text-[11px] font-bold rounded ${txType === 'income' ? 'bg-green text-white' : 'bg-surface border border-border'}`}>Income</button>
              </div>
              <input type="text" placeholder="Description (e.g. Groceries)" value={txDesc} onChange={e=>setTxDesc(e.target.value)} className="w-full bg-surface border border-border rounded px-3 py-2 text-[12px] outline-none" />
              <input type="number" placeholder="Amount (₹)" value={txAmount} onChange={e=>setTxAmount(e.target.value)} className="w-full bg-surface border border-border rounded px-3 py-2 text-[12px] outline-none" />
              <div className="flex gap-2">
                <button onClick={handleAddTx} className="flex-1 bg-accent text-white text-[11px] font-bold py-2 rounded">Save</button>
                <button onClick={() => setIsAddingTx(false)} className="flex-1 bg-surface border border-border text-text-2 text-[11px] font-bold py-2 rounded">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-border group hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green/10 text-green' : 'bg-coral/10 text-coral'}`}>
                    {tx.type === 'income' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-text-primary">{tx.desc}</div>
                    <div className="text-[10px] text-text-3">By {tx.addedBy} • {new Date(tx.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className={`font-syne font-bold ${tx.type === 'income' ? 'text-green' : 'text-text-primary'}`}>
                  {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                </div>
              </div>
            ))}
            {transactions.length === 0 && <div className="text-center text-text-3 text-[12px] py-10">No transactions yet.</div>}
          </div>
        </div>

        {/* Savings Jars */}
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne text-[15px] font-bold text-text-primary flex items-center gap-2">
              <Target size={16} className="text-blue" /> Savings Jars
            </h3>
            <button onClick={() => setIsAddingJar(true)} className="text-[11px] font-bold bg-blue/10 text-blue px-3 py-1.5 rounded-md hover:bg-blue/20 transition-colors flex items-center gap-1">
              <Plus size={12} /> New Jar
            </button>
          </div>

          {isAddingJar && (
            <div className="mb-4 bg-surface-2 p-3 rounded-lg border border-border space-y-3">
              <input type="text" placeholder="Goal Name (e.g. Europe Trip)" value={jarName} onChange={e=>setJarName(e.target.value)} className="w-full bg-surface border border-border rounded px-3 py-2 text-[12px] outline-none" />
              <input type="number" placeholder="Target Amount (₹)" value={jarTarget} onChange={e=>setJarTarget(e.target.value)} className="w-full bg-surface border border-border rounded px-3 py-2 text-[12px] outline-none" />
              <div className="flex gap-2">
                <button onClick={handleAddJar} className="flex-1 bg-blue text-white text-[11px] font-bold py-2 rounded">Create Jar</button>
                <button onClick={() => setIsAddingJar(false)} className="flex-1 bg-surface border border-border text-text-2 text-[11px] font-bold py-2 rounded">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {jars.map(jar => {
              const progress = Math.min(100, Math.round((jar.current / jar.target) * 100));
              return (
                <div key={jar.id} className="relative bg-surface-2 border border-border rounded-xl p-4 overflow-hidden group cursor-pointer" onClick={() => addFundsToJar(jar.id, jar.current, jar.target)}>
                  {/* Liquid fill effect */}
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute bottom-0 left-0 right-0 bg-blue/10 z-0 border-t border-blue/20"
                  />
                  <div className="relative z-10 flex flex-col items-center text-center gap-2">
                    <span className="text-[12px] font-bold text-text-primary line-clamp-1">{jar.name}</span>
                    <div className="font-syne text-xl font-bold text-blue">₹{jar.current.toLocaleString()}</div>
                    <div className="text-[10px] text-text-3 font-medium">of ₹{jar.target.toLocaleString()}</div>
                    <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-blue rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, 'collab_finance_jars', jar.id)); }} className="absolute top-2 right-2 text-text-3 hover:text-coral opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Trash2 size={12}/>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
