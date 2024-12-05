import { useState } from "react";
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
import { Eye, Ban, Play, AlertCircle } from "lucide-react";

interface Stream {
  id: string;
  streamer: string;
  title: string;
  isLive: boolean;
  viewers: number;
  interactions: number;
  lastLive: string;
  totalStreams: number;
  category: string;
  status: 'active' | 'suspended' | 'warning';
}

const sampleStreams: Stream[] = [
  {
    id: "STR001",
    streamer: "TechMaster",
    title: "Live Product Reviews",
    isLive: true,
    viewers: 1250,
    interactions: 3420,
    lastLive: "2024-03-20T15:30:00",
    totalStreams: 156,
    category: "Technology",
    status: 'active'
  },
  {
    id: "STR002",
    streamer: "Fashionista",
    title: "Spring Collection Preview",
    isLive: false,
    viewers: 0,
    interactions: 8900,
    lastLive: "2024-03-19T18:45:00",
    totalStreams: 89,
    category: "Fashion",
    status: 'warning'
  },
  {
    id: "STR003",
    streamer: "CookingPro",
    title: "Gourmet Cooking Tips",
    isLive: true,
    viewers: 875,
    interactions: 2100,
    lastLive: "2024-03-20T14:20:00",
    totalStreams: 234,
    category: "Cooking",
    status: 'active'
  },
  {
    id: "STR004",
    streamer: "GameMaster",
    title: "Gaming Products Review",
    isLive: false,
    viewers: 0,
    interactions: 1500,
    lastLive: "2024-03-18T20:15:00",
    totalStreams: 67,
    category: "Gaming",
    status: 'suspended'
  }
];

function Streams() {
  const [streams] = useState<Stream[]>(sampleStreams);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Live Streams</h2>
        <p className="text-muted-foreground">Monitor and manage platform streams</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Active Streams</span>
            <span className="text-2xl font-bold mt-2">
              {streams.filter(s => s.isLive).length}
            </span>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Total Viewers</span>
            <span className="text-2xl font-bold mt-2">
              {streams.reduce((acc, curr) => acc + curr.viewers, 0)}
            </span>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Total Interactions</span>
            <span className="text-2xl font-bold mt-2">
              {streams.reduce((acc, curr) => acc + curr.interactions, 0)}
            </span>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Total Streamers</span>
            <span className="text-2xl font-bold mt-2">{streams.length}</span>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seller</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Current Viewers</TableHead>
              <TableHead>Total Interactions</TableHead>
              <TableHead>Last Live</TableHead>
              <TableHead>Total Streams</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {streams.map((stream) => (
              <TableRow key={stream.id}>
                <TableCell className="font-medium">{stream.streamer}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    stream.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : stream.status === 'warning'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>{stream.category}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {stream.isLive && <Play className="h-3 w-3 text-green-500 mr-2" />}
                    {stream.viewers}
                  </div>
                </TableCell>
                <TableCell>{stream.interactions}</TableCell>
                <TableCell>{formatDate(stream.lastLive)}</TableCell>
                <TableCell>{stream.totalStreams}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-yellow-500">
                      <AlertCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500">
                      <Ban className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default Streams;
