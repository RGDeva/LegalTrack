import { useState } from "react";
import { Upload, FileText, Download, Trash2, Search, Filter, Calendar, User, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  category: 'court-filing' | 'correspondence' | 'evidence' | 'contract' | 'other';
}

interface DocumentsProps {
  caseId: string;
}

const Documents = ({ caseId }: DocumentsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // Mock documents data - in a real app, this would come from database
  const [documents] = useState<Document[]>([
    {
      id: '1',
      name: 'Initial Complaint.pdf',
      type: 'PDF',
      size: '2.4 MB',
      uploadedBy: 'John Doe',
      uploadedAt: '2024-01-15',
      category: 'court-filing'
    },
    {
      id: '2',
      name: 'Client Agreement.docx',
      type: 'DOCX',
      size: '156 KB',
      uploadedBy: 'Jane Smith',
      uploadedAt: '2024-01-10',
      category: 'contract'
    },
    {
      id: '3',
      name: 'Evidence_Photos.zip',
      type: 'ZIP',
      size: '15.3 MB',
      uploadedBy: 'Mike Johnson',
      uploadedAt: '2024-01-20',
      category: 'evidence'
    },
    {
      id: '4',
      name: 'Motion to Dismiss.pdf',
      type: 'PDF',
      size: '1.8 MB',
      uploadedBy: 'John Doe',
      uploadedAt: '2024-02-01',
      category: 'court-filing'
    },
    {
      id: '5',
      name: 'Email Correspondence.eml',
      type: 'EML',
      size: '234 KB',
      uploadedBy: 'Jane Smith',
      uploadedAt: '2024-01-25',
      category: 'correspondence'
    }
  ]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: Document['category']) => {
    const variants = {
      'court-filing': "bg-info text-info-foreground",
      'correspondence': "bg-warning text-warning-foreground",
      'evidence': "bg-success text-success-foreground",
      'contract': "bg-primary text-primary-foreground",
      'other': "bg-muted text-muted-foreground"
    };
    const labels = {
      'court-filing': 'Court Filing',
      'correspondence': 'Correspondence',
      'evidence': 'Evidence',
      'contract': 'Contract',
      'other': 'Other'
    };
    return <Badge className={variants[category]}>{labels[category]}</Badge>;
  };

  const getFileIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-destructive" />;
      case 'docx':
      case 'doc':
        return <FileText className="h-4 w-4 text-info" />;
      case 'zip':
      case 'rar':
        return <File className="h-4 w-4 text-warning" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleUpload = () => {
    toast({
      title: "Upload Document",
      description: "Document upload functionality would be implemented here",
    });
  };

  const handleDownload = (docName: string) => {
    toast({
      title: "Downloading",
      description: `Downloading ${docName}`,
    });
  };

  const handleDelete = (docName: string) => {
    toast({
      title: "Document Deleted",
      description: `${docName} has been deleted`,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Case Documents</CardTitle>
              <CardDescription>
                Manage all documents related to this case
              </CardDescription>
            </div>
            <Button onClick={handleUpload} variant="gradient">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="court-filing">Court Filing</SelectItem>
                <SelectItem value="correspondence">Correspondence</SelectItem>
                <SelectItem value="evidence">Evidence</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documents Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(doc.type)}
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(doc.category)}</TableCell>
                      <TableCell className="text-muted-foreground">{doc.size}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{doc.uploadedBy}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{doc.uploadedAt}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Document Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDownload(doc.name)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(doc.name)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No documents found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold">{documents.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Total Size</p>
              <p className="text-2xl font-bold">19.8 MB</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Court Filings</p>
              <p className="text-2xl font-bold">
                {documents.filter(d => d.category === 'court-filing').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Evidence Files</p>
              <p className="text-2xl font-bold">
                {documents.filter(d => d.category === 'evidence').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;