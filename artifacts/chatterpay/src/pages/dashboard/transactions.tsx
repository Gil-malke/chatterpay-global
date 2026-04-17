import { Sidebar } from "@/components/layout/sidebar";
import { useListTransactions, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Transactions() {
  const { data: transactions, isLoading } = useListTransactions({
    query: { queryKey: getListTransactionsQueryKey() }
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'deposit': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Deposit</Badge>;
      case 'withdrawal': return <Badge variant="outline" className="text-amber-600 border-amber-200">Withdrawal</Badge>;
      case 'earning': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Earning</Badge>;
      case 'contract_purchase': return <Badge variant="secondary">Contract</Badge>;
      default: return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-50">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Transactions</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-slate-500">Loading...</p>
            ) : transactions && transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-slate-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{getTypeBadge(tx.type)}</TableCell>
                      <TableCell className="text-slate-700">{tx.description || '-'}</TableCell>
                      <TableCell className={`text-right font-mono font-medium ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.currency}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No transactions found.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
