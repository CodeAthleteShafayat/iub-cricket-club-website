export default function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-10 flex flex-col gap-3">
      <span className="section-eyebrow" />
      <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-sm text-muted sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
