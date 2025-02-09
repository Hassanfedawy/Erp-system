'use client'

// React Imports
import { useMemo } from 'react'

// MUI Imports
import { deepmerge } from '@mui/utils'
import {
  Experimental_CssVarsProvider as CssVarsProvider,
  experimental_extendTheme as extendTheme,
  lighten,
  darken
} from '@mui/material/styles'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import CssBaseline from '@mui/material/CssBaseline'

// Third-party Imports
import { useMedia } from 'react-use'
import stylisRTLPlugin from 'stylis-plugin-rtl'

// Component Imports
import ModeChanger from './ModeChanger'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Core Theme Imports
import defaultCoreTheme from '@core/theme'

const defaultSettings = {
  skin: 'default',
  appBar: 'fixed',
  navCollapsed: false,
  layout: 'vertical',
  lastLayout: 'vertical',
  direction: 'ltr',
  semiDark: false,
  navbarType: 'floating',
  footerType: 'static',
  themeColor: 'primary',
  contentWidth: 'full',
  mode: 'light',
  primaryColor: '#7367F0'
}

const ThemeProvider = props => {
  // Props
  const { children, direction, systemMode } = props

  // Hooks
  const { settings } = useSettings()
  const isDark = useMedia('(prefers-color-scheme: dark)', systemMode === 'dark')

  // Vars
  const isServer = typeof window === 'undefined'
  const currentSettings = settings || defaultSettings
  let currentMode = isServer ? systemMode : currentSettings.mode === 'system' ? (isDark ? 'dark' : 'light') : currentSettings.mode

  // Merge the primary color scheme override with the core theme
  const theme = useMemo(() => {
    const primaryColor = currentSettings?.primaryColor || defaultSettings.primaryColor

    const newColorScheme = {
      colorSchemes: {
        light: {
          palette: {
            primary: {
              main: primaryColor,
              light: primaryColor ? lighten(primaryColor, 0.2) : lighten(defaultSettings.primaryColor, 0.2),
              dark: primaryColor ? darken(primaryColor, 0.1) : darken(defaultSettings.primaryColor, 0.1)
            }
          }
        },
        dark: {
          palette: {
            primary: {
              main: primaryColor,
              light: primaryColor ? lighten(primaryColor, 0.2) : lighten(defaultSettings.primaryColor, 0.2),
              dark: primaryColor ? darken(primaryColor, 0.1) : darken(defaultSettings.primaryColor, 0.1)
            }
          }
        }
      }
    }

    const coreTheme = deepmerge(defaultCoreTheme(currentSettings, currentMode, direction), newColorScheme)

    return extendTheme(coreTheme)
  }, [currentSettings, currentMode, direction])

  return (
    <AppRouterCacheProvider
      options={{
        prepend: true,
        ...(direction === 'rtl' && {
          key: 'rtl',
          stylisPlugins: [stylisRTLPlugin]
        })
      }}
    >
      <CssVarsProvider
        theme={theme}
        defaultMode={systemMode}
        modeStorageKey={`${themeConfig.templateName.toLowerCase().split(' ').join('-')}-mui-template-mode`}
      >
        <>
          <ModeChanger systemMode={systemMode} />
          <CssBaseline />
          {children}
        </>
      </CssVarsProvider>
    </AppRouterCacheProvider>
  )
}

export default ThemeProvider
