import { Sidebar } from "@/components/layout/sidebar";
import { useListAssignments, getListAssignmentsQueryKey, useDeleteAssignment, useListUsers, getListUsersQueryKey, useListForeignClients, getListForeignClientsQueryKey, useCreateAssignment } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";

const schema = z.object({
  userId: z.coerce.number().min(1, "Select a user"),
  foreignClientId: z.coerce.number().min(1, "Select a client"),
});

export default function AdminAssignments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: assignments, isLoading } = useListAssignments({
    query: { queryKey: getListAssignmentsQueryKey() }
  });

  const { data: users } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });
  const { data: clients } = useListForeignClients({ query: { queryKey: getListForeignClientsQueryKey() } });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const createMutation = useCreateAssignment({
    mutation: {
      onSuccess: () => {
        toast({ title: "Assigned successfully" });
        setOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
      },
      onError: (error: any) => {
        toast({ title: "Failed", description: error.message, variant: "destructive" });
      }
    }
  });

  const deleteMutation = useDeleteAssignment({
    mutation: {
      onSuccess: () => {
        toast({ title: "Assignment removed" });
        queryClient.invalidateQueries({ queryKey: getListAssignmentsQueryKey() });
      }
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Remove this assignment?")) {
      deleteMutation.mutate({ assignmentId: id });
    }
  };

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-50">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Assignments</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>New Assignment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Client to User</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => createMutation.mutate({ data: d }))} className="space-y-4">
                  <FormField control={form.control} name="userId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kenyan User</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users?.map(u => (
                            <SelectItem key={u.id} value={u.id.toString()}>{u.username} {u.hasActiveContract ? '(Active)' : '(No Contract)'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="foreignClientId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foreign Client</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients?.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.username}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>Assign</Button>
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
                    <TableHead>User</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Assigned At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments?.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.id}</TableCell>
                      <TableCell className="font-medium">{a.user?.username}</TableCell>
                      <TableCell className="font-medium text-primary">{a.foreignClient?.username}</TableCell>
                      <TableCell>{new Date(a.assignedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(a.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Remove
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
