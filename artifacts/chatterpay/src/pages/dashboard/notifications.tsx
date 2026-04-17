import { Sidebar } from "@/components/layout/sidebar";
import { useListNotifications, getListNotificationsQueryKey, useMarkNotificationRead } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle2 } from "lucide-react";

export default function Notifications() {
  const queryClient = useQueryClient();
  
  const { data: notifications, isLoading } = useListNotifications({
    query: { queryKey: getListNotificationsQueryKey() }
  });

  const markReadMutation = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    }
  });

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate({ notificationId: id });
  };

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-50">
        <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <Bell className="text-primary" /> Notifications
        </h1>
        
        <div className="max-w-3xl space-y-4">
          {isLoading ? (
            <p className="text-slate-500">Loading notifications...</p>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((note) => (
              <Card key={note.id} className={note.isRead ? "bg-slate-50 border-transparent shadow-none" : "border-primary/20 shadow-sm"}>
                <CardContent className="p-4 flex justify-between items-start">
                  <div>
                    <p className={`mb-1 ${note.isRead ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                      {note.message}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!note.isRead && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-primary/80"
                      onClick={() => handleMarkRead(note.id)}
                      disabled={markReadMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Read
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">You're all caught up!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
