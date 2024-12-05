import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { api } from "@/api/axios";

interface Buyer {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  country: string;
  phoneNumber: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isDisabled: boolean;
  createdAt: string;
  selectedCategories: Array<{
    name: string;
    subCategories: Array<{
      name: string;
      _id: string;
    }>;
  }>;
}

function Buyers() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      const response = await api.get("/api/admin/users");
      setBuyers(response.data);
    } catch (err) {
      setError("Failed to fetch buyers");
      console.error("Error fetching buyers:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDisabled = async (buyerId: string, currentState: boolean) => {
    setUpdatingId(buyerId);
    try {
      await api.put(`/api/admin/buyers/${buyerId}/${currentState ? 'enable' : 'disable'}`);
      setBuyers(buyers.map(buyer => 
        buyer._id === buyerId 
          ? {...buyer, isDisabled: !currentState}
          : buyer
      ));
    } catch (err) {
      console.error("Error updating disabled status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Buyers</h2>
        <p className="text-muted-foreground">Manage your platform buyers</p>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email Verified</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buyers.map((buyer) => (
              <TableRow key={buyer._id}>
                <TableCell className="font-mono text-xs">
                  {buyer._id}
                </TableCell>
                <TableCell className="font-medium">
                  {buyer.firstName} {buyer.lastName}
                </TableCell>
                <TableCell>{buyer.username}</TableCell>
                <TableCell>{buyer.email}</TableCell>
                <TableCell>{buyer.country}</TableCell>
                <TableCell>{buyer.phoneNumber}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    buyer.emailVerified 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {buyer.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant={buyer.isDisabled ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => toggleDisabled(buyer._id, !!buyer.isDisabled)}
                    disabled={updatingId === buyer._id}
                  >
                    {updatingId === buyer._id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    {buyer.isDisabled ? "Disabled" : "Active"}
                  </Button>
                </TableCell>
                <TableCell>{formatDate(buyer.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default Buyers;
