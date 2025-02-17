"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function NotificationsSettings() {
  return (
    <div className="space-y-6">
      {/* Customizable Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">CUSTOMIZABLE NOTIFICATIONS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">New orders placed</span>
            <Checkbox checked />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Upcoming payout reminders</span>
            <Checkbox />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Inventory running low</span>
            <Checkbox checked />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Auction starting/ending alerts</span>
            <Checkbox checked />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Feedback or reviews received</span>
            <Checkbox checked />
          </div>
        </CardContent>
      </Card>

      {/* Communication Preferences */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Email */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-medium">E-mail</h3>
                <p className="text-sm text-muted-foreground">
                  Sellers can toggle to receive updates and reports (e.g., weekly sales summary)
                </p>
              </div>
              <Switch checked />
            </div>
          </CardContent>
        </Card>

        {/* Browse Push */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-medium">Browse Push</h3>
                <p className="text-sm text-muted-foreground">
                  Toggle for real-time updates while logged in, such as new orders or live auction activity.
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* SMS */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-medium">SMS</h3>
                <p className="text-sm text-muted-foreground">
                  Sellers can opt to receive critical updates like payout confirmations or urgent platform notices.
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Sales Performance */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-medium">Sales Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Weekly or monthly reports emailed to sellers. Also, notifications for milestones (e.g., 100 sales or
                  $1,000 revenue).
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Customer Interaction */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-medium">Customer Interaction</h3>
                <p className="text-sm text-muted-foreground">
                  Alerts for new reviews or ratings & Feedback received on products.
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Do Not Disturb */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-medium">Do Not Disturb</h3>
                <p className="text-sm text-muted-foreground">
                  Critical notifications (e.g., payment issues) will still come through
                </p>
              </div>
              <Switch checked />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Settings */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Input type="date" defaultValue="2023-06-14" />
          </div>
          <div className="space-y-2">
            <Label>End Date *</Label>
            <Input type="date" defaultValue="2023-06-14" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Start Time *</Label>
            <Input type="time" defaultValue="12:00" />
          </div>
          <div className="space-y-2">
            <Label>End Time *</Label>
            <Input type="time" defaultValue="12:00" />
          </div>
        </div>
      </div>
    </div>
  )
}

