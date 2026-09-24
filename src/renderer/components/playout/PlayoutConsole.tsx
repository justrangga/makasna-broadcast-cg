import React from 'react';
import { DualMonitor } from './DualMonitor';
import { RundownPlaylist } from './RundownPlaylist';

export const PlayoutConsole: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-studio-950">
      {/* Top Dual Monitor (PVW vs PGM) */}
      <DualMonitor />

      {/* Bottom Rundown Playlist & Master Transition Deck */}
      <RundownPlaylist />
    </div>
  );
};
