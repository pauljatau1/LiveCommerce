"use client"

import { Edit } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Button } from "@/Components/ui/button"
import { Switch } from "@/Components/ui/switch"

export default function VacationSettings() {
  return (
    <div className="">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            VACATION MODE
          </CardTitle>
          <Button variant="outline" className="text-green-500 border-green-500">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm">Status</span>
              <Switch checked />
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm">Vacation Setting</span>
              <span className="text-sm text-muted-foreground">Store-wide</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm">Date</span>
              <span className="text-sm text-muted-foreground">1st Jan 2025 - 10th Jan 2025</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm">Auto-Response</span>
              <span className="text-sm text-muted-foreground max-w-[60%] text-right">
                The store is on vacation and will resume on 10th Jan 2025
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
