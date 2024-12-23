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


// Sample data - you can replace this with your actual data
const orders = [
    {
        id: "#1827GH",
        product: "Nike Sportswear",
        orderDate: "Jan 2, 12:23 pm",
        price: "N 176.00",
        payment: "Transfer",
        status: "Processing"
    },
    {
        id: "#1897GH",
        product: "Nike Sportswear",
        orderDate: "Jan 2, 12:23 pm",
        price: "N 176.00",
        payment: "Transfer",
        status: "Completed"
    },
    {
        id: "#1847GH",
        product: "Nike Sportswear",
        orderDate: "Jan 2, 12:23 pm",
        price: "N 176.00",
        payment: "Transfer",
        status: "Completed"
    },
    {
        id: "#1857GH",
        product: "Nike Sportswear",
        orderDate: "Jan 2, 12:23 pm",
        price: "N 176.00",
        payment: "Transfer",
        status: "Completed"
    },
    {
        id: "#1867GH",
        product: "Nike Sportswear",
        orderDate: "Jan 2, 12:23 pm",
        price: "N 176.00",
        payment: "Transfer",
        status: "Completed"
    },
    {
        id: "#1877GH",
        product: "Nike Sportswear",
        orderDate: "Jan 2, 12:23 pm",
        price: "N 176.00",
        payment: "Transfer",
        status: "Completed"
    },
    {
        id: "#1887GH",
        product: "Nike Sportswear",
        orderDate: "Jan 2, 12:23 pm",
        price: "N 176.00",
        payment: "Transfer",
        status: "Completed"
    },
    // Add more orders as needed
]

const OrdersTable = () => {
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
                            <TableHead className="hidden md:table-cell text-sm lg:text-base font-cabin font-normal text-[#000000]">Product</TableHead>
                            <TableHead className="text-sm lg:text-base font-cabin font-normal text-[#000000]">Order Date</TableHead>
                            <TableHead className="hidden md:table-cell text-sm lg:text-base font-cabin font-normal text-[#000000]">Price</TableHead>
                            <TableHead className="hidden md:table-cell text-sm lg:text-base font-cabin font-normal text-[#000000]">Payment</TableHead>
                            <TableHead className="text-sm lg:text-base font-cabin font-normal text-[#000000]">Status</TableHead>
                            <TableHead className="text-sm lg:text-base font-cabin font-normal text-[#000000]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="text-sm lg:text-base font-cabin font-normal text-[#00000090]">{order.id}</TableCell>
                                <TableCell className="hidden md:table-cell text-sm lg:text-base font-cabin font-normal text-[#00000090]">{order.product}</TableCell>
                                <TableCell className="text-sm lg:text-base font-cabin font-normal text-[#00000090]">{order.orderDate}</TableCell>
                                <TableCell className="hidden md:table-cell text-sm lg:text-base font-cabin font-normal text-[#00000090]">{order.price}</TableCell>
                                <TableCell className="hidden md:table-cell text-sm lg:text-base font-cabin font-normal text-[#00000090]">{order.payment}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-sm  ${order.status === "Completed"
                                        ? "bg-green-100 text-green-600"
                                        : "bg-yellow-100 text-yellow-600"
                                        }`}>
                                        {order.status}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Button className="text-sm text-[#05031F90] font-cabin border border-[#05031F90] hover:border-[#05031F] transition-all duration-500 ease-in-out rounded-2xl" variant="outline" size="sm">
                                        View Order
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default OrdersTable
