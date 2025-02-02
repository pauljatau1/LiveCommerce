import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, ChevronDown, Download } from "lucide-react"
import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { BASE_URL } from "@/Constants/Server"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { toast } from "react-hot-toast"

function StatsCard({ title, value, change, prefix = "" }) {
  const isPositive = parseFloat(change) >= 0

  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">
            {prefix}
            {value}
          </h2>
          <span className={`text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? "+" : ""}
            {change}%
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function TrendsChart() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    // Fetch campaign trends data
    const fetchTrends = async () => {
      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken'))?.data
        const response = await axios.get(`${BASE_URL}/campaigns/trends`, {
          headers: { Authorization: `Bearer ${sellerToken}` }
        })
        setData(response.data)
      } catch (error) {
        console.error('Error fetching trends:', error)
      }
    }
    fetchTrends()
  }, [])

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Trends Over Time</CardTitle>
        <Button variant="success">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="MessagesSent" stroke="#8884d8" />
            <Line type="monotone" dataKey="Opened" stroke="#82ca9d" />
            <Line type="monotone" dataKey="Clicked" stroke="#ffc658" />
            <Line type="monotone" dataKey="Sales" stroke="#ff7300" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function SubscriptionCard() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex gap-2">
          <Input type="email" placeholder="E-mail" className="flex-1" />
          <Button variant="outline" className="bg-white">
            Subscribe
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Follow your statistics.</p>
      </CardContent>
    </Card>
  )
}

function DistributionChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full" viewBox="0 0 42 42">
            <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e6e6e6" strokeWidth="3" />
            <circle
              cx="21"
              cy="21"
              r="15.91549430918954"
              fill="transparent"
              stroke="rgb(22 163 74)"
              strokeWidth="3"
              strokeDasharray="75 25"
              transform="rotate(-90 21 21)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">13</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CampaignsTable() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken'))?.data
        const response = await axios.get(`${BASE_URL}/campaigns`, {
          headers: { Authorization: `Bearer ${sellerToken}` }
        })
        setCampaigns(response.data.campaigns)
      } catch (error) {
        console.error('Error fetching campaigns:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCampaigns()
  }, [])

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">Campaigns</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white">
            <Calendar className="mr-2 h-4 w-4" />
            Filtering by date
          </Button>
          <Button variant="outline" className="bg-white">
            Channel
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left">Campaign Name</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Recipients</th>
                <th className="px-6 py-3 text-left">Open Rate</th>
                <th className="px-6 py-3 text-left">Click Rate</th>
                <th className="px-6 py-3 text-left">Sales</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">Loading...</td>
                </tr>
              ) : campaigns.map((campaign) => (
                <tr key={campaign._id} className="border-b">
                  <td className="px-6 py-4">{campaign.title}</td>
                  <td className="px-6 py-4">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">{campaign.followers}</td>
                  <td className="px-6 py-4">{campaign.openRate}</td>
                  <td className="px-6 py-4">{campaign.clickRate}</td>
                  <td className="px-6 py-4">{campaign.sales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function InboxCampaigns() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalFollowers: { value: 0, change: 0 },
    totalMessagesSent: { value: 0, change: 0 },
    openRate: { value: '0%', change: 0 },
    clickRate: { value: '0%', change: 0 },
    salesGenerated: { value: 0, change: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken'))?.data
        const response = await axios.get(`${BASE_URL}/campaigns/stats`, {
          headers: { Authorization: `Bearer ${sellerToken}` }
        })
        setStats(response.data)
      } catch (error) {
        console.error('Error fetching campaign stats:', error)
        toast.error('Failed to load campaign statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campaign Analytics</h1>
        <Button 
          className="bg-green-600 hover:bg-green-700" 
          onClick={() => navigate('/dashboard/inbox-campaigns/create')}
        >
          Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <StatsCard 
          title="Total Followers" 
          value={stats.totalFollowers.value} 
          change={stats.totalFollowers.change} 
        />
        <StatsCard 
          title="Total Messages sent" 
          value={stats.totalMessagesSent.value} 
          change={stats.totalMessagesSent.change} 
        />
        <StatsCard 
          title="Open Rate" 
          value={stats.openRate.value} 
          change={stats.openRate.change} 
        />
        <StatsCard 
          title="Click rate" 
          value={stats.clickRate.value} 
          change={stats.clickRate.change} 
        />
        <StatsCard 
          title="Sales Generated" 
          value={stats.salesGenerated.value} 
          change={stats.salesGenerated.change} 
          prefix="N " 
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <TrendsChart />
        <div className="space-y-4">
          <SubscriptionCard />
          <DistributionChart />
        </div>
      </div>

      <CampaignsTable />
    </div>
  )
}

export default InboxCampaigns
