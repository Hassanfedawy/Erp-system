'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CustomTextField from '@core/components/mui/TextField'

// Third-party Imports
import axios from 'axios'
import crypto from 'crypto'
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Environment Variables
const key = process.env.NEXT_PUBLIC_AES_KEY
const iv = process.env.NEXT_PUBLIC_AES_IV
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN

// Helper to resize key/iv to required lengths (32 for key, 16 for iv)
const resizeKey = (str, length) => {
  if (str.length > length) {
    return str.slice(0, length)
  } else if (str.length < length) {
    return str.padEnd(length, "\0")
  }
  return str
}

// Encrypt a text using AES-256-CBC
const encrypt = (text, keyVal = key, ivVal = iv) => {
  const resizedKey = resizeKey(keyVal, 32)
  const resizedIV = resizeKey(ivVal, 16)
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(resizedKey, "utf8"),
    Buffer.from(resizedIV, "utf8")
  )
  let encrypted = cipher.update(text, "utf8", "base64")
  encrypted += cipher.final("base64")
  return encrypted
}

// Converts an object to JSON and then encrypts it.
const encryptData = (data) => {
  const jsonString = JSON.stringify(data)
  return encrypt(jsonString)
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

// API Config
const API_URL = "https://erpapi.tocan.com.ly/api/Home/GetDataSet"
// Index for fetching the currency list
const CURRENCY_INDEX = "nbP1CHGw6f/nir2q8luij0LaIU03mndvkDfMffBB5mg="
// Index for fetching user accounts (filtered by currency id)
const USER_ACCOUNTS_INDEX = "nbP1CHGw6f8KY0GNhNzbnQ=="

const UserListTable = () => {
  // States for the Add Account section (if used)
  const [addUserOpen, setAddUserOpen] = useState(false)

  // States for fetching currency list
  const [currencyList, setCurrencyList] = useState([])
  const [selectedCurrency, setSelectedCurrency] = useState("")
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)
  const [currencyError, setCurrencyError] = useState(null)

  // States for the user accounts table (filtered by currency)
  const [userAccounts, setUserAccounts] = useState([])
  const [tableLoading, setTableLoading] = useState(false)
  const [tableError, setTableError] = useState(null)

  // 🔥 Fetch Currency List from API with Encryption (on mount)
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        setLoadingCurrencies(true)
        setCurrencyError(null)
        const sessionID = localStorage.getItem('sessionID') || ""
        // Encrypt the request payload for currencies
        const encryptedPayload = encryptData({
          Index: CURRENCY_INDEX,
          Params: "",
          sessionID
        })

        const response = await axios.post(
          API_URL,
          { body: encryptedPayload, AccessToken: ACCESS_TOKEN, sessionId: sessionID },
          {
            headers: {
              "Content-Type": "application/json",
              Token: API_TOKEN
            }
          }
        )


        if (response.data.Request_State) {
          const decryptedData = decrypt(response.data.ResultData)
          const parsedData = JSON.parse(decryptedData)
          console.log("Fetched Currencies:", parsedData)
          setCurrencyList(parsedData)
          // Set initial selected currency to the first currency's id (if available)
          if (parsedData && parsedData.length > 0) {
            setSelectedCurrency(parsedData[0].id)
          }
        } else {
          throw new Error(response.data.ResultData)
        }
      } catch (error) {
        console.error("❌ Error fetching currencies:", error)
        setCurrencyError("Failed to fetch currencies.")
      } finally {
        setLoadingCurrencies(false)
      }
    }

    fetchCurrencies()
  }, [])

  // 🔥 Function to fetch User Accounts filtered by Currency (using encryption)
  const fetchUserAccounts = async (currencyId) => {
    try {
      setTableLoading(true)
      setTableError(null)
      const sessionID = localStorage.getItem('sessionID') || ""
      const payload = {
        Index: USER_ACCOUNTS_INDEX,
        Params: currencyId
      }
      const encryptedPayload = encryptData(payload)

      const response = await axios.post(
        API_URL,
        { body: encryptedPayload, AccessToken: ACCESS_TOKEN, sessionId: sessionID },
        {
          headers: {
            "Content-Type": "application/json",
            Token: API_TOKEN
          }
        }
      )


      if (response.data.Request_State) {
        const decryptedData = decrypt(response.data.ResultData)
        const parsedData = JSON.parse(decryptedData)
        console.log(parsedData)
        setUserAccounts(parsedData)
      } else {
        throw new Error(response.data.ResultData)
      }
    } catch (error) {
      console.error("❌ Error fetching user accounts:", error)
      setTableError("Failed to fetch user accounts.")
    } finally {
      setTableLoading(false)
    }
  }

  // Fetch user accounts on first render and whenever the selected currency changes
  useEffect(() => {
    if (selectedCurrency) {
      fetchUserAccounts(selectedCurrency)
    }
  }, [selectedCurrency])

  return (
    <Card>
      <CardHeader title="User Accounts" />

      {/* 🔥 Filters & Add Account Button */}
      <Grid container spacing={2} className="p-4">
        {/* Currency Dropdown (Fetched from Server) */}
        <Grid item xs={12} sm={3}>
          <CustomTextField
            select
            fullWidth
            label="Currency"
            value={selectedCurrency}
            onChange={e => setSelectedCurrency(e.target.value)}
            disabled={loadingCurrencies || !!currencyError}
          >
            {loadingCurrencies ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : currencyError ? (
              <MenuItem disabled>Error loading currencies</MenuItem>
            ) : (
              currencyList.map(currency => (
                <MenuItem key={currency.id} value={currency.id}>
                  {currency.description}
                </MenuItem>
              ))
            )}
          </CustomTextField>
        </Grid>

        {/* Placeholder Dropdown for Class */}
        <Grid item xs={12} sm={3}>
          <CustomTextField select fullWidth label="Class">
            <MenuItem value="classA">Class A</MenuItem>
            <MenuItem value="classB">Class B</MenuItem>
            <MenuItem value="classC">Class C</MenuItem>
          </CustomTextField>
        </Grid>

        {/* Placeholder Dropdown for Country */}
        <Grid item xs={12} sm={3}>
          <CustomTextField select fullWidth label="Country">
            <MenuItem value="us">United States</MenuItem>
            <MenuItem value="uk">United Kingdom</MenuItem>
            <MenuItem value="fr">France</MenuItem>
          </CustomTextField>
        </Grid>

        {/* Add Account Button */}
        <Grid item xs={12} sm={3} className="flex items-center">
          <Button
            variant="contained"
            startIcon={<i className="tabler-plus" />}
            href="/apps/Accounts/add"
            fullWidth
          >
            Add New Account
          </Button>
        </Grid>
      </Grid>
      {/* 🔥 End Filters Section */}

      {/* 🔥 User Accounts Table */}
      <TableContainer component={Paper} sx={{ margin: 2 }}>
        {tableLoading ? (
          <Typography sx={{ p: 2 }}>Loading table data...</Typography>
        ) : tableError ? (
          <Typography sx={{ p: 2 }} color="error">
            {tableError}
          </Typography>
        ) : userAccounts && userAccounts.length > 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Number</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Debit</TableCell>
                <TableCell>Credit</TableCell>
                <TableCell>Telephone</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Class</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userAccounts.map(account => (
                <TableRow key={account.id}>
                  <TableCell>{account.number}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{account.Debit}</TableCell>
                  <TableCell>{account.Credit}</TableCell>
                  <TableCell>{account.Telephone}</TableCell>
                  <TableCell>{account.Country}</TableCell>
                  <TableCell>{account.class}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Typography sx={{ p: 2 }}>No user accounts found.</Typography>
        )}
      </TableContainer>

      {/* Optionally, if you still use a pagination component, you can include it here */}
      {/* <TablePaginationComponent table={{ getRowModel: () => ({ rows: [] }) }} /> */}
    </Card>
  )
}

export default UserListTable
