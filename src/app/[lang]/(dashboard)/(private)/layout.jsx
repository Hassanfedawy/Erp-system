// Server component
import ClientLayout from './ClientLayout'

// MUI Imports
import Button from '@mui/material/Button'

// Layout Imports
import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import HorizontalLayout from '@layouts/HorizontalLayout'

// Component Imports
import Providers from '@components/Providers'
import Navigation from '@components/layout/vertical/Navigation'
import Header from '@components/layout/horizontal/Header'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import HorizontalFooter from '@components/layout/horizontal/Footer'
import Customizer from '@core/components/customizer'
import ScrollToTop from '@core/components/scroll-to-top'

// Util Imports
import { getDictionary } from '@/utils/getDictionary'
import { getMode, getSystemMode } from '@core/utils/serverHelpers'
import { i18n } from '@configs/i18n'

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
  contentWidth: 'full'
}

const Layout = async ({ children, params }) => {
  const dictionary = await getDictionary(params.lang)
  const direction = i18n.langDirection[params.lang]
  const mode = getMode()
  const systemMode = getSystemMode()

  return (
    <ClientLayout direction={direction} systemMode={systemMode}>
      <Providers direction={direction}>
        <LayoutWrapper
          systemMode={systemMode}
          settings={defaultSettings}
          verticalLayout={
            <VerticalLayout
              navigation={<Navigation dictionary={dictionary} mode={mode} systemMode={systemMode} />}
              navbar={<Navbar />}
              footer={<VerticalFooter />}
            >
              {children}
            </VerticalLayout>
          }
          horizontalLayout={
            <HorizontalLayout header={<Header dictionary={dictionary} />} footer={<HorizontalFooter />}>
              {children}
            </HorizontalLayout>
          }
        />
        <ScrollToTop className='mui-fixed'>
          <Button variant='contained'>
            <i className='tabler-arrow-up' />
          </Button>
        </ScrollToTop>
        <Customizer />
      </Providers>
    </ClientLayout>
  )
}

export default Layout
