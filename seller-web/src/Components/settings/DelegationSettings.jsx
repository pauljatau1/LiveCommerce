"use client"

import { PlusSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export default function DelegationSettings() {
  return (
    <div className="space-y-6">
      {/* Delegation / Access Control */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            DELEGATION / ACCESS CONTROL
          </CardTitle>
          <Button variant="outline" className="text-green-500 border-green-500">
            <PlusSquare className="mr-2 h-4 w-4" />
            Add / Remove
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">E-mail</span>
              <span className="text-sm">abc@gmail.com</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Duration</span>
              <div className="text-sm">
                <span className="text-muted-foreground">2 weeks</span>
                <span className="text-red-500 ml-2">(5 days left)</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="text-sm">Full Admin</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Revoke */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            ACCESS REVOKE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm">Revoke Access Upon Expiration</span>
            <Switch checked />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
