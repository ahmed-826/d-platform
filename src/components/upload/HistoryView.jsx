import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Plus, Eye } from "lucide-react";
import { useState } from "react";

// Sample history data
const sampleHistory = [
  {
    id: 1,
    name: "Project X Data",
    user: "John Doe",
    count: 12,
    type: "File",
    date: "2023-10-15",
  },
  {
    id: 2,
    name: "Market Research",
    user: "Jane Smith",
    count: 8,
    type: "Form",
    date: "2023-10-13",
  },
  {
    id: 3,
    name: "Q3 Reports",
    user: "Mike Johnson",
    count: 5,
    type: "File",
    date: "2023-10-10",
  },
  {
    id: 4,
    name: "Customer Feedback",
    user: "Sarah Wilson",
    count: 15,
    type: "Form",
    date: "2023-10-05",
  },
  {
    id: 5,
    name: "Product Analysis",
    user: "Alex Brown",
    count: 7,
    type: "File",
    date: "2023-10-01",
  },
];

const HistoryView = ({ onUpload, onConsult }) => {
  const [history] = useState(sampleHistory);

  const handleDownload = (id) => {
    console.log(`Downloading history item ${id}`);
    // Actual download logic would go here
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Upload History</h2>
        <Button onClick={onUpload}>
          <Plus className="mr-2 h-4 w-4" />
          New Upload
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Upload</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Nombre de fiches</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-4 text-muted-foreground"
                >
                  No upload history found
                </TableCell>
              </TableRow>
            ) : (
              history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.user}</TableCell>
                  <TableCell>{item.count}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(item.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onConsult(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default HistoryView;
