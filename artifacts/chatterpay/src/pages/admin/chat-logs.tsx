import { Sidebar } from "@/components/layout/sidebar";
import { useListChatLogs, getListChatLogsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminChatLogs() {
  const { data: logs, isLoading } = useListChatLogs({
    query: { queryKey: getListChatLogsQueryKey() }
  });

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-50">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">System Chat Logs</h1>
        
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Room ID</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.roomId}</TableCell>
                      <TableCell className="font-medium">{log.senderUsername}</TableCell>
                      <TableCell>
                        <Badge variant={log.senderRole === "foreign_client" ? "secondary" : "outline"}>
                          {log.senderRole}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate" title={log.content}>
                        {log.content}
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
