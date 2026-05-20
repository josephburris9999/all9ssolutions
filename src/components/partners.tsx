"use client";

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const partnerImages = PlaceHolderImages.filter(img => img.id.startsWith('partner'));

export function Partners() {
  return (
    <section id="partners" className="bg-secondary/30 px-[1.25rem] py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Our Strategic Partners</h2>
          <p className="text-muted-foreground">Collaborating with industry leaders to deliver unparalleled expertise.</p>
        </div>

        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-10 px-2 md:gap-16 md:px-6">
          {partnerImages.map((partner) => (
            <div key={partner.id} className="w-full max-w-[28.8rem] shrink-0 sm:w-[21.6rem] md:w-96">
              <div className="relative h-48 w-full overflow-hidden rounded-xl border border-border bg-[color-mix(in_srgb,hsl(var(--card))_80%,black_20%)] grayscale transition-all hover:grayscale-0 group cursor-pointer md:h-[13.2rem]">
                <Image
                  src={partner.imageUrl}
                  alt={partner.description}
                  fill
                  className="object-contain opacity-75 transition-opacity group-hover:opacity-100"
                  data-ai-hint={partner.imageHint}
                  sizes="(max-width: 640px) 100vw, 24rem"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
