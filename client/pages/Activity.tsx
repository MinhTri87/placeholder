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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Activity,
  TrendingUp,
  Users,
  CheckSquare,
  Clock,
  BarChart3,
  Calendar,
  Download,
  Filter,
} from "lucide-react";
import { Navigate, Link } from "react-router-dom";

export default function ActivityPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [timeRange, setTimeRange] = useState("7days");
  const [activityType, setActivityType] = useState("all");
  const [recentActivities, setRecentActivities] = useState([]);
  const [fullActivity, setFullActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActivityData();
    }
  }, [isAuthenticated]);

  const fetchActivityData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Fetch recent activity
      const recentResponse = await fetch('/api/activity/recent', { headers });
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        if (recentData.success && recentData.data) {
          setRecentActivities(recentData.data);
        }
      }

      // Fetch full activity
      const fullResponse = await fetch('/api/activity/full', { headers });
      if (fullResponse.ok) {
        const fullData = await fullResponse.json();
        if (fullData.success && fullData.data) {
          setFullActivity(fullData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  // Mock data for charts
  const weeklyActivity = [
    { day: "Mon", logins: 8, tasks: 12, projects: 2 },
    { day: "Tue", logins: 12, tasks: 15, projects: 3 },
    { day: "Wed", logins: 10, tasks: 18, projects: 1 },
    { day: "Thu", logins: 15, tasks: 20, projects: 4 },
    { day: "Fri", logins: 18, tasks: 25, projects: 2 },
    { day: "Sat", logins: 5, tasks: 8, projects: 1 },
    { day: "Sun", logins: 3, tasks: 5, projects: 0 },
  ];

  const monthlyTrends = [
    { month: "Jan", users: 8, projects: 3, tasks: 45 },
    { month: "Feb", users: 12, projects: 5, tasks: 68 },
    { month: "Mar", users: 15, projects: 7, tasks: 89 },
    { month: "Apr", users: 18, projects: 9, tasks: 112 },
    { month: "May", users: 22, projects: 12, tasks: 145 },
    { month: "Jun", users: 25, projects: 15, tasks: 178 },
  ];

  const taskDistribution = [
    { name: "Completed", value: 45, color: "#10B981" },
    { name: "In Progress", value: 25, color: "#3B82F6" },
    { name: "Pending", value: 20, color: "#F59E0B" },
    { name: "Overdue", value: 10, color: "#EF4444" },
  ];

  const userActivity = [
    { name: "Jane Smith", tasksCompleted: 15, projectsLed: 2, hoursWorked: 42 },
    { name: "Bob Wilson", tasksCompleted: 12, projectsLed: 1, hoursWorked: 38 },
    {
      name: "Sarah Johnson",
      tasksCompleted: 18,
      projectsLed: 3,
      hoursWorked: 45,
    },
    { name: "Mike Davis", tasksCompleted: 10, projectsLed: 1, hoursWorked: 35 },
    { name: "Admin User", tasksCompleted: 8, projectsLed: 4, hoursWorked: 40 },
  ];



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isManager = user?.role === "manager";

  const getActivityIcon = (type) => {
    switch (type) {
      case "task":
        return <CheckSquare className="h-4 w-4 text-blue-600" />;
      case "project":
        return <BarChart3 className="h-4 w-4 text-green-600" />;
      case "login":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "user":
        return <Users className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Phân tích & Hoạt động
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Theo dõi hiệu suất nhóm và hoạt động hệ thống
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="1year">Last year</SelectItem>
              </SelectContent>
            </Select>
            {isManager && (
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Activity className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Activities
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  1,234
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  +12% from last week
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  15
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  +2 new this week
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <CheckSquare className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tasks Completed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  89
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  +8% completion rate
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-orange-600 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Productivity
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  92%
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  +5% this month
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="users">User Analytics</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Weekly Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity Trend</CardTitle>
                <CardDescription>
                  User logins, task completions, and project activities over the
                  past week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="logins"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="tasks"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="projects"
                      stackId="1"
                      stroke="#F59E0B"
                      fill="#F59E0B"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Task Distribution</CardTitle>
                  <CardDescription>
                    Current status of all tasks in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={taskDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {taskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest actions performed by team members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[250px] overflow-y-auto">
                    {recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3"
                      >
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.user}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.action}: {activity.details}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Growth Trends</CardTitle>
                <CardDescription>
                  User growth, project creation, and task completion over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#3B82F6"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="projects"
                      stroke="#10B981"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="tasks"
                      stroke="#F59E0B"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Activity Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity Breakdown</CardTitle>
                <CardDescription>
                  Detailed view of daily activities across the week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="logins" fill="#3B82F6" />
                    <Bar dataKey="tasks" fill="#10B981" />
                    <Bar dataKey="projects" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {/* User Performance */}
            <Card>
              <CardHeader>
                <CardTitle>User Performance Metrics</CardTitle>
                <CardDescription>
                  Individual performance metrics for team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userActivity.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Team Member
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-8">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.tasksCompleted}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Tasks Completed
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.projectsLed}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Projects Led
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.hoursWorked}h
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Hours Worked
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            {/* Activity Logs */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>System Activity Logs</CardTitle>
                    <CardDescription>
                      Detailed log of all system activities and user actions
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={activityType}
                      onValueChange={setActivityType}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="login">Logins</SelectItem>
                        <SelectItem value="task">Tasks</SelectItem>
                        <SelectItem value="project">Projects</SelectItem>
                        <SelectItem value="user">User Management</SelectItem>
                      </SelectContent>
                    </Select>
                    {isManager && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Logs
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities
                    .concat([
                      {
                        id: "6",
                        user: "Jane Smith",
                        action: "File upload",
                        details: "Uploaded design mockups for homepage",
                        timestamp: "3 hours ago",
                        type: "task",
                      },
                      {
                        id: "7",
                        user: "System",
                        action: "Backup completed",
                        details: "Daily database backup completed successfully",
                        timestamp: "6 hours ago",
                        type: "system",
                      },
                    ])
                    .filter(
                      (activity) =>
                        activityType === "all" ||
                        activity.type === activityType,
                    )
                    .map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {activity.user}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.timestamp}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>{activity.action}:</strong>{" "}
                            {activity.details}
                          </p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {activity.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
