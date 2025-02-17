"use client"

import { Building2, CreditCard, User, Briefcase, Calculator } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PaymentSettings() {
  return (
    <div className="space-y-6 ">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Payout Details */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Payout Details</CardTitle>
            <Button variant="default" className="bg-green-500 hover:bg-green-600">Edit</Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Commodo pellentesque massa tellus ac augue.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Bank Name</span>
                </div>
                <span className="text-sm">GTB Bank Nigeria</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Account Name</span>
                </div>
                <span className="text-sm">Odera Joseph</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Account Type</span>
                </div>
                <span className="text-sm">Business</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Account Number</span>
                </div>
                <span className="text-sm">1234567890</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Card Payment method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visa Card */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="h-12 w-16 flex items-center justify-center bg-green-500 rounded">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Visa:</span>
                    <span>5342</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Exp. date:</span>
                    <span className="text-sm">12/24</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mastercard */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="h-12 w-16 flex items-center justify-center bg-green-500 rounded">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Mastercard:</span>
                    <span>4291</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Exp. date:</span>
                    <span className="text-sm">12/24</span>
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full bg-green-500 hover:bg-green-600">
              Update payment method
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Label */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Purchase Label</h3>
            <p className="text-sm text-muted-foreground">
              If an item is missing or incomplete and you want to send a replacement, you can purchase labels via Auqli through terminal and print.
            </p>
          </div>
          <Button variant="outline" className="text-green-500 border-green-500 hover:bg-green-50">
            Set up
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
