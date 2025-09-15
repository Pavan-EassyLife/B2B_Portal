'use client'

import { Provider } from 'react-redux'
import { store } from '@/store'
import { ReactNode, useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { initializeAuth } from '@/store/authSlice'

interface Props {
  children: ReactNode
}

// Component to initialize auth state
function AuthInitializer({ children }: Props) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Initialize auth state from localStorage on app start
    dispatch(initializeAuth())
  }, [dispatch])

  return <>{children}</>
}

export default function ReduxProvider({ children }: Props) {
  return (
    <Provider store={store}>
      <AuthInitializer>
        {children}
      </AuthInitializer>
    </Provider>
  )
}
