import { Activity, LayoutDashboard, CheckCircle2 } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Weekly Report Generator & Team Dashboard</h1>
            <p className="text-xs text-slate-400">Sisenco Assignment Stack Initialized</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <CheckCircle2 className="w-4 h-4" />
          <span>Vite + React + Tailwind Ready</span>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-5xl mx-auto w-full flex flex-col justify-center items-center text-center">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Activity className="w-10 h-10 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white">Project Environment Setup</h2>
          <p className="text-sm text-slate-400">
            Frontend stack with Vite, React, TypeScript & Tailwind CSS initialized successfully.
          </p>
          <div className="grid grid-cols-2 gap-3 text-left pt-2">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-500 block">Frontend Framework</span>
              <span className="text-sm font-medium text-slate-200">React + TypeScript</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-500 block">Styling Engine</span>
              <span className="text-sm font-medium text-sky-400">Tailwind CSS v3</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
