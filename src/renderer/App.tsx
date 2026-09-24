import React, { useEffect } from 'react';
import { useCGStore } from '@/store/useCGStore';
import { usePlayoutStore } from '@/store/usePlayoutStore';
import { Header } from './components/Header';
import { DesignerStudio } from './components/designer/DesignerStudio';
import { PlayoutConsole } from './components/playout/PlayoutConsole';
import { MasterOutputView } from './components/output/MasterOutputView';

export const App: React.FC = () => {
  const { mode } = useCGStore();
  const { take, clearAll } = usePlayoutStore();

  // Check if this window was opened as a dedicated transparent broadcast output
  const params = new URLSearchParams(window.location.search);
  const isPureOutputWindow = params.get('output') === 'pgm' || params.get('channel') === 'pgm';

  // Global broadcast keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        take();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        clearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [take, clearAll]);

  if (isPureOutputWindow) {
    return <MasterOutputView />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-studio-950 text-slate-100 overflow-hidden font-display select-none">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        {mode === 'designer' ? <DesignerStudio /> : <PlayoutConsole />}
      </main>
    </div>
  );
};
