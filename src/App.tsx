import React from 'react'
import { AppRouter } from './presentation/routes/AppRouter'
import { ErrorBoundary } from './presentation/components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  )
}

export default App
