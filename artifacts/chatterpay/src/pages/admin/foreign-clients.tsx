import { Sidebar } from "@/components/layout/sidebar";
import { useListForeignClients, getListForeignClientsQueryKey, useCreateForeignClient } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const schema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  usdtBalance: z.coerce.number().optional(),
  country: z.string().optional(),
});

export default function AdminForeignClients() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: clients, isLoading } = useListForeignClients({
    query: { queryKey: getListForeignClientsQueryKey() }
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "", usdtBalance: 0, country: "" },
  });

  const createMutation = useCreateForeignClient({
    mutation: {
      onSuccess: () => {
        toast({ title: "Client Created" });
        setOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListForeignClientsQueryKey() });
      },
      onError: (error: any) => {
        toast({ title: "Failed", description: error.message, variant: "destructive" });
      }
    }
  });

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-50">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Foreign Clients</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add Client</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Foreign Client</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => createMutation.mutate({ data: d }))} className="space-y-4">
                  <FormField control={form.control} name="username" render={({ field }) => (
                    <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="usdtBalance" render={({ field }) => (
                    <FormItem><FormLabel>USDT Balance</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>Create</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>USDT Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Users</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients?.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.id}</TableCell>
                      <TableCell className="font-medium">{c.username}</TableCell>
                      <TableCell>{c.country || '-'}</TableCell>
                      <TableCell>${c.usdtBalance}</TableCell>
                      <TableCell>
                        {c.isOnline ? <Badge className="bg-emerald-500">Online</Badge> : <Badge variant="secondary">Offline</Badge>}
                      </TableCell>
                      <TableCell>{c.assignedUsersCount || 0}</TableCell>
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
