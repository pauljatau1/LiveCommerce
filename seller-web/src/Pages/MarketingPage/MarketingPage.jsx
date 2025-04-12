"use client"

import { useState, useEffect } from "react"
import { Icon } from "@iconify/react"
import { useOutletContext, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, Zap, Ticket, MessageSquare, Users2, MessageCircle } from "lucide-react"
import { HiSpeakerphone } from "react-icons/hi"
import { IoTicketSharp, IoFlashSharp } from "react-icons/io5"
import { BiMessageRoundedDots } from "react-icons/bi"
import { PiUsersThreeFill } from "react-icons/pi"
import { LuMessageSquareMore } from "react-icons/lu"
import { BsQuestionCircleFill } from "react-icons/bs"
import SuggestedVideoCard from "@/Components/SuggestedVideoCard"
import { marketingAdsData, suggestVideosData } from "../../Utilities/data";
import ComingSoonTag from "@/Components/ComingSoonTag";

// Marketing features data
const marketingFeatures = [
  {
    icon: HiSpeakerphone,
    title: "Auqli Ads",
    description: "Boost your sales and brand visibility with Auqli's powerful In-app Platform Ads, reaching a wider audience",
    status: "paid",
    isComingSoon: true,
    link: "/auqli-ads",
  },
  {
    icon: IoTicketSharp,
    title: "Coupons",
    description: "Create coupons and distribute. Drive up sales and increase the average order value for your store!",
    status: "free",
    isComingSoon: false,
    link: "/dashboard/coupons",
  },
  {
    icon: IoFlashSharp,
    title: "Flash Sales",
    description:
      "Create urgency, FOMO and limited sales for your buyers. Helps increase visibility and get in front of buyers",
    status: "free",
    isComingSoon: true,
    link: "/flash-sales",
  },
  {
    icon: BiMessageRoundedDots,
    title: "Inbox Campaigns",
    description:
      "Directly send messages to your followers using our in-built direct marketing feature for your business!",
    status: "free",
    isComingSoon: false,
    link: "/dashboard/inbox-campaigns",
  },
  {
    icon: PiUsersThreeFill,
    title: "Referral",
    description:
      "Refer people and earn when they join Auqli and makes a purchase. Increase followers and get passive income",
    status: "free",
    isComingSoon: true,
    link: "/referral",
  },
  {
    icon: LuMessageSquareMore,
    title: "Inbox Automation+",
    description: "Message those who add to cart, purchased, viewed product & welcome Messages are automated.",
    status: "beta",
    isComingSoon: true,
    link: "/inbox-automation",
  },
]

const MarketingPage = () => {
  const { isSidebarOpen, setIsSidebarOpen, setHeaderName, setNavName } = useOutletContext()
  const [open, setOpen] = useState(false)
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [notification, setNotification] = useState(true)

  useEffect(() => {
    setHeaderName("Marketing")
    setNavName("")
  }, [setHeaderName, setNavName]) // Added dependencies to useEffect

  return (
    <div className="container mx-auto pt-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {marketingFeatures.map((feature, index) => (
          <Card
            key={index}
            className="relative hover:shadow-lg transition-all duration-300 border-2"
          >
            {feature.isComingSoon && (
              <ComingSoonTag xAxisCenterPosition={true} topPosition="top-10" />
            )}
            <CardHeader>
              <div className="flex items-center justify-between">

                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center shadow-sm">
                  <feature.icon className="h-7 w-7 text-green-600" />
                </div>
                <Badge
                  variant="secondary"
                  className={`
                    px-4 py-1 rounded-full font-medium
                    ${feature.status === "paid" ? "bg-green-100 text-green-800" : ""}
                    ${feature.status === "free" ? "bg-blue-50 text-blue-800" : ""}
                    ${feature.status === "beta" ? "bg-purple-50 text-purple-800" : ""}
                  `}
                >
                  {feature.status.charAt(0).toUpperCase() + feature.status.slice(1)}
                </Badge>
              </div>
              <h3 className="text-xl text-center font-semibold mt-6">{feature.title}</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center leading-relaxed">{feature.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <Link to={feature.isComingSoon ? "#" : feature.link}>
                <Button
                  variant="default"
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white w-full mr-2 transition-all duration-300"
                  disabled={feature.isComingSoon}
                >
                  Get Started
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-green-50"
                disabled={feature.isComingSoon}
              >
                <BsQuestionCircleFill className="h-4 w-4 text-green-700" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-10 bg-[#E7F7ED] rounded-[10px] px-4 py-3 lg:px-8 lg:py-7">
                <h1 className="text-lg font-lexend font-bold text-[#05031F] mb-2">Marketing Resources</h1>
                <p className="text-sm lg:text-base font-cabin font-normal text-[#05031F]">Get tips and best practices to grow your business on Auqli using Auqli marketing tools</p>
                <div className="relative">
                    <div className="flex gap-4 lg:gap-8 overflow-x-scroll pb-4 mt-5 scroll-smooth
                [&::-webkit-scrollbar]:h-2
                [&::-webkit-scrollbar-track]:rounded-full
                [&::-webkit-scrollbar-track]:bg-gray-100
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-gray-300
                hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                        {
                            suggestVideosData.map((video) => (
                                <div key={video.id} className="flex-none">
                                    <SuggestedVideoCard video={video} />
                                </div>
                            ))
                        }
                    </div>
                </div>
      </div>
    </div>
  )
}

export default MarketingPage
