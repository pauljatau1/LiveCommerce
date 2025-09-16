import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { DollarSign } from "lucide-react";
import { Calendar } from "lucide-react";

export default function PriceBreakdownCard({ order, shipping }) {
  if (!order) return null;
  return (
    <Card className="border rounded-2xl border-gray-100 -sm bg-white">
      <CardHeader className="border-b border-gray-100 p-4">
        <CardTitle className="flex items-center gap-2 font-inter text-sm text-gray-700">
          <DollarSign className="h-4 w-4 text-blue-500" />
          Payment Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Order Summary</h3>
            <div className="space-y-2">
              {order?.paymentBreakdown?.items?.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate pr-4">{item.productName}</span>
                  <span className="font-medium">₦{item.amount.toLocaleString()}</span>
                </div>
              ))}
              {shipping?.fee?.amount > 0 && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="flex items-center gap-2">
                    <span className="text-gray-600 line-through">₦{shipping.fee.amount.toLocaleString()}</span>
                    <Badge className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">Free</Badge>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Fees & Deductions</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                    <path d="M3 3v18h18"/>
                    <path d="M18 9l-6-6-6 6"/>
                    <path d="M6 10l6-6 6 6"/>
                  </svg>
                  <span>Platform Fee ({order?.paymentBreakdown?.items?.[0]?.platformFeePercentage}%)</span>
                </div>
                <span className="text-red-600">-₦{order?.paymentBreakdown?.fees?.totalPlatformFee?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  <span>VAT (7.5% of commission)</span>
                </div>
                <span className="text-red-600">-₦{(order?.paymentBreakdown?.fees?.totalPlatformFee * 0.075)?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                  <span>Payment Processing ({order?.paymentBreakdown?.fees?.processingFeePercentage}%)</span>
                </div>
                <span className="text-red-600">-₦{order?.paymentBreakdown?.fees?.processingFee?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-700">Total Deductions</span>
                <span className="text-red-600">-₦{order?.paymentBreakdown?.fees?.totalDeductions?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-inter font-semibold bg-green-50 p-3 rounded-md">
                <span>Your Payout</span>
                <span className="text-green-700">₦{order?.paymentBreakdown?.sellerPayout?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${
                order?.paymentInfo?.status === 'paid' ? 'bg-green-100' :
                order?.paymentInfo?.status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${
                  order?.paymentInfo?.status === 'paid' ? 'text-green-600' :
                  order?.paymentInfo?.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
              </div>
              <div>
                <Badge className={`${
                  order?.paymentInfo?.status === 'paid' ? 'bg-green-100 text-green-700' :
                  order?.paymentInfo?.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {order?.paymentInfo?.status === 'awaiting_cod' ? 'Payment on Delivery' : order?.paymentInfo?.status}
                </Badge>
                <p className="text-xs text-gray-500 mt-0.5">
                  {order?.paymentInfo?.method ? `via ${order?.paymentInfo?.method}` : ''}
                  {order?.paymentInfo?.transactionId ? ` • Ref: ${order?.paymentInfo?.transactionId}` : ''}
                </p>
              </div>
            </div>
            {order?.paymentInfo?.paidAt && (
              <div className="text-xs flex items-center gap-1 text-gray-500">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(order.paymentInfo.paidAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
