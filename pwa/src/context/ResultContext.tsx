// Shared context: holds the current InterpretationResult across Result/Timeline/SourceDetail pages
import React, { createContext, useContext, useState } from 'react'
import type { InterpretationResult, SearchMode } from '@/types'

export type SearchStatus = 'idle' | 'loading' | 'done' | 'error'

interface ResultState {
  result: InterpretationResult | null
  query: string
  mode: SearchMode
  searchStatus: SearchStatus
  searchError: string | null
}

interface ResultContextValue extends ResultState {
  setResult: (result: InterpretationResult, query: string, mode: SearchMode) => void
  clearResult: () => void
  setSearchStatus: (status: SearchStatus) => void
  setSearchError: (error: string | null) => void
}

const ResultContext = createContext<ResultContextValue | null>(null)

export function ResultProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ResultState>({
    result: null,
    query: '',
    mode: 'word',
    searchStatus: 'idle',
    searchError: null,
  })

  function setResult(result: InterpretationResult, query: string, mode: SearchMode) {
    setState(s => ({ ...s, result, query, mode }))
  }

  function clearResult() {
    setState({ result: null, query: '', mode: 'word', searchStatus: 'idle', searchError: null })
  }

  function setSearchStatus(searchStatus: SearchStatus) {
    setState(s => ({ ...s, searchStatus }))
  }

  function setSearchError(searchError: string | null) {
    setState(s => ({ ...s, searchError }))
  }

  return (
    <ResultContext.Provider value={{ ...state, setResult, clearResult, setSearchStatus, setSearchError }}>
      {children}
    </ResultContext.Provider>
  )
}

export function useResult(): ResultContextValue {
  const ctx = useContext(ResultContext)
  if (!ctx) throw new Error('useResult must be used within ResultProvider')
  return ctx
}
