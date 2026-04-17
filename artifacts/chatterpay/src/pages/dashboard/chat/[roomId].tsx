import { useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useListMessages, getListMessagesQueryKey, useSendMessage } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Send, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

export default function ChatRoom() {
  const [, params] = useRoute("/dashboard/chat/:roomId");
  const roomId = params?.roomId ? parseInt(params.roomId, 10) : 0;
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useListMessages(roomId, {
    query: {
      queryKey: getListMessagesQueryKey(roomId),
      enabled: !!roomId,
      refetchInterval: 3000, // Poll every 3s
    }
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { content: "" },
  });

  const sendMessageMutation = useSendMessage({
    mutation: {
      onSuccess: () => {
        form.reset();
        // The polling will pick up the new message shortly, but we could invalidate here if we wanted immediate refresh
      }
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSubmit = (data: z.infer<typeof schema>) => {
    sendMessageMutation.mutate({
      roomId,
      data: { content: data.content }
    });
  };

  if (!roomId) return <div>Invalid room</div>;

  return (
    <div className="flex h-[100dvh]">
      <Sidebar />
      <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4 flex items-center gap-4 shadow-sm z-10">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/chat">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Link>
          </Button>
          <div>
            <h2 className="font-bold text-lg text-slate-900">Chat Room</h2>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="text-center text-slate-500 py-4">Loading messages...</div>
          ) : messages?.length === 0 ? (
            <div className="text-center text-slate-500 py-12">No messages yet. Start the conversation!</div>
          ) : (
            messages?.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-slate-400 mb-1 px-1">
                    {msg.senderUsername}
                  </span>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t p-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-3 max-w-4xl mx-auto">
            <Input 
              {...form.register("content")} 
              placeholder="Type a message..." 
              className="flex-1 rounded-full bg-slate-50 border-slate-200 px-6"
              autoComplete="off"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="rounded-full h-10 w-10 shrink-0 bg-primary hover:bg-primary/90"
              disabled={sendMessageMutation.isPending || !form.watch("content").trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
