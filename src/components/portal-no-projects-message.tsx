type PortalNoProjectsMessageProps = {
  title?: string;
  description?: string;
};

export function PortalNoProjectsMessage({
  title = 'No projects yet',
  description = 'There are no projects linked to this account. Contact all9s Solutions if you believe this is an error.',
}: PortalNoProjectsMessageProps) {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-background px-[1.25rem] pb-16 pt-28 md:pb-20 md:pt-32">
        <div className="container relative z-10 mx-auto px-4">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">{title}</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">{description}</p>
        </div>
      </section>
    </main>
  );
}
