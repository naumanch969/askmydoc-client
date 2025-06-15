"use client"

import { ContextProvider } from '@/context/useStateContext'
import store from '@/store/store'
import React, { ReactNode } from 'react'
import { Provider } from 'react-redux'

const StateProvider = ({ children }: { children: ReactNode }) => {

  return (
    <Provider store={store} >
      <ContextProvider>
        {children}
      </ContextProvider>
    </Provider>
  )
}

export default StateProvider