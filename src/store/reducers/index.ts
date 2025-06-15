import { combineReducers } from 'redux';
import document from './documentSlice'
import session from './sessionSlice'
import chat from './chatSlice'

const rootReducer = combineReducers({
    document,
    session,
    chat,
});

export default rootReducer;
