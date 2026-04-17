import { Sidebar } from "@/components/layout/sidebar";
import { useListChatRooms, getListChatRoomsQueryKey, useGetActiveContract, getGetActiveContractQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { MessageSquare, Circle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ChatRooms() {
  const { user } = useAuth();
  
  const { data: contract } = useGetActiveContract({
    query: { 
      queryKey: getGetActiveContractQueryKey(),
      enabled: user?.role === "user"
    }
  });

  const { data: rooms, isLoading } = useListChatRooms({
    query: { queryKey: getListChatRoomsQueryKey() }
  });

  const needsContract = user?.role === "user" && !contract;

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-50">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Chat Rooms</h1>
        
        {needsContract ? (
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg max-w-2xl">
            <h2 className="text-xl font-bold text-amber-800 mb-2">Contract Required</h2>
            <p className="text-amber-700 mb-4">You need an active contract to view your assigned clients and start chatting.</p>
            <Link href="/dashboard/contract" className="text-primary font-bold hover:underline">
              Get a contract now &rarr;
            </Link>
          </div>
        ) : (
          <div className="max-w-4xl space-y-4">
            {isLoading ? (
              <p className="text-slate-500">Loading chat rooms...</p>
            ) : rooms && rooms.length > 0 ? (
              rooms.map((room) => (
                <Link key={room.id} href={`/dashboard/chat/${room.id}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer group">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center relative">
                          <MessageSquare className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors" />
                          <Circle className={`absolute bottom-0 right-0 h-3 w-3 fill-current ${room.participant.isOnline ? "text-emerald-500" : "text-slate-300"}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">{room.participant.username}</h3>
                          {room.lastMessage ? (
                            <p className="text-sm text-slate-500 truncate max-w-md">
                              {room.lastMessage}
                            </p>
                          ) : (
                            <p className="text-sm text-slate-400 italic">No messages yet</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {room.lastMessageAt && (
                          <span className="text-xs text-slate-400">
                            {new Date(room.lastMessageAt).toLocaleDateString()}
                          </span>
                        )}
                        {room.unreadCount > 0 && (
                          <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                            {room.unreadCount} new
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">No clients assigned yet</h3>
                <p className="text-slate-500">
                  {user?.role === "user" 
                    ? "Check back later or contact admin to get assignments."
                    : "No users have been assigned to you yet."}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
