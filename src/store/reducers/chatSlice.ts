import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../api';
import toast from 'react-hot-toast';
import { Message } from '@/lib/interfaces';
import { getErrorMessage } from '@/lib/utils';

interface MessageState {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
}

const initialState: MessageState = {
    messages: [],
    isLoading: false,
    error: null,
};

export const sendMessage = createAsyncThunk('message/sendMessage', async (payload: { sessionId: string; message: string }, { rejectWithValue }) => {
    try {
        const { data } = await api.sendMessage(payload);
        return data?.data;
    } catch (error) {
        const message = getErrorMessage(error, 'Failed to send message');
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const getMessageHistory = createAsyncThunk('message/getMessageHistory', async (sessionId: string, { rejectWithValue }) => {
    try {
        const { data } = await api.getMessageHistory(sessionId);
        return data?.data;
    } catch (error) {
        const message = getErrorMessage(error, 'Failed to fetch message history');
        return rejectWithValue(message);
    }
});

// streamMessage is handled separately and not part of redux state

const messageSlice = createSlice({
    name: 'message',
    initialState,
    reducers: {
        resetMessageState: () => initialState,
        appendStreamedMessage: (state, action) => {
            const lastMessage = state.messages[state.messages.length - 1];
            if (lastMessage && lastMessage.isStreaming) {
                lastMessage.content += action.payload;
            } else {
                const message: Message = {
                    _id: 'streaming',
                    role: 'assistant',
                    content: action.payload,
                    createdAt: new Date().toISOString(),
                    isStreaming: true,
                }
                state.messages.push(message);
            }
        },
        finalizeStreamedMessage: (state) => {
            const lastMessage = state.messages[state.messages.length - 1];
            if (lastMessage && lastMessage.isStreaming) {
                delete lastMessage.isStreaming;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendMessage.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                state.isLoading = false;
                state.messages.push(action.payload);
            })
            .addCase(sendMessage.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            .addCase(getMessageHistory.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getMessageHistory.fulfilled, (state, action) => {
                state.isLoading = false;
                state.messages = action.payload;
            })
            .addCase(getMessageHistory.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            .addDefaultCase((state) => state);
    }
});

export default messageSlice.reducer;
export const { resetMessageState, appendStreamedMessage, finalizeStreamedMessage } = messageSlice.actions;
export const { actions: messageActions } = messageSlice;
