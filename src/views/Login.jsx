'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'

// Third-party Imports
import axios from 'axios'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Environment Variables
const key = process.env.NEXT_PUBLIC_AES_KEY
const iv = process.env.NEXT_PUBLIC_AES_IV
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN

// ---- New Encryption / Decryption Helpers using Node's crypto ---- //
import crypto from 'crypto' // Make sure to polyfill this in the browser!

// Resize a key/iv to the required length (key: 32 bytes, iv: 16 bytes)
const resizeKey = (str, length) => {
  if (str.length > length) {
    return str.slice(0, length)
  } else if (str.length < length) {
    return str.padEnd(length, '\0')
  }
  return str
}

const encrypt = (text, keyVal = key, ivVal = iv) => {
  const resizedKey = resizeKey(keyVal, 32)
  const resizedIV = resizeKey(ivVal, 16)
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(resizedKey, 'utf8'),
    Buffer.from(resizedIV, 'utf8')
  )
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return encrypted
}

const decrypt = (encryptedText, keyVal = key, ivVal = iv) => {
  const resizedKey = resizeKey(keyVal, 32)
  const resizedIV = resizeKey(ivVal, 16)
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(resizedKey, 'utf8'),
    Buffer.from(resizedIV, 'utf8')
  )
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// A helper that converts an object to JSON then encrypts it.
const encryptData = (data) => {
  const jsonString = JSON.stringify(data)
  return encrypt(jsonString)
}

// ----------------- End Encryption Helpers ----------------- //


// Helper functions for consistent session storage
const storeSession = (sessionData, remember) => {
  // Store final session in localStorage if persistent, otherwise in sessionStorage.
  const storage = remember ? localStorage : sessionStorage
  storage.setItem('session', JSON.stringify(sessionData))
  }

const getStoredSession = () => {
  // Check localStorage first then sessionStorage
  let session = localStorage.getItem('session')
  if (!session) {
    session = sessionStorage.getItem('session')
  }
  return session
}

// Styled Custom Components
const LoginIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 680,
  maxInlineSize: '100%',
  margin: theme.spacing(12),
  [theme.breakpoints.down(1536)]: {
    maxBlockSize: 550
  },
  [theme.breakpoints.down('lg')]: {
    maxBlockSize: 450
  }
}))

