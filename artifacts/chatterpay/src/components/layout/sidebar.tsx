import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const links = user.role === "admin" 
    ? [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/foreign-clients", label: "Clients" },
        { href: "/admin/assignments", label: "Assignments" },
        { href: "/admin/withdrawals", label: "Withdrawals" },
        { href: "/admin/chat-logs", label: "Chat Logs" },
      ]
    : user.role === "foreign_client"
      ? [
          { href: "/dashboard/chat", label: "Chats" },
        ]
      : [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/dashboard/deposit", label: "Deposit" },
          { href: "/dashboard/contract", label: "Contract" },
          { href: "/dashboard/chat", label: "Chats" },
          { href: "/dashboard/transactions", label: "Transactions" },
          { href: "/dashboard/withdraw", label: "Withdraw" },
          { href: "/dashboard/notifications", label: "Notifications" },
        ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-4 font-bold text-xl border-b border-slate-800">
        ChatterPay {user.role === 'admin' ? 'Admin' : ''}
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map(link => (
          <Link key={link.href} href={link.href} className={`block px-4 py-2 rounded-md transition-colors ${location === link.href ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-800'}`}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <Button variant="destructive" className="w-full justify-start" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
