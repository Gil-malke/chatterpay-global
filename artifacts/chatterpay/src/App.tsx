import { Switch, Route } from "wouter";
import { AuthProvider } from "./hooks/use-auth";
import { initApi } from "./lib/api";
import { Toaster } from "@/components/ui/toaster";
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard/index";
import Deposit from "./pages/dashboard/deposit";
import Contract from "./pages/dashboard/contract";
import ChatRooms from "./pages/dashboard/chat/index";
import ChatRoom from "./pages/dashboard/chat/[roomId]";
import Transactions from "./pages/dashboard/transactions";
import Withdraw from "./pages/dashboard/withdraw";
import Notifications from "./pages/dashboard/notifications";
import AdminDashboard from "./pages/admin/index";
import AdminUsers from "./pages/admin/users";
import AdminForeignClients from "./pages/admin/foreign-clients";
import AdminAssignments from "./pages/admin/assignments";
import AdminWithdrawals from "./pages/admin/withdrawals";
import AdminChatLogs from "./pages/admin/chat-logs";

initApi();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* User Dashboard Routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/deposit" component={Deposit} />
      <Route path="/dashboard/contract" component={Contract} />
      <Route path="/dashboard/chat" component={ChatRooms} />
      <Route path="/dashboard/chat/:roomId" component={ChatRoom} />
      <Route path="/dashboard/transactions" component={Transactions} />
      <Route path="/dashboard/withdraw" component={Withdraw} />
      <Route path="/dashboard/notifications" component={Notifications} />

      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/foreign-clients" component={AdminForeignClients} />
      <Route path="/admin/assignments" component={AdminAssignments} />
      <Route path="/admin/withdrawals" component={AdminWithdrawals} />
      <Route path="/admin/chat-logs" component={AdminChatLogs} />
    </Switch>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}
