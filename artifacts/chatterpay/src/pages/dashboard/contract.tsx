import { Sidebar } from "@/components/layout/sidebar";
import { useGetActiveContract, getGetActiveContractQueryKey, useCreateContract, getGetWalletQueryKey, useGetWallet } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Clock, Users } from "lucide-react";
import { Link } from "wouter";

export default function Contract() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contract, isLoading: contractLoading } = useGetActiveContract({
    query: { queryKey: getGetActiveContractQueryKey() }
  });

  const { data: wallet } = useGetWallet({
    query: { queryKey: getGetWalletQueryKey() }
  });

  const createContractMutation = useCreateContract({
    mutation: {
      onSuccess: () => {
        toast({ title: "Contract Activated", description: "You can now chat with assigned clients." });
        queryClient.invalidateQueries({ queryKey: getGetActiveContractQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
      },
      onError: (error: any) => {
        toast({ title: "Failed to buy contract", description: error.message || "Insufficient balance", variant: "destructive" });
      }
    }
  });

  const handleBuy = () => {
    createContractMutation.mutate({ data: { plan: "24h" } });
  };

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-50">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Chat Contracts</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-6 w-6" />
                Standard 24h Plan
              </CardTitle>
              <CardDescription>Get access to foreign clients for 24 hours.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="text-4xl font-extrabold text-slate-900">
                KSh 200 <span className="text-lg text-slate-500 font-normal">/ 24 hrs</span>
              </div>
              <ul className="space-y-3 mt-6">
                <li className="flex items-center gap-3 text-slate-700">
                  <Clock className="h-5 w-5 text-primary" />
                  24 hours of active chat time
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <Users className="h-5 w-5 text-primary" />
                  Chat with up to 5 assigned foreign clients
                </li>
              </ul>
              
              <div className="pt-4 border-t mt-6">
                <p className="text-sm text-slate-500 mb-2">Your current balance:</p>
                <p className="font-semibold text-lg font-mono">KSh {wallet?.kshBalance?.toFixed(2) || '0.00'}</p>
                {(wallet?.kshBalance ?? 0) < 200 && (
                  <p className="text-red-500 text-sm mt-1">Insufficient balance. Please deposit first.</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t pb-6 pt-6">
              {(wallet?.kshBalance ?? 0) < 200 ? (
                 <Button className="w-full" asChild>
                   <Link href="/dashboard/deposit">Deposit Funds</Link>
                 </Button>
              ) : (
                <Button 
                  className="w-full text-lg h-12" 
                  onClick={handleBuy} 
                  disabled={createContractMutation.isPending || !!contract}
                >
                  {createContractMutation.isPending ? "Processing..." : contract ? "You already have an active plan" : "Buy Plan"}
                </Button>
              )}
            </CardFooter>
          </Card>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                {contractLoading ? (
                  <p className="text-slate-500">Loading status...</p>
                ) : contract ? (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg flex items-start gap-3">
                      <ShieldCheck className="h-6 w-6 text-emerald-600 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-lg">Contract Active</h3>
                        <p className="text-emerald-700">You can currently chat with clients.</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-100 p-4 rounded-lg">
                        <p className="text-sm text-slate-500 mb-1">Plan</p>
                        <p className="font-bold text-slate-900 capitalize">{contract.plan}</p>
                      </div>
                      <div className="bg-slate-100 p-4 rounded-lg">
                        <p className="text-sm text-slate-500 mb-1">Expires</p>
                        <p className="font-bold text-slate-900">{new Date(contract.expiresAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-100 border border-slate-200 text-slate-600 p-6 rounded-lg text-center">
                    <p className="mb-2">You don't have an active contract.</p>
                    <p className="text-sm">Buy a plan to start chatting and earning.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
