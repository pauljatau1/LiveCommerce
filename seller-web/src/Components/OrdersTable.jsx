import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table"
import { Button } from "./ui/button";
import { Icon } from "@iconify/react";
import PropTypes from 'prop-types';


const OrdersTable = ({ orders }) => {

    const getTotalProductQuantityOrdered = (orders) => {
        const productsInAnOrder = orders?.items.length;
        const totalQuantity = orders?.items.reduce((total, product) => total + product.quantity, 0);
        return { productsInAnOrder, totalQuantity };
    };


    




    return (
        <div className="w-full rounded-xl overflow-hidden border border-[#00000026] ">
            <div className="bg-[#F0F5F2] p-4 flex justify-between items-center">
                <h2 className="text-lg font-bold text-[#05031F] font-lexend">Latest Orders</h2>
                <div className="flex gap-4">
                    <Button variant="outline" className="hidden lg:flex text-sm lg:text-base font-cabin text-[#05031F] bg-[#0BB24817] transition-all duration-300 ease-in-out">
                        <Icon icon="solar:calendar-outline" width="20" height="20" color="#05031F" />
                        Filtering by date
                    </Button>
                    <Button className="text-sm font-cabin text-[#05031F] lg:text-base bg-[#0BB24817] rounded-[7.8px] py-3 px-4 transition-all duration-300 ease-in-out" variant="outline">
                        Channel
                    </Button>
                    <Button className="text-sm font-cabin text-white bg-[#05031F] lg:text-base rounded-[7.8px] py-3 px-4 transition-all duration-300 ease-in-out">
                        View All
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#F0F5F2] hover:bg-[#F0F5F2]">
                            <TableHead className="text-sm lg:text-base font-cabin font-normal text-[#000000]">Order ID</TableHead>
                            <TableHead className="table-cell text-sm lg:text-base font-cabin font-normal text-[#000000]">Quantity</TableHead>
                            <TableHead className="hidden md:table-cell text-sm lg:text-base font-cabin font-normal text-[#000000]">Order Date</TableHead>
                            <TableHead className="hidden md:table-cell text-sm lg:text-base font-cabin font-normal text-[#000000]">Price</TableHead>
                            <TableHead className="hidden md:table-cell text-sm lg:text-base font-cabin font-normal text-[#000000]">Payment</TableHead>
                            <TableHead className="text-sm lg:text-base font-cabin font-normal text-[#000000]">Status</TableHead>
                            <TableHead className="text-sm lg:text-base font-cabin font-normal text-[#000000]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {
                            orders.length > 0 ? (
                                orders?.slice(0, 10).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((order) => (
                                    <TableRow key={order?._id}>
                                        <TableCell className="text-sm lg:text-base font-cabin font-normal text-[#00000090]">
                                            <span className="block break-all max-w-[80px] md:max-w-[150px]" title={order?._id}>
                                                {order?._id}
                                            </span>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-sm lg:text-base font-cabin font-normal text-[#00000090]">{getTotalProductQuantityOrdered(order)?.totalQuantity}</TableCell>
                                        <TableCell className="text-sm lg:text-base font-cabin font-normal text-[#00000090]">{order?.createdAt.split('T')[0]}</TableCell>
                                        <TableCell className="hidden md:table-cell text-sm lg:text-base font-cabin font-normal text-[#00000090]">{order?.totalAmount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</TableCell>
                                        <TableCell className="hidden md:table-cell text-sm lg:text-base font-cabin font-normal text-[#00000090]">{order?.paymentInfo?.status}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-sm  ${order?.shipping?.tracking?.status === "completed"
                                                ? "bg-green-100 text-green-600"
                                                : "bg-yellow-100 text-yellow-600"
                                                }`}>
                                                {order?.shipping?.tracking?.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Button className="text-sm text-[#05031F90] font-cabin border border-[#05031F90] hover:border-[#05031F] transition-all duration-500 ease-in-out rounded-2xl" variant="outline" size="sm">
                                                View Order
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan="7" className="text-center text-sm lg:text-base font-cabin font-normal text-[#00000090]">No orders found</TableCell>
                                </TableRow>
                            )
                        }
                    </TableBody>
                </Table>
            </div>
        </div>
    )
};

OrdersTable.propTypes = {
    orders: PropTypes.array.isRequired,
};

export default OrdersTable
