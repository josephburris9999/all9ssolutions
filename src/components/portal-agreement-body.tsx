import type { PortalAgreementSection } from '@/lib/portal-agreement';

type PortalAgreementBodyProps = {
  section: PortalAgreementSection;
};

export function PortalAgreementBody({ section }: PortalAgreementBodyProps) {
  if (section.subsections) {
    return (
      <div className="space-y-3">
        {section.subsections.map((subsection) => (
          <div key={subsection.title}>
            <p className="font-bold text-foreground">{subsection.title}</p>
            <p className="whitespace-pre-line">{subsection.body}</p>
          </div>
        ))}
      </div>
    );
  }

  return <p className="whitespace-pre-line">{section.body}</p>;
}
