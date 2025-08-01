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

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
      fetchUsers();
      fetchPrivateChats();
    }
  }, [isAuthenticated]);
  useEffect(() => {
  if (isAuthenticated && user && onlineUsers.length > 0) {
    fetchPrivateChats();
  }
  
}, [isAuthenticated, user, onlineUsers]);


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
  const token = localStorage.getItem('auth_token');

  const allChats = {};
  const userIds = onlineUsers.map(u => u.id).filter(id => id !== user.id);

  for (const otherUserId of userIds) {
    try {
      const response = await fetch(`/api/chat/private/${otherUserId}?currentUserId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          allChats[otherUserId] = data.data;
        }
      }
    } catch (error) {
      console.error(`Error fetching chat with ${otherUserId}:`, error);
    }
  }

  setPrivateChats(allChats);
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
      socketRef.current?.emit('private_message', {
  to: activeChat,
  message: {
    id: Date.now().toString(),
    senderId: user.id,
    senderName: `${user.firstName} ${user.lastName}`,
    message: newMessage,
    timestamp: new Date().toISOString(),
    type: 'text',
    isRead: false
  }
});

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
  if (!name || typeof name !== "string") return "??";
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
  const rawMessages = activeChat === "group"
    ? messages
    : privateChats[activeChat] || [];

  // Normalize userName for both group and private messages
  return rawMessages.map(msg => ({
  ...msg,
  userName: msg.userName || msg.senderName || "Unknown",
  userId: msg.userId || msg.senderId // 👈 ensure all messages have userId
}));
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

          <Card className="flex flex-col h-[calc(100vh-20rem)]">
  <CardHeader className="pb-3">
    <CardTitle className="text-sm">Private Messages</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3 flex-1 flex flex-col overflow-hidden">
    {/* Search Bar */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search members..."
        value={searchUsers}
        onChange={(e) => setSearchUsers(e.target.value)}
        className="pl-10"
      />
    </div>

    {/* Scrollable User List */}
    <ScrollArea className="flex-1 overflow-y-auto pr-2">
      <div className="space-y-1">
        {filteredUsers.map((user) => {
          const lastMessage = privateChats[user.id]?.slice(-1)[0];
          return (
            <Button
              key={user.id}
              variant={activeChat === user.id ? "default" : "ghost"}
              className="w-full justify-start h-auto p-3"
              onClick={() => startPrivateChat(user.id)}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(user.status)}`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">
                    {user.name}
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

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
  {/* Scrollable Message List with Max Height */}
  <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-4 max-h-[calc(100vh-16rem)]">
    {getCurrentMessages().map((message, index) => {
      const isOwnMessage = message.userId === user.id;
      const showAvatar =
        index === 0 ||
        getCurrentMessages()[index - 1].userId !== message.userId;

      return (
        <div
          key={message.id}
          className={`flex items-start space-x-3 ${
            isOwnMessage ? "flex-row-reverse space-x-reverse" : ""
          }`}
        >
          {showAvatar ? (
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
          ) : (
            <div className="w-8" />
          )}

          <div className={`flex-1 max-w-xs ${isOwnMessage ? "text-right" : ""}`}>
            {showAvatar && (
              <div
                className={`flex items-center space-x-2 mb-1 ${
                  isOwnMessage ? "justify-end" : ""
                }`}
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

  {/* Fixed Input Box */}
  <div className="p-4 border-t shrink-0">
    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
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
