import UserTable from '@/components/UserTable'
import React from 'react'

const RoleBasedAccess = () => {
  return (
   <div className="py-8">
      <div className="card">
        <div className="card-body">
          <h1 className="text-2xl font-semibold">User Management</h1>
          <div className="mt-4">
            <UserTable />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleBasedAccess
