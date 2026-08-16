import { cn } from "@/shared/lib/cn";
import { LinkIcon } from "@/ui/icons";
import { iconActionBaseClassName } from "@/ui/primitives";

export function ItemLink({ link }: { link: string | null }) {
  if (!link) return null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver produto"
      className={cn(
        iconActionBaseClassName,
        "bg-surface-alt text-ink-soft hover:bg-surface hover:text-jade size-[30px]",
      )}
    >
      <LinkIcon />
    </a>
  );
}
