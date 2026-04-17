import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50">
      <div className="flex items-center gap-2 text-primary font-bold text-xl">
        <Link href="/">ChatterPay</Link>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link href="/register">Register</Link>
        </Button>
      </div>
    </nav>
  );
}
