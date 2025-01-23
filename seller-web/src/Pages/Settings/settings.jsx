import { useState } from "react";
import { CalendarIcon, Clock, HelpCircle, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


const TABS = [
  "Store",
  "Notifications",
  "Warehouse",
  "Payment",
  "Delegation/Access Control",
  "Vacation Mode",
  "Security",
];

export default function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState("Store");
  const [openDays, setOpenDays] = useState();
  const [closedDays, setClosedDays] = useState();

  return (
    <div className="min-h-screen bg-white">
      <h2 className="text-2xl mt-5 font-bold">Settings</h2>
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-8">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-4 text-sm hover:text-gray-900",
                  activeTab === tab ? "text-green-500 border-b-2 border-green-500" : "text-gray-600",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4">
        {activeTab === "Notifications" && (
          <div className="max-w-3xl space-y-8">
            {/* Customizable Notifications */}
            <div>
              <h2 className="text-sm text-gray-500 uppercase mb-4">Customizable notifications</h2>
              <div className="space-y-4">
                {[
                  { label: "New orders placed", checked: true },
                  { label: "Upcoming payout reminders", checked: false },
                  { label: "Inventory running low", checked: true },
                  { label: "Auction starting/ending alerts", checked: true },
                  { label: "Feedback or reviews received", checked: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center space-x-2">
                    <Checkbox id={item.label} checked={item.checked} />
                    <Label htmlFor={item.label}>{item.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification Channels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Email */}
              <div className="space-y-2">
                <h3 className="font-medium">E-mail</h3>
                <p className="text-sm text-gray-500">
                  Sellers can toggle to receive updates and reports (e.g., weekly sales summary)
                </p>
                <Switch checked />
              </div>

              {/* Browse Push */}
              <div className="space-y-2">
                <h3 className="font-medium">Browse Push</h3>
                <p className="text-sm text-gray-500">
                  Toggle for real-time updates while logged in, such as new orders or live auction activity.
                </p>
                <Switch />
              </div>

              {/* SMS */}
              <div className="space-y-2">
                <h3 className="font-medium">SMS</h3>
                <p className="text-sm text-gray-500">
                  Sellers can opt to receive critical updates like payout confirmations or urgent platform notices.
                </p>
                <Switch />
              </div>

              {/* Sales Performance */}
              <div className="space-y-2">
                <h3 className="font-medium">Sales Performance</h3>
                <p className="text-sm text-gray-500">
                  Weekly or monthly reports emailed to sellers. Also, notifications for milestones (e.g., 100 sales or
                  $1,000 revenue).
                </p>
                <Switch />
              </div>

              {/* Customer Interaction */}
              <div className="space-y-2">
                <h3 className="font-medium">Customer Interaction</h3>
                <p className="text-sm text-gray-500">
                  Alerts for new reviews or ratings & Feedback received on products.
                </p>
                <Switch />
              </div>

              {/* Do Not Disturb */}
              <div className="space-y-2">
                <h3 className="font-medium">Do Not Disturb</h3>
                <p className="text-sm text-gray-500">
                  Critical notifications (e.g., payment issues) will still come through
                </p>
                <Switch checked />
              </div>
            </div>
          </div>
        )}

        {activeTab === "Store" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Store Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-medium mb-1">Store Info</h2>
                <p className="text-sm text-gray-500">This details will appear in your profile</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name *</Label>
                    <Input id="storeName" placeholder="Enter company name" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="+234 00000 00000" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Store Logo</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Button variant="outline" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">Or Drop a file</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea id="address" placeholder="Enter your address" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="ca">Canada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ny">New York</SelectItem>
                        <SelectItem value="ca">California</SelectItem>
                        <SelectItem value="tx">Texas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail Address</Label>
                  <Input id="email" type="email" placeholder="Enter email address" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="cac">CAC</Label>
                    <span className="flex items-center">
                      <HelpCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm text-gray-500">Corporate Affairs Commission registration number</span>
                    </span>
                  </div>
                  <Input id="cac" placeholder="E.g.1234567890" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Store Description *</Label>
                  <Textarea id="description" placeholder="Enter store description" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Open Days *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !openDays && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {openDays ? openDays.toLocaleDateString() : "Select days"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={openDays} onSelect={setOpenDays} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Open Time *</Label>
                    <div className="relative">
                      <Input placeholder="Select time" className="pl-10" />
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Closed Days *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !closedDays && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {closedDays ? closedDays.toLocaleDateString() : "Select days"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={closedDays} onSelect={setClosedDays} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Close Time *</Label>
                    <div className="relative">
                      <Input placeholder="Select time" className="pl-10" />
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Policy */}
            <div className="space-y-8">
              <h2 className="text-lg font-medium">Store Policy</h2>

              <div className="space-y-6">
                <h3 className="font-medium">Shipping</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Delivery Time</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2">1-2 days</SelectItem>
                        <SelectItem value="3-5">3-5 days</SelectItem>
                        <SelectItem value="5-7">5-7 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Shipping Cost</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free Shipping</SelectItem>
                        <SelectItem value="flat">Flat Rate</SelectItem>
                        <SelectItem value="calculated">Calculated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Lost/Damaged Orders</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Report within" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="48h">48 hours</SelectItem>
                      <SelectItem value="72h">72 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <h3 className="font-medium pt-4">Refund</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Eligibility</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All items</SelectItem>
                        <SelectItem value="selected">Selected items</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Processing time</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24 hours</SelectItem>
                        <SelectItem value="48h">48 hours</SelectItem>
                        <SelectItem value="72h">72 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Refund Method</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original">Original payment method</SelectItem>
                        <SelectItem value="store">Store credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Non-Refundable Items</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="custom">Custom items</SelectItem>
                        <SelectItem value="sale">Sale items</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <h3 className="font-medium pt-4">Return</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Return Window</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New with tags</SelectItem>
                        <SelectItem value="unused">Unused</SelectItem>
                        <SelectItem value="any">Any condition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Return Shipping</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="customer">Customer pays</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Exchange Option</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Available</SelectItem>
                        <SelectItem value="no">Not available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder content for other tabs */}
        {activeTab !== "Notifications" && activeTab !== "Store" && (
          <div className="py-8 text-center text-gray-500">
            <h2 className="text-2xl font-medium mb-2">{activeTab}</h2>
            <p>This section is under development</p>
          </div>
        )}

        {/* Save Button */}
        {(activeTab === "Notifications" || activeTab === "Store") && (
          <div className="flex justify-end mt-8">
            <Button>Save</Button>
          </div>
        )}
      </div>
    </div>
  );
}
