import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Send,
  Users,
  Smile,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  UserPlus,
  Search,
  MessageCircle,
  X,
} from "lucide-react";
import { Navigate } from "react-router-dom";

export default function Chat() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [privateChats, setPrivateChats] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeChat, setActiveChat] = useState("group"); // 'group' or userId for private chat
  const [searchUsers, setSearchUsers] = useState("");
  const messagesEndRef = useRef(null);

  // Mock data for group chat
  const mockMessages = [
    {
      id: "1",
      userId: "1",
      userName: "Admin User",
      message: "Welcome to the team chat! 👋",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      type: "text",
    },
    {
      id: "2",
      userId: "2",
      userName: "Regular User",
      message: "Thanks! Excited to be working with everyone.",
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      type: "text",
    },
    {
      id: "3",
      userId: "3",
      userName: "Jane Smith",
      message: "Has anyone seen the latest project updates?",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      type: "text",
    },
    {
      id: "4",
      userId: "1",
      userName: "Admin User",
      message:
        "Yes, I just posted them in the Projects section. Check them out!",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      type: "text",
    },
  ];

  const mockOnlineUsers = [
    { id: "1", name: "Admin User", role: "manager", status: "online" },
    { id: "2", name: "Regular User", role: "member", status: "online" },
    { id: "3", name: "Jane Smith", role: "member", status: "away" },
    { id: "4", name: "Bob Wilson", role: "member", status: "offline" },
    { id: "5", name: "Sarah Johnson", role: "member", status: "online" },
  ];

  // Mock private chat data
  const mockPrivateChats = {
    "2": [
      {
        id: "p1",
        userId: "2",
        userName: "Regular User",
        message: "Hi! Can you help me with the website project?",
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        type: "text",
      },
      {
        id: "p2",
        userId: user?.id,
        userName: `${user?.firstName} ${user?.lastName}`,
        message: "Sure! What do you need help with?",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: "text",
      },
    ],
    "3": [
      {
        id: "p3",
        userId: "3",
        userName: "Jane Smith",
        message: "Are you free to review the design?",
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        type: "text",
      },
    ],
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
      fetchUsers();
      fetchPrivateChats();
    }
  }, [isAuthenticated]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/chat/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setMessages(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages(mockMessages);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const usersWithStatus = data.data.map(u => ({
            ...u,
            name: `${u.firstName} ${u.lastName}`,
            status: u.isActive ? 'online' : 'offline'
          }));
          setOnlineUsers(usersWithStatus);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setOnlineUsers(mockOnlineUsers);
    }
  };

  const fetchPrivateChats = async () => {
    // For now, use mock data - would need to fetch from multiple endpoints
    setPrivateChats(mockPrivateChats);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, privateChats, activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('auth_token');

      if (activeChat === "group") {
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: newMessage,
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setMessages(prev => [...prev, data.data]);
          }
        }
      } else {
        const response = await fetch(`/api/chat/private/${activeChat}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: newMessage,
            senderId: user.id,
            senderName: `${user.firstName} ${user.lastName}`
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setPrivateChats(prev => ({
              ...prev,
              [activeChat]: [...(prev[activeChat] || []), data.data]
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }

    setNewMessage("");
  };

  const startPrivateChat = (userId) => {
    if (userId === user.id) return; // Can't chat with yourself

    if (!privateChats[userId]) {
      setPrivateChats((prev) => ({
        ...prev,
        [userId]: [],
      }));
    }
    setActiveChat(userId);
  };

  const formatTimeAgo = (timestamp) => {
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

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const getCurrentMessages = () => {
    if (activeChat === "group") {
      return messages;
    }
    return privateChats[activeChat] || [];
  };

  const getCurrentChatTitle = () => {
    if (activeChat === "group") {
      return "Team Chat";
    }
    const chatUser = onlineUsers.find((u) => u.id === activeChat);
    return chatUser ? `${chatUser.name}` : "Private Chat";
  };

  const getActiveChatUsers = () => {
    if (activeChat === "group") {
      return onlineUsers.filter((u) => u.status === "online").length;
    }
    const chatUser = onlineUsers.find((u) => u.id === activeChat);
    return chatUser ? chatUser.status : "offline";
  };

  const filteredUsers = onlineUsers.filter(
    (u) =>
      u.id !== user.id &&
      u.name.toLowerCase().includes(searchUsers.toLowerCase()),
  );

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex gap-6">
        {/* Chat List Sidebar */}
        <div className="w-80 space-y-4">
          {/* Chat Type Tabs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Chats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant={activeChat === "group" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setActiveChat("group")}
              >
                <Users className="h-4 w-4 mr-2" />
                Group ({
                  onlineUsers.filter((u) => u.status === "online").length
                }{" "}
                online)
              </Button>
            </CardContent>
          </Card>

          {/* Private Chats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Private Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.keys(privateChats).map((userId) => {
                const chatUser = onlineUsers.find((u) => u.id === userId);
                if (!chatUser) return null;

                const lastMessage = privateChats[userId]?.slice(-1)[0];

                return (
                  <Button
                    key={userId}
                    variant={activeChat === userId ? "default" : "ghost"}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setActiveChat(userId)}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getInitials(chatUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(chatUser.status)}`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium truncate">
                          {chatUser.name}
                        </p>
                        {lastMessage && (
                          <p className="text-xs text-muted-foreground truncate">
                            {lastMessage.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Start New Chat */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Start New Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="pl-10"
                />
              </div>
              <ScrollArea className="h-40">
                <div className="space-y-1">
                  {filteredUsers.map((user) => (
                    <Button
                      key={user.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2"
                      onClick={() => startPrivateChat(user.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-gray-800 ${getStatusColor(user.status)}`}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm">{user.name}</p>
                          <Badge
                            variant={
                              user.role === "manager" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {user.role === "manager" ? "Manager" : "Member"}
                          </Badge>
                        </div>
                        <MessageCircle className="h-4 w-4" />
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-lg">
                    {getCurrentChatTitle()}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {activeChat === "group"
                      ? `${getActiveChatUsers()} members online`
                      : `Status: ${getActiveChatUsers() === "online" ? "Online" : getActiveChatUsers() === "away" ? "Away" : "Offline"}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {activeChat !== "group" && (
                  <>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {getCurrentMessages().map((message, index) => {
                    const isOwnMessage = message.userId === user.id;
                    const showAvatar =
                      index === 0 ||
                      getCurrentMessages()[index - 1].userId !== message.userId;

                    return (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${isOwnMessage ? "flex-row-reverse space-x-reverse" : ""}`}
                      >
                        {showAvatar && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback
                              className={
                                isOwnMessage
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary"
                              }
                            >
                              {getInitials(message.userName)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {!showAvatar && <div className="w-8" />}

                        <div
                          className={`flex-1 max-w-xs ${isOwnMessage ? "text-right" : ""}`}
                        >
                          {showAvatar && (
                            <div
                              className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? "justify-end" : ""}`}
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {message.userName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(message.timestamp)}
                              </span>
                            </div>
                          )}
                          <div
                            className={`inline-block rounded-lg px-3 py-2 text-sm ${
                              isOwnMessage
                                ? "bg-primary text-primary-foreground"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                            }`}
                          >
                            {message.message}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center space-x-2"
                >
                  <Button variant="outline" size="sm" type="button">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={
                      activeChat === "group"
                        ? "Type a message to the group..."
                        : "Type a private message..."
                    }
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" type="button">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button type="submit" size="sm" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
