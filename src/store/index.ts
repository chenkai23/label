import create from "zustand";
import { immer } from "zustand/middleware/immer";
import { Project, ImagePair, Annotation } from "../types/project";

interface LabelPreset {
  id: string;
  name: string;
  color: string;
  shortcut?: string;
}

interface HistoryItem {
  imagePairId: string;
  type: "visible" | "infrared";
  annotations: Annotation[];
}

interface AppState {
  projects: Project[];
  currentProject: Project | null;
  currentImagePair: ImagePair | null;
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  addProject: (project: Project) => void;
  setCurrentProject: (project: Project | null) => void;
  setCurrentImagePair: (imagePair: ImagePair | null) => void;
  addImagePair: (projectId: string, imagePair: ImagePair) => void;
  updateAnnotations: (
    imagePairId: string,
    type: "visible" | "infrared",
    annotations: Annotation[]
  ) => void;
  labelPresets: LabelPreset[];
  addLabelPreset: (preset: LabelPreset) => void;
  removeLabelPreset: (id: string) => void;
  updateLabelPreset: (id: string, updates: Partial<LabelPreset>) => void;
  currentVisibleImage: ImagePair | null;
  currentInfraredImage: ImagePair | null;
  setCurrentImages: (
    visible: ImagePair | null,
    infrared: ImagePair | null
  ) => void;
  currentLabel: LabelPreset | null;
  setCurrentLabel: (label: LabelPreset | null) => void;
  annotationHistory: HistoryItem[];
  maxHistoryLength: number;
  undoAnnotation: () => void;
  setCurrentselectedBoxId: (boxId) => void;
  currentselectedBoxId: string | null;
}

// 创建一些测试数据
const testProject: Project = {
  id: "1",
  name: "测试项目",
  description: "这是一个测试项目",
  imageCount: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
  imagePairs: [
    {
      id: "pair1",
      projectId: "1",
      visibleImage: {
        id: "visible1",
        url: "https://picsum.photos/800/600",
        name: "可见光图片1",
        type: "visible",
        annotations: [],
      },
      infraredImage: {
        id: "infrared1",
        url: "https://picsum.photos/800/600",
        name: "红外图片1",
        type: "infrared",
        annotations: [],
      },
    },
  ],
};

export const useStore = create<AppState>((set, get) => ({
  projects: [testProject],
  currentProject: null,
  currentImagePair: null,
  darkMode: false,
  setDarkMode: (darkMode) => set({ darkMode }),
  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),
  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentImagePair: (imagePair) => set({ currentImagePair: imagePair }),
  addImagePair: (projectId, imagePair) =>
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              imagePairs: [...(project.imagePairs || []), imagePair],
              imageCount: (project.imageCount || 0) + 1,
              updatedAt: new Date(),
            }
          : project
      ),
    })),
  updateAnnotations: (imagePairId, type, annotations) => {
    set((state) => {
      // 保存当前状态到历史记录
      const currentState =
        state.projects
          .flatMap((p) => p.imagePairs)
          .find((ip) => ip!.id === imagePairId)?.[
          type === "visible" ? "visibleImage" : "infraredImage"
        ]?.annotations || [];

      const newHistory = [
        {
          imagePairId,
          type,
          annotations: [...currentState],
        },
        ...state.annotationHistory,
      ].slice(0, state.maxHistoryLength);

      // 更新标注
      const newProjects = state.projects.map((project) => ({
        ...project,
        imagePairs: project.imagePairs!.map((pair) => {
          if (pair.id === imagePairId) {
            return {
              ...pair,
              [type === "visible" ? "visibleImage" : "infraredImage"]: {
                ...pair[type === "visible" ? "visibleImage" : "infraredImage"],
                annotations,
              },
            };
          }
          return pair;
        }),
      }));

      return {
        annotationHistory: newHistory,
        projects: newProjects,
      };
    });
  },
  labelPresets: [],
  addLabelPreset: (preset) =>
    set((state) => ({
      labelPresets: [...state.labelPresets, preset],
    })),
  removeLabelPreset: (id) =>
    set((state) => ({
      labelPresets: state.labelPresets.filter((p) => p.id !== id),
    })),
  updateLabelPreset: (id, updates) =>
    set((state) => ({
      labelPresets: state.labelPresets.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  currentVisibleImage: null,
  currentInfraredImage: null,
  setCurrentImages: (visible, infrared) =>
    set({ currentVisibleImage: visible, currentInfraredImage: infrared }),
  currentLabel: null,
  setCurrentLabel: (label) => set({ currentLabel: label }),
  annotationHistory: [],
  maxHistoryLength: 20, // 保存最近20次操作
  undoAnnotation: () => {
    set((state) => {
      if (state.annotationHistory.length === 0) return state;

      const [lastHistory, ...remainingHistory] = state.annotationHistory;
      const { imagePairId, type, annotations } = lastHistory;

      const newProjects = state.projects.map((project) => ({
        ...project,
        imagePairs: project.imagePairs!.map((pair) => {
          if (pair.id === imagePairId) {
            return {
              ...pair,
              [type === "visible" ? "visibleImage" : "infraredImage"]: {
                ...pair[type === "visible" ? "visibleImage" : "infraredImage"],
                annotations,
              },
            };
          }
          return pair;
        }),
      }));

      return {
        annotationHistory: remainingHistory,
        projects: newProjects,
      };
    });
  },
  currentselectedBoxId: null, // 当前选中的标注框id
  setCurrentselectedBoxId: (boxId) => set({ currentselectedBoxId: boxId }),
}));

export default useStore;
