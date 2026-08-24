export default function PageHeader({
  title,
  description,
  eyebrow = "IUB Cricket Club",
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <div className="animate-fade-up mb-12 flex flex-col gap-4">
      <span className="section-eyebrow">{eyebrow}</span>
      <h1 className="font-heading text-4xl font-semibold tracking-tight text-navy sm:text-5xl">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-base leading-relaxed text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
