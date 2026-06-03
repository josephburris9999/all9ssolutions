import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Lifecycle Services | all9s Solutions',
  description:
    'How all9s Solutions supports clients across discovery, delivery, operations, and evolution of custom software and web solutions.',
};

const lifecyclePhases = [
  {
    title: 'Discovery & Planning',
    description:
      'We begin by understanding business objectives, operational challenges, technical requirements, and long-term goals to establish a clear project foundation.',
    imageSrc: '/01_idea_strategy_vine.png',
    imageAlt: 'Idea and strategy — discovery and planning',
  },
  {
    title: 'Solution Design & Development',
    description:
      'Applications and systems are designed and built using modern technologies and proven development practices, created with performance, reliability, scalability, and future growth in mind.',
    imageSrc: '/02_system_design_vine.png',
    imageAlt: 'System design — solution design and development',
  },
  {
    title: 'Testing & Optimization',
    description:
      'Applications and systems are evaluated for performance, usability, reliability, and operational efficiency before deployment.',
    imageSrc: '/03_project_review_vine.png',
    imageAlt: 'Project review — testing and optimization',
  },
  {
    title: 'Deployment & Implementation',
    description:
      'We assist with deployment, configuration, migration, and production readiness to ensure smooth implementation into existing environments.',
    imageSrc: '/04_cloud_deployment_vine.png',
    imageAlt: 'Cloud deployment — deployment and implementation',
  },
  {
    title: 'Ongoing Support & Maintenance',
    description:
      'Post-deployment services include monitoring, troubleshooting, updates, performance improvements, and long-term technical support.',
    imageSrc: '/05_support_maintenance_vine.png',
    imageAlt: 'Support and maintenance — ongoing support',
  },
  {
    title: 'Continuous Improvement',
    description:
      'As technology and business needs evolve, solutions can be refined, expanded, and optimized to support continued growth and operational efficiency.',
    imageSrc: '/06_growth_optimization_vine.png',
    imageAlt: 'Growth and optimization — continuous improvement',
  },
] as const;

type LifecyclePhaseRowProps = {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageFirst?: boolean;
};

function LifecyclePhaseRow({
  title,
  description,
  imageSrc,
  imageAlt,
  imageFirst = false,
}: LifecyclePhaseRowProps) {
  const imageColumn = (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-[200px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card/50 sm:mx-0 sm:w-[200px]">
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        className="object-contain p-4"
        sizes="(max-width: 640px) 100vw, 200px"
      />
    </div>
  );

  const textColumn = (
    <div className="w-full flex-1 space-y-2">
      <h2 className="text-3xl font-bold text-foreground">{title}</h2>
      <p className="text-lg leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <div
      className={
        imageFirst
          ? 'flex flex-col gap-10 sm:grid sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center sm:gap-x-12'
          : 'flex flex-col gap-10 sm:grid sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center sm:gap-x-12'
      }
    >
      {imageFirst ? (
        <>
          {imageColumn}
          {textColumn}
        </>
      ) : (
        <>
          {textColumn}
          {imageColumn}
        </>
      )}
    </div>
  );
}

export default function LifecycleServicesPage() {
  return (
    <main className="min-h-screen">
      <section className="relative flex min-h-screen items-center overflow-hidden bg-background px-[1.25rem] pb-[1.25rem] pt-20">
        <div className="iso-neon-grid-layer" aria-hidden>
          <div className="iso-neon-grid-layer-drift" />
        </div>
        <div className="pointer-events-none absolute top-1/4 -left-20 z-[0] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-5rem] bottom-1/4 z-[0] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div
          className="pointer-events-none absolute inset-0 z-[2] opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container relative z-10 mx-auto px-4">
          <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Lifecycle Services</h1>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-2xl flex-1 space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p className="text-lg text-muted-foreground md:text-xl">
                Complete Development & Support Lifecycle Services
              </p>
              <p>
                all9s Solutions provides comprehensive lifecycle services designed to support technology initiatives from
                initial planning through long-term maintenance and optimization. Our approach combines strategic
                development, scalable engineering, deployment support, and ongoing system management to help
                organizations maintain reliable, adaptable, and efficient digital environments.
              </p>
              <p>
                We work closely with clients throughout every phase of the technology lifecycle, ensuring solutions
                remain aligned with operational goals, performance expectations, and evolving business requirements.
              </p>
            </div>
            <div className="relative mx-auto aspect-square w-full max-w-md shrink-0 overflow-hidden lg:mx-0 lg:max-w-[min(100%,440px)]">
              <Image
                src="/lifecycle-tree.png"
                alt="Lifecycle services roadmap tree"
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 440px"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-background px-[1.25rem] py-24">
        <div className="absolute top-0 left-1/2 z-[1] h-[1px] w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container relative z-10 mx-auto space-y-16 px-4">
          {lifecyclePhases.map((phase) => (
            <LifecyclePhaseRow key={phase.title} {...phase} />
          ))}
        </div>
      </section>
    </main>
  );
}
