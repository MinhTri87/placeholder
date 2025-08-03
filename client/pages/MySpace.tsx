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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  FolderOpen,
  Settings,
  Edit3,
  Star,
  Trophy,
  Target,
  Zap,
  Activity,
  BookOpen,
  Coffee,
  Heart,
} from "lucide-react";
import { Navigate, Link } from "react-router-dom";
import { getAuthHeaders } from "@/lib/utils";
import { profile } from "console";
import e from "cors";

export default function MySpace() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    tasksTotal: 0,
    projectsActive: 0,
    messagesUnread: 0,
  });
  const [activityData, setActivityData] = useState([]);
  const [profileEdit, setProfileEdit] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    favoriteQuote: "",
    username: "",
    role: "",
    isActive: true,
    email: "",
  });
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const fetchMyTasks = async () => {
    try {
      const response = await fetch("/api/tasks", {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const myTasks = data.data.filter(task => task.assignedTo === user.id);
          setTasks(myTasks);
          
          const completed = myTasks.filter(t => t.status === "completed").length;
          const pending = myTasks.filter(t => t.status === "pending").length;
          const inProgress = myTasks.filter(t => t.status === "in-progress").length;
          setStats(prev => ({
            ...prev,
            tasksCompleted: completed,
            pendingTasks: pending,
            inProgressTasks: inProgress,
            tasksTotal: myTasks.length,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchMyProjects = async () => {
    try {
      const response = await fetch("/api/projects", {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setProjects(data.data);
          const activeProjects = data.data.filter(p => p.status === "active").length;
          setStats(prev => ({
            ...prev,
            projectsActive: activeProjects,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch("/api/stats", {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Generate activity chart data
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
              day: date.toLocaleDateString('en', { weekday: 'short' }),
              tasks: Math.floor(Math.random() * 8) + 1,
              messages: Math.floor(Math.random() * 15) + 2,
            };
          }).reverse();
          setActivityData(last7Days);
        }
      }
    } catch (error) {
      console.error("Error fetching activity:", error);
      // Fallback data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          day: date.toLocaleDateString('en', { weekday: 'short' }),
          tasks: Math.floor(Math.random() * 8) + 1,
          messages: Math.floor(Math.random() * 15) + 2,
        };
      }).reverse();
      setActivityData(last7Days);
    }
    console.log("user data:", user);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMyTasks();
      fetchMyProjects();
      fetchRecentActivity();
      
      // Initialize profile edit form
      setProfileEdit({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
        role: user.role || "",
        isActive: user.isActive || true,
        favoriteQuote: user.favoriteQuote || "",
        email: user.email || "", // Email cannot be changed
        username: user.username || "",
      });
    }
  }, [isAuthenticated, user]);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!profileEdit) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: profileEdit.firstName,
          lastName: profileEdit.lastName,
          email: profileEdit.email, // Email cannot be changed
          username: profileEdit.username,
          role: profileEdit.role,
          isActive: profileEdit.isActive,
          bio: profileEdit.bio,
          favoriteQuote: profileEdit.favoriteQuote,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await setIsEditProfileOpen(false);
        await getGreeting();
      } else {
        alert(data.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Update user error:", error);
      alert("Failed to update user");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your space...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${user.username}`;
    if (hour < 17) return `Good afternoon, ${user.username}`;
    return `Good evening, ${user.username}`;
  };

  const completionRate = stats.tasksTotal > 0 ? (stats.tasksCompleted / stats.tasksTotal) * 100 : 0;
  
  const recentTasks = tasks
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  const upcomingTasks = tasks
    .filter(task => task.status !== "completed" && task.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);

  const taskStatusData = [
    { name: "Completed", value: tasks.filter(t => t.status === "completed").length, color: "#10b981" },
    { name: "In Progress", value: tasks.filter(t => t.status === "in-progress").length, color: "#3b82f6" },
    { name: "Pending", value: tasks.filter(t => t.status === "pending").length, color: "#f59e0b" },
  ];

  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString();
  };

  const achievements = [
    { icon: Trophy, title: "Task Master", description: "Completed 10+ tasks", unlocked: stats.tasksCompleted >= 10 },
    { icon: Star, title: "Team Player", description: "Active in projects", unlocked: stats.projectsActive > 0 },
    { icon: Target, title: "Goal Oriented", description: "High completion rate", unlocked: completionRate >= 80 },
    { icon: Zap, title: "Quick Responder", description: "Active in chat", unlocked: true },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome to your personal workspace
            </p>
          </div>
          <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Your Profile</DialogTitle>
                <DialogDescription>
                  Customize your personal information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                      id="firstName"
                      value={profileEdit.firstName}
                      onChange={(e) =>
                        setProfileEdit(prev => ({ ...prev, firstName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileEdit.lastName}
                      onChange={(e) =>
                        setProfileEdit(prev => ({ ...prev, lastName: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">User Name</Label>
                      <Input
                      id="username"
                      value={profileEdit.username}
                      onChange={(e) =>
                        setProfileEdit(prev => ({ ...prev, username: e.target.value }))
                      }
                    />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={profileEdit.email}
                        onChange={(e) =>
                          setProfileEdit(prev => ({ ...prev, email: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={profileEdit.bio}
                    onChange={(e) =>
                      setProfileEdit(prev => ({ ...prev, bio: e.target.value }))
                    }
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote">Favorite Quote</Label>
                  <Input
                    id="quote"
                    value={profileEdit.favoriteQuote}
                    onChange={(e) =>
                      setProfileEdit(prev => ({ ...prev, favoriteQuote: e.target.value }))
                    }
                    placeholder="Your inspiration..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsEditProfileOpen(false)}>
                    Save Changes
                  </Button>
                </div>
              </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tasks Completed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.tasksCompleted}/{stats.tasksTotal}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <FolderOpen className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Projects
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.projectsActive}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completionRate.toFixed(0)}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Activity className="h-8 w-8 text-orange-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Streak Days
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  7
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Weekly Activity
                  </CardTitle>
                  <CardDescription>Your productivity over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="tasks" fill="#3b82f6" />
                      <Bar dataKey="messages" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Task Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Task Distribution
                  </CardTitle>
                  <CardDescription>Current status of your tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Upcoming Deadlines
                  </CardTitle>
                  <CardDescription>Tasks that need attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingTasks.length > 0 ? (
                      upcomingTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-gray-500">{formatDate(task.dueDate)}</p>
                          </div>
                          <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>
                            {task.priority}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Get things done faster</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" variant="outline" asChild>
                    <Link to="/vault">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Personal Vault
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                      <Link to="/chat">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Link to="/projects">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      View Projects
                    </Link>
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Coffee className="h-4 w-4 mr-2" />
                    Take a Break
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Tasks</CardTitle>
                  <CardDescription>Your latest task activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {task.status === "completed" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-gray-500">{task.description}</p>
                          </div>
                        </div>
                        <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                          {task.status.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Progress Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Progress Overview</CardTitle>
                  <CardDescription>Your task completion progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Progress</span>
                      <span>{completionRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Tasks</span>
                      <span className="text-sm font-medium">{stats.tasksTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Completed</span>
                      <span className="text-sm font-medium">{stats.tasksCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">In Progress</span>
                      <span className="text-sm font-medium">
                        {stats.inProgressTasks}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pending</span>
                      <span className="text-sm font-medium">
                        {stats.pendingTasks}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Achievements
                </CardTitle>
                <CardDescription>Your accomplishments and milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg ${
                        achievement.unlocked
                          ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20"
                          : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <achievement.icon
                          className={`h-8 w-8 ${
                            achievement.unlocked ? "text-yellow-600" : "text-gray-400"
                          }`}
                        />
                        <div>
                          <h3 className={`font-medium ${
                            achievement.unlocked ? "text-gray-900 dark:text-white" : "text-gray-500"
                          }`}>
                            {achievement.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {achievement.description}
                          </p>
                        </div>
                        {achievement.unlocked && (
                          <Badge variant="default" className="ml-auto">
                            Unlocked
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {getInitials(user.firstName || "", user.lastName || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <p className="text-sm">{user.bio || "No bio set yet. Add one to tell others about yourself!"}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Favorite Quote</Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm italic">
                        {user.favoriteQuote || "No favorite quote set yet. Add one to inspire others!"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2" />
                    My Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Member since</span>
                    <span className="text-sm font-medium">
                      {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total tasks</span>
                    <span className="text-sm font-medium">{stats.tasksTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Completed tasks</span>
                    <span className="text-sm font-medium">{stats.tasksCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active projects</span>
                    <span className="text-sm font-medium">{stats.projectsActive}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success rate</span>
                    <span className="text-sm font-medium">{completionRate.toFixed(0)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
