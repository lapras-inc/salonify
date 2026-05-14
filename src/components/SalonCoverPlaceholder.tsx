type Variant = 'a' | 'b' | 'c';

export function SalonCoverPlaceholder({
  title,
  category,
  variant = 'a',
}: {
  title: string;
  category?: string;
  variant?: Variant;
}) {
  return (
    <div data-cover={variant} className="aspect-[16/9]">
      <div className="cover-ph w-full h-full">
        <div className="cover-ph__corner">SALON</div>
        <div className="cover-ph__corner cover-ph__corner--r">{category}</div>
        <div className="cover-ph__title">{title}</div>
      </div>
    </div>
  );
}
