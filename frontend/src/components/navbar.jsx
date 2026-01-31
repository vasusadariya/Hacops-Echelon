"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";


import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/language-switcher";

import { Search, Menu, X, LogOut, User, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Navbar() {
  const t = useTranslations();
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide navbar on auth pages
  if (
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password")
  ) {
    return null;
  }

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <>
      {/* 🏛 Main Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">

            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 flex items-center justify-center bg-muted rounded-md">
                🏛️
              </div>
              <div>
                <h1 className="text-lg font-semibold">
                  National Identity Verification Portal
                </h1>
                <p className="text-xs text-muted-foreground">
                  Government of India (Mock)
                </p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <Link href="/" className="hover:text-primary">{t('common.home')}</Link>
              <Link href="#" className="hover:text-primary">{t('common.aboutVerification')}</Link>
              <Link href="#" className="hover:text-primary">{t('common.services')}</Link>
              <Link href="#" className="hover:text-primary">{t('common.help')}</Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">

              <button className="p-2 hover:bg-accent rounded-md">
                <Search className="w-5 h-5" />
              </button>

              <Link href="#" className="text-xs border px-2 py-1 rounded">
                {t('navbar.fontSize')}
              </Link>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* AUTH SECTION */}
              {loading ? (
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <User className="mr-2 h-4 w-4" />
                        {t('common.dashboard')}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      {t('common.settings')}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={logout}
                      className="text-destructive cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('common.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link href="/auth">
                    <Button variant="outline" className="hidden sm:inline-flex">
                      {t('common.login')}
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button className="hidden sm:inline-flex">
                      {t('common.register')}
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>

          {/* 📱 Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 border-t pt-4 space-y-3 text-sm">
              <Link href="/" className="block">{t('common.home')}</Link>
              <Link href="#" className="block">{t('common.aboutVerification')}</Link>
              <Link href="#" className="block">{t('common.services')}</Link>
              <Link href="#" className="block">{t('common.help')}</Link>

              {!user && (
                <div className="flex gap-2 pt-2">
                  <Link href="/auth" className="flex-1">
                    <Button variant="outline" className="w-full">
                      {t('common.login')}
                    </Button>
                  </Link>
                  <Link href="/auth" className="flex-1">
                    <Button className="w-full">
                      {t('common.register')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
}