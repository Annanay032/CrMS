import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User, UserTeam } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  activeTeamId: string | null;
  activeTeam: UserTeam | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  activeTeamId: localStorage.getItem('activeTeamId'),
  activeTeam: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>) {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('accessToken', action.payload.accessToken);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
      // Restore active team from user's teams
      if (action.payload.user.teams?.length && state.activeTeamId) {
        const team = action.payload.user.teams.find((t) => t.id === state.activeTeamId);
        if (team) state.activeTeam = team;
      }
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      // Restore active team from user's teams
      if (action.payload.teams?.length && state.activeTeamId) {
        const team = action.payload.teams.find((t) => t.id === state.activeTeamId);
        if (team) state.activeTeam = team;
        else {
          state.activeTeamId = null;
          state.activeTeam = null;
          localStorage.removeItem('activeTeamId');
        }
      }
    },
    switchTeam(state, action: PayloadAction<UserTeam | null>) {
      if (action.payload) {
        state.activeTeamId = action.payload.id;
        state.activeTeam = action.payload;
        localStorage.setItem('activeTeamId', action.payload.id);
      } else {
        // Switch to personal account
        state.activeTeamId = null;
        state.activeTeam = null;
        localStorage.removeItem('activeTeamId');
      }
    },
    logout(state) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('activeTeamId');
      state.user = null;
      state.isAuthenticated = false;
      state.activeTeamId = null;
      state.activeTeam = null;
    },
  },
});

export const { setCredentials, setUser, switchTeam, logout } = authSlice.actions;
export default authSlice.reducer;
