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
    <>
      {loading ? (
        <div className="flex flex-col justify-center items-center h-[80dvh]">
          <div className="w-1/4">
            <LinearProgress color="success" />
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <Header showSearch={true} headerTitle="Customers" showHeader={true} searchPlaceholder="Search customers..." />

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
                      <TableHead className="text-white text-xs xl:text-base rounded-tl-xl">Customer Name</TableHead>
                      <TableHead className="text-white text-xs xl:text-base">Location</TableHead>
                      <TableHead className="text-white text-xs xl:text-base">Orders</TableHead>
                      <TableHead className="text-white text-xs xl:text-base">Amount spent</TableHead>
                      <TableHead className="text-white text-xs xl:text-base rounded-tr-xl">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {followers.map((follower) => (
                      <TableRow key={follower._id} className="bg-[#F0F5F2] hover:bg-green-200">
                        <TableCell className="flex items-center gap-2">
                          <Avatar className="bg-white border border-[#05031F]/50 text-xs xl:text-base">
                            <AvatarFallback>
                              {follower.firstName ? follower.firstName[0] : follower.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-xs xl:text-base">{follower.firstName ? `${follower.firstName} ${follower.lastName}` : follower.name}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs xl:text-base">{follower.mainAddress ?
                            `${follower.mainAddress.city}, ${follower.mainAddress.country}` :
                            'N/A'
                          }</p>
                        </TableCell>
                        <TableCell><p>{follower?.totalOrders || 0}</p></TableCell>
                        <TableCell>₦{follower.totalSpent ? follower.totalSpent.toLocaleString() : '0'}</TableCell>
                        <TableCell>
                          <Link to={`/dashboard/customer/${follower.buyerId || follower._id}`}>
                            <Button className="bg-transparent border border-[#05031F] text-[#05031F] px-2 xl:px-6 hover:bg-[#05031F] hover:text-white transition-all duration-300 ease-in-out" variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
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
