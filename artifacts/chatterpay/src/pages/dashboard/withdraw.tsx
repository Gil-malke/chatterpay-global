import { Sidebar } from "@/components/layout/sidebar";
import { useRequestWithdrawal, useGetWallet, getGetWalletQueryKey, getListWithdrawalsQueryKey, useListWithdrawals } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  currency: z.enum(["KSH", "USDT"]),
  phone: z.string().optional(),
}).refine(data => {
  if (data.currency === "KSH" && (!data.phone || data.phone.length < 10)) {
    return false;
  }
  return true;
}, {
  message: "Phone number required for M-Pesa KSh withdrawals",
  path: ["phone"]
});

export default function Withdraw() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wallet } = useGetWallet({
    query: { queryKey: getGetWalletQueryKey() }
  });

  const { data: withdrawals, isLoading: listLoading } = useListWithdrawals({
    query: { queryKey: getListWithdrawalsQueryKey() }
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 100, currency: "KSH", phone: "" },
  });

  const withdrawMutation = useRequestWithdrawal({
    mutation: {
      onSuccess: () => {
        toast({ title: "Withdrawal Requested", description: "Your request is pending admin approval." });
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListWithdrawalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
      },
      onError: (error: any) => {
        toast({ title: "Request Failed", description: error.message || "Failed to request withdrawal", variant: "destructive" });
      }
    }
  });

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-50">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Withdraw Funds</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Request Withdrawal</CardTitle>
              <CardDescription>Withdraw your earnings to M-Pesa (KSh) or Crypto Wallet (USDT).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex gap-4 text-sm">
                <div className="bg-slate-100 p-3 rounded-md flex-1">
                  <p className="text-slate-500">Available KSh</p>
                  <p className="font-bold text-lg">KSh {wallet?.kshBalance?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-slate-100 p-3 rounded-md flex-1">
                  <p className="text-slate-500">Available USDT</p>
                  <p className="font-bold text-lg">${wallet?.usdtBalance?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => withdrawMutation.mutate({ data: d }))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="KSH">KSh (M-Pesa)</SelectItem>
                            <SelectItem value="USDT">USDT (Crypto)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("currency") === "KSH" && (
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>M-Pesa Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="2547XXXXXXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <Button type="submit" className="w-full" disabled={withdrawMutation.isPending}>
                    {withdrawMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {listLoading ? (
                <p className="text-slate-500">Loading...</p>
              ) : withdrawals && withdrawals.length > 0 ? (
                <div className="space-y-4">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="flex justify-between items-center p-3 bg-white border rounded-md">
                      <div>
                        <p className="font-bold text-slate-900">{w.amount} {w.currency}</p>
                        <p className="text-xs text-slate-500">{new Date(w.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge variant={w.status === "pending" ? "secondary" : w.status === "approved" ? "default" : "destructive"}>
                        {w.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">No withdrawal requests.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
