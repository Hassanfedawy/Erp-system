"use client"
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import crypto from 'crypto'

// MUI Imports
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Typography,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

// ---- Encryption / Decryption Helpers using Node's crypto ---- //
const key = process.env.NEXT_PUBLIC_AES_KEY
const iv = process.env.NEXT_PUBLIC_AES_IV
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN

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

const encryptData = (data) => {
  const jsonString = JSON.stringify(data)
  return encrypt(jsonString)
}

// Default values for the main form fields
const defaultValues = {
  name: '',
  telephone: '',
  accountClass: '',
  maxDebit: '',
  notes: '',
  isCustomer: true,
  isSupplier: false,
  active: '1',
  show: '1',
  email: '',
  phone: '',
  country: '',
  company: '',
  accountType: 0,
  whatsapp: '',
  whatAppGroup: ''
}

// Steps for the two tabs (Main Form & Sub Account Details)
const steps = [
  { label: 'Main Form' },
  { label: 'Sub Account Details' }
]

const AddAccountPage = () => {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  // State for the active tab (0: main form, 1: sub-forms)
  const [activeTab, setActiveTab] = useState(0)

  // States for dropdown options (fetched from APIs)
  const [accountTypeOptions, setAccountTypeOptions] = useState([])
  const [countryList, setCountryList] = useState([])
  const [whatsappGroupOptions, setWhatsappGroupOptions] = useState([])
  const [currencyOptions, setCurrencyOptions] = useState([])
  const [currencySubOptions, setCurrencySubOptions] = useState([])

  // Currency Details Sub-Form
  const [firstForm, setFirstForm] = useState({
    currencyId: '',
    rate: '',
    openingCredit: '',
    openingDebit: ''
  })

  // Sub Account Details Sub-Form
  const [secondForm, setSecondForm] = useState({
    currencyId: '',
    subAccountName: '',
    openingCredit: '',
    openingDebit: ''
  })

  // State for the fetched Currency Dataset
  const [fetchedCurrencyData, setFetchedCurrencyData] = useState([])

  // State for the fetched Sub Account Dataset
  const [fetchedSubAccountData, setFetchedSubAccountData] = useState([])

  // State for the selected currency ID
  const [selectedCurrencyId, setSelectedCurrencyId] = useState(null)

  // Handlers for Currency Details Sub-Form
  const handleFirstFormChange = (field, value) => {
    setFirstForm((prev) => ({ ...prev, [field]: value }))
  }

  // Handler to submit one row for Currency Details
  const handleSubmitFirstRow = async () => {
    const accountId = localStorage.getItem("AccountId") || ""
    const paramsString = [
      "0", // id always 0
      accountId, // accountId from local storage
      firstForm.currencyId,
      firstForm.rate,
      firstForm.openingCredit,
      firstForm.openingDebit
    ].join("#~")
    const payload = {
      state: "0",
      Index: "9Gxa/++yB2qA3dxRdNUAM3zWF9yxYIl9", // Replace with actual index if needed
      Params: paramsString
    }
    const encryptedPayload = encryptData(payload)
    try {
      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/DataTrans',
        {
          body: encryptedPayload,
          accessToken: ACCESS_TOKEN,
          SessionID: localStorage.getItem('sessionID')
        },
        {
          headers: { Token: API_TOKEN, 'Content-Type': 'application/json' },
          transformRequest: [(data) => JSON.stringify(data)]
        }
      )
      setFirstForm({
        currencyId: '',
        rate: '',
        openingCredit: '',
        openingDebit: ''
      })
    } catch (error) {
      console.error("Error saving first sub-form data:", error)
    }
  }

  // Handlers for Sub Account Details Sub-Form
  const handleSecondFormChange = (field, value) => {
    setSecondForm((prev) => ({ ...prev, [field]: value }))
  }

  // Handler to submit one row for Sub Account Details
  const handleSubmitSecondRow = async () => {
    const accountId = localStorage.getItem("AccountId") || ""
    const paramsString = [
      "0", // id always 0
      accountId, // accountId from local storage
      secondForm.currencyId,
      secondForm.subAccountName,
      secondForm.openingCredit,
      secondForm.openingDebit
    ].join("#~")
    const payload = {
      state: "0",
      Index: "KnYBAH9kk95NB4mN8HErbMqqyia9I+EOScRpC1QXu7XUAEHjQPbb2Q==", // Replace with actual index if needed
      Params: paramsString
    }
    const encryptedPayload = encryptData(payload)
    try {
      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/DataTrans',
        {
          body: encryptedPayload,
          accessToken: ACCESS_TOKEN,
          SessionID: localStorage.getItem('sessionID')
        },
        {
          headers: { Token: API_TOKEN, 'Content-Type': 'application/json' },
          transformRequest: [(data) => JSON.stringify(data)]
        }
      )
      localStorage.setItem("CurrencyId", secondForm.currencyId)
      setSecondForm({
        currencyId: '',
        subAccountName: '',
        openingCredit: '',
        openingDebit: ''
      })
    } catch (error) {
      console.error("Error saving second sub-form data:", error)
    }
  }

  // useEffect to fetch dropdown data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      const sessionId = localStorage.getItem('sessionID') || ""
      try {
        // Fetch Account Type Options
        const payloadAccType = {
          Index: "Argf73Umoi1+Jn4L4U0q8NqY/Gv+i386bMLXh1MwL5d1KDqNpFhEhQ==",
          Params: ""
        }
        const encryptedPayloadAccType = encryptData(payloadAccType)
        const responseAccType = await axios.post(
          "https://erpapi.tocan.com.ly/api/Home/GetDataSet",
          {
            body: encryptedPayloadAccType,
            accessToken: ACCESS_TOKEN,
            SessionID: sessionId
          },
          { headers: { "Content-Type": "application/json", Token: API_TOKEN } }
        )
        if (responseAccType.data.Request_State) {
          const decryptedData = decrypt(responseAccType.data.ResultData)
          const parsedData = JSON.parse(decryptedData)
          setAccountTypeOptions(parsedData)
        } else {
          throw new Error(responseAccType.data.ResultData)
        }

        // Fetch Country List
        const payloadCountries = {
          Index: "nbP1CHGw6f/TdV9/pd8sTqdgcwdZ8Se8bOmgtjJZldwYVZKZNdWXbQ==",
          Params: ""
        }
        const encryptedPayloadCountries = encryptData(payloadCountries)
        const responseCountries = await axios.post(
          "https://erpapi.tocan.com.ly/api/Home/GetDataSet",
          {
            body: encryptedPayloadCountries,
            accessToken: ACCESS_TOKEN,
            SessionID: sessionId
          },
          { headers: { "Content-Type": "application/json", Token: API_TOKEN } }
        )
        if (responseCountries.data.Request_State) {
          const decryptedData = decrypt(responseCountries.data.ResultData)
          const parsedData = JSON.parse(decryptedData)
          setCountryList(parsedData)
        } else {
          throw new Error(responseCountries.data.ResultData)
        }

        // Fetch WhatsApp Group Options
        const payloadWhatsapp = {
          Index: "TNi63r7IFRtiRRxzwWabGyWrI7/ArN8zjMNx5iCpDj4=",
          Params: ""
        }
        const encryptedPayloadWhatsapp = encryptData(payloadWhatsapp)
        const responseWhatsapp = await axios.post(
          "https://erpapi.tocan.com.ly/api/Home/GetDataSet",
          {
            body: encryptedPayloadWhatsapp,
            accessToken: ACCESS_TOKEN,
            SessionID: sessionId
          },
          { headers: { "Content-Type": "application/json", Token: API_TOKEN } }
        )
        if (responseWhatsapp.data.Request_State) {
          const decryptedData = decrypt(responseWhatsapp.data.ResultData)
          const parsedData = JSON.parse(decryptedData)
          setWhatsappGroupOptions(parsedData)
        } else {
          throw new Error(responseWhatsapp.data.ResultData)
        }

        // Fetch Currency Options
        const accountId = localStorage.getItem("AccountId")
        const payloadCurrency = {
          Index: "nbP1CHGw6f/nir2q8luij0LaIU03mndvkDfMffBB5mg=",
          Params: accountId
        }
        const encryptedPayloadCurrency = encryptData(payloadCurrency)
        const responseCurrency = await axios.post(
          "https://erpapi.tocan.com.ly/api/Home/GetDataSet",
          {
            body: encryptedPayloadCurrency,
            accessToken: ACCESS_TOKEN,
            SessionID: sessionId
          },
          { headers: { "Content-Type": "application/json", Token: API_TOKEN } }
        )
        if (responseCurrency.data.Request_State) {
          const decryptedData = decrypt(responseCurrency.data.ResultData)
          const parsedData = JSON.parse(decryptedData)
          setCurrencyOptions(parsedData)
        } else {
          throw new Error(responseCurrency.data.ResultData)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
      }
      try{
        const accountId = localStorage.getItem("AccountId")
      const payloadSubCurrency = {
        Index: "Argf73Umoi2x6qEOo0JXUGvDLYrMpWQgn5vhJ80G4l/ec1gvBf4xKg==",
        Params: accountId
      }
      const encryptedPayloadCurrency = encryptData(payloadSubCurrency)
      const responseCurrency = await axios.post(
        "https://erpapi.tocan.com.ly/api/Home/GetDataSet",
        {
          body: encryptedPayloadCurrency,
          accessToken: ACCESS_TOKEN,
          SessionID: sessionId
        },
        { headers: { "Content-Type": "application/json", Token: API_TOKEN } }
      )
      if (responseCurrency.data.Request_State) {
        const decryptedData = decrypt(responseCurrency.data.ResultData)
        const parsedData = JSON.parse(decryptedData)
        console.log("Fetched subCurrencies:", parsedData)
        setCurrencySubOptions(parsedData)
      } else {
        throw new Error(responseCurrency.data.ResultData)
      }
    } catch (err) {
      console.error("Error fetching data:", err)
    }
    }


    fetchAllData()
  }, [])

  // useEffect to fetch datasets when activeTab === 1 (Table)
  useEffect(() => {
    if (activeTab === 1) {
      const fetchDatasets = async () => {
        const accountId = localStorage.getItem("AccountId")
        if (accountId) {
          // Fetch Currency Dataset
          const payloadCurrency = {
            Index: "Argf73Umoi2x6qEOo0JXUGvDLYrMpWQgn5vhJ80G4l/ec1gvBf4xKg==",
            Params: accountId
          }
          const encryptedPayloadCurrency = encryptData(payloadCurrency)
          try {
            const responseCurrency = await axios.post(
              "https://erpapi.tocan.com.ly/api/Home/GetDataSet",
              {
                body: encryptedPayloadCurrency,
                accessToken: ACCESS_TOKEN,
                SessionID: localStorage.getItem("sessionID")
              },
              { headers: { "Content-Type": "application/json", Token: API_TOKEN } }
            )
            if (responseCurrency.data.Request_State) {
              const decryptedData = decrypt(responseCurrency.data.ResultData)
              const parsedData = JSON.parse(decryptedData)
              setFetchedCurrencyData(parsedData)
            } else {
              throw new Error(responseCurrency.data.ResultData)
            }
          } catch (err) {
            console.error("Error fetching currency dataset:", err)
          }
        }
        // Fetch Sub Account Dataset
        if (accountId && selectedCurrencyId) {
          const payloadSubAccount = {
            Index: "jjXVsHjcrPjFOQckG+ZasRdGhSIxiz06omT3mLj5fzI=",
            Params: accountId + "#~" + selectedCurrencyId
          }
          const encryptedPayloadSubAccount = encryptData(payloadSubAccount)
          try {
            const responseSubAccount = await axios.post(
              "https://erpapi.tocan.com.ly/api/Home/GetDataSet",
              {
                body: encryptedPayloadSubAccount,
                accessToken: ACCESS_TOKEN,
                SessionID: localStorage.getItem("sessionID")
              },
              { headers: { "Content-Type": "application/json", Token: API_TOKEN } }
            )
            if (responseSubAccount.data.Request_State) {
              const decryptedData = decrypt(responseSubAccount.data.ResultData)
              const parsedData = JSON.parse(decryptedData)
              setFetchedSubAccountData(parsedData)
            } else {
              throw new Error(responseSubAccount.data.ResultData)
            }
          } catch (err) {
            console.error("Error fetching sub account dataset:", err)
          }
        }
      }
      fetchDatasets()
    }
  }, [activeTab, selectedCurrencyId])

  // Handler for Main Form submission (all main form fields in one tab)
  const onSubmitMainForm = async (data) => {
    const newId = Date.now()
    const paramsArray = [
      String(newId),
      String(newId),
      data.name || '',
      data.telephone || '',
      data.accountClass || '',
      data.maxDebit || '',
      data.notes || '',
      data.isCustomer ? '1' : '0',
      data.isSupplier ? '1' : '0',
      data.country || '',
      data.active || '',
      data.show || '',
      data.email || '',
      data.phone || '',
      data.company || '',
      data.accountType || 0,
      data.whatsapp || '',
      String(data.whatAppGroup)
    ]
    const payload = {
      state: "0",
      Index: "9Gxa/++yB2r7leSJMWyxnA==",
      Params: paramsArray.join("#~")
    }
    const encryptedPayload = encryptData(payload)
    try {
      const response = await axios.post(
        'https://erpapi.tocan.com.ly/api/Home/DataTrans',
        {
          body: encryptedPayload,
          accessToken: ACCESS_TOKEN,
          SessionID: localStorage.getItem('sessionID')
        },
        {
          headers: { Token: API_TOKEN, 'Content-Type': 'application/json' },
          transformRequest: [(data) => JSON.stringify(data)]
        }
      )
      console.log("Main Form Response:", response.data)
      const returnedAccountId = response.data.id
      localStorage.setItem("AccountId", returnedAccountId)
      setActiveTab(1)
    } catch (error) {
      console.error("Error sending DataTrans request:", error)
    }
    reset(defaultValues)
  }

  const handleReset = () => {
    reset(defaultValues)
  }

  const handleCurrencyRowClick = (currencyId) => {
    setSelectedCurrencyId(currencyId)
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
        <Typography variant="h5">Add New Account</Typography>
        <IconButton size="small" onClick={handleReset}>
          <i className="tabler-x text-2xl" />
        </IconButton>
      </Box>
      <Divider />
      {/* Form Content */}
      {activeTab === 0 ? (
        <form onSubmit={handleSubmit(onSubmitMainForm)} style={{ padding: '1.5rem' }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {steps.slice(0, 1).map((step, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      bgcolor: activeTab === index ? 'primary.main' : 'grey.400',
                      color: activeTab === index ? '#fff' : '#000'
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography sx={{ fontWeight: activeTab === index ? 'bold' : 'normal', color: activeTab === index ? 'text.primary' : 'grey.600' }}>
                    {step.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="h6">Basic Details</Typography>
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <CustomTextField fullWidth label="NO." value="Auto-generated" disabled />
            </Box>
            <Box>
              <Controller
                name="name"
                control={control}
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <CustomTextField {...field} fullWidth label="Name" placeholder="Enter Name" error={Boolean(errors.name)} helperText={errors.name?.message} />
                )}
              />
            </Box>
            <Box>
              <Controller
                name="telephone"
                control={control}
                rules={{ required: "Telephone is required" }}
                render={({ field }) => (
                  <CustomTextField {...field} fullWidth label="Telephone" placeholder="Enter Telephone" error={Boolean(errors.telephone)} helperText={errors.telephone?.message} />
                )}
              />
            </Box>
            <Box>
              <Controller
                name="accountClass"
                control={control}
                rules={{ required: "Class is required" }}
                render={({ field }) => (
                  <CustomTextField {...field} fullWidth label="Class" placeholder="Enter Class" error={Boolean(errors.accountClass)} helperText={errors.accountClass?.message} />
                )}
              />
            </Box>
            <Box>
              <Controller
                name="maxDebit"
                control={control}
                rules={{ required: "Max Debit is required" }}
                render={({ field }) => (
                  <CustomTextField {...field} fullWidth type="number" label="Max Debit" placeholder="Enter Max Debit" error={Boolean(errors.maxDebit)} helperText={errors.maxDebit?.message} />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Controller
                name="notes"
                control={control}
                rules={{ required: "Notes are required" }}
                render={({ field }) => (
                  <CustomTextField {...field} fullWidth label="Notes" placeholder="Enter Notes" multiline rows={3} error={Boolean(errors.notes)} helperText={errors.notes?.message} />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: '1 / -1', mt: 2 }}>
              <Typography variant="h6">Contact / Customer Details</Typography>
            </Box>
            <Box>
              <Controller
                name="isCustomer"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    control={<Checkbox checked={value} onChange={(e) => onChange(e.target.checked)} />}
                    label="Customer"
                  />
                )}
              />
            </Box>
            <Box>
              <Controller
                name="isSupplier"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControlLabel
                    control={<Checkbox checked={value} onChange={(e) => onChange(e.target.checked)} />}
                    label="Supplier"
                  />
                )}
              />
            </Box>
            <Box>
              <Controller
                name="active"
                control={control}
                rules={{ required: "Select Active status" }}
                render={({ field }) => (
                  <CustomTextField select fullWidth label="Active" {...field} error={Boolean(errors.active)} helperText={errors.active?.message}>
                    <MenuItem value="1">Active</MenuItem>
                    <MenuItem value="0">Inactive</MenuItem>
                  </CustomTextField>
                )}
              />
            </Box>
            <Box>
              <Controller
                name="show"
                control={control}
                rules={{ required: "Select Show status" }}
                render={({ field }) => (
                  <CustomTextField select fullWidth label="Show" {...field} error={Boolean(errors.show)} helperText={errors.show?.message}>
                    <MenuItem value="1">Show</MenuItem>
                    <MenuItem value="0">Hide</MenuItem>
                  </CustomTextField>
                )}
              />
            </Box>
            <Box>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: "Email is required",
                  pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
                }}
                render={({ field }) => (
                  <CustomTextField {...field} fullWidth type="email" label="Email" placeholder="Enter Email" error={Boolean(errors.email)} helperText={errors.email?.message} />
                )}
              />
            </Box>
            <Box>
              <Controller
                name="phone"
                control={control}
                rules={{ required: "Phone is required" }}
                render={({ field }) => (
                  <CustomTextField {...field} fullWidth label="Phone" placeholder="Enter Phone" error={Boolean(errors.phone)} helperText={errors.phone?.message} />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Controller
                name="country"
                control={control}
                rules={{ required: "Country is required" }}
                render={({ field: { onChange, value } }) => (
                  <Autocomplete
                    options={countryList.map(option => option.country)}
                    value={value || ""}
                    onChange={(event, newValue) => { onChange(newValue) }}
                    getOptionLabel={(option) => typeof option === 'string' ? option : option?.toString() || ""}
                    renderInput={(params) => (
                      <CustomTextField
                        {...params}
                        label="Country"
                        placeholder="Select or enter country"
                        error={Boolean(errors.country)}
                        helperText={errors.country?.message}
                      />
                    )}
                  />
                )}
              />
            </Box>
            <Box sx={{ gridColumn: '1 / -1', mt: 2 }}>
              <Typography variant="h6">Additional Info</Typography>
            </Box>
            <Box>
              <Controller
                name="company"
                control={control}
                rules={{ required: "Company is required" }}
                render={({ field }) => (
                  <CustomTextField {...field} fullWidth label="Company" placeholder="Enter Company" error={Boolean(errors.company)} helperText={errors.company?.message} />
                )}
              />
            </Box>
            <Box>
              <Controller
                name="accountType"
                control={control}
                rules={{ required: "Account Type is required" }}
                render={({ field }) => (
                  <CustomTextField select fullWidth label="Account Type" {...field} error={Boolean(errors.accountType)} helperText={errors.accountType?.message}>
                    {accountTypeOptions.length > 0 ? (
                      accountTypeOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.acc_name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>Loading options...</MenuItem>
                    )}
                  </CustomTextField>
                )}
              />
            </Box>
            <Box>
              <Controller
                name="whatsapp"
                control={control}
                render={({ field }) => (
                  <CustomTextField {...field} fullWidth label="WhatsApp" placeholder="Enter WhatsApp" />
                )}
              />
            </Box>
            <Box>
              <Controller
                name="whatAppGroup"
                control={control}
                rules={{ required: "WhatsApp group is required" }}
                render={({ field }) => (
                  <CustomTextField select fullWidth label="WhatsApp Group" {...field} error={Boolean(errors.whatAppGroup)} helperText={errors.whatAppGroup?.message}>
                    {whatsappGroupOptions.length > 0 ? (
                      whatsappGroupOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.Name} - {option.Number}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>Loading options...</MenuItem>
                    )}
                  </CustomTextField>
                )}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button variant="contained" type="submit">
              Save
            </Button>
          </Box>
          <Button variant="tonal" color="error" type="button" onClick={handleReset} href="/apps/Accounts/view" sx={{ mt: 2 }}>
            Cancel
          </Button>
        </form>
      ) : (
        <Box sx={{ padding: '1.5rem' }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: '#fff'
                  }}
                >
                  2
                </Box>
                <Typography sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  Sub Account Details
                </Typography>
              </Box>
            </Box>
          </Box>
          {/* Currency Details Sub-Form */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6">Currency Details</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mt: 2 }}>
              <Controller
                name="currencyId"
                control={control}
                rules={{ required: "Currency is required" }}
                render={({ field }) => (
                  <CustomTextField
                    select
                    fullWidth
                    label="Currency"
                    {...field}
                    error={Boolean(errors.currencyId)}
                    helperText={errors.currencyId?.message}
                  >
                    {currencyOptions.length > 0 ? (
                      currencyOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.OMLA_NAME}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>Loading options...</MenuItem>
                    )}
                  </CustomTextField>
                )}
              />
              <CustomTextField
                label="Rate"
                value={firstForm.rate}
                onChange={(e) => handleFirstFormChange('rate', e.target.value)}
              />
              <CustomTextField
                label="Opening Credit"
                value={firstForm.openingCredit}
                onChange={(e) => handleFirstFormChange('openingCredit', e.target.value)}
              />
              <CustomTextField
                label="Opening Debit"
                value={firstForm.openingDebit}
                onChange={(e) => handleFirstFormChange('openingDebit', e.target.value)}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={handleSubmitFirstRow}>
                Save Currency Details
              </Button>
            </Box>
            {/* New Table: Display Fetched Currency Dataset */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6">Fetched Currency Data</Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Cust ID</TableCell>
                      <TableCell>OMLA ID</TableCell>
                      <TableCell>Ex Rate</TableCell>
                      <TableCell>Daen</TableCell>
                      <TableCell>Mden</TableCell>
                      <TableCell>Egmaly</TableCell>
                      <TableCell>OMLA NAME</TableCell>
                      <TableCell>Code</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fetchedCurrencyData && fetchedCurrencyData.length > 0 ? (
                      fetchedCurrencyData.map((row, index) => (
                        <TableRow key={index} onClick={() => handleCurrencyRowClick(row.id)}>
                          <TableCell>{row.id}</TableCell>
                          <TableCell>{row.cust_id}</TableCell>
                          <TableCell>{row.omla_id}</TableCell>
                          <TableCell>{row.ex_rate}</TableCell>
                          <TableCell>{row.daen}</TableCell>
                          <TableCell>{row.mden}</TableCell>
                          <TableCell>{row.egmaly}</TableCell>
                          <TableCell>{row.OMLA_NAME}</TableCell>
                          <TableCell>{row.code}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9}>No Data Found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
          {/* Sub Account Details Sub-Form */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6">Sub Account Details</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mt: 2 }}>
              <Controller
                name="currencyId"
                control={control}
                rules={{ required: "Currency is required" }}
                render={({ field }) => (
                  <CustomTextField
                    select
                    fullWidth
                    label="Currency"
                    {...field}
                    error={Boolean(errors.currencyId)}
                    helperText={errors.currencyId?.message}
                  >
                    {currencySubOptions.length > 0 ? (
                      currencySubOptions.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.description}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>Loading options...</MenuItem>
                    )}
                  </CustomTextField>
                )}
              />
              <CustomTextField
                label="Sub Account Name"
                value={secondForm.subAccountName}
                onChange={(e) => handleSecondFormChange('subAccountName', e.target.value)}
              />
              <CustomTextField
                label="Opening Credit"
                value={secondForm.openingCredit}
                onChange={(e) => handleSecondFormChange('openingCredit', e.target.value)}
              />
              <CustomTextField
                label="Opening Debit"
                value={secondForm.openingDebit}
                onChange={(e) => handleSecondFormChange('openingDebit', e.target.value)}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={handleSubmitSecondRow}>
                Save Sub Account Details
              </Button>
            </Box>
            {/* New Table: Display Fetched Sub Account Dataset */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6">Fetched Sub Account Data</Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Cust ID</TableCell>
                      <TableCell>Curr ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Daen</TableCell>
                      <TableCell>Mden</TableCell>
                      <TableCell>Reg Date</TableCell>
                      <TableCell>Open Dept</TableCell>
                      <TableCell>Open Credit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fetchedSubAccountData && fetchedSubAccountData.length > 0 ? (
                      fetchedSubAccountData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.id}</TableCell>
                          <TableCell>{row.Cust_id}</TableCell>
                          <TableCell>{row.Curr_id}</TableCell>
                          <TableCell>{row.Name}</TableCell>
                          <TableCell>{row.daen}</TableCell>
                          <TableCell>{row.mden}</TableCell>
                          <TableCell>{row.Reg_date}</TableCell>
                          <TableCell>{row.Open_Dept}</TableCell>
                          <TableCell>{row.Open_Credit}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9}>No Data Found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => setActiveTab(0)}>
              Back to Main Form
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default AddAccountPage
