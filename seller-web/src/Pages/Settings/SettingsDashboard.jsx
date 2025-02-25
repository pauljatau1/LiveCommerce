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
import { useOutletContext } from "react-router-dom";
import { useEffect } from "react";

export default function SettingsDashboard() {

  const { setHeaderName, setNavName } = useOutletContext();

  useEffect(() => {
    setHeaderName("Settings");
  
  }, []);

  return (
    <div className="w-full px-4 py-6">
      <Tabs defaultValue="store" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
        <TabsTrigger
            value="store"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent"
          >
            Store
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent"
          >
            Notifications
          </TabsTrigger>
         
          {/* <TabsTrigger
            value="warehouse"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent"
          >
            Warehouse
          </TabsTrigger> */}
          <TabsTrigger
            value="addresses"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent"
          >
            Addresses
          </TabsTrigger>
          <TabsTrigger
            value="payment"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent"
          >
            Payment
          </TabsTrigger>
          {/* <TabsTrigger
            value="delegation"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent"
          >
            Delegation/Access Control
          </TabsTrigger>
          <TabsTrigger
            value="vacation"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent"
          >
            Vacation Mode
          </TabsTrigger> */}
          <TabsTrigger
            value="security"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent"
          >
            Security
          </TabsTrigger>
         
        </TabsList>

        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Store Settings</CardTitle>
              <CardDescription>Manage your store preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <StoreSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications Settings</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationsSettings />
            </CardContent>
          </Card>
        </TabsContent>

       

        {/* <TabsContent value="warehouse">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Settings</CardTitle>
              <CardDescription>Manage your warehouse preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <WarehouseSettings />
            </CardContent>
          </Card>
        </TabsContent> */}

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Manage your payment preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delegation">
          <Card>
            <CardHeader>
              <CardTitle>Delegation Settings</CardTitle>
              <CardDescription>Manage access control and delegation</CardDescription>
            </CardHeader>
            <CardContent>
              <DelegationSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vacation">
          <Card>
            <CardHeader>
              <CardTitle>Vacation Mode</CardTitle>
              <CardDescription>Manage your vacation mode settings</CardDescription>
            </CardHeader>
            <CardContent>
              <VacationSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your security preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <SecuritySettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle>Address Settings</CardTitle>
              <CardDescription>Manage your business and warehouse addresses</CardDescription>
            </CardHeader>
            <CardContent>
              <AddressSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

