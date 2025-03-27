import SearchBar from "@/Components/ui/DashboardHomepageUi/SearchBar"
import { useState, useEffect } from "react"
import Header from "@/Components/ui/Header/Header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table"
import { Button } from "@/Components/ui/button"
import { Avatar, AvatarFallback } from "@/Components/ui/avatar"
import { Link } from "react-router-dom"
import { BASE_URL } from "@/Constants/Server"
import LinearProgress from "@mui/material/LinearProgress";
import { 
  FiUsers, 
  FiShoppingBag, 
  FiMapPin, 
  FiDollarSign,
  FiEye,
  FiSearch
} from "react-icons/fi"
import { BiSortAlt2 } from "react-icons/bi"
import { motion } from "framer-motion"
import { useOutletContext } from "react-router-dom"
import { Icon } from "@iconify/react"
import jsPDF from 'jspdf'
import 'jspdf-autotable'


function Customers() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const [filteredFollowers, setFilteredFollowers] = useState([])

  const { setHeaderName, setNavName } = useOutletContext()

  useEffect(() => {
    setHeaderName('Customers');
    setNavName('');
  }, [])

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken)
          const token = tokenData.data
          console.log('Token:', token)
          const response = await fetch(`${BASE_URL}/seller/followers?page=1&limit=100`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const data = await response.json()
          console.log('Data:', data)
          if (data && Array.isArray(data.followers)) {
            setFollowers(data.followers)
          } else {
            console.error('Followers data is missing or invalid')
          }
        } else {
          console.error('Seller token not found in localStorage')
        }
      } catch (error) {
        console.error('Error fetching followers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFollowers()
  }, [])

  // Search and filter logic
  useEffect(() => {
    let result = [...followers]
    
    // Apply search
    if (searchTerm) {
      result = result.filter(follower => {
        const searchString = `${follower.firstName || ''} ${follower.lastName || ''} ${follower.name || ''} ${follower.email || ''}`.toLowerCase()
        return searchString.includes(searchTerm.toLowerCase())
      })
    }

    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key] || 0
        let bValue = b[sortConfig.key] || 0
        
        if (sortConfig.key === 'name') {
          aValue = (a.firstName ? `${a.firstName} ${a.lastName}` : a.name) || ''
          bValue = (b.firstName ? `${b.firstName} ${b.lastName}` : b.name) || ''
        }

        if (sortConfig.direction === 'asc') {
          return aValue > bValue ? 1 : -1
        }
        return aValue < bValue ? 1 : -1
      })
    }

    setFilteredFollowers(result)
  }, [followers, searchTerm, sortConfig])

  // Sorting handler
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(16)
    doc.text('Customer Report', 14, 15)
    doc.setFontSize(10)
    doc.text('Auqli Inc', 14, 22)
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28)

    const tableColumn = [
      'Customer Name', 
      'Location', 
      'Total Orders', 
      'Total Spent (₦)',
      'Join Date'
    ]

    const tableRows = filteredFollowers.map(follower => [
      follower.firstName ? `${follower.firstName} ${follower.lastName}` : follower.name,
      follower.mainAddress ? 
        `${follower.mainAddress.city}, ${follower.mainAddress.country}` : 
        'N/A',
      follower.totalOrders || 0,
      (follower.totalSpent || 0).toLocaleString(),
      new Date(follower.followDate).toLocaleDateString()
    ])

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 175, 80] }
    })

    doc.save('customers-report.pdf')
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50/30 py-6">
     
      {loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col justify-center items-center h-[80dvh]" 
        >
          <div className="w-1/4">
            <LinearProgress color="success" />
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Stats Overview */}
         

          {/* Search and Filter Section */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-10 pr-4 py-2 font-inter rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleSort('name')}
                    className={`flex items-center gap-2 ${
                      sortConfig.key === 'name' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-700'
                    } hover:bg-gray-100`}
                  >
                    Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </Button>
                  <Button 
                    onClick={() => handleSort('totalOrders')}
                    className={`flex items-center gap-2 ${
                      sortConfig.key === 'totalOrders' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-700'
                    } hover:bg-gray-100`}
                  >
                    Orders {sortConfig.key === 'totalOrders' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </Button>
                  <Button 
                    onClick={() => handleSort('totalSpent')}
                    className={`flex items-center gap-2 ${
                      sortConfig.key === 'totalSpent' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-700'
                    } hover:bg-gray-100`}
                  >
                    Spent {sortConfig.key === 'totalSpent' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </Button>
                </div>
                <Button 
                  onClick={exportToPDF}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Export Data
                </Button>
              </div>
            </div>
          </div>

          {filteredFollowers.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-[40vh] bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <FiUsers className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-xl text-gray-500">No customers yet</p>
              <p className="text-gray-400 mt-2">Your customer list will appear here</p>
            </motion.div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50/80">
                    <TableHead className="font-semibold font-inter uppercase text-xs text-[#8492A6]">Customer</TableHead>
                    <TableHead className="font-semibold font-inter uppercase text-xs text-[#8492A6]">
                      <div className="flex items-center gap-2">
                        <FiMapPin className="w-4 h-4" />
                        Location
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold font-inter uppercase text-xs text-[#8492A6]">
                      <div className="flex items-center gap-2">
                        <FiShoppingBag className="w-4 h-4" />
                        Orders
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold font-inter uppercase text-xs text-[#8492A6]">
                      <div className="flex items-center gap-2">
                      <Icon icon="mdi:naira" width="17" height="17"  style={{color: '#8492A6'}} />
                        Amount spent
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold font-inter uppercase text-xs text-[#8492A6]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFollowers.map((follower) => (
                    <TableRow key={follower._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="bg-green-50 border-2 border-green-100">
                            {follower.profileImageUrl ? (
                              <img 
                                src={follower.profileImageUrl} 
                                alt={follower.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <AvatarFallback className="text-green-600 font-medium">
                                {follower.firstName ? follower.firstName[0] : follower.name[0]}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-semibold font-inter text-[#27272E]">
                              {follower.firstName ? `${follower.firstName} ${follower.lastName}` : follower.name}
                            </p>
                            {/* <p className="text-sm text-gray-500">ID: {follower._id.slice(-6)}</p> */}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FiMapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {follower.mainAddress ? 
                              `${follower.mainAddress.city || 'Unknown City'}, ${follower.mainAddress.country === 'NG' ? 'Nigeria' : follower.mainAddress.country}` :
                              'Location not set'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                            {follower?.totalOrders || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium font-inter text-[#27272E]">
                          ₦{follower.totalSpent ? follower.totalSpent.toLocaleString() : '0'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link to={`/dashboard/customer/${follower.buyerId || follower._id}`}>
                          <Button className="bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-2">
                            <FiEye className="w-4 h-4" />
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      )}
    </div>
    </>
  )
}

export default Customers
