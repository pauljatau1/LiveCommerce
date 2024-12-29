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
import Loader from "@/Components/Loader"

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
          if (data && Array.isArray(data)) {
            setFollowers(data)
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
    <>
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <Loader />
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <SearchBar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

          {followers?.length === 0 ? (
            <div className="flex justify-center items-center h-[calc(100vh-100px)]">
              <p className="text-xl text-gray-500">You have no followers yet</p>
            </div>
          ) : (
            <div className="">
              {/* Content area */}
              <div className="w-full rounded-xl overflow-hidden">
                <Table className="rounded-xl">
                  <TableHeader className="rounded-t-xl">
                    <TableRow className="bg-green-700 hover:bg-green-500/90 rounded-t-xl">
                      <TableHead className="text-white rounded-tl-xl">Customer Name</TableHead>
                      <TableHead className="text-white">Location</TableHead>
                      <TableHead className="text-white">Orders</TableHead>
                      <TableHead className="text-white">Amount spent</TableHead>
                      <TableHead className="text-white rounded-tr-xl">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {followers?.map((follower) => {
                      // Check if the follower object has the required properties
                      if (follower.firstName && follower.lastName && follower.mainAddress) {
                        return (
                          <TableRow key={follower._id} className="bg-[#F0F5F2] hover:bg-green-200">
                            <TableCell className="flex items-center gap-2">
                              <Avatar className="bg-white">
                                <AvatarFallback>{follower.firstName[0]}</AvatarFallback>
                              </Avatar>
                              {`${follower.firstName} ${follower.lastName}`}
                            </TableCell>
                            <TableCell>{`${follower.mainAddress.city}, ${follower.mainAddress.country}`}</TableCell>
                            <TableCell>{follower.totalOrders} Orders</TableCell>
                            <TableCell>₦0</TableCell>
                            <TableCell>
                              <Link to={`/dashboard/customer/${follower.buyerId}`}>
                                <Button variant="outline" size="sm">
                                  View
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        )
                      } else {
                        return null; // Skip rendering for invalid follower objects
                      }
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default Customers
