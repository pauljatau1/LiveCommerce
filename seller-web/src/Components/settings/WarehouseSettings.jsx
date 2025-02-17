"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

export default function WarehouseSettings() {
  return (
    <div className="space-y-6">
      {/* Inventory Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">INVENTORY</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Low stock alert</span>
            <Switch checked />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Stock threshold</span>
            <span className="text-sm text-muted-foreground">10 units</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Product</span>
            <span className="text-sm text-muted-foreground">All</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Storage Location</span>
            <span className="text-sm text-muted-foreground">Main Warehouse</span>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Preference Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">SHIPPING PREFERENCE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Preferred Shipping Carrier</span>
            <span className="text-sm text-muted-foreground">DHL</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Product-Based Estimated time</span>
            <span className="text-sm text-muted-foreground">1-2 business days</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Region-Based Delivery Time</span>
            <span className="text-sm text-muted-foreground">1-2 business days</span>
          </div>
        </CardContent>
      </Card>

      {/* Restock Schedule Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">RESTOCK SCHEDULE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Restock Notification</span>
            <Switch checked />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Notification time-frame</span>
            <span className="text-sm text-muted-foreground">Weekly</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Sales data tracking</span>
            <span className="text-sm text-muted-foreground">Past 3 months</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

