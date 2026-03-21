// Shared context: holds the current InterpretationResult across Result/Timeline/SourceDetail pages
import React, { createContext, useContext, useState } from 'react'
import type { InterpretationResult, SearchMode } from '@/types'

interface ResultState {
  result: InterpretationResult | null
  query: string
  mode: SearchMode
}

interface ResultContextValue extends ResultState {
  setResult: (result: InterpretationResult, query: string, mode: SearchMode) => void
  clearResult: () => void
}

const ResultContext = createContext<ResultContextValue | null>(null)

export function ResultProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ResultState>({
    result: null,
    query: '',
    mode: 'word',
  })

  function setResult(result: InterpretationResult, query: string, mode: SearchMode) {
    setState({ result, query, mode })
  }

  function clearResult() {
    setState({ result: null, query: '', mode: 'word' })
  }

  return (
    <ResultContext.Provider value={{ ...state, setResult, clearResult }}>
      {children}
    </ResultContext.Provider>
  )
}

export function useResult(): ResultContextValue {
  const ctx = useContext(ResultContext)
  if (!ctx) throw new Error('useResult must be used within ResultProvider')
  return ctx
}
