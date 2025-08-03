import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Users,
  UserPlus,
  Activity,
  Settings,
  LogOut,
  Shield,
  Home,
  Menu,
  MessageSquare,
  FolderOpen,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  HardDrive
} from "lucide-react";
// Added icon import

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    return <>{children}</>;
  }

  const isManager = user.role === "manager";

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      description: "Overview and stats",
    },
    {
      name: "Chat",
      href: "/chat",
      icon: MessageSquare,
      description: "Team communication",
    },
    {
      name: "Projects",
      href: "/projects",
      icon: FolderOpen,
      description: "Project management",
    },
    {
      name: "Tasks",
      href: "/tasks",
      icon: CheckSquare,
      description: "Task assignments",
    },
    {
      name: "My Space",
      href: "/myspace",
      icon: Users,
      description: "Personal workspace",
    },
    {
      name: "Personal Vault",
      href: "/Vault",
      icon: Shield,
      description: "Secure personal storage",
    },
    {
      name: "File Manager",
      href: "/files",
      icon: FolderOpen,
      description: "Manage your files",
    },
    ...(isManager
      ? [
          {
            name: "User Management",
            href: "/user-management",
            icon: UserPlus,
            description: "Manage users",
          },
          {
            name: "Analytics & Activity",
            href: "/analytics",
            icon: BarChart3,
            description: "Charts and activity logs",
          },
        ]
      : []),
  ];

  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo and Brand */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <Link to="/" className="flex items-center space-x-2">
          <div className="p-2 bg-primary rounded-lg">
            <Users className="h-6 w-6 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              GroupManager
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex h-8 w-8 p-0"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              title={sidebarCollapsed ? item.description : ""}
            >
              <item.icon
                className={`h-5 w-5 ${sidebarCollapsed ? "" : "mr-3"}`}
              />
              {!sidebarCollapsed && (
                <div className="flex-1">
                  <div>{item.name}</div>
                  <div className="text-xs opacity-60">{item.description}</div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start h-auto p-2 ${sidebarCollapsed ? "px-2" : "px-3"}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="ml-3 text-left flex-1">
                  <p className="text-sm font-medium leading-none">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground mt-1">
                    {user.email}
                  </p>
                  <Badge
                    variant={isManager ? "default" : "secondary"}
                    className="text-xs mt-1"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role}
                  </Badge>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-red-600 dark:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm z-40`}
      >
        <SidebarContent />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center space-x-2">
            <div className="p-2 bg-primary rounded-lg">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              GroupManager
            </span>
          </Link>

          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
        }`}
      >
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
