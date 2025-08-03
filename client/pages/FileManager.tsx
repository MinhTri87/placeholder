import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FolderOpen,
  File,
  Upload,
  Download,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Share,
  Eye,
  Copy,
  Move,
  Archive,
  Star,
  Clock,
  Users,
  HardDrive,
  Filter,
  Grid,
  List,
  ArrowLeft,
  Home,
  Folder,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  RefreshCw,
  Settings,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { getAuthHeaders } from "@/lib/utils";

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  path: string;
  parentPath: string;
  mimeType?: string;
  extension?: string;
  createdAt: string;
  modifiedAt: string;
  createdBy: string;
  modifiedBy: string;
  permissions: string[];
  isShared: boolean;
  isStarred: boolean;
  description?: string;
  tags: string[];
  version: number;
  checksum?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export default function FileManager() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState("/");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<'all' | 'files' | 'folders'>('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [sharePermissions, setSharePermissions] = useState({
    users: [] as string[],
    groups: [] as string[],
    isPublic: false,
    canEdit: false,
    canDownload: true,
    expiresAt: "",
  });
  const [serverStatus, setServerStatus] = useState({
    connected: false,
    totalSpace: 0,
    usedSpace: 0,
    serverPath: "",
  });

  // Mock data for development
  const generateMockFiles = (): FileItem[] => [
    {
      id: "1",
      name: "Documents",
      type: "folder",
      size: 0,
      path: "/Documents",
      parentPath: "/",
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      createdBy: user?.id || "1",
      modifiedBy: user?.id || "1",
      permissions: ["read", "write"],
      isShared: false,
      isStarred: false,
      tags: [],
      version: 1,
    },
    {
      id: "2",
      name: "Projects",
      type: "folder",
      size: 0,
      path: "/Projects",
      parentPath: "/",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      modifiedAt: new Date(Date.now() - 86400000).toISOString(),
      createdBy: user?.id || "1",
      modifiedBy: user?.id || "1",
      permissions: ["read", "write"],
      isShared: true,
      isStarred: true,
      tags: ["work"],
      version: 1,
    },
    {
      id: "3",
      name: "Team Meeting Notes.docx",
      type: "file",
      size: 245760,
      path: "/Documents/Team Meeting Notes.docx",
      parentPath: "/Documents",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extension: ".docx",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      modifiedAt: new Date(Date.now() - 86400000).toISOString(),
      createdBy: user?.id || "1",
      modifiedBy: user?.id || "1",
      permissions: ["read", "write"],
      isShared: true,
      isStarred: false,
      description: "Weekly team meeting notes and action items",
      tags: ["meetings", "notes"],
      version: 3,
    },
    {
      id: "4",
      name: "Budget_2024.xlsx",
      type: "file",
      size: 512000,
      path: "/Documents/Budget_2024.xlsx",
      parentPath: "/Documents",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      extension: ".xlsx",
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      modifiedAt: new Date(Date.now() - 172800000).toISOString(),
      createdBy: user?.id || "1",
      modifiedBy: user?.id || "1",
      permissions: ["read"],
      isShared: false,
      isStarred: true,
      description: "Annual budget planning spreadsheet",
      tags: ["budget", "finance", "2024"],
      version: 2,
    },
    {
      id: "5",
      name: "App_Screenshots",
      type: "folder",
      size: 0,
      path: "/Projects/App_Screenshots",
      parentPath: "/Projects",
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      modifiedAt: new Date(Date.now() - 259200000).toISOString(),
      createdBy: user?.id || "1",
      modifiedBy: user?.id || "1",
      permissions: ["read", "write"],
      isShared: true,
      isStarred: false,
      tags: ["screenshots", "app"],
      version: 1,
    },
  ];

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchFiles();
      checkServerStatus();
    }
  }, [isAuthenticated, user, currentPath]);

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.files) {
          setFiles(data.files);
        } else {
          // Fallback to mock data
          const mockFiles = generateMockFiles();
          const currentFolderFiles = mockFiles.filter(f => f.parentPath === currentPath);
          setFiles(currentFolderFiles);
        }
      } else {
        // Fallback to mock data
        const mockFiles = generateMockFiles();
        const currentFolderFiles = mockFiles.filter(f => f.parentPath === currentPath);
        setFiles(currentFolderFiles);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      // Fallback to mock data
      const mockFiles = generateMockFiles();
      const currentFolderFiles = mockFiles.filter(f => f.parentPath === currentPath);
      setFiles(currentFolderFiles);
    }
  };

  const checkServerStatus = async () => {
    try {
      const response = await fetch("/api/files/status", {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setServerStatus(data);
        fetchFiles();
      } else {
        // Mock server status
        setServerStatus({
          connected: true,
          totalSpace: 1000000000000, // 1TB
          usedSpace: 250000000000,   // 250GB
          serverPath: "\\\\fileserver.domain.local\\shared",
        });
      }
    } catch (error) {
      console.error("Error checking server status:", error);
      setServerStatus({
        connected: false,
        totalSpace: 0,
        usedSpace: 0,
        serverPath: "Connection failed",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading file manager...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return <Folder className="h-5 w-5 text-blue-600" />;
    }

    const ext = file.extension?.toLowerCase();
    switch (ext) {
      case '.txt':
      case '.doc':
      case '.docx':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.gif':
      case '.bmp':
      case '.svg':
        return <FileImage className="h-5 w-5 text-green-600" />;
      case '.mp4':
      case '.avi':
      case '.mov':
      case '.wmv':
        return <FileVideo className="h-5 w-5 text-purple-600" />;
      case '.mp3':
      case '.wav':
      case '.flac':
        return <FileAudio className="h-5 w-5 text-orange-600" />;
      case '.js':
      case '.ts':
      case '.html':
      case '.css':
      case '.json':
      case '.xml':
        return <FileCode className="h-5 w-5 text-gray-600" />;
      case '.xls':
      case '.xlsx':
      case '.csv':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      default:
        return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFolderClick = (folder: FileItem) => {
    if (folder.type === 'folder') {
      setCurrentPath(folder.path);
    }
  };

  const handleBack = () => {
    if (currentPath !== "/") {
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/")) || "/";
      setCurrentPath(parentPath);
    }
  };
  
  //delete file function
  const handleDelete = async (fileId: string) => {
    if (!window.confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
      return;
    }
    setFiles(prev => prev.filter(file => file.id !== fileId));
    const token = localStorage.getItem("auth_token");
    try {
      if (token) {
        await fetch(`/api/files/${fileId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  //preview file function
  const handlePreview = async (file: FileItem) => {
  if (file.type === 'folder') {
    alert("Cannot preview folders");
    return;
  }

  const token = localStorage.getItem('auth_token');
  const fileId = btoa(file.path);

  try {
    const res = await fetch(`/api/files/preview/${fileId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Preview failed');
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  } catch (err) {
    alert('Preview error: ' + err.message);
  }
};


  const handleFileUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    const newUploads: UploadProgress[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadProgress(newUploads);
    setIsUploadDialogOpen(true);

    // Upload files one by one
    for (const upload of newUploads) {
      try {
        const formData = new FormData();
        newUploads.forEach((upload) => formData.append('files', upload.file));
        formData.append('tags', JSON.stringify(['project', 'Q3']));
        formData.append('isStarred', 'true'); // Optional flags
        formData.append('files', upload.file); // Note: 'files' matches the multer array name
        formData.append('path', currentPath);
        


        console.log(`Uploading ${upload.file.name} to ${currentPath}`);

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => prev.map(u =>
            u.file === upload.file && u.progress < 90
              ? { ...u, progress: u.progress + 10 }
              : u
          ));
        }, 200);

        // Create headers without Content-Type for file upload
        const token = localStorage.getItem("auth_token");
        const uploadHeaders: Record<string, string> = {};
        if (token) {
          uploadHeaders["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch("/api/files/upload", {
          method: "POST",
          headers: uploadHeaders, // Don't set Content-Type - let browser set it for FormData
          body: formData,
        });

        clearInterval(progressInterval);

        if (response.ok) {
          const data = await response.json();
          console.log('Upload response:', data);

          setUploadProgress(prev => prev.map(u =>
            u.file === upload.file ? { ...u, progress: 100, status: 'completed' } : u
          ));
        } else {
          const errorData = await response.json();
          console.error('Upload failed:', errorData);
          
          setUploadProgress(prev => prev.map(u =>
            u.file === upload.file ? {
              ...u,
              status: 'error',
              error: errorData.message || 'Upload failed'
            } : u
          ));
        }
      } catch (error) {
        alert('Failed to upload file: ' + upload.file.name);
        console.error('Upload error:', error);
        setUploadProgress(prev => prev.map(u =>
          u.file === upload.file ? {
            ...u,
            status: 'error',
            error: 'Network error'
          } : u
        ));
      }
    }
    
    // Refresh file list after all uploads
    setTimeout(() => {
      fetchFiles();
      setUploadProgress([]);
      alert(`Successfully uploaded`);
    }, 2000);
  };

  // Function to handle file download
  const handleDownload = async (file: FileItem) => {
  try {
    const token = localStorage.getItem("auth_token");
    const fileId = btoa(file.path);
    const folderId = btoa(file.parentPath);

    const url = file.type === "folder"
      ? `/api/files/download/folder/${folderId}/${file.parentPath}`
      : `/api/files/download/${fileId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Download failed");
    }

    const blob = await response.blob();
    const urlObject = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = urlObject;
    link.download = `${file.name}.zip`; // if it's a folder, assume zip
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(urlObject);
  } catch (err) {
    console.error("Download error:", err);
    alert("Failed to download file/folder");
  }
};



  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch("/api/files/folder", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newFolderName,
          path: currentPath,
        }),
      });

      if (response.ok) {
        await fetchFiles();
        setNewFolderName("");
        setIsCreateFolderOpen(false);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const filteredFiles = files
    .filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || 
        (filterType === 'files' && file.type === 'file') ||
        (filterType === 'folders' && file.type === 'folder');
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const breadcrumbs = currentPath.split('/').filter(Boolean);
  const storageUsage = serverStatus.totalSpace > 0 ? (serverStatus.usedSpace / serverStatus.totalSpace) * 100 : 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <HardDrive className="h-8 w-8 mr-3" />
              File Manager
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage group files on remote server
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>

        {/* Server Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${serverStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm font-medium">
                    {serverStatus.connected ? 'Connected' : 'Disconnected'}
                  </p>
                  <p className="text-xs text-gray-500">{serverStatus.serverPath}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium">Storage</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(serverStatus.usedSpace)} / {formatFileSize(serverStatus.totalSpace)}
                  </p>
                </div>
                <div className="w-32">
                  <Progress value={storageUsage} className="h-2" />
                </div>
                <Button variant="ghost" size="sm" onClick={checkServerStatus}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation and Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-4">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setCurrentPath("/")}>
                  <Home className="h-4 w-4" />
                </Button>
                {currentPath !== "/" && (
                  <Button variant="ghost" size="sm" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-500">Root</span>
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center space-x-1">
                      <span className="text-gray-400">/</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{crumb}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search files and folders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="files">Files Only</SelectItem>
                      <SelectItem value="folders">Folders Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="size">Size</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-r-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-l-none"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        <Card
          className={`transition-colors ${isDragOver ? 'border-primary bg-primary/5' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Files & Folders</span>
              <Badge variant="outline">{filteredFiles.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {viewMode === 'list' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Modified</TableHead>
                    <TableHead>Shared</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow
                      key={file.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => file.type === 'folder' && handleFolderClick(file)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getFileIcon(file)}
                          {file.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{file.name}</span>
                          {file.description && (
                            <span className="text-xs text-gray-500">{file.description}</span>
                          )}
                          {file.tags.length > 0 && (
                            <div className="flex space-x-1 mt-1">
                              {file.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {file.type === 'file' ? formatFileSize(file.size) : '—'}
                      </TableCell>
                      <TableCell>{formatDate(file.modifiedAt)}</TableCell>
                      <TableCell>
                        {file.isShared ? (
                          <Badge variant="default" className="text-xs">
                            <Share className="h-3 w-3 mr-1" />
                            Shared
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => handlePreview(file)}
                                disabled={file.type === 'folder'}>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </Button>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => handleDownload(file)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                                </Button>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  handleDelete(file.id);
                                }}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                              </Button>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredFiles.map((file) => (
                  <Card
                    key={file.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => file.type === 'folder' && handleFolderClick(file)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="flex justify-center mb-2">
                        {getFileIcon(file)}
                      </div>
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {file.type === 'file' ? formatFileSize(file.size) : 'Folder'}
                      </p>
                      {file.isStarred && (
                        <Star className="h-3 w-3 text-yellow-500 fill-current mx-auto mt-1" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredFiles.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No files found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm ? "Try adjusting your search criteria" : "This folder is empty"}
                </p>
                {!searchTerm && (
                  <div className="space-x-2">
                    <Button onClick={() => setIsUploadDialogOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateFolderOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Folder
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
              <DialogDescription>
                Upload files to {currentPath}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Supports all file types, max 100MB per file
                </p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                />
                <label htmlFor="file-upload">
                  <Button className="mt-4" asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
              </div>

              {uploadProgress.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Upload Progress</h4>
                  {uploadProgress.map((upload, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{upload.file.name}</span>
                        <span className="flex items-center space-x-1">
                          {upload.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {upload.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                          {upload.progress}%
                        </span>
                      </div>
                      <Progress value={upload.progress} className="h-2" />
                      {upload.error && (
                        <p className="text-xs text-red-600">{upload.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Folder Dialog */}
        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Create a new folder in {currentPath}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folderName">Folder Name</Label>
                <Input
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                  Create Folder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
