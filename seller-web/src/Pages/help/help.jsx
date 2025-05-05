"use client"

import { useState } from "react"
import { Search, Mail, Phone, MessageSquare, FileText, Users, HelpCircle } from "lucide-react"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/Components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/Components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs"
import { Label } from "@/Components/ui/label"
import { Textarea } from "@/Components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"

const sellerFaqData = [
  {
    question: "How do I list a new product?",
    answer:
      "To list a new product, go to your Seller Dashboard and click on 'Add New Product'. Fill in the required details such as product name, description, price, and inventory. Don't forget to add high-quality images and specify shipping options. Once you're satisfied with the listing, click 'Publish' to make it live on the marketplace.",
  },
  {
    question: "How do I manage my inventory?",
    answer:
      "You can manage your inventory through the 'Inventory' section of your Seller Dashboard. Here, you can update stock levels, set up low stock alerts, and manage product variations. We recommend regularly updating your inventory to ensure accurate stock information for customers.",
  },
  {
    question: "What are the fees for selling on this platform?",
    answer:
      "Our fee structure includes a monthly subscription fee and a per-sale commission. The monthly fee varies based on your seller plan, while the commission is typically 5-15% of the sale price, depending on the product category. For a detailed breakdown, please visit our 'Pricing' page in the Seller Help Center.",
  },
  {
    question: "How do I handle returns and refunds?",
    answer:
      "When a customer initiates a return, you'll receive a notification in your Seller Dashboard. Review the return reason and approve it if it meets our return policy. Once you receive the returned item, inspect it and process the refund through your dashboard. Make sure to handle returns promptly to maintain good customer satisfaction.",
  },
  {
    question: "How can I improve my seller rating?",
    answer:
      "To improve your seller rating, focus on providing excellent customer service, shipping products promptly, maintaining accurate product descriptions, and handling returns efficiently. Regularly check your seller feedback and address any issues raised by customers. Consistently high performance can lead to better visibility and more sales opportunities.",
  },
]

export default function SellerHelpAndSupport() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFAQs = sellerFaqData.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Seller Help & Support</h1>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search for seller help..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="faq" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq">FAQs</TabsTrigger>
            <TabsTrigger value="contact">Contact Support</TabsTrigger>
            <TabsTrigger value="resources">Seller Resources</TabsTrigger>
          </TabsList>
          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Find quick answers to common seller questions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQs.map((faq, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  View All FAQs
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Seller Support</CardTitle>
                <CardDescription>Get in touch with our dedicated seller support team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <span>seller.support@example.com</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <span>+1 (800) 555-1234</span>
                </div>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Your email" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="account">Account Issues</SelectItem>
                        <SelectItem value="listing">Listing Problems</SelectItem>
                        <SelectItem value="orders">Order Management</SelectItem>
                        <SelectItem value="payments">Payments and Fees</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Please provide details about your inquiry" />
                  </div>
                  <Button type="submit" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" /> Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle>Seller Resources</CardTitle>
                <CardDescription>Access guides, tools, and community support to grow your business.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Seller Handbook
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Seller Community Forum
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Video Tutorials
                </Button>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-gray-500">
                  Need more help? Check out our{" "}
                  <a href="#" className="text-blue-500 hover:underline">
                    Seller Success Center
                  </a>{" "}
                  for comprehensive guides and best practices.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Seller Support Hours</CardTitle>
            <CardDescription>
              Our dedicated seller support team is available to assist you during the following hours:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Monday to Friday: 9:00 AM - 8:00 PM EST</li>
              <li>Saturday: 10:00 AM - 6:00 PM EST</li>
              <li>Sunday: Closed</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600">
              For urgent issues outside of these hours, please use our 24/7 emergency support line: +1 (888) 999-9999
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

