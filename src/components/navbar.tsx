
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const logo = PlaceHolderImages.find((img) => img.id === 'brand-logo');

const navLinks = [
  { href: '/#services', label: 'Services' },
  { href: '/#partners', label: 'Partners' },
  { href: '/#consultation', label: 'Consultation' },
  { href: '/portal', label: 'Portal' },
] as const;

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative h-10 w-auto shrink-0 transition-transform group-hover:scale-110">
            {logo && (
              <Image
                src={logo.imageUrl}
                alt="all9s Logo"
                width={160}
                height={100}
                className="h-10 w-auto object-contain"
                priority
                data-ai-hint={logo.imageHint}
              />
            )}
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            all9s <span className="text-primary">Solutions</span>
          </span>
        </Link>

        <div className="flex items-center gap-4 ml-auto">
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium hover:text-primary transition-colors text-foreground/80 hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0 text-foreground"
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100%,20rem)] border-border bg-background">
              <SheetHeader className="text-left">
                <SheetTitle className="text-foreground">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-10 flex flex-col gap-1" aria-label="Mobile">
                {navLinks.map(({ href, label }) => (
                  <SheetClose asChild key={href}>
                    <Link
                      href={href}
                      className="rounded-lg px-3 py-3 text-base font-medium text-foreground/90 transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      {label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
