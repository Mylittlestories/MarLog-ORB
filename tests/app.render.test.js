// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { createElement } from 'react'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '@/App.jsx'

beforeAll(() => {
  if (!('structuredClone' in globalThis)) globalThis.structuredClone = (x) => JSON.parse(JSON.stringify(x))
})

afterEach(cleanup)

describe('App renders', () => {
  it('boots with a default vessel and shows the dashboard', async () => {
    render(createElement(App))
    await waitFor(() => {
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    }, { timeout: 3000 })
    expect(screen.getAllByText('MarLog ORB').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/New Record Entry/i).length).toBeGreaterThan(0)
  }, 10000)
})
