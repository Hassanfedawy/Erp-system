'use client'
// React Imports
import { useState, useEffect } from 'react'
// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
// Component Imports
import CustomTextField from '@core/components/mui/TextField'
// Vars
import crypto from 'crypto'
// Environment Variables
const key = process.env.NEXT_PUBLIC_AES_KEY
const iv = process.env.NEXT_PUBLIC_AES_IV
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN

// Encryption Helpers
const resizeKey = (str, length) => {
  if (str.length > length) {
    return str.slice(0, length)
  } else if (str.length < length) {
    return str.padEnd(length, '\0')
  }
  return str
}

const encrypt = (text, keyVal, ivVal) => {
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

const decrypt = (encryptedText, keyVal, ivVal) => {
  if (!encryptedText) {
    console.error('Decryption error: No encrypted text provided')
    return ''
  }
  const resizedKey = resizeKey(keyVal, 32)
  const resizedIV = resizeKey(ivVal, 16)
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(resizedKey, 'utf8'),
      Buffer.from(resizedIV, 'utf8')
    )
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    return ''
  }
}

const encryptData = (data, key, iv) => {
  const jsonString = JSON.stringify(data)
  return encrypt(jsonString, key, iv)
}

const initialData = {
  id: '', // Add this field to store the account ID
  serialNumber: '',
  name: '',
  telephone: '',
  accountClass: '',
  maxDebit: '',
  notes: '',
  isCustomer: '',
  isSupplier: '',
  address: '',
  active: '',
  show: '',
  email: '',
  phone: '',
  company: '',
  accountTypeId: '',
  whatsapp: '',
  whatsappGroupId: ''
}

const languageData = ['English', 'Arabic', 'French', 'German', 'Portuguese']

