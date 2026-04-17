import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
            Earn by Chatting 💬💰
          </h1>
          <p className="text-xl text-slate-600">
            Connect with international clients, provide excellent conversation, and get paid instantly via M-Pesa.
          </p>
          <div className="pt-8 flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Start Earning</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
