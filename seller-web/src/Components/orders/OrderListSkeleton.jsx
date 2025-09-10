import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";

const OrderListSkeleton = () => {
  return (
    <div className="relative">
      <div className="absolute top-4 right-4">
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="py-6">
        <div className="mb-8 hidden sm:block">
          <div className="border-b flex gap-6 pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-28 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        <div className="bg-[#F8FAF9] rounded-lg p-6 shadow-sm">
          <div className="flex flex-col xl:flex-row justify-between gap-4 xl:items-center mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex flex-wrap gap-4">
              <div className="h-10 w-[240px] bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-[240px] bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-[180px] bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-[180px] bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-none">
                  <TableHead className="w-[180px]"><div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div></TableHead>
                  <TableHead className="w-[180px]"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></TableHead>
                  <TableHead className="w-[200px]"><div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div></TableHead>
                  <TableHead className="w-[120px]"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></TableHead>
                  <TableHead className="w-[120px]"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></TableHead>
                  <TableHead className="w-[100px]"><div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div></TableHead>
                  <TableHead className="w-[150px]"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></TableHead>
                  <TableHead className="w-[200px]"><div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div></TableHead>
                  <TableHead className="w-[100px]"><div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5, 6].map((row) => (
                  <TableRow key={row} className="border-b hover:bg-gray-50">
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                    <TableCell><div className="h-8 w-28 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-8 w-28 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="h-7 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                        <div className="h-7 w-24 bg-gray-200 rounded-md animate-pulse ml-4"></div>
                      </div>
                    </TableCell>
                    <TableCell><div className="h-9 w-28 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-6">
            <div className="h-10 w-[140px] bg-gray-200 rounded animate-pulse"></div>
            <div className="flex items-center gap-4">
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex gap-4">
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderListSkeleton;


