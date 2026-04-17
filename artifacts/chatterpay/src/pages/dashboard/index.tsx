import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { useGetWallet, getGetWalletQueryKey, useGetActiveContract, getGetActiveContractQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: wallet } = useGetWallet({
    query: { queryKey: getGetWalletQueryKey() }
  });
  
  const { data: contract } = useGetActiveContract({
    query: { queryKey: getGetActiveContractQueryKey() }
  });

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-50">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Welcome back, {user?.username}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-blue-600 text-white shadow-md">
            <CardHeader>
              <CardTitle className="text-blue-100">KSh Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">KSh {wallet?.kshBalance?.toFixed(2) || '0.00'}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-emerald-600 text-white shadow-md">
            <CardHeader>
              <CardTitle className="text-emerald-100">USDT Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">${wallet?.usdtBalance?.toFixed(2) || '0.00'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Contract</CardTitle>
            </CardHeader>
            <CardContent>
              {contract ? (
                <div>
                  <p className="text-green-600 font-semibold mb-2">Active ({contract.plan})</p>
                  <p className="text-sm text-slate-500">Expires: {new Date(contract.expiresAt).toLocaleString()}</p>
                </div>
              ) : (
                <div>
                  <p className="text-red-500 font-semibold mb-4">No active contract</p>
                  <Button asChild size="sm">
                    <Link href="/dashboard/contract">Buy Contract</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
