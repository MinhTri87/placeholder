import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  Shield,
  Activity,
  TrendingUp,
  Calendar,
  Clock,
  UserPlus,
} from "lucide-react";
import { GroupStats, ActivityLog, ApiResponse } from "@shared/api";
import { Navigate, Link } from "react-router-dom";

export default function Index() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
  await Promise.all([fetchStats(), fetchRecentActivity()]);
  setLoadingStats(false);
};

const fetchStats = async () => {
  try {
    const token = localStorage.getItem("auth_token");
    const headers = { Authorization: `Bearer ${token}` };
    const res = await fetch("/api/stats", { headers });
    if (res.ok) {
      const data: ApiResponse<GroupStats> = await res.json();
      if (data.success && data.data) setStats(data.data);
    }
  } catch (err) {
    console.error("Failed to fetch stats:", err);
  }
};

const fetchRecentActivity = async () => {
  try {
    const token = localStorage.getItem("auth_token");
    const headers = { Authorization: `Bearer ${token}` };

    const response = await fetch("/api/activity/recent", {
      headers,
    });

    if (response.ok) {
      const data: ApiResponse<ActivityLog[]> = await response.json();
      if (data.success && data.data) {
        setRecentActivity(data.data);
      }
    } else {
      console.error("Failed to fetch recent activity");
    }
  } catch (error) {
    console.error("Error fetching recent activity:", error);
  }
};



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isManager = user?.role === "manager";

  const defaultStats: GroupStats = {
    totalMembers: 12,
    activeMembers: 10,
    managersCount: 2,
    membersCount: 10,
  };

  const currentStats = stats || defaultStats;

  const defaultActivity: ActivityLog[] = [
    {
      id: "1",
      userId: "1",
      userName: "John Doe",
      action: "User Login",
      details: "Logged in from 192.168.1.100",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      userId: "2",
      userName: "Jane Smith",
      action: "Member Added",
      details: "Added new member: Mike Johnson",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      userId: "3",
      userName: "Bob Wilson",
      action: "Profile Updated",
      details: "Updated contact information",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const currentActivity =
    recentActivity.length > 0 ? recentActivity : defaultActivity;

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Here's what's happening with your group today.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={isManager ? "default" : "secondary"}
                className="text-sm"
              >
                <Shield className="h-3 w-3 mr-1" />
                {user?.role}
              </Badge>
              {isManager && (
                <Button asChild>
                  <Link to="/user-management">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentStats.totalMembers}
              </div>
              <p className="text-xs text-muted-foreground">
                Active group members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Today
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentStats.activeMembers}
              </div>
              <p className="text-xs text-muted-foreground">
                Online in last 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Managers</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentStats.managersCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Admin level access
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+2</div>
              <p className="text-xs text-muted-foreground">
                New members this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest actions from group members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.userName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.action}: {activity.details}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks you can perform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link to="/user-management">
                  <Users className="h-4 w-4 mr-2" />
                  View All Members
                </Link>
              </Button>

              {isManager && (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link to="/user-management">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add New Member
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link to="/analytics">
                      <Activity className="h-4 w-4 mr-2" />
                      View Analytics & Activity
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
