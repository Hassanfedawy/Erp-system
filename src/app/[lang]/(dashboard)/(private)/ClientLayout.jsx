'use client'

import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'

export default function ClientLayout({ children, direction, systemMode }) {
  return (
    <SettingsProvider>
      <ThemeProvider direction={direction} systemMode={systemMode}>
        {children}
      </ThemeProvider>
    </SettingsProvider>
  )
}
