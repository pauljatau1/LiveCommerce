import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs"
import NotificationsSettings from "@/Components/settings/NotificationsSettings"
import StoreSettings from "@/Components/settings/StoreSettings"
import WarehouseSettings from "@/Components/settings/WarehouseSettings"
import PaymentSettings from "@/Components/settings/PaymentSettings"
import DelegationSettings from "@/Components/settings/DelegationSettings"
import VacationSettings from "@/Components/settings/VacationSettings"
import SecuritySettings from "@/Components/settings/SecuritySettings"
import AddressSettings from "@/Components/settings/AddressSettings"
import { useOutletContext, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function SettingsDashboard() {
  const { setHeaderName, setNavName } = useOutletContext();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("store");

  useEffect(() => {
    setHeaderName("Settings");
    
    // Get the tab from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get('tab');
    
    // Set the active tab if a valid tab is specified in the URL
    if (tabParam && ['store', 'notifications', 'addresses', 'payment', 'security'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  return (
    <div className="w-full sm:px-4 py-4 sm:py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent min-w-[600px]">
            <TabsTrigger
              value="store"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent text-sm sm:text-base"
            >
              Store
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent text-sm sm:text-base"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="addresses"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent text-sm sm:text-base"
            >
              Addresses
            </TabsTrigger>
            <TabsTrigger
              value="payment"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent text-sm sm:text-base"
            >
              Payment
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent text-sm sm:text-base"
            >
              Security
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4 sm:mt-6">
          <TabsContent value="store">
            <Card className="border-none sm:border">
              <CardHeader className="px-0 sm:px-6">
                <CardTitle>Store Settings</CardTitle>
                <CardDescription>Manage your store preferences</CardDescription>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <StoreSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-none sm:border">
              <CardHeader className="px-0 sm:px-6">
                <CardTitle>Notifications Settings</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <NotificationsSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <Card className="border-none sm:border">
              <CardHeader className="px-0 sm:px-6">
                <CardTitle>Address Settings</CardTitle>
                <CardDescription>Manage your business and warehouse addresses</CardDescription>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <AddressSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card className="border-none sm:border">
              <CardHeader className="px-0 sm:px-6">
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>Manage your payment preferences</CardDescription>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <PaymentSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-none sm:border">
              <CardHeader className="px-0 sm:px-6">
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your security preferences</CardDescription>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <SecuritySettings />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

