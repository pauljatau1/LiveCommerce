import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Button } from "@/Components/ui/button"
import { Calendar, ChevronDown, Download, Users, Mail, MousePointerClick, TrendingUp, DollarSign,  Monitor, Smartphone, Tablet } from "lucide-react"
import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { BASE_URL } from "@/Constants/Server"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { toast } from "sonner"
import PropTypes from "prop-types";

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

function StatsCard({ title, value, change, prefix = "", icon: Icon }) {
  const isPositive = parseFloat(change) >= 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2 mt-2">
              <h2 className="text-2xl font-bold">
                {prefix}
                {value}
              </h2>
              <span className={`text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}>
                {isPositive ? "+" : ""}
                {change}%
              </span>
            </div>
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  change: PropTypes.number.isRequired,
  prefix: PropTypes.string,
  icon: PropTypes.func.isRequired,
};

function TrendsChart({ data }) {
  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Campaign Performance</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Track your campaign metrics over time</p>
        </div>
        <Button variant="outline" className="bg-white">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="day" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="MessagesSent" 
              stroke="#4f46e5" 
              strokeWidth={2}
              dot={false}
              name="Messages Sent"
            />
            <Line 
              type="monotone" 
              dataKey="Opened" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
              name="Opens"
            />
            <Line 
              type="monotone" 
              dataKey="Clicked" 
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={false}
              name="Clicks"
            />
            <Line 
              type="monotone" 
              dataKey="Sales" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={false}
              name="Sales"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

TrendsChart.propTypes = {
  data: PropTypes.array.isRequired,
};

function DeviceDistribution({ deviceStats }) {
  const data = [
    { name: 'Desktop', value: deviceStats?.desktop || 0 },
    { name: 'Mobile', value: deviceStats?.mobile || 0 },
    { name: 'Tablet', value: deviceStats?.tablet || 0 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Device Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">How users view your campaigns</p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            <span className="text-sm">Desktop</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-green-500" />
            <span className="text-sm">Mobile</span>
          </div>
          <div className="flex items-center gap-2">
            <Tablet className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Tablet</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

DeviceDistribution.propTypes = {
  deviceStats: PropTypes.object.isRequired,
};

function CampaignsTable({ campaigns }) {
  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <div>
          <CardTitle>Recent Campaigns</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Detailed view of your campaign performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="bg-white">
            <Calendar className="mr-2 h-4 w-4" />
            Filter by date
          </Button>
          <Button variant="outline" className="bg-white">
            Status
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Campaign Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Recipients</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Open Rate</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Click Rate</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Sales</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign._id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{campaign.title}</p>
                      <p className="text-sm text-muted-foreground">ID: {campaign._id.slice(0, 8)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">{campaign.stats.totalRecipients}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm">{campaign.openRate}</p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.stats.uniqueOpens} unique opens
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm">{campaign.clickRate}</p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.stats.uniqueClicks} unique clicks
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">₦{campaign.stats.sales.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

CampaignsTable.propTypes = {
  campaigns: PropTypes.array.isRequired,
};

function InboxCampaigns() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalFollowers: { value: 0, change: 0 },
    totalMessagesSent: { value: 0, change: 0 },
    openRate: { value: '0%', change: 0 },
    clickRate: { value: '0%', change: 0 },
    salesGenerated: { value: 0, change: 0 },
    deviceStats: {
      desktop: 0,
      mobile: 0,
      tablet: 0
    }
  })
  const [campaigns, setCampaigns] = useState([])
  const [trendsData, setTrendsData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken'))?.data
        const headers = { Authorization: `Bearer ${sellerToken}` }

        const [statsRes, campaignsRes, trendsRes] = await Promise.all([
          axios.get(`${BASE_URL}/campaigns/stats`, { headers }),
          axios.get(`${BASE_URL}/campaigns`, { headers }),
          axios.get(`${BASE_URL}/campaigns/trends`, { headers })
        ])

        setStats(statsRes.data)
        setCampaigns(campaignsRes.data.campaigns)
        setTrendsData(trendsRes.data)
      } catch (error) {
        console.error('Error fetching campaign data:', error)
        toast.error('Failed to load campaign data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="p-8 text-center">Loading campaign data...</div>
  }

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold">Campaign Analytics</h1>
          <p className="text-muted-foreground mt-1">Track and analyze your campaign performance</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto" 
          onClick={() => navigate('/dashboard/inbox-campaigns/create')}
        >
          Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard 
          title="Total Followers" 
          value={stats.totalFollowers.value} 
          change={stats.totalFollowers.change}
          icon={Users}
        />
        <StatsCard 
          title="Messages Sent" 
          value={stats.totalMessagesSent.value} 
          change={stats.totalMessagesSent.change}
          icon={Mail}
        />
        <StatsCard 
          title="Open Rate" 
          value={stats.openRate.value} 
          change={stats.openRate.change}
          icon={TrendingUp}
        />
        <StatsCard 
          title="Click Rate" 
          value={stats.clickRate.value} 
          change={stats.clickRate.change}
          icon={MousePointerClick}
        />
        <StatsCard 
          title="Revenue" 
          value={stats.salesGenerated.value.toLocaleString()} 
          change={stats.salesGenerated.change}
          prefix="₦"
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TrendsChart data={trendsData} />
        <DeviceDistribution deviceStats={stats.deviceStats} />
      </div>

      <CampaignsTable campaigns={campaigns} />
    </div>
  )
}

InboxCampaigns.propTypes = {
  campaigns: PropTypes.array.isRequired,
};

export default InboxCampaigns
