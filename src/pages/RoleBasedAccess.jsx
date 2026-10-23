import UserTable from '@/components/UserTable'
import TeamsManager from '@/components/TeamsManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTeams } from '@/hooks/useTeams'
import React from 'react'

const RoleBasedAccess = () => {
  const { teams, reload } = useTeams()
  return (
   <div className="py-8">
      <div className="card">
        <div className="card-body">
          <h1 className="text-2xl font-semibold">User Management</h1>
          <Tabs defaultValue="users" className="mt-4">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="teams">Teams & sub-roles ({teams.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <UserTable teams={teams} onTeamsChanged={reload} />
            </TabsContent>
            <TabsContent value="teams">
              <TeamsManager teams={teams} reload={reload} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default RoleBasedAccess
