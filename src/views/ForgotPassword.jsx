'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

import classnames from 'classnames'

import CryptoJS from 'crypto-js'
import axios from 'axios'

import DirectionalIcon from '@components/DirectionalIcon'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

import { getLocalizedUrl } from '@/utils/i18n'

// Environment Variables
const key = process.env.NEXT_PUBLIC_AES_KEY
const iv = process.env.NEXT_PUBLIC_AES_IV
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN

// Encryption Function
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



// Styled Custom Components
const ForgotPasswordIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 650,
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

const ForgotPassword = ({ mode }) => {
  // Vars for images
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-forgot-password-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-forgot-password-light.png'

  // Hooks
  const { lang: locale } = useParams()
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, lightImg, darkImg)
  const characterIllustration = useImageVariant(mode, lightIllustration, darkIllustration)

  // Local state for reset process
  // resetStep = 0: enter user; 1: enter OTP; 2: enter new password; 3: reset complete.
  const [resetStep, setResetStep] = useState(0)
  const [userName, setUserName] = useState('')
  const [otp, setOtp] = useState('')
  const [verifiedOtp, setVerifiedOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetId, setResetId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState('')

  // Step 0: Send Reset Link (state: "0")
  const handleUserSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    if (!userName) {
      setError('Please enter your username.')
      setLoading(false)
      return
    }
    try {
      const payload = {
        state: "0",
        UserName: userName,
        Type: "0", // 0 for WhatsApp
        ResetData: phoneNumber
      }
      const encryptedBody = encryptData(payload)

  
      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/ResetPassword',
        { body: encryptedBody, accessToken: ACCESS_TOKEN, SessionID: '' },
        { headers: { Token: API_TOKEN } }
      )
  
  
      if (response.data?.Request_State) {
        // Save the ResetID returned in ResultData
        setResetId(response.data.ResultData)
        setSuccess('Reset link sent.')
        setResetStep(1)
      } else {
        setError(`Failed to send reset link. ${response.data.ResultData}`)
      }
    } catch (err) {
      console.error('Reset E Error:', err.response?.data || err.message)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Verify OTP (state: "1")
  const handleOTPVerification = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    if (!otp) {
      setError('Please enter the OTP.')
      setLoading(false)
      return
    }
    if (otp.length !== 6) {
      setError('OTP must be 6 digits.')
      setLoading(false)
      return
    }
    try {
      const payload = {
        state: "1",
        UserName: userName,
        Type: "0", // 1 for Email
        ResetData: phoneNumber,
        ResetID: resetId,
        OTP: otp
      }
      const encryptedBody = encryptData(payload)
      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/ResetPassword',
        { body: encryptedBody ,accessToken: ACCESS_TOKEN },
        { headers: { Token: API_TOKEN, accessToken: ACCESS_TOKEN } }
      )
      if (response.data?.Request_State) {
        setSuccess('OTP verified. You can now reset your password.')
        setVerifiedOtp(otp)
        setResetStep(2)
      } else {
        setError('OTP verification failed. Please check the OTP and try again.')
      }
    } catch (err) {
      console.error('OTP Verification Error:', err.response?.data || err.message)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Reset Password (state: "2")
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    if (!newPassword) {
      setError('Please enter your new password.')
      setLoading(false)
      return
    }
    try {
      const payload = {
        state: "2",
        UserName: userName,
        Type: "0", // 1 for Email
        ResetData: phoneNumber,
        ResetID: resetId,
        OTP: verifiedOtp, // use the OTP verified in step 1
        Password: newPassword
      }
      const encryptedBody = encryptData(payload)
      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/ResetPassword',
        { body: encryptedBody,accessToken: ACCESS_TOKEN },
        { headers: { Token: API_TOKEN, accessToken: ACCESS_TOKEN } }
      )
      if (response.data?.Request_State) {
        setSuccess('Your password has been changed successfully.')
        // Move to final complete state so the form is hidden
        setResetStep(3)
      } else {
        setError('Failed to reset password. Please try again.')
      }
    } catch (err) {
      console.error('Reset Password Error:', err.response?.data || err.message)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          { 'border-ie': settings.skin === 'bordered' }
        )}
      >
        <ForgotPasswordIllustration src={characterIllustration} alt='character-illustration' />
        {!hidden && <MaskImg alt='mask' src={authBackground} />}
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link
          href={getLocalizedUrl('/login', locale)}
          className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'
        >
          <Logo />
        </Link>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-8 sm:mbs-11 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>Forgot Password 🔒</Typography>
            <Typography>
              Enter your Username and we&apos;ll send you instructions to reset your password
            </Typography>
          </div>
          {error && <Alert severity='error'>{error}</Alert>}
          {success && <Alert severity='success'>{success}</Alert>}

          {resetStep === 0 && (
            <form noValidate autoComplete='off' onSubmit={handleUserSubmit} className='flex flex-col gap-6'>
              <CustomTextField
                autoFocus
                fullWidth
                label='Username'
                placeholder='Enter your Username'
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
               <CustomTextField
                autoFocus
                fullWidth
                label='Phone number'
                placeholder='Enter your Phonenumber'
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Button fullWidth variant='contained' type='submit' disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}

          {resetStep === 1 && (
            <form noValidate autoComplete='off' onSubmit={handleOTPVerification} className='flex flex-col gap-6'>
              <CustomTextField
                autoFocus
                fullWidth
                label='OTP Code'
                placeholder='Enter the OTP code'
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button fullWidth variant='contained' type='submit' disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </form>
          )}

          {resetStep === 2 && (
            <form noValidate autoComplete='off' onSubmit={handleResetPasswordSubmit} className='flex flex-col gap-6'>
              <CustomTextField
                autoFocus
                fullWidth
                label='New Password'
                placeholder='Enter your new password'
                type='password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button fullWidth variant='contained' type='submit' disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}

          {resetStep === 3 && (
            <div className='flex flex-col gap-6'>
              <Typography variant='h6' align='center'>
                Your password has been changed successfully.
              </Typography>
            </div>
          )}

          <Typography className='flex justify-center items-center' color='primary'>
            <Link href={getLocalizedUrl('/login', locale)} className='flex items-center gap-1.5'>
              <DirectionalIcon
                ltrIconClass='tabler-chevron-left'
                rtlIconClass='tabler-chevron-right'
                className='text-xl'
              />
              <span>Back to login</span>
            </Link>
          </Typography>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
