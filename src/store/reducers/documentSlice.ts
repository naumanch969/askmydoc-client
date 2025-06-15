import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../api';
import toast from 'react-hot-toast';
import { Document } from '@/lib/interfaces';
import { getErrorMessage } from '@/lib/utils';

interface DocumentState {
    documents: Document[];
    selectedDocument: Document | null;
    isLoading: boolean;
    error: string | null;
}

export const uploadDocument = createAsyncThunk('document/uploadDocument', async (formData: FormData, { rejectWithValue }) => {
    try {
        const { data } = await api.uploadDocument(formData);
        if (data?.success) toast.success(data?.message);
        else toast.error(data.message);
        return data.data;
    } catch (error) {
        const message = getErrorMessage(error, "Failed to upload document");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const getAllDocuments = createAsyncThunk('document/getAllDocuments', async (_, { rejectWithValue }) => {
    try {
        const { data } = await api.getAllDocuments();
        return data.data;
    } catch (error) {
        const message = getErrorMessage(error, "Failed to fetch documents");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const getOneDocument = createAsyncThunk('document/getOneDocument', async (id: string, { rejectWithValue }) => {
    try {
        const { data } = await api.getOneDocument(id);
        return data.data;
    } catch (error) {
        const message = getErrorMessage(error, "Failed to fetch document");
        toast.error(message);
        return rejectWithValue(message);
    }
});

export const deleteDocument = createAsyncThunk('document/deleteDocument', async (id: string, { rejectWithValue }) => {
    try {
        const { data } = await api.deleteDocument(id);
        if (data?.success) toast.success(data.message);
        else toast.error(data.message);
        return id;
    } catch (error) {
        const message = getErrorMessage(error, "Failed to delete document");
        toast.error(message);
        return rejectWithValue(message);
    }
});

const initialState: DocumentState = {
    documents: [],
    selectedDocument: null,
    isLoading: false,
    error: null,
};

const documentSlice = createSlice({
    name: 'document',
    initialState,
    reducers: {
        resetDocumentState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(uploadDocument.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(uploadDocument.fulfilled, (state, action) => {
                state.isLoading = false;
                state.documents.push(action.payload);
            })
            .addCase(uploadDocument.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            .addCase(getAllDocuments.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getAllDocuments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.documents = action.payload;
            })
            .addCase(getAllDocuments.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            .addCase(getOneDocument.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getOneDocument.fulfilled, (state, action) => {
                state.isLoading = false;
                state.selectedDocument = action.payload;
            })
            .addCase(getOneDocument.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            .addCase(deleteDocument.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteDocument.fulfilled, (state, action) => {
                state.isLoading = false;
                state.documents = state.documents.filter(doc => doc._id !== action.payload);
            })
            .addCase(deleteDocument.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            .addDefaultCase((state) => state);
    },
});

export default documentSlice.reducer;
export const { resetDocumentState } = documentSlice.actions;
export const { actions: documentActions } = documentSlice;
