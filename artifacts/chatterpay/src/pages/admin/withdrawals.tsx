import { Sidebar } from "@/components/layout/sidebar";
import { useListWithdrawals, getListWithdrawalsQueryKey, useApproveWithdrawal, useRejectWithdrawal } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminWithdrawals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: withdrawals, isLoading } = useListWithdrawals({
    query: { queryKey: getListWithdrawalsQueryKey() }
  });

  const approveMutation = useApproveWithdrawal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Approved" });
        queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
      }
    }
  });

  const rejectMutation = useRejectWithdrawal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Rejected" });
        queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
      }
    }
  });

  const handleAction = (id: number, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      approveMutation.mutate({ withdrawalId: id });
    } else {
      rejectMutation.mutate({ withdrawalId: id });
    }
  };

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-50">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Withdrawal Requests</h1>
        
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals?.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="text-slate-500">{new Date(w.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{w.username}</TableCell>
                      <TableCell className="font-bold">{w.amount} {w.currency}</TableCell>
                      <TableCell>{w.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={w.status === "pending" ? "secondary" : w.status === "approved" ? "default" : "destructive"}>
                          {w.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {w.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleAction(w.id, 'approve')}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleAction(w.id, 'reject')}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
