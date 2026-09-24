import { create } from 'zustand';
import { CGProject, CGTemplate, CGLayer, Keyframe, SmartDataSet } from '@shared/types';
import { defaultProject } from '@shared/defaultProject';

interface CGStoreState {
  mode: 'designer' | 'playout';
  project: CGProject;
  activeTemplateId: string;
  selectedLayerId: string | null;
  currentTime: number; // in seconds
  isPlaying: boolean;
  playbackSpeed: number;
  showGuides: boolean;
  showActionSafe: boolean;
  zoom: number;

  // Actions
  setMode: (mode: 'designer' | 'playout') => void;
  setProject: (project: CGProject) => void;
  setActiveTemplateId: (id: string) => void;
  setSelectedLayerId: (id: string | null) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setShowGuides: (show: boolean) => void;
  setShowActionSafe: (show: boolean) => void;
  setZoom: (zoom: number) => void;

  // Project mutations
  updateTemplate: (templateId: string, updates: Partial<CGTemplate>) => void;
  addLayer: (templateId: string, layer: CGLayer) => void;
  updateLayer: (templateId: string, layerId: string, updates: Partial<CGLayer>) => void;
  deleteLayer: (templateId: string, layerId: string) => void;
  reorderLayers: (templateId: string, sourceIndex: number, destIndex: number) => void;

  // Keyframes
  addKeyframe: (templateId: string, layerId: string, kf: Keyframe) => void;
  updateKeyframe: (templateId: string, layerId: string, kfId: string, updates: Partial<Keyframe>) => void;
  deleteKeyframe: (templateId: string, layerId: string, kfId: string) => void;

  // Datahub
  updateDataset: (datasetId: string, updates: Partial<SmartDataSet>) => void;
  addDatasetRow: (datasetId: string, row: Record<string, string | number>) => void;
  updateDatasetCell: (datasetId: string, rowIndex: number, column: string, value: string | number) => void;
  deleteDatasetRow: (datasetId: string, rowIndex: number) => void;
}

