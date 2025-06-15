"use client"

import { User } from '@/lib/interfaces';
import React, { createContext, useContext, ReactNode } from 'react';

interface StateContextType {
    user?: User | null;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const ContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    ///////////////////////////////////////////////////// VARIABLES ////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////// STATES ////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////// RENDER ////////////////////////////////////////////////////////////
    return (
        <StateContext.Provider
            value={{

            }}
        >
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = (): StateContextType => {
    const context = useContext(StateContext);
    if (!context) {
        throw new Error('useStateContext must be used within a StateProvider');
    }
    return context;
};
