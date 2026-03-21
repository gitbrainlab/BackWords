import '@testing-library/jest-dom'
import { beforeAll, afterAll } from 'vitest'

// Suppress specific console warnings in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ReactDOM.render') || args[0].includes('act'))
    ) return
    originalError(...args)
  }
})
afterAll(() => {
  console.error = originalError
})

