import Link from "next/link";

export default function SidebarItem({
    title,
    href,
    active,
    onClickAction,
}: {
    title: string;
    href: string;
    active?: boolean;
    onClickAction?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onClickAction}
            className={`
                block px-3 py-2 rounded-md text-sm truncate
                transition-colors
                ${active ? "bg-muted font-medium" : "hover:bg-muted/50"}
            `}
        >
            {title}
        </Link>
    );
}
