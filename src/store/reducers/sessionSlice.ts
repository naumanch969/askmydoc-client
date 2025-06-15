import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../api';
import toast from 'react-hot-toast';
import { Session } from '@/lib/interfaces';
import { getErrorMessage } from '@/lib/utils';

interface SessionState {
    sessions: Session[];
    selectedSession: Session | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: SessionState = {
    sessions: [],
    selectedSession: null,
    isLoading: false,
    error: null,
};

export const createSession = createAsyncThunk('session/createSession', async (payload: { documentId: string }, { rejectWithValue }) => {
    try {
        const { data } = await api.createSession(payload);
        if (data?.success) toast.success(data?.message);
        else toast.error(data?.message);
        return data?.data as Session;
    } catch (error) {
        const message = getErrorMessage(error, 'Failed to create session');
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const getAllSessions = createAsyncThunk('session/getAllSessions', async (_, { rejectWithValue }) => {
    try {
        const { data } = await api.getAllSessions();
        return data?.data as Session[];
    } catch (error) {
        const message = getErrorMessage(error, 'Failed to fetch sessions');
        return rejectWithValue(message);
    }
});

export const getOneSession = createAsyncThunk('session/getOneSession', async (sessionId: string, { rejectWithValue }) => {
    try {
        const { data } = await api.getOneSession(sessionId);
        return data?.data as Session;
    } catch (error) {
        const message = getErrorMessage(error, 'Failed to fetch session');
        return rejectWithValue(message);
    }
});

export const updateSession = createAsyncThunk('session/updateSession', async ({ sessionId, title }: { sessionId: string; title: string }, { rejectWithValue }) => {
    try {
        const { data } = await api.updateSession(sessionId, title);
        if (data?.success) toast.success(data?.message);
        else toast.error(data?.message);
        return data?.data;
    } catch (error) {
        const message = getErrorMessage(error, 'Failed to update session');
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const pinSession = createAsyncThunk('session/pinSession', async ({ sessionId }: { sessionId: string; isPinned: boolean }, { rejectWithValue }) => {
    try {
        const { data } = await api.pinSession(sessionId);
        if (data?.success) toast.success(data?.message);
        else toast.error(data?.message);
        return data?.data;
    } catch (error) {
        const message = getErrorMessage(error, 'Failed to pin session');
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const deleteSession = createAsyncThunk('session/deleteSession', async (sessionId: string, { rejectWithValue }) => {
    try {
        const { data } = await api.deleteSession(sessionId);
        if (data?.success) toast.success(data?.message);
        else toast.error(data?.message);
        return { _id: sessionId };
    } catch (error) {
        const message = getErrorMessage(error, 'Failed to delete session');
        toast.error(message);
        return rejectWithValue(message);
    }
});

const sessionSlice = createSlice({
    name: 'session',
    initialState,
    reducers: {
        resetSessionState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(createSession.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.sessions.push(action.payload);
            })
            .addCase(createSession.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            .addCase(getAllSessions.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getAllSessions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.sessions = action.payload;
            })
            .addCase(getAllSessions.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            .addCase(getOneSession.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getOneSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedSession = action.payload;
            })
            .addCase(getOneSession.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            .addCase(updateSession.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.sessions = state.sessions.map((s) => s._id === action.payload._id ? action.payload : s);
            })
            .addCase(updateSession.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            .addCase(pinSession.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(pinSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.sessions = state.sessions.map((s) => s._id === action.payload._id ? action.payload : s);
            })
            .addCase(pinSession.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            .addCase(deleteSession.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.sessions = state.sessions.filter((s) => s._id !== action.payload._id);
            })
            .addCase(deleteSession.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            .addDefaultCase((state) => state);
    }
});

export default sessionSlice.reducer;
export const { resetSessionState } = sessionSlice.actions;
export const { actions: sessionActions } = sessionSlice;
