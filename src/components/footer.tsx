
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const logo = PlaceHolderImages.find(img => img.id === 'brand-logo');

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/20 px-[1.25rem] pb-10 pt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 mb-16 md:grid-cols-[2fr_1fr]">
          <div className="min-w-0">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="relative h-8 w-auto shrink-0">
                {logo && (
                  <Image
                    src={logo.imageUrl}
                    alt="all9s Logo"
                    width={128}
                    height={80}
                    className="h-8 w-auto object-contain"
                    data-ai-hint={logo.imageHint}
                  />
                )}
              </div>
              <span className="text-xl font-bold text-foreground">all9s <span className="text-primary">Solutions</span></span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Providing custom software development, web development, technology consulting, database solutions,
              business automation, and digital transformatoin services focused on reliability, efficiency, and long-term
              growth.
            </p>
          </div>
          
          <div className="md:ml-auto md:w-max md:text-right">
            <h4 className="font-bold mb-6 text-foreground">Company</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/lifecycle-services" className="hover:text-primary transition-colors">
                  Lifecycle Services
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@all9ssolutions.com?subject=Contact%20all9s%20Solutions&body=Tell%20us%20how%20we%20can%20help."
                  className="hover:text-primary transition-colors"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground font-medium">
          <p>© {new Date().getFullYear()} all9s Solutions LLC. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="/privacy" className="transition-colors hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
