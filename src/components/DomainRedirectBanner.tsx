"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const OLD_DOMAIN = "playlist-predator.vercel.app";
const NEW_DOMAIN = "predator.raunakm.xyz";

export default function DomainRedirectBanner() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (window.location.hostname === OLD_DOMAIN) {
            setOpen(true);
        }
    }, []);

    if (!open) return null;

    const redirectUrl = `https://${NEW_DOMAIN}${pathname}`;

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        We&apos;ve moved!
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Playlist Predator is now at{" "}
                        <span className="font-semibold text-foreground">
                            {NEW_DOMAIN}
                        </span>
                        . The old domain will be retired soon. Please update
                        your bookmarks.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Close</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            window.location.href = redirectUrl;
                        }}
                    >
                        Redirect me there
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
