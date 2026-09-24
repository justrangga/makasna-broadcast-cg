import React from 'react';
import { ElementsHierarchy } from './ElementsHierarchy';
import { CanvasViewport } from './CanvasViewport';
import { PropertiesInspector } from './PropertiesInspector';
import { TimelinePanel } from './TimelinePanel';

export const DesignerStudio: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-studio-950">
      {/* Top Main Workspace: Layers Left, Viewport Center, Properties Right */}
      <div className="flex-1 flex overflow-hidden">
        <ElementsHierarchy />
        <CanvasViewport />
        <PropertiesInspector />
      </div>

      {/* Bottom Timeline Panel */}
      <TimelinePanel />
    </div>
  );
};
