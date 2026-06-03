"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const logo = PlaceHolderImages.find((img) => img.id === 'brand-logo');

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-[1.25rem] pb-[1.25rem] pt-20">
      <div className="iso-neon-grid-layer" aria-hidden>
        <div className="iso-neon-grid-layer-drift" />
      </div>
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 -left-20 z-[0] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 z-[0] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Glowing purple wave streaks */}
      <div
        className="hero-wave-streaks pointer-events-none absolute inset-0 z-[1] opacity-[0.42] sm:opacity-50"
        aria-hidden
      >
        <svg
          className="absolute left-1/2 top-1/2 h-[140%] min-h-[800px] w-[140%] min-w-[1200px] -translate-x-1/2 -translate-y-1/2"
          viewBox="0 0 2000 1200"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="heroWaveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(262 83% 58% / 0)" />
              <stop offset="35%" stopColor="hsl(262 83% 70% / 0.85)" />
              <stop offset="65%" stopColor="hsl(262 83% 58% / 0.9)" />
              <stop offset="100%" stopColor="hsl(262 83% 58% / 0)" />
            </linearGradient>
            <filter id="heroWaveGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#heroWaveGlow)" stroke="url(#heroWaveStroke)" fill="none" strokeLinecap="round">
            <path className="hero-wave-path" strokeWidth="2.5" d="M-80,420 C280,260 520,580 840,420 S1520,260 2080,420" />
            <path className="hero-wave-path" strokeWidth="2" d="M-80,520 C360,360 640,680 920,520 S1560,340 2080,520" />
            <path className="hero-wave-path" strokeWidth="3" d="M-80,620 C320,480 680,820 980,620 S1580,420 2080,620" />
            <path className="hero-wave-path" strokeWidth="1.8" d="M-80,320 C400,160 560,520 900,320 S1480,180 2080,320" />
            <path className="hero-wave-path" strokeWidth="2.2" d="M-80,720 C340,560 720,900 1000,720 S1620,520 2080,720" />
            <path className="hero-wave-path" strokeWidth="1.5" d="M-80,260 C300,120 640,400 860,260 S1440,100 2080,260" />
          </g>
        </svg>
      </div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 z-[2] opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} 
      />

      <div className="container mx-auto px-4 text-center z-10">
        <h1 className="mt-6 text-4xl md:text-[3.375rem] lg:text-7xl font-black tracking-tight mb-8 fade-in-up text-foreground leading-[1.1]">
          Building Solutions. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/60 to-primary bg-[length:200%_auto] animate-gradient">Powering Growth.</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12 fade-in-up font-medium" style={{ animationDelay: '0.2s' }}>
          Custom software and web solutions to drive your business forward.
        </p>
        
        <div
          className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-10 rounded-full text-lg font-extrabold shadow-[0_0_20px_rgba(123,58,237,0.3)] transition-all hover:scale-105">
                Explore Our Stack
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card border-border gap-3 p-4 sm:p-5">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex flex-row items-center gap-3 pr-8">
                  {logo && (
                    <div className="relative h-10 w-auto shrink-0">
                      <Image
                        src={logo.imageUrl}
                        alt="all9s Logo"
                        width={160}
                        height={100}
                        className="h-10 w-auto object-contain"
                        data-ai-hint={logo.imageHint}
                      />
                    </div>
                  )}
                  Enterprise Stack Explorer
                </DialogTitle>
              </DialogHeader>
              <div className="border border-border rounded-3xl bg-secondary/10 px-4 py-4 sm:px-5 sm:py-5">
                <p className="text-left text-base sm:text-lg leading-relaxed text-muted-foreground">
                  all9s Solutions utilizes a modern full-stack technology focused on scalable software engineering,
                  responsive web development, database integration, business automation, and digital transformation
                  services.
                </p>
                <div className="mt-5 text-left">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Core Technologies</h3>
                  <ul className="list-disc list-outside space-y-2 pl-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
                    <li>Backend: Java, Python, PHP</li>
                    <li>Frontend: JavaScript/TypeScript, HTML5/CSS3</li>
                    <li>Databases: Microsoft SQL Server, IBM Db2 for i, MySQL</li>
                    <li>APIs & Integrations</li>
                    <li>Business Automation & Workflow Systems</li>
                    <li>Web & Application Infrastructure</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 rounded-full border-primary/35 bg-background/60 px-10 text-lg font-extrabold text-foreground backdrop-blur-sm transition-all hover:scale-105 hover:border-primary/60 hover:bg-secondary/40"
          >
            <Link href="/#consultation">
              Request Consultation
              <MessageSquare className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-700 fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-muted-foreground/30" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Secure Development Practices</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-muted-foreground/30" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Reliable Client Support</span>
          </div>
        </div>
      </div>
    </section>
  );
}
