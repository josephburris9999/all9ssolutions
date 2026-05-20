import type { Metadata } from 'next';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const aboutIntroImage = PlaceHolderImages.find((img) => img.id === 'about-intro');

export const metadata: Metadata = {
  title: 'About Us | all9s Solutions',
  description:
    'all9s Solutions builds reliable, scalable software, web applications, databases, automation, and technology consulting for businesses and organizations.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-background px-[1.25rem] pb-16 pt-28 md:pb-20 md:pt-32">
        <div className="iso-neon-grid-layer" aria-hidden>
          <div className="iso-neon-grid-layer-drift" />
        </div>
        <div className="absolute top-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground md:text-4xl">About Us</h1>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-2xl flex-1 space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p>
                <span className="text-xl font-bold tracking-tight text-foreground">
                  all9s <span className="text-primary">Solutions</span>
                </span>{' '}
                is a software and web development consulting company focused on building reliable, scalable, and modern
                digital solutions for businesses and organizations.
              </p>
              <p>
                We specialize in custom software development, web development, technology consulting, database
                solutions, business automation, and digital transformation services tailored to real-world operational
                needs.
              </p>
              <p>
                Our approach combines technical precision, problem-solving, and modern development practices to create
                solutions that improve efficiency, strengthen digital infrastructure, and support long-term growth.
              </p>
            </div>
            {aboutIntroImage && (
              <div className="relative mx-auto aspect-square w-full max-w-md shrink-0 overflow-hidden max-md:hidden lg:mx-0 lg:max-w-[min(100%,440px)]">
                <Image
                  src={aboutIntroImage.imageUrl}
                  alt={aboutIntroImage.description}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 440px"
                  priority
                  unoptimized
                  data-ai-hint={aboutIntroImage.imageHint}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-background px-[1.25rem] py-24">
        <div className="absolute top-0 left-1/2 h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold text-foreground">Our Approach</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Building Solutions Around Your Vision
            </p>
          </div>
          <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center lg:gap-x-12 lg:gap-y-0">
            <div className="max-w-2xl flex-1 space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p>
                We approach every client relationship as a strategic partnership. We take the time to understand your
                business objectives, operational challenges, and long-term technology goals before designing solutions
                tailored to your environment. Our focus is not just on delivering technology, but on building scalable,
                reliable systems that create measurable value, support growth, and evolve alongside your business.
              </p>
            </div>
            <div className="mx-auto w-full max-w-[min(100%,440px)] shrink-0 max-md:hidden lg:mx-0">
              <Image
                src="/clients.png"
                alt="Client partnership consultation with business technology dashboard"
                width={500}
                height={333}
                className="h-auto w-full rounded-3xl"
                sizes="(max-width: 1024px) 100vw, 440px"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-secondary/30 px-[1.25rem] py-24">
        <div className="container relative z-10 mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-2 text-3xl font-bold text-foreground">Founder Bio</h2>
          </div>
          <div className="mx-auto w-full max-w-6xl space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>
              Joseph Burris is the Founder of all9s Solutions. With experience spanning software engineering, web
              development, technical instruction, and systems-focused problem solving, Joseph brings a practical,
              client-centered approach to technology and digital transformation.
            </p>
            <div className="flex flex-row flex-nowrap items-center gap-6 sm:gap-x-10">
              <div className="hidden w-[100px] shrink-0 overflow-hidden rounded-xl sm:block">
                <Image
                  src="/founder.png"
                  alt="Joseph Burris, Founder of all9s Solutions"
                  width={100}
                  height={133}
                  className="h-auto w-[100px] object-cover"
                  sizes="100px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p>
                  His background includes development work across Java, JavaScript, Python, PHP, SQL, HTML5, and CSS3,
                  with a focus on creating reliable applications, modern web experiences, and streamlined operational
                  solutions. In addition to development work, Joseph has experience mentoring and teaching technical
                  subjects, helping others build both technical skills and confidence in technology-driven environments.
                </p>
              </div>
            </div>
            <p>
              Joseph founded all9s Solutions with the belief that technology should simplify complexity, support growth,
              and create long-term value for clients. The company&apos;s approach emphasizes collaboration, adaptability,
              responsive support, and scalable engineering designed around real business goals.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
