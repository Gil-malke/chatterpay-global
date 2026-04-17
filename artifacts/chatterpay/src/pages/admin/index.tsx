import { Sidebar } from "@/components/layout/sidebar";
import { useGetAdminDashboard, getGetAdminDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, CreditCard, DollarSign, MessageSquare, ArrowRightLeft } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() }
  });

  if (isLoading) return <div className="p-8">Loading stats...</div>;
  if (!stats) return <div className="p-8">Error loading stats.</div>;

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-50">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Admin Overview</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="h-4 w-4 text-blue-500" />} />
          <StatCard title="Foreign Clients" value={stats.totalForeignClients} icon={<Briefcase className="h-4 w-4 text-indigo-500" />} />
          <StatCard title="Active Contracts" value={stats.activeContracts} icon={<CheckCircle iconColor="text-emerald-500" />} />
          <StatCard title="Total Deposits" value={`KSh ${stats.totalDepositsKsh}`} icon={<CreditCard className="h-4 w-4 text-amber-500" />} />
          <StatCard title="Total Earnings" value={`$${stats.totalEarningsUsdt}`} icon={<DollarSign className="h-4 w-4 text-emerald-600" />} />
          <StatCard title="Pending Withdrawals" value={stats.pendingWithdrawals} icon={<ArrowRightLeft className="h-4 w-4 text-rose-500" />} />
          <StatCard title="Total Messages" value={stats.totalMessages} icon={<MessageSquare className="h-4 w-4 text-primary" />} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {stats.recentUsers.map(u => (
                <div key={u.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-900">{u.username}</p>
                    <p className="text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>KSh {u.kshBalance}</p>
                    <p className="text-slate-500">${u.usdtBalance}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}

function CheckCircle({ iconColor }: { iconColor: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${iconColor}`}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  );
}
