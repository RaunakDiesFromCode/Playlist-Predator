import Link from "next/link";

export default function SidebarItem({
    title,
    href,
    active,
}: {
    title: string;
    href: string;
    active?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`block px-3 py-2 rounded-md text-sm truncate ${
                active ? "bg-muted font-medium" : "hover:bg-muted/50"
            }`}
        >
            {title}
        </Link>
    );
}
