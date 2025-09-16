import { Card, CardContent } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { AlertCircle, ArrowUpRight, Calendar, Check, Clock, CreditCard, DollarSign, MapPin, MessageSquare, ShoppingBag, Truck, User, Building2, XCircle, Mail } from "lucide-react";
import { Button } from "@/Components/ui/button";

export default function OrderHeaderCard({ order, orderData, shipping, onMessage, onOpenProof, confirmDeliveryLoading, navigate }) {
  const getStatusColor = (statusRaw) => {
    const status = (statusRaw || '').toString().toLowerCase();
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      paid: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      abandoned: 'bg-orange-100 text-orange-800',
      confirmed: 'bg-cyan-100 text-cyan-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const maskEmail = (email) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    const maskedUsername = `${username.slice(0, 2)}***${username.slice(-2)}`;
    return `${maskedUsername}@${domain}`;
  };
  return (
    <Card className="border border-emerald-100 rounded-2xl bg-white overflow-hidden">
      <div className={`${order?.isStale ? 'bg-gradient-to-r from-orange-50/90 to-orange-100/90' : order?.isStorePickup ? 'bg-gradient-to-r from-purple-50/90 to-purple-100/90' : 'bg-emerald-50'} p-5 sm:p-6 text-gray-800`}>
        <div className="flex flex-col gap-4">
          {/* Header row with Order ID and Message Customer button */}
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`bg-white p-2 rounded-full shadow-sm ${order?.isStale ? 'text-orange-600' : order?.isStorePickup ? 'text-purple-600' : 'text-green-600'}`}>
                    {order?.isStale ? <XCircle className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                  </div>
                  <h1 className="text-lg sm:text-xl font-inter font-semibold">Order ID : #{order?.order_id}</h1>
                  <div className="flex flex-wrap gap-2">
                    {/* Channel badge visually aligned to the requested pink pill */}
                    <Badge variant="outline" className="bg-blue-500/90 capitalize px-3 py-1 rounded-full text-white border-white/10 text-xs">
                      {order?.channel}
                    </Badge>
                    {order?.isStale ? (
                      <Badge variant="outline" className="bg-orange-600 capitalize px-3 py-1 rounded-full text-white border-white/10 text-xs">Abandoned</Badge>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            (order?.paymentInfo?.status || '').toLowerCase() === 'paid'
                              ? 'bg-green-500'
                              : (order?.paymentInfo?.status || '').toLowerCase().includes('pending') || (order?.paymentInfo?.status || '').toLowerCase() === 'unpaid'
                              ? 'bg-red-500'
                              : (order?.paymentInfo?.status || '').toLowerCase() === 'awaiting_cod'
                              ? 'bg-orange-500'
                              : 'bg-gray-400'
                          }`}
                        ></span>
                        <span
                          className={`${
                            (order?.paymentInfo?.status || '').toLowerCase() === 'paid'
                              ? 'text-green-600'
                              : (order?.paymentInfo?.status || '').toLowerCase().includes('pending') || (order?.paymentInfo?.status || '').toLowerCase() === 'unpaid'
                              ? 'text-red-600'
                              : (order?.paymentInfo?.status || '').toLowerCase() === 'awaiting_cod'
                              ? 'text-orange-600'
                              : 'text-gray-600'
                          } capitalize text-xs sm:text-sm font-medium`}
                        >
                          {(order?.paymentInfo?.status || '').toLowerCase() === 'awaiting_cod'
                            ? 'On Delivery'
                            : (order?.paymentInfo?.status || '').toLowerCase() || 'status'}
                        </span>
                      </span>
                    )}
                    {order?.isStorePickup && (
                      <Badge variant="outline" className="bg-purple-600 capitalize px-3 py-1 rounded-full text-white border-white/10 text-xs">Store Pickup</Badge>
                    )}
                    {orderData?.order?.orderStatus?.hasReturn && (
                      <Badge variant="outline" className="bg-orange-600 capitalize px-3 py-1 rounded-full text-white border-white/10 text-xs">Return Requested</Badge>
                    )}
                  </div>
                </div>
                {/* Message Customer button at top right */}
                {!order?.isStale && (
                  <div className="mt-2 sm:mt-0 sm:ml-auto flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-4 bg-[#0BB248] text-white flex items-center font-inter justify-center gap-2 border-green-700/20 hover:bg-green-800 py-1 rounded-lg"
                      onClick={onMessage}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message Customer
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-gray-700 py-2">
                <div className="flex items-center gap-2  rounded-lg px-3 py-2   border-gray-100">
                  <span className="flex items-center justify-center bg-emerald-100 rounded-full p-1">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                  </span>
                  <span className="text-xs sm:text-sm font-medium">
                    <span className="text-gray-500">Ordered:</span>{" "}
                    <span className="text-gray-800">
                      {order?.createdAt
                        ? new Date(order.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                      {" "}
                      <span className="text-gray-400">at</span>{" "}
                      {order?.createdAt
                        ? new Date(order.createdAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </span>
                </div>
                {order?.paymentInfo?.paidAt && (
                  <div className="flex items-center gap-2  px-3 py-2   border-gray-100">
                    <span className="flex items-center justify-center bg-blue-100 rounded-full p-1">
                      <Mail className="h-4 w-4 text-blue-500" />
                    </span>
                    <span className="text-xs sm:text-sm font-medium">
                      <span className="text-gray-500">Paid:</span>{" "}
                      <span className="text-gray-800">
                        {new Date(order.paymentInfo.paidAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {" "}
                        <span className="text-gray-400">at</span>{" "}
                        {new Date(order.paymentInfo.paidAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {order?.isStale && (
              <div className="bg-orange-100 border border-orange-200 rounded-md p-3 text-orange-800 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Order Abandoned</p>
                    <p>This order was abandoned by the buyer who did not complete payment. No action is required from you.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              {/* Remove Message Customer button from here */}
              {!order?.isStale && order?.isStorePickup && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-purple-600 text-white flex items-center font-inter justify-center gap-2 border-gray-200 hover:bg-purple-700"
                  onClick={onOpenProof}
                  disabled={confirmDeliveryLoading || order?.storePickupStatus?.state === 'approved' || order?.storePickupStatus?.state === 'confirmed_by_seller'}
                >
                  {confirmDeliveryLoading ? (
                    <> <Clock className="w-4 h-4" /> Confirming... </>
                  ) : order?.storePickupStatus?.state === 'approved' ? (
                    <> <Check className="w-4 h-4" /> Pickup Approved </>
                  ) : order?.storePickupStatus?.state === 'confirmed_by_seller' ? (
                    <> <Clock className="w-4 h-4" /> Awaiting Approval </>
                  ) : (
                    <> <Check className="w-4 h-4" /> Confirm Pickup </>
                  )}
                </Button>
              )}
              {!order?.isStale && orderData?.order?.orderStatus?.hasReturn && (
                <Button onClick={() => navigate(`/dashboard/return/${orderData.order.orderStatus.returnRequestId}`)} size="lg" className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 capitalize transition-all duration-300 text-white text-sm h-10">
                  <ArrowUpRight className="mr-2 h-3 w-3" />
                  View Return Request
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-emerald-100">
            <Badge className={`${order?.isStale ? getStatusColor('abandoned') : getStatusColor(order?.paymentInfo?.status)} px-3 py-1.5 rounded-full text-xs`}>
              <CreditCard className="h-3 w-3 mr-1" />
              Payment: {order?.isStale ? 'abandoned' : order?.paymentInfo?.status === 'awaiting_cod' ? 'On Delivery' : order?.paymentInfo?.status}
            </Badge>
            <Badge className={`${order?.isStale ? getStatusColor('abandoned') : getStatusColor(shipping?.tracking?.status)} px-3 py-1.5 rounded-full text-xs`}>
              <Truck className="h-3 w-3 mr-1" />
              Shipping: {order?.isStale ? 'abandoned' : shipping?.tracking?.status?.replace(/_/g, ' ')}
            </Badge>
            {order?.isStorePickup && (
              <Badge className={`${
                order?.storePickupStatus?.state === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : order?.storePickupStatus?.state === 'confirmed_by_seller'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-yellow-100 text-yellow-700'
              } px-3 py-1.5 rounded-full text-xs`}>
                <MapPin className="h-3 w-3 mr-1" />
                Pickup Status: {order?.storePickupStatus?.state === 'confirmed_by_seller' ? 'Waiting Approval' : order?.storePickupStatus?.state?.replace(/_/g, ' ')}
              </Badge>
            )}
            {order?.dispute?.status !== 'none' && (
              <Badge variant="destructive" className="text-xs px-3 py-1.5 rounded-full capitalize transition-all duration-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                Dispute: {order?.dispute?.status || 'none'}
              </Badge>
            )}
            <Badge className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1.5 rounded-full">
              Payments processed after 24hrs
            </Badge>
          </div>
        </div>
      </div>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-50">
              <User className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Buyer</p>
              <p className="text-sm font-medium flex items-center gap-1">
                {orderData?.buyer?.firstName} {orderData?.buyer?.lastName}
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              </p>
              <p className="text-xs text-gray-500">{maskEmail(orderData?.buyer?.email)}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-50">
              <Building2 className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Seller</p>
              <p className="text-sm font-medium">{orderData?.seller?.businessName}</p>
              <p className="text-xs text-gray-500">{maskEmail(orderData?.seller?.email)}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-50">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-sm font-semibold">₦{order?.totalAmount?.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Payout ₦{order?.paymentBreakdown?.sellerPayout?.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
