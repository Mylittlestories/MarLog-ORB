// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { createElement } from 'react'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from '@/App.jsx'

beforeAll(() => {
  if (!('structuredClone' in globalThis)) globalThis.structuredClone = (x) => JSON.parse(JSON.stringify(x))
})
afterEach(cleanup)

async function boot() {
  render(createElement(App))
  await waitFor(() => expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0), { timeout: 3000 })
}

describe('navigation renders every page without crashing', () => {
  it('visits all main pages', async () => {
    await boot()
    const pages = [
      ['ORB Entries', /Oil Record Book/i],
      ['Analytics', /Analytics/i],
      ['Fleet Setup', /Fleet Setup/i],
      ['Rules Reference', /Compliance Rules/i],
      ['Audit Log', /Audit Log/i],
      ['Templates', /Entry Templates/i],
      ['Export & Backup', /Export & Backup/i],
    ]
    for (const [navLabel, pageTest] of pages) {
      const buttons = screen.getAllByText(navLabel)
      fireEvent.click(buttons[0])
      await waitFor(() => expect(screen.getAllByText(pageTest).length).toBeGreaterThan(0), { timeout: 2000 })
    }
  }, 20000)
})
