"use client";

import { useAuth } from "../../store/useAuth";
import { Button } from "../ui/button";
import { LogOut, User } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto px-4">
        <div className="flex items-center space-x-4">
          <a href="/" className="font-bold tracking-tight text-primary flex items-center gap-2">
            <span className="h-6 w-6 rounded bg-primary text-white flex items-center justify-center text-xs">W</span>
            WinRepo
          </a>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User size={16} />
                {user.name} ({user.role})
              </span>
              <Button variant="ghost" size="sm" onClick={() => logout()} className="gap-2">
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          ) : (
            <Button variant="default" size="sm" asChild>
              <a href="/login">Login</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
