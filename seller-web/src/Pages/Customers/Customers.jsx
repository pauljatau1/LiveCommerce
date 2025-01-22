import SearchBar from "@/Components/ui/DashboardHomepageUi/SearchBar"
import { useState, useEffect } from "react"
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
import Header from "@/Components/ui/Header/Header";
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

function Customers() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const sellerToken = localStorage.getItem('sellerToken')
        if (sellerToken) {
          const tokenData = JSON.parse(sellerToken)
          const token = tokenData.data
          console.log('Token:', token)
          const response = await fetch(`${BASE_URL}/seller/followers?page=1&limit=20`, {
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

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            <h1 className="text-3xl font-semibold text-gray-800">Customers</h1>
            {/* Add more stat cards here */}
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div className="flex items-center gap-4">
                <Button className="flex items-center gap-2 bg-gray-50 text-gray-700 hover:bg-gray-100">
                  <BiSortAlt2 className="w-5 h-5" />
                  Sort
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  Export Data
                </Button>
              </div>
            </div>
          </div>

          {followers?.length === 0 ? (
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
                    <TableHead className="font-semibold text-gray-600">Customer</TableHead>
                    <TableHead className="font-semibold text-gray-600">
                      <div className="flex items-center gap-2">
                        <FiMapPin className="w-4 h-4" />
                        Location
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-600">
                      <div className="flex items-center gap-2">
                        <FiShoppingBag className="w-4 h-4" />
                        Orders
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-600">
                      <div className="flex items-center gap-2">
                        <FiDollarSign className="w-4 h-4" />
                        Amount spent
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followers.map((follower) => (
                    <TableRow key={follower._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="bg-green-50 border-2 border-green-100">
                            <AvatarFallback className="text-green-600 font-medium">
                              {follower.firstName ? follower.firstName[0] : follower.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {follower.firstName ? `${follower.firstName} ${follower.lastName}` : follower.name}
                            </p>
                            <p className="text-sm text-gray-500">ID: {follower._id.slice(-6)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FiMapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {follower.mainAddress ?
                              `${follower.mainAddress.city}, ${follower.mainAddress.country}` :
                              'N/A'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {follower?.totalOrders || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
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
  )
}

export default Customers
