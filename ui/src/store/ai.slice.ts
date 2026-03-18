import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface AiActivity {
  id: string;
  label: string;
  agentType: string;
  startedAt: number;
}

export interface AiLogEntry {
  id: string;
  label: string;
  agentType: string;
  timestamp: number;
  status: 'success' | 'error';
}

interface AiState {
  /** Currently running AI tasks */
  activeTasks: AiActivity[];
  /** Recent AI activity log (last 20) */
  activityLog: AiLogEntry[];
  /** Whether the floating assistant is open */
  isAssistantOpen: boolean;
}

const initialState: AiState = {
  activeTasks: [],
  activityLog: [],
  isAssistantOpen: false,
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    aiTaskStarted(state, action: PayloadAction<AiActivity>) {
      state.activeTasks.push(action.payload);
    },
    aiTaskCompleted(state, action: PayloadAction<{ id: string; label: string; agentType: string }>) {
      state.activeTasks = state.activeTasks.filter((t) => t.id !== action.payload.id);
      state.activityLog.unshift({
        ...action.payload,
        timestamp: Date.now(),
        status: 'success',
      });
      if (state.activityLog.length > 20) state.activityLog.pop();
    },
    aiTaskFailed(state, action: PayloadAction<{ id: string; label: string; agentType: string }>) {
      state.activeTasks = state.activeTasks.filter((t) => t.id !== action.payload.id);
      state.activityLog.unshift({
        ...action.payload,
        timestamp: Date.now(),
        status: 'error',
      });
      if (state.activityLog.length > 20) state.activityLog.pop();
    },
    toggleAssistant(state) {
      state.isAssistantOpen = !state.isAssistantOpen;
    },
    openAssistant(state) {
      state.isAssistantOpen = true;
    },
    closeAssistant(state) {
      state.isAssistantOpen = false;
    },
  },
});

export const {
  aiTaskStarted,
  aiTaskCompleted,
  aiTaskFailed,
  toggleAssistant,
  openAssistant,
  closeAssistant,
} = aiSlice.actions;
export default aiSlice.reducer;
