import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card"
import { Button } from "@/Components/ui/button"
import { Calendar, ChevronDown, Download, Users, Mail, DollarSign, Filter, Zap, LineChart, ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { BASE_URL } from "@/Constants/Server"
import { toast } from "sonner"
import PropTypes from "prop-types";

function StatsCard({ title, value, change, prefix = "", suffix = "", icon: Icon }) {
  const isPositive = parseFloat(change) >= 0

  return (
    <Card className="overflow-hidden border-none -lg hover:-xl transition-all duration-300">
      <CardContent className="p-6 bg-gradient-to-br from-white to-slate-50">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2 mt-2">
              <h2 className="text-3xl font-bold text-slate-800">
                {prefix}
                {value}
                {suffix}
              </h2>
              <span className={`text-sm font-semibold px-2 py-1 rounded-full ${isPositive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                {isPositive ? "+" : ""}
                {change}%
              </span>
            </div>
          </div>
          <div className="p-3 bg-primary/15 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  change: PropTypes.number.isRequired,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  icon: PropTypes.func.isRequired,
};

function CampaignsTable({ campaigns }) {
  return (
    <Card className="col-span-3 overflow-hidden border-none -lg">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 bg-gradient-to-r from-slate-50 to-white p-6">
        <div>
          <CardTitle className="text-xl text-slate-800">Recent Campaigns</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Detailed view of your campaign performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="bg-white rounded-full border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all">
            <Calendar className="mr-2 h-4 w-4 text-primary" />
            Filter by date
          </Button>
          <Button variant="outline" className="bg-white rounded-full border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all">
            <Filter className="mr-2 h-4 w-4 text-primary" />
            Status
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Campaign Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Recipients</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Revenue</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Engagement</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign._id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-800">{campaign.title}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {campaign.formattedDate || new Date(campaign.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{campaign.recipients || campaign.stats.totalRecipients}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    ₦{campaign.stats.revenue ? campaign.stats.revenue.toLocaleString() : '0'}
                    {campaign.stats.conversionRate && 
                      <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {campaign.stats.conversionRate}
                      </span>
                    }
                  </td>
                  <td className="px-6 py-4">
                    {campaign.stats.engagementScore !== undefined ? (
                      <div className="flex items-center">
                        <div className="w-24 bg-slate-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-full rounded-full ${
                              campaign.stats.engagementScore > 70 ? 'bg-green-500' : 
                              campaign.stats.engagementScore > 40 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`} 
                            style={{width: `${campaign.stats.engagementScore}%`}}
                          />
                        </div>
                        <span className="text-sm font-medium">{campaign.stats.engagementScore}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      campaign.status === 'sent' ? 'bg-green-100 text-green-700' :
                      campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      campaign.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                      'bg-red-100 text-red-700'
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
  const [summary, setSummary] = useState({
    totalRecipients: 0,
    totalSales: 0,
    conversionRate: '0%',
    engagementScore: 0,
    totalCampaigns: 0,
    averageOrderValue: 0
  })
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const sellerToken = JSON.parse(localStorage.getItem('sellerToken'))?.data
        const headers = { Authorization: `Bearer ${sellerToken}` }

        // Use the new performance endpoint for better metrics
        const [performanceRes, campaignsRes] = await Promise.all([
          axios.get(`${BASE_URL}/campaigns/performance?period=${period}`, { headers }),
          axios.get(`${BASE_URL}/campaigns`, { headers })
        ])

        if (performanceRes.data && performanceRes.data.summary) {
          setSummary(performanceRes.data.summary)
        } else {
          // Fallback to legacy endpoint
          const statsRes = await axios.get(`${BASE_URL}/campaigns/stats`, { headers })
          setSummary({
            totalRecipients: statsRes.data.totalMessagesSent?.value || 0,
            totalSales: statsRes.data.salesGenerated?.value || 0,
            conversionRate: '0%',
            engagementScore: 0,
            salesChange: statsRes.data.salesGenerated?.change || 0,
            recipientsChange: statsRes.data.totalMessagesSent?.change || 0
          })
        }
        
        setCampaigns(campaignsRes.data.campaigns)
      } catch (error) {
        console.error('Error fetching campaign data:', error)
        toast.error('Failed to load campaign data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-primary font-medium">Loading campaign data...</div>
      </div>
    )
  }

  return (
    <div className="py-4 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 bg-white p-6 rounded-2xl -sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Campaign Analytics</h1>
          <p className="text-muted-foreground mt-1">Track and analyze your campaign performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* <select 
            className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-sm focus:ring-primary"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
          </select> */}
          
          <Button 
            className="bg-primary hover:bg-primary/90 text-white rounded-xl -md hover:-lg transition-all font-medium" 
            onClick={() => navigate('/dashboard/inbox-campaigns/create')}
          >
            Create Campaign
          </Button>
        </div>
      </div>

      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Recipients" 
          value={summary.totalRecipients?.toLocaleString() || 0} 
          change={summary.recipientsChange || 0}
          icon={Users}
        />
        <StatsCard 
          title="Revenue" 
          value={summary.totalSales?.toLocaleString() || 0} 
          change={summary.salesChange || 0}
          prefix="₦"
          icon={DollarSign}
        />
        <StatsCard 
          title="Conversion Rate" 
          value={summary.conversionRate || '0%'} 
          change={0}
          icon={ShoppingCart}
        />
        <StatsCard 
          title="Avg Order Value" 
          value={summary.averageOrderValue?.toLocaleString() || 0} 
          change={0}
          prefix="₦"
          icon={LineChart}
        />
      </div> */}
      
      {/* Performance Score Card */}
      {summary.engagementScore > 0 && (
        <Card className="overflow-hidden border-none -lg">
          <CardContent className="p-6 bg-gradient-to-br from-white to-slate-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Campaign Engagement Score</h3>
                <p className="text-sm text-slate-500">Overall performance based on opens, clicks, and conversions</p>
              </div>
              <div className="p-3 bg-primary/15 rounded-full">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4 mb-2">
              <div 
                className={`h-full rounded-full ${
                  summary.engagementScore > 70 ? 'bg-green-500' : 
                  summary.engagementScore > 40 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`} 
                style={{width: `${summary.engagementScore}%`}}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Low</span>
              <span className="font-medium text-primary">{summary.engagementScore}/100</span>
              <span className="text-slate-500">High</span>
            </div>
          </CardContent>
        </Card>
      )}

      <CampaignsTable campaigns={campaigns} />
    </div>
  )
}

export default InboxCampaigns
