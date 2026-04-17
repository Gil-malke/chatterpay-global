import { Sidebar } from "@/components/layout/sidebar";
import { useListUsers, getListUsersQueryKey, useBanUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useListUsers({
    query: { queryKey: getListUsersQueryKey() }
  });

  const banMutation = useBanUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Status Updated" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      }
    }
  });

  const handleToggleBan = (userId: number, currentBanned: boolean) => {
    banMutation.mutate({ userId, data: { banned: !currentBanned } });
  };

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-50">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Kenyan Users</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Balances</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contracts / Assignments</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.id}</TableCell>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell>
                        <div className="text-sm">KSh {u.kshBalance}</div>
                        <div className="text-xs text-slate-500">${u.usdtBalance}</div>
                      </TableCell>
                      <TableCell>
                        {u.isBanned ? <Badge variant="destructive">Banned</Badge> : <Badge className="bg-emerald-500">Active</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{u.hasActiveContract ? 'Active' : 'None'}</div>
                        <div className="text-xs text-slate-500">{u.assignedClientsCount} clients</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant={u.isBanned ? "outline" : "destructive"} 
                          size="sm"
                          onClick={() => handleToggleBan(u.id, u.isBanned)}
                          disabled={banMutation.isPending}
                        >
                          {u.isBanned ? "Unban" : "Ban"}
                        </Button>
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
