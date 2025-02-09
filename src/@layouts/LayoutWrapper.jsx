'use client'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import useLayoutInit from '@core/hooks/useLayoutInit'
import { SettingsProvider } from '@core/contexts/settingsContext'

const LayoutWrapper = props => {
  // Props
  const { systemMode, verticalLayout, horizontalLayout } = props

  // Hooks
  const { settings } = useSettings()
  useLayoutInit(systemMode)

  // Return the layout based on the layout context
  return (
    <SettingsProvider>
      <div className='flex flex-col flex-auto' data-skin={settings.skin}>
        {settings.layout === 'horizontal' ? horizontalLayout : verticalLayout}
      </div>
    </SettingsProvider>
  )
}

export default LayoutWrapper