const MaskImg = styled('img')({
  blockSize: 'auto',
  maxBlockSize: 355,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

const Login = ({ mode }) => {
  // Component States
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errorState, setErrorState] = useState(null)
  const [is2FAStep, setIs2FAStep] = useState(false)
  const [loginData, setLoginData] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Variables for images and theme
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-login-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-login-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-login-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-login-light-border.png'

  // Hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang: locale } = useParams()
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, lightImg, darkImg)



  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const handleClickShowPassword = () => setIsPasswordShown(prev => !prev)

  // OTP verification function
  const handle2FALogin = async () => {
    try {
      setIsSubmitting(true)
      // Encrypt using new encryption method:
      const encryptedBody = encryptData({ id: loginData.ResultData, OTP: otp })

      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/ConfirmOTP',
        { body: encryptedBody,
          accessToken: ACCESS_TOKEN,
          SessionID: loginData.SessionID
         },
        {
          headers: {
            Token: API_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log(response.data)

      if (response.data?.Request_State) {
        // On success, store the final session using our helper.
        storeSession(response.data, rememberMe)
        // Remove any pending session saved during login.
        localStorage.removeItem('pendingSession')
        sessionStorage.removeItem('pendingSession')
  
        localStorage.setItem('sessionId', response.data.SessionID);
        localStorage.setItem('settings', JSON.stringify(response.data.userSettings));
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
        localStorage.setItem('settings', JSON.stringify(defaultSettings))
        window.dispatchEvent(new Event('storage'))
        window.dispatchEvent(new CustomEvent('auth-change', {
          detail: { loggedIn: true }
        }));
        router.push(getLocalizedUrl('/dashboards/crm', locale))
      } else {
        setErrorState({ message: 'Invalid OTP code' })
      }
    } catch (error) {
      console.error('2FA Error:', error.response?.data || error.message)
      setErrorState({ message: 'Error verifying OTP' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Login submission function (first step)
  const onSubmit = async (e) => {
    e.preventDefault();
    if (is2FAStep) {
      return handle2FALogin();
    }
    // Basic client-side validation
    if (!username.trim()) {
      return setErrorState({ message: 'Username is required' });
    }
    if (!password || password.length < 1) {
      return setErrorState({ message: 'Password must be at least 1 character long' });
    }
    try {
      setIsSubmitting(true);
      setErrorState(null);
    
  
      const encryptedBody = encryptData({ UserName: username, Password: password });
      console.log("🔹 Encrypted Body:", encryptedBody);
  
      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/UserLogin',
        { body: encryptedBody,
          accessToken: ACCESS_TOKEN,
          SessionID: '' },
        {
          headers: { 
            Token: API_TOKEN,
            'Content-Type': 'application/json'
          },
          transformRequest: [(data) => JSON.stringify(data)]
        }
      );
      console.log("✅ API Response:", response.data);
      if (response.data?.Request_State) {
        setLoginData(response.data);
        setIs2FAStep(true);
        setOtp(''); // Reset OTP input
        // Save a pending session so the OTP process can survive a page refresh.
        if (rememberMe) {
          localStorage.setItem('pendingSession', JSON.stringify(response.data));
        } else {
          sessionStorage.setItem('pendingSession', JSON.stringify(response.data));
        }
      } else {
        setErrorState({ message: response.data.ResultData || 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
      setErrorState({ message: 'Login failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={`flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden ${
          settings.skin === 'bordered' ? 'border-ie' : ''
        }`}
      >
        <LoginIllustration src={characterIllustration} alt='character-illustration' />
        {!hidden && <MaskImg alt='mask' src={authBackground} />}
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </div>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-8 sm:mbs-11 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}! 👋🏻`}</Typography>
            <Typography>Please sign-in to your account and start the adventure</Typography>
          </div>

          {errorState && (
            <Alert severity='error' className='mb-4'>
              {errorState.message}
            </Alert>
          )}

          <form noValidate autoComplete='off' className='flex flex-col gap-6' onSubmit={onSubmit}>
            {!is2FAStep ? (
              <>
                <CustomTextField
                  fullWidth
                  type='text'
                  label='Username'
                  placeholder='Enter your username'
                  autoFocus
                  value={username}
                  disabled={isSubmitting}
                  onChange={e => {
                    setUsername(e.target.value)
                    if (errorState) setErrorState(null)
                  }}
                />
                <CustomTextField
                  fullWidth
                  label='Password'
                  placeholder='············'
                  id='login-password'
                  type={isPasswordShown ? 'text' : 'password'}
                  value={password}
                  disabled={isSubmitting}
                  onChange={e => {
                    setPassword(e.target.value)
                    if (errorState) setErrorState(null)
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={handleClickShowPassword}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <i className={isPasswordShown ? 'tabler-eye' : 'tabler-eye-off'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <div className='flex justify-between items-center gap-x-3 gap-y-1 flex-wrap'>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={isSubmitting}
                      />
                    }
                    label='Remember me'
                  />
                  <Typography
                    className='text-end'
                    color='primary'
                    component={Link}
                    href={getLocalizedUrl('/forgot-password', locale)}
                  >
                    Forgot password?
                  </Typography>
                </div>
              </>
            ) : (
              <CustomTextField
                fullWidth
                label='OTP Code'
                placeholder='Enter 6-digit code'
                autoFocus
                value={otp}
                disabled={isSubmitting}
                onChange={e => {
                  setOtp(e.target.value)
                  if (errorState) setErrorState(null)
                }}
              />
            )}

            <Button fullWidth variant='contained' type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : (is2FAStep ? 'Verify OTP' : 'Login')}
            </Button>

            {!is2FAStep && (
              <>
                <div className='flex justify-center items-center flex-wrap gap-2'>
                  <Typography>New on our platform?</Typography>
                  <Typography component={Link} href={getLocalizedUrl('/register', locale)} color='primary'>
                    Create an account
                  </Typography>
                </div>
                <Divider className='gap-2'>or</Divider>
                <Button
                  color='secondary'
                  className='self-center text-textPrimary'
                  startIcon={<img src='/images/logos/google.png' alt='Google' width={22} />}
                  sx={{ '& .MuiButton-startIcon': { marginInlineEnd: 3 } }}
                  onClick={() => signIn('google')}
                >
                  Sign in with Google
                </Button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
