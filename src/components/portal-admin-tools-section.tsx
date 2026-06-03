export function PortalAdminToolsSection() {
  return (
    <section className="mt-12 max-w-3xl" aria-labelledby="portal-admin-tools-heading">
      <h2 id="portal-admin-tools-heading" className="mb-2 text-2xl font-bold text-foreground">
        Admin tools
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Use the navigation on the left to open client, communication, billing, and settings sections as they are
        added.
      </p>

      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Additional admin features will appear here as they are added.
        </p>
      </div>
    </section>
  );
}