export const useCGStore = create<CGStoreState>((set) => ({
  mode: 'designer',
  project: defaultProject,
  activeTemplateId: defaultProject.templates[0].id,
  selectedLayerId: defaultProject.templates[0].layers[3].id,
  currentTime: 1.0,
  isPlaying: false,
  playbackSpeed: 1,
  showGuides: true,
  showActionSafe: true,
  zoom: 0.65,

  setMode: (mode) => set({ mode }),
  setProject: (project) => set({ project }),
  setActiveTemplateId: (id) =>
    set((state) => {
      const tpl = state.project.templates.find((t) => t.id === id);
      return {
        activeTemplateId: id,
        selectedLayerId: tpl && tpl.layers.length > 0 ? tpl.layers[0].id : null,
        currentTime: 0,
        isPlaying: false,
      };
    }),
  setSelectedLayerId: (id) => set({ selectedLayerId: id }),
  setCurrentTime: (time) =>
    set((state) => {
      const tpl = state.project.templates.find((t) => t.id === state.activeTemplateId);
      const maxTime = tpl ? tpl.duration : 10;
      return { currentTime: Math.max(0, Math.min(maxTime, time)) };
    }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setShowGuides: (showGuides) => set({ showGuides }),
  setShowActionSafe: (showActionSafe) => set({ showActionSafe }),
  setZoom: (zoom) => set({ zoom }),

  updateTemplate: (templateId, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        templates: state.project.templates.map((tpl) =>
          tpl.id === templateId ? { ...tpl, ...updates } : tpl
        ),
      },
    })),

  addLayer: (templateId, layer) =>
    set((state) => ({
      project: {
        ...state.project,
        templates: state.project.templates.map((tpl) =>
          tpl.id === templateId ? { ...tpl, layers: [...tpl.layers, layer] } : tpl
        ),
      },
      selectedLayerId: layer.id,
    })),

  updateLayer: (templateId, layerId, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        templates: state.project.templates.map((tpl) =>
          tpl.id === templateId
            ? {
                ...tpl,
                layers: tpl.layers.map((l) =>
                  l.id === layerId
                    ? {
                        ...l,
                        ...updates,
                        transform: { ...l.transform, ...(updates.transform || {}) },
                        style: { ...l.style, ...(updates.style || {}) },
                        content: { ...l.content, ...(updates.content || {}) },
                      }
                    : l
                ),
              }
            : tpl
        ),
      },
    })),

  deleteLayer: (templateId, layerId) =>
    set((state) => ({
      project: {
        ...state.project,
        templates: state.project.templates.map((tpl) =>
          tpl.id === templateId
            ? { ...tpl, layers: tpl.layers.filter((l) => l.id !== layerId) }
            : tpl
        ),
      },
      selectedLayerId: state.selectedLayerId === layerId ? null : state.selectedLayerId,
    })),

  reorderLayers: (templateId, sourceIndex, destIndex) =>
    set((state) => {
      const tpl = state.project.templates.find((t) => t.id === templateId);
      if (!tpl) return state;
      const layers = [...tpl.layers];
      const [moved] = layers.splice(sourceIndex, 1);
      layers.splice(destIndex, 0, moved);
      return {
        project: {
          ...state.project,
          templates: state.project.templates.map((t) =>
            t.id === templateId ? { ...t, layers } : t
          ),
        },
      };
    }),

  addKeyframe: (templateId, layerId, kf) =>
    set((state) => ({
      project: {
        ...state.project,
        templates: state.project.templates.map((tpl) =>
          tpl.id === templateId
            ? {
                ...tpl,
                layers: tpl.layers.map((l) =>
                  l.id === layerId
                    ? { ...l, keyframes: [...l.keyframes.filter((k) => k.time !== kf.time), kf] }
                    : l
                ),
              }
            : tpl
        ),
      },
    })),

  updateKeyframe: (templateId, layerId, kfId, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        templates: state.project.templates.map((tpl) =>
          tpl.id === templateId
            ? {
                ...tpl,
                layers: tpl.layers.map((l) =>
                  l.id === layerId
                    ? {
                        ...l,
                        keyframes: l.keyframes.map((k) => (k.id === kfId ? { ...k, ...updates } : k)),
                      }
                    : l
                ),
              }
            : tpl
        ),
      },
    })),

  deleteKeyframe: (templateId, layerId, kfId) =>
    set((state) => ({
      project: {
        ...state.project,
        templates: state.project.templates.map((tpl) =>
          tpl.id === templateId
            ? {
                ...tpl,
                layers: tpl.layers.map((l) =>
                  l.id === layerId
                    ? { ...l, keyframes: l.keyframes.filter((k) => k.id !== kfId) }
                    : l
                ),
              }
            : tpl
        ),
      },
    })),

  updateDataset: (datasetId, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        datasets: state.project.datasets.map((ds) =>
          ds.id === datasetId ? { ...ds, ...updates, lastUpdated: Date.now() } : ds
        ),
      },
    })),

  addDatasetRow: (datasetId, row) =>
    set((state) => ({
      project: {
        ...state.project,
        datasets: state.project.datasets.map((ds) =>
          ds.id === datasetId
            ? { ...ds, rows: [...ds.rows, row], lastUpdated: Date.now() }
            : ds
        ),
      },
    })),

  updateDatasetCell: (datasetId, rowIndex, column, value) =>
    set((state) => ({
      project: {
        ...state.project,
        datasets: state.project.datasets.map((ds) =>
          ds.id === datasetId
            ? {
                ...ds,
                rows: ds.rows.map((r, i) => (i === rowIndex ? { ...r, [column]: value } : r)),
                lastUpdated: Date.now(),
              }
            : ds
        ),
      },
    })),

  deleteDatasetRow: (datasetId, rowIndex) =>
    set((state) => ({
      project: {
        ...state.project,
        datasets: state.project.datasets.map((ds) =>
          ds.id === datasetId
            ? { ...ds, rows: ds.rows.filter((_, i) => i !== rowIndex), lastUpdated: Date.now() }
            : ds
        ),
      },
    })),
}));
