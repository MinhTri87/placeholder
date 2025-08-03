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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Database,
  Plus,
  Search,
  BookOpen,
  Link,
  FileText,
  Lightbulb,
  Heart,
  Star,
  Tag,
  Calendar,
  Lock,
  Share,
  Edit,
  Trash2,
  MoreHorizontal,
  Archive,
  Eye,
  EyeOff,
  Download,
  Upload,
  Filter,
  Globe,
  Bookmark,
  Camera,
  Music,
  Video,
  File,
  Code,
  Coffee,
  Brain,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { getAuthHeaders } from "@/lib/utils";

interface PersonalItem {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'bookmark' | 'idea' | 'document' | 'contact' | 'memory' | 'goal' | 'quote';
  category: string;
  tags: string[];
  isPrivate: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    url?: string;
    author?: string;
    date?: string;
    location?: string;
    mood?: string;
    priority?: 'low' | 'medium' | 'high';
  };
}

export default function PersonalVault() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [items, setItems] = useState<PersonalItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PersonalItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonalItem | null>(null);
  const [newItem, setNewItem] = useState({
    title: "",
    content: "",
    type: "note" as PersonalItem['type'],
    category: "",
    tags: "",
    isPrivate: true,
    metadata: {},
  });

  const fetchVaultItems = async () => {
    try {
      const response = await fetch("/api/vault", {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setItems(data.data);
          // Extract unique categories
          const uniqueCategories = [...new Set(data.data.map(item => item.category))];
          setCategories(uniqueCategories);
        }
      } else {
        console.error("Failed to fetch vault items:", response.status);
        // Load demo data if API fails
        loadDemoData();
      }
    } catch (error) {
      console.error("Error fetching vault items:", error);
      // Load demo data if API fails
      loadDemoData();
    }
  };

  const loadDemoData = () => {
    const demoData: PersonalItem[] = [
      {
        id: "demo-1",
        title: "Welcome to your Personal Vault! 🎉",
        content: "This is your private digital space where you can store:\n\n• 📝 Notes and thoughts\n• 🔖 Bookmarks and links\n• 💡 Ideas and inspiration\n• 🎯 Goals and plans\n• 📸 Memories and experiences\n• 💬 Quotes and wisdom\n• 👤 Contacts and connections\n• 📄 Important documents\n\nStart adding your own items using the 'Add Item' button above!",
        type: "note",
        category: "Welcome",
        tags: ["welcome", "guide", "getting-started"],
        isPrivate: true,
        isFavorite: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "demo-2",
        title: "Building Better Habits",
        content: "💡 Idea: Create a habit tracking system that focuses on:\n\n1. Small, consistent actions\n2. Visual progress tracking\n3. Positive reinforcement\n4. Community support\n5. Data-driven insights\n\nCould use React + Node.js + PostgreSQL for the tech stack.",
        type: "idea",
        category: "Projects",
        tags: ["habits", "productivity", "app-idea"],
        isPrivate: false,
        isFavorite: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        metadata: { priority: "high" }
      }
    ];
    setItems(demoData);
    setCategories(["Welcome", "Projects"]);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchVaultItems();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, selectedType, selectedCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your vault...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const getTypeIcon = (type: PersonalItem['type']) => {
    const icons = {
      note: FileText,
      bookmark: Bookmark,
      idea: Lightbulb,
      document: File,
      contact: Globe,
      memory: Camera,
      goal: Star,
      quote: BookOpen,
    };
    const Icon = icons[type];
    return <Icon className="h-4 w-4" />;
  };

  const getTypeColor = (type: PersonalItem['type']) => {
    const colors = {
      note: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      bookmark: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      idea: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      document: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      contact: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      memory: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      goal: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      quote: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    };
    return colors[type];
  };

  const handleCreateItem = async () => {
    try {
      const itemData = {
        title: newItem.title,
        content: newItem.content,
        type: newItem.type,
        category: newItem.category || "Uncategorized",
        tags: newItem.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        isPrivate: newItem.isPrivate,
        metadata: newItem.metadata,
      };

      const response = await fetch("/api/vault", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh the vault items
          await fetchVaultItems();

          setNewItem({
            title: "",
            content: "",
            type: "note",
            category: "",
            tags: "",
            isPrivate: true,
            metadata: {},
          });
          setIsCreateDialogOpen(false);
        }
      } else {
        console.error("Failed to create vault item:", response.status);
        alert("Failed to create item. Please try again.");
      }
    } catch (error) {
      console.error("Error creating vault item:", error);
      alert("Failed to create item. Please try again.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/vault/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setItems(prev => prev.filter(item => item.id !== id));
        }
      } else {
        console.error("Failed to delete vault item:", response.status);
        alert("Failed to delete item. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting vault item:", error);
      alert("Failed to delete item. Please try again.");
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const response = await fetch(`/api/vault/${id}/favorite`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setItems(prev => prev.map(item =>
            item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
          ));
        }
      } else {
        console.error("Failed to toggle favorite:", response.status);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    total: items.length,
    notes: items.filter(i => i.type === 'note').length,
    bookmarks: items.filter(i => i.type === 'bookmark').length,
    ideas: items.filter(i => i.type === 'idea').length,
    favorites: items.filter(i => i.isFavorite).length,
    private: items.filter(i => i.isPrivate).length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Database className="h-8 w-8 mr-3" />
              Personal Vault
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Your private digital space to store thoughts, ideas, and important information
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Store your thoughts, ideas, bookmarks, and more
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newItem.title}
                      onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter title..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={newItem.type} onValueChange={(value: PersonalItem['type']) => setNewItem(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">📝 Note</SelectItem>
                        <SelectItem value="bookmark">🔖 Bookmark</SelectItem>
                        <SelectItem value="idea">💡 Idea</SelectItem>
                        <SelectItem value="document">📄 Document</SelectItem>
                        <SelectItem value="contact">👤 Contact</SelectItem>
                        <SelectItem value="memory">📸 Memory</SelectItem>
                        <SelectItem value="goal">🎯 Goal</SelectItem>
                        <SelectItem value="quote">💬 Quote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={newItem.category}
                      onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Personal, Work, Learning..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={newItem.tags}
                      onChange={(e) => setNewItem(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="tag1, tag2, tag3..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newItem.content}
                    onChange={(e) => setNewItem(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your content here..."
                    rows={6}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newItem.isPrivate}
                    onChange={(e) => setNewItem(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isPrivate" className="flex items-center">
                    <Lock className="h-4 w-4 mr-1" />
                    Keep private
                  </Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateItem} disabled={!newItem.title || !newItem.content}>
                    Add Item
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="flex items-center p-4">
              <Database className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-4">
              <FileText className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.notes}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-4">
              <Lightbulb className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ideas</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.ideas}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-4">
              <Bookmark className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Links</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.bookmarks}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-4">
              <Heart className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Favorites</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.favorites}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-4">
              <Lock className="h-6 w-6 text-gray-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Private</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.private}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search your vault..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                  <SelectItem value="bookmark">Bookmarks</SelectItem>
                  <SelectItem value="idea">Ideas</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="contact">Contacts</SelectItem>
                  <SelectItem value="memory">Memories</SelectItem>
                  <SelectItem value="goal">Goals</SelectItem>
                  <SelectItem value="quote">Quotes</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getTypeColor(item.type)}>
                      {getTypeIcon(item.type)}
                      <span className="ml-1 capitalize">{item.type}</span>
                    </Badge>
                    {item.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    {item.isPrivate && <Lock className="h-4 w-4 text-gray-500" />}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleFavorite(item.id)}>
                        <Star className="mr-2 h-4 w-4" />
                        {item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                <div className="flex items-center text-xs text-gray-500 space-x-2">
                  <span>{item.category}</span>
                  <span>•</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                  {item.content}
                </p>
                
                {item.metadata?.url && (
                  <div className="mb-3">
                    <a 
                      href={item.metadata.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs flex items-center"
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      Visit Link
                    </a>
                  </div>
                )}

                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm || selectedType !== "all" || selectedCategory !== "all" 
                  ? "No items match your filters"
                  : "Your vault is empty"
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || selectedType !== "all" || selectedCategory !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start building your personal knowledge base by adding your first item"
                }
              </p>
              {(!searchTerm && selectedType === "all" && selectedCategory === "all") && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Item
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
