import { LinkIcon } from "@/ui/icons";

const ACTION_BUTTON_BASE =
  "shadow-control hover:shadow-control-hover active:shadow-control-active focus-visible:shadow-control-focus inline-flex size-[30px] cursor-pointer items-center justify-center rounded-[5px] transition-[background-color,box-shadow] duration-100 focus-visible:outline-none";
const NEUTRAL_ACTION_BUTTON = `${ACTION_BUTTON_BASE} bg-surface-alt text-ink-soft hover:bg-surface hover:text-accent`;

export function ItemLink({ link }: { link: string | null }) {
  if (!link) return null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver produto"
      className={NEUTRAL_ACTION_BUTTON}
    >
      <LinkIcon />
    </a>
  );
}
