"use client"

import { Smartphone, Laptop, MoreVertical } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function SecuritySettings() {
  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      {/* Left Column - Authentication Settings */}
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Two-factor Authentication</h3>
              <Switch checked />
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Authentication app</p>
                  <p className="text-sm text-muted-foreground">Google auth app</p>
                </div>
                <Button variant="outline" className="text-green-500 border-green-500">
                  Setup
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Another e-mail</p>
                  <p className="text-sm text-muted-foreground">E-mail to send verification link</p>
                </div>
                <Button variant="outline" className="text-green-500 border-green-500">
                  Setup
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Phone number</p>
                  <p className="text-sm text-muted-foreground">Either of your phone numbers</p>
                </div>
                <Button variant="outline" className="text-green-500 border-green-500">
                  Setup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Password</h3>
                <p className="text-sm text-muted-foreground">You can change your passwords regularly</p>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current">Current password</Label>
                  <Input id="current" type="password" value="Password8@" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new">New password</Label>
                  <Input id="new" type="password" value="Current8@" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input id="confirm" type="password" value="Current8@" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium">Rules for passwords</h4>
                <p className="text-sm text-muted-foreground">
                  To create a new password, you have to meet all of the following requirements:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Minimum 8 character</li>
                  <li>• At least one special character</li>
                  <li>• At least one number</li>
                  <li>• Can't be the same as a previous</li>
                </ul>
              </div>

              <Button className="bg-green-500 hover:bg-green-600">Save</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Devices */}
      <Card>
        <CardHeader>
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="h-6 w-6 text-green-500" />
          </div>
          <CardTitle>Devices</CardTitle>
          <CardDescription>
            View a list of devices currently logged into your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button className="w-full bg-green-500 hover:bg-green-600">
            Sign out from all devices
          </Button>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">iPhone 11</p>
                  <p className="text-sm text-muted-foreground">
                    Lagos, Nigeria • Jan 25 at 1:15 AM
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Sign out</DropdownMenuItem>
                  <DropdownMenuItem>View details</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <Laptop className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Macbook Pro</p>
                  <p className="text-sm text-muted-foreground">
                    Lagos, Nigeria • Jan 25 at 1:15 AM
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Sign out</DropdownMenuItem>
                  <DropdownMenuItem>View details</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
