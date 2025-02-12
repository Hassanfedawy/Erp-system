"use client"

// Component Imports
import UserListTable from '@views/apps/accounts/UserListTable'
import UserListCards from '@views/apps/user/list/UserListCards'

// MUI Imports
import Grid from '@mui/material/Grid'

// Main component
const UserListApp = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <UserListCards />
      </Grid>
      <Grid item xs={12}>
        <UserListTable />
      </Grid>
    </Grid>
  )
}

export default UserListApp
