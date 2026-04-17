import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useInitiateDeposit } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const schema = z.object({
  phone: z.string().min(10, "Valid phone number required (e.g. 254712345678)"),
  amount: z.coerce.number().min(1, "Amount must be at least 1 KSh"),
});

export default function Deposit() {
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", amount: 100 },
  });

  const depositMutation = useInitiateDeposit({
    mutation: {
      onSuccess: (data) => {
        setStatus("pending");
        setMessage(data.message || "Please check your phone to complete the M-Pesa STK push.");
        toast({ title: "STK Push Initiated", description: "Check your phone to enter your M-Pesa PIN." });
      },
      onError: (error: any) => {
        setStatus("error");
        setMessage(error.message || "Failed to initiate deposit.");
        toast({ title: "Deposit Failed", description: error.message, variant: "destructive" });
      }
    }
  });

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-50">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Deposit via M-Pesa</h1>
        
        <div className="max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Top up your KSh Balance</CardTitle>
              <CardDescription>Enter your M-Pesa registered phone number and amount.</CardDescription>
            </CardHeader>
            <CardContent>
              {status === "pending" && (
                <Alert className="mb-6 bg-blue-50 border-blue-200">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <AlertTitle className="text-blue-800">Pending Payment</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    {message}
                  </AlertDescription>
                </Alert>
              )}
              {status === "error" && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => depositMutation.mutate({ data: d }))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (e.g. 2547XXXXXXXX)</FormLabel>
                        <FormControl>
                          <Input placeholder="254712345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (KSh)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={depositMutation.isPending || status === "pending"}>
                    {depositMutation.isPending ? "Processing..." : "Initiate M-Pesa Payment"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