const AccountDetails = () => {
  // States
  const [formData, setFormData] = useState(initialData)
  const [fileInput, setFileInput] = useState('')
  const [imgSrc, setImgSrc] = useState('/images/avatars/1.png')
  const [language, setLanguage] = useState(['English']) // Ensure initial value is an array
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    // Fetch session ID from local storage
    const storedSessionId = localStorage.getItem('sessionId')
    if (storedSessionId) {
      setSessionId(storedSessionId)
    }
    fetchAccountDetails()
  }, [])

  const fetchAccountDetails = async () => {
    try {
      const body = {
        Index: '9Gxa/++yB2r7leSJMWyxnA==',
        Params: '' // Adjust as needed
      }
      const encryptedBody = encryptData(body, key, iv)

      const response = await fetch(`https://erpapi.tocan.com.ly/api/Home/DataTrans`, {
        method: 'POST',
        headers: {
          Token: API_TOKEN,
          'Content-Type': 'application/json',
          accessToken: ACCESS_TOKEN,
          sessionId: sessionId
        },
        body: JSON.stringify({ body: encryptedBody })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()
      console.log('Response Data:', responseData) // Log response data for debugging

      if (!responseData.body) {
        console.error('Response does not contain encrypted body')
        return
      }

      const decryptedData = decrypt(responseData.body, key, iv)
      if (!decryptedData) {
        console.error('Decryption failed or no data received')
        return
      }
      const parsedData = JSON.parse(decryptedData)

      // Assuming the response contains the account details
      setFormData({
        id: parsedData.id || '',
        serialNumber: parsedData.serialNumber || '',
        name: parsedData.name || '',
        telephone: parsedData.telephone || '',
        accountClass: parsedData.accountClass || '',
        maxDebit: parsedData.maxDebit || '',
        notes: parsedData.notes || '',
        isCustomer: parsedData.isCustomer || '',
        isSupplier: parsedData.isSupplier || '',
        address: parsedData.address || '',
        active: parsedData.active || '',
        show: parsedData.show || '',
        email: parsedData.email || '',
        phone: parsedData.phone || '',
        company: parsedData.company || '',
        accountTypeId: parsedData.accountTypeId || '',
        whatsapp: parsedData.whatsapp || '',
        whatsappGroupId: parsedData.whatsappGroupId || ''
      })

      // Update language based on parsed data
      if (parsedData.language) {
        setLanguage(parsedData.language.split(',').map(lang => lang.trim()))
      }
    } catch (error) {
      console.error('Error fetching account details:', error)
    }
  }

  const handleDelete = value => {
    setLanguage(current => current.filter(item => item !== value))
  }

  const handleChange = event => {
    setLanguage(event.target.value)
  }

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleFileInputChange = file => {
    const reader = new FileReader()
    const { files } = file.target
    if (files && files.length !== 0) {
      reader.onload = () => setImgSrc(reader.result)
      reader.readAsDataURL(files[0])
      if (reader.result !== null) {
        setFileInput(reader.result)
      }
    }
  }

  const handleFileInputReset = () => {
    setFileInput('')
    setImgSrc('/images/avatars/1.png')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Prepare the data for the API request
    const body = {
      state: 1, // Assuming 1 for update
      Index: '9Gxa/++yB2r7leSJMWyxnA==',
      Params: `${formData.id}#~${formData.serialNumber}#~${formData.name}#~${formData.telephone}#~${formData.accountClass}#~${formData.maxDebit}#~${formData.notes}#~${formData.isCustomer}#~${formData.isSupplier}#~${formData.address}#~${formData.active}#~${formData.show}#~${formData.email}#~${formData.phone}#~${formData.company}#~${formData.accountTypeId}#~${formData.whatsapp}#~${formData.whatsappGroupId}#~${language.join(',')}`
    }

    const encryptedBody = encryptData(body, key, iv)

    try {
      const response = await fetch(`https://erpapi.tocan.com.ly/api/Home/DataTrans`, {
        method: 'POST',
        headers: {
          Token: API_TOKEN,
          'Content-Type': 'application/json',
          accessToken: ACCESS_TOKEN,
          sessionId: sessionId
        },
        body: JSON.stringify({ body: encryptedBody })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()
      console.log('Response Data:', responseData) // Log response data for debugging

      if (!responseData.body) {
        console.error('Response does not contain encrypted body')
        return
      }

      const decryptedData = decrypt(responseData.body, key, iv)
      if (!decryptedData) {
        console.error('Decryption failed or no data received')
        return
      }
      const parsedData = JSON.parse(decryptedData)

      // Handle the response as needed
      console.log('Account updated successfully:', parsedData)
    } catch (error) {
      console.error('Error updating account:', error)
    }
  }

  const handleReset = () => {
    setFormData(initialData)
    setLanguage(['English']) // Reset language to initial value
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                label="First Name"
                value={formData.name.split(' ')[0]}
                onChange={(e) => handleFormChange('name', `${e.target.value} ${formData.name.split(' ')[1]}`)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                label="Last Name"
                value={formData.name.split(' ')[1]}
                onChange={(e) => handleFormChange('name', `${formData.name.split(' ')[0]} ${e.target.value}`)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                label="Email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                label="Organization"
                value={formData.company}
                onChange={(e) => handleFormChange('company', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                label="Phone Number"
                value={formData.telephone}
                onChange={(e) => handleFormChange('telephone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                label="Address"
                value={formData.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                label="State"
                value={formData.state}
                onChange={(e) => handleFormChange('state', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                label="Zip Code"
                value={formData.zipCode}
                onChange={(e) => handleFormChange('zipCode', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                label="Country"
                value={formData.country}
                onChange={(e) => handleFormChange('country', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                select
                label="Language"
                value={language}
                onChange={handleChange}
                multiple
                renderValue={(selected) => (
                  <div>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        size="small"
                        label={value}
                        onDelete={() => handleDelete(value)}
                      />
                    ))}
                  </div>
                )}
              >
                {languageData.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                select
                label="Timezone"
                value={formData.timezone}
                onChange={(e) => handleFormChange('timezone', e.target.value)}
                SelectProps={{
                  MenuProps: { PaperProps: { style: { maxHeight: 250 } } }
                }}
              >
                <MenuItem value="(GMT-12:00)">International Date Line West</MenuItem>
                <MenuItem value="(GMT-11:00)">Midway Island, Samoa</MenuItem>
                <MenuItem value="(GMT-10:00)">Hawaii</MenuItem>
                <MenuItem value="(GMT-09:00)">Alaska</MenuItem>
                <MenuItem value="(GMT-08:00)">Pacific Time (US & Canada)</MenuItem>
                <MenuItem value="(GMT-08:00)">Tijuana, Baja California</MenuItem>
                <MenuItem value="(GMT-07:00)">Chihuahua, La Paz, Mazatlan</MenuItem>
                <MenuItem value="(GMT-07:00)">Mountain Time (US & Canada)</MenuItem>
                <MenuItem value="(GMT-06:00)">Central America</MenuItem>
                <MenuItem value="(GMT-06:00)">Central Time (US & Canada)</MenuItem>
                <MenuItem value="(GMT-06:00)">Guadalajara, Mexico City, Monterrey</MenuItem>
                <MenuItem value="(GMT-06:00)">Saskatchewan</MenuItem>
                <MenuItem value="(GMT-05:00)">Bogota, Lima, Quito, Rio Branco</MenuItem>
                <MenuItem value="(GMT-05:00)">Eastern Time (US & Canada)</MenuItem>
                <MenuItem value="(GMT-05:00)">Indiana (East)</MenuItem>
                <MenuItem value="(GMT-04:00)">Atlantic Time (Canada)</MenuItem>
                <MenuItem value="(GMT-04:00)">Caracas, La Paz</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                select
                label="Currency"
                value={formData.currency}
                onChange={(e) => handleFormChange('currency', e.target.value)}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="Pound">Pound</MenuItem>
                <MenuItem value="Bitcoin">Bitcoin</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary">
                Save Changes
              </Button>
              <Button onClick={handleReset} variant="outlined" color="secondary">
                Reset
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default AccountDetails
