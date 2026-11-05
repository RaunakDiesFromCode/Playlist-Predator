import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    Check,
    Chrome,
    Download,
    ExternalLink,
    Github,
    Info,
    Layers,
    Play,
    RefreshCw,
    Shield,
    Terminal,
    Youtube,
    Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const GITHUB_EXTENSION_URL =
    "https://github.com/RaunakDiesFromCode/Playlist-Predator/tree/main/extension";
const CHROME_LOAD_UNPACKED_IMAGE =
    "https://developer.chrome.com/static/docs/extensions/get-started/tutorial/hello-world/image/extensions-page-e0d64d89a6acf_1920.png";

export const metadata: Metadata = {
    title: "YouTube Sync Extension — Documentation & Setup Guide",
    description:
        "Complete setup and implementation guide for the Playlist Predator YouTube Auto-Sync Chrome Extension. Effortlessly track your study progress.",
};

export default function ExtensionDocsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Top Navigation & Breadcrumb */}
            <div className="border-b border-border bg-muted/10 sticky top-10 z-30 backdrop-blur supports-backdrop-filter:bg-background/80">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Playlist Predator</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="rounded-none h-8 text-xs font-mono gap-1.5"
                        >
                            <a
                                href="/api/extension/download"
                                download="playlist-predator-extension.zip"
                            >
                                <Download className="h-3.5 w-3.5 text-primary" />
                                <span>Download .zip</span>
                            </a>
                        </Button>
                        <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="rounded-none h-8 text-xs font-mono gap-1.5 hidden sm:inline-flex"
                        >
                            <a
                                href={GITHUB_EXTENSION_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Github className="h-3.5 w-3.5" />
                                <span>GitHub</span>
                            </a>
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 space-y-16">
                {/* Hero Section */}
                <header className="space-y-6">

                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono">
                        Introducing Hassle-Free <br className="hidden sm:inline" />
                        Playlist Sync
                    </h1>

                    <p className="text-base sm:text-xl text-muted-foreground max-w-3xl leading-relaxed font-sans">
                        Automatically sync your YouTube watch progress directly to your active
                        study playlist in Playlist Predator. No manual checklist ticking, no
                        distractions — just learn, watch, and let your progress update itself.
                    </p>

                    {/* Download & Setup CTA Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Button asChild className="rounded-none font-mono text-xs sm:text-sm h-10 px-5 gap-2">
                            <a
                                href="/api/extension/download"
                                download="playlist-predator-extension.zip"
                            >
                                <Download className="h-4 w-4" />
                                <span>Download Extension (.zip)</span>
                            </a>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="rounded-none font-mono text-xs sm:text-sm h-10 px-4 gap-2"
                        >
                            <a
                                href={GITHUB_EXTENSION_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Github className="h-4 w-4" />
                                <span>Clone from GitHub</span>
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </a>
                        </Button>
                        <Button
                            asChild
                            variant="ghost"
                            className="rounded-none font-mono text-xs sm:text-sm h-10 px-4 gap-2 text-muted-foreground hover:text-foreground"
                        >
                            <a href="#quick-setup">
                                <Chrome className="h-4 w-4" />
                                <span>Installation Steps</span>
                            </a>
                        </Button>
                    </div>
                </header>

                <Separator className="bg-border" />

                {/* Section 1: Core Capabilities */}
                <section className="space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight flex items-center gap-2.5">
                            <Zap className="h-5 w-5 text-primary" />
                            Why Use the Extension?
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Designed specifically for students, self-taught developers, and lifelong learners tackling video courses.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="rounded-none border-border bg-card">
                            <CardHeader className="pb-3">
                                <div className="h-8 w-8 rounded-none bg-red-500/10 text-red-500 flex items-center justify-center font-bold mb-1">
                                    <Youtube className="h-4 w-4" />
                                </div>
                                <CardTitle className="text-base font-semibold font-mono">
                                    Auto-Done at 85%
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                When you watch any lesson on YouTube past 85% of its duration (or when it completes),
                                the extension automatically records the video as <strong className="text-foreground">DONE</strong> in Playlist Predator.
                            </CardContent>
                        </Card>

                        <Card className="rounded-none border-border bg-card">
                            <CardHeader className="pb-3">
                                <div className="h-8 w-8 rounded-none bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold mb-1">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <CardTitle className="text-base font-semibold font-mono">
                                    Active Playlist Isolation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                The extension only monitors the playlist you currently have open on Playlist Predator.
                                Watching music videos or random tutorials will never pollute your study courses.
                            </CardContent>
                        </Card>

                        <Card className="rounded-none border-border bg-card">
                            <CardHeader className="pb-3">
                                <div className="h-8 w-8 rounded-none bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold mb-1">
                                    <Check className="h-4 w-4" />
                                </div>
                                <CardTitle className="text-base font-semibold font-mono">
                                    Preserves Manual States
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Videos marked as <strong className="text-foreground">REWATCH</strong> or <strong className="text-foreground">SKIP</strong> are strictly respected and will never be downgraded or overwritten.
                            </CardContent>
                        </Card>

                        <Card className="rounded-none border-border bg-card">
                            <CardHeader className="pb-3">
                                <div className="h-8 w-8 rounded-none bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold mb-1 font-mono text-xs">
                                    0Auth
                                </div>
                                <CardTitle className="text-base font-semibold font-mono">
                                    No YouTube Login
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                No YouTube API keys, Google credentials, or OAuth permissions required. Operates completely through your existing Playlist Predator account.
                            </CardContent>
                        </Card>

                        <Card className="rounded-none border-border bg-card">
                            <CardHeader className="pb-3">
                                <div className="h-8 w-8 rounded-none bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold mb-1">
                                    <RefreshCw className="h-4 w-4" />
                                </div>
                                <CardTitle className="text-base font-semibold font-mono">
                                    Multi-Tab Real-Time Sync
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                As soon as a video completes on YouTube, your open Playlist Predator tabs are signaled in real-time, instantly advancing your course progress bar.
                            </CardContent>
                        </Card>

                        <Card className="rounded-none border-border bg-card">
                            <CardHeader className="pb-3">
                                <div className="h-8 w-8 rounded-none bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold mb-1">
                                    <Chrome className="h-4 w-4" />
                                </div>
                                <CardTitle className="text-base font-semibold font-mono">
                                    Chromium Universal
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                Built with modern Chrome Extension Manifest V3. Compatible with Google Chrome, Brave Browser, Microsoft Edge, Arc, and Opera.
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Section 2: Quick Setup & Installation */}
                <section id="quick-setup" className="space-y-6 scroll-mt-20">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="rounded-none border-primary text-primary font-mono text-xs">
                                SETUP GUIDE
                            </Badge>
                        </div>
                        <h2 className="text-xl sm:text-3xl font-bold font-mono tracking-tight">
                            Installation in 3 Steps
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Load the extension in any Chromium-based browser via Developer Mode in under 60 seconds.
                        </p>
                    </div>

                    {/* Numbered Detailed Instructions without the old install diagram */}
                    <div className="space-y-4">
                        {/* Step 1 */}
                        <div className="border border-border bg-muted/10 p-5 rounded-none space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="h-7 w-7 rounded-none bg-primary text-primary-foreground font-mono font-bold text-sm flex items-center justify-center">
                                    1
                                </span>
                                <h3 className="font-mono font-semibold text-base">
                                    Download or Clone the Extension
                                </h3>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground pl-10 leading-relaxed">
                                Choose whichever method suits your setup: download the ready-to-use zip file and extract it, or clone directly from the GitHub repository.
                            </p>

                            <div className="pl-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div className="border border-border bg-card p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-semibold text-xs text-foreground flex items-center gap-1.5">
                                            <Download className="h-3.5 w-3.5 text-primary" />
                                            Option A: ZIP Download
                                        </span>
                                        <Badge variant="secondary" className="rounded-none text-[10px]">
                                            FASTEST
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Download and unzip the folder to any convenient location on your computer.
                                    </p>
                                    <Button asChild size="sm" className="rounded-none h-8 w-full font-mono text-xs gap-1.5">
                                        <a
                                            href="/api/extension/download"
                                            download="playlist-predator-extension.zip"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            <span>Download .zip (25 KB)</span>
                                        </a>
                                    </Button>
                                </div>

                                <div className="border border-border bg-card p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-semibold text-xs text-foreground flex items-center gap-1.5">
                                            <Github className="h-3.5 w-3.5" />
                                            Option B: Clone GitHub Repo
                                        </span>
                                        <Badge variant="outline" className="rounded-none text-[10px]">
                                            GIT
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Clone the repository or navigate to the extension source folder.
                                    </p>
                                    <Button asChild size="sm" variant="outline" className="rounded-none h-8 w-full font-mono text-xs gap-1.5">
                                        <a
                                            href={GITHUB_EXTENSION_URL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Github className="h-3.5 w-3.5" />
                                            <span>View on GitHub ↗</span>
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            <div className="pl-10 pt-1">
                                <div className="border border-border bg-black/60 p-3 font-mono text-xs text-muted-foreground space-y-1">
                                    <div className="text-muted-foreground/80 text-[11px]">Git clone command:</div>
                                    <div className="text-foreground select-all">
                                        git clone https://github.com/RaunakDiesFromCode/Playlist-Predator.git
                                    </div>
                                    <div className="text-primary text-[11px] pt-1">
                                        → Folder to load: <code className="text-foreground font-bold">Playlist-Predator/extension</code>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="border border-border bg-muted/10 p-5 rounded-none space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="h-7 w-7 rounded-none bg-primary text-primary-foreground font-mono font-bold text-sm flex items-center justify-center">
                                    2
                                </span>
                                <h3 className="font-mono font-semibold text-base">
                                    Open Extensions &amp; Enable Developer Mode
                                </h3>
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground pl-10 space-y-2 leading-relaxed">
                                <p>
                                    In Google Chrome (or Brave / Edge / Arc), enter the following address in your URL bar:
                                </p>
                                <div className="border border-border bg-black/60 p-3 font-mono text-xs text-primary font-bold">
                                    chrome://extensions
                                </div>
                                <p>
                                    Look at the top-right corner of the Extensions page and toggle the switch labeled <strong className="text-foreground">Developer mode</strong> to <strong className="text-emerald-500 font-semibold">ON</strong>.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 - Showing Load unpacked image */}
                        <div className="border border-border bg-muted/10 p-5 rounded-none space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="h-7 w-7 rounded-none bg-primary text-primary-foreground font-mono font-bold text-sm flex items-center justify-center">
                                    3
                                </span>
                                <h3 className="font-mono font-semibold text-base">
                                    Click &quot;Load unpacked&quot; &amp; Select the Extension Folder
                                </h3>
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground pl-10 space-y-3 leading-relaxed">
                                <p>
                                    With Developer Mode enabled, a new toolbar will appear at the top-left of the Extensions page.
                                    Click the <strong className="text-foreground font-semibold">&quot;Load unpacked&quot;</strong> button as highlighted below:
                                </p>

                                {/* Official Google Chrome extensions page image showing Load unpacked */}
                                <div className="border border-border bg-black/60 p-2 sm:p-3 rounded-none overflow-hidden space-y-2">
                                    <div className="relative w-full aspect-[1920/1080] border border-border/60 overflow-hidden bg-black/80">
                                        <Image
                                            src={CHROME_LOAD_UNPACKED_IMAGE}
                                            alt="Chrome Extensions page showing the Load unpacked button in developer mode"
                                            fill
                                            unoptimized
                                            className="object-contain"
                                        />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground text-center font-mono">
                                        Click &quot;Load unpacked&quot; in the top-left bar and select the unzipped <code className="text-foreground">extension/</code> directory.
                                    </p>
                                </div>

                                <p className="text-foreground font-medium pt-1">
                                    ✓ The extension will immediately load! Pin it to your Chrome toolbar for quick access and status monitoring.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: How It Works & Architecture */}
                <section id="how-it-works" className="space-y-6 scroll-mt-20">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="rounded-none border-primary text-primary font-mono text-xs">
                                UNDER THE HOOD
                            </Badge>
                        </div>
                        <h2 className="text-xl sm:text-3xl font-bold font-mono tracking-tight">
                            How the Sync Engine Works
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Real-time communication between your Playlist Predator session, background worker, and YouTube tabs.
                        </p>
                    </div>

                    {/* Architecture SVG diagram */}
                    <div className="border border-border bg-card p-4 sm:p-6 rounded-none">
                        <div className="relative w-full aspect-[960/440] border border-border/80 overflow-hidden bg-black/60">
                            <Image
                                src="/images/extension/extension-architecture.svg"
                                alt="Playlist Predator Extension Architecture and Data Flow Diagram"
                                fill
                                unoptimized
                                className="object-contain"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                        <div className="border border-border bg-muted/10 p-4 space-y-2 rounded-none">
                            <div className="flex items-center gap-2 font-mono font-semibold text-foreground">
                                <Terminal className="h-4 w-4 text-primary" />
                                <span>1. Predator Bridge</span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                Runs on Playlist Predator. It securely detects your active playlist ID and passes authenticated Supabase session tokens to the extension background.
                            </p>
                        </div>

                        <div className="border border-border bg-muted/10 p-4 space-y-2 rounded-none">
                            <div className="flex items-center gap-2 font-mono font-semibold text-foreground">
                                <Layers className="h-4 w-4 text-blue-500" />
                                <span>2. Background Worker</span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                Maintains active playlist isolation. Evaluates video progress reports from YouTube against your study playlist, strictly ensuring only relevant course items trigger updates.
                            </p>
                        </div>

                        <div className="border border-border bg-muted/10 p-4 space-y-2 rounded-none">
                            <div className="flex items-center gap-2 font-mono font-semibold text-foreground">
                                <Play className="h-4 w-4 text-red-500" />
                                <span>3. YouTube Tracker</span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                Injected into <code className="text-foreground">youtube.com</code>. Tracks video playback progress. When progress surpasses 85%, it triggers the API sync and displays the toast notification.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 4: Visual Mockups - The UI Experience */}
                <section className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="rounded-none border-primary text-primary font-mono text-xs">
                                VISUAL PREVIEW
                            </Badge>
                        </div>
                        <h2 className="text-xl sm:text-3xl font-bold font-mono tracking-tight">
                            The Extension in Action
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            A clean, distraction-free companion that works silently in the background.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        {/* YouTube Player Toast Preview */}
                        <div className="border border-border bg-card p-4 space-y-3 rounded-none">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Youtube className="h-4 w-4 text-red-500" />
                                    <h3 className="font-mono font-semibold text-sm">
                                        Live YouTube Completion Toast
                                    </h3>
                                </div>
                                <Badge variant="secondary" className="rounded-none text-[10px] font-mono">
                                    ≥ 85% THRESHOLD
                                </Badge>
                            </div>
                            <div className="relative w-full aspect-[960/520] border border-border/80 overflow-hidden bg-black/60">
                                <Image
                                    src="/images/extension/youtube-toast-mockup.svg"
                                    alt="Live YouTube player notification toast preview"
                                    fill
                                    unoptimized
                                    className="object-contain"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                When watching on YouTube, an unobtrusive toast notification slides up in the bottom right corner confirming your video was automatically marked as Done in Playlist Predator.
                            </p>
                        </div>

                        {/* Extension Popup Interface Preview */}
                        <div className="border border-border bg-card p-4 space-y-3 rounded-none">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Chrome className="h-4 w-4 text-primary" />
                                    <h3 className="font-mono font-semibold text-sm">
                                        Companion Popup Dashboard
                                    </h3>
                                </div>
                                <Badge variant="secondary" className="rounded-none text-[10px] font-mono">
                                    TOOLBAR POPUP
                                </Badge>
                            </div>
                            <div className="relative w-full aspect-[600/620] border border-border/80 overflow-hidden bg-black/60">
                                <Image
                                    src="/images/extension/extension-popup-mockup.svg"
                                    alt="Extension popup preview showing connected account, active playlist, and current tab"
                                    fill
                                    unoptimized
                                    className="object-contain"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Click the extension icon anytime in your browser toolbar to verify your active playlist, view overall course progress, check the current tab status, or trigger an instant progress sync.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 5: Daily Study Workflow */}
                <section className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="rounded-none border-primary text-primary font-mono text-xs">
                                USER WORKFLOW
                            </Badge>
                        </div>
                        <h2 className="text-xl sm:text-3xl font-bold font-mono tracking-tight">
                            Recommended Daily Routine
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            How to get the most out of automatic playlist tracking every day.
                        </p>
                    </div>

                    <div className="border border-border bg-card p-6 rounded-none space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="border-l-2 border-primary pl-4 space-y-1.5">
                                <span className="font-mono text-xs text-primary font-bold">STEP 01</span>
                                <h4 className="font-mono font-semibold text-sm text-foreground">
                                    Open Playlist
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Open your study course on Playlist Predator (e.g. <code className="text-foreground">/PLxyz...</code>). It automatically sets as the active playlist.
                                </p>
                            </div>

                            <div className="border-l-2 border-primary pl-4 space-y-1.5">
                                <span className="font-mono text-xs text-primary font-bold">STEP 02</span>
                                <h4 className="font-mono font-semibold text-sm text-foreground">
                                    Verify Connection
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Click the extension icon to see a green <strong className="text-emerald-500">&quot;Connected&quot;</strong> badge and your playlist title displayed.
                                </p>
                            </div>

                            <div className="border-l-2 border-primary pl-4 space-y-1.5">
                                <span className="font-mono text-xs text-primary font-bold">STEP 03</span>
                                <h4 className="font-mono font-semibold text-sm text-foreground">
                                    Watch on YouTube
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Click any video link to open YouTube. Watch your video at your own pace (1x, 1.5x, 2x speeds are all accurately supported).
                                </p>
                            </div>

                            <div className="border-l-2 border-primary pl-4 space-y-1.5">
                                <span className="font-mono text-xs text-primary font-bold">STEP 04</span>
                                <h4 className="font-mono font-semibold text-sm text-foreground">
                                    Auto-Synced
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Upon passing 85%, the on-screen toast fires and your Playlist Predator progress bar advances automatically!
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 6: Troubleshooting & FAQs */}
                <section id="troubleshooting" className="space-y-6 scroll-mt-20">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="rounded-none border-primary text-primary font-mono text-xs">
                                FAQ &amp; HELP
                            </Badge>
                        </div>
                        <h2 className="text-xl sm:text-3xl font-bold font-mono tracking-tight">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Common questions and quick troubleshooting steps.
                        </p>
                    </div>

                    <div className="space-y-3 text-xs sm:text-sm">
                        <div className="border border-border bg-card p-4 rounded-none space-y-2">
                            <h4 className="font-mono font-semibold text-foreground flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary shrink-0" />
                                <span>The extension popup says &quot;Not Logged In&quot;. How do I fix it?</span>
                            </h4>
                            <p className="text-muted-foreground leading-relaxed pl-6">
                                Open Playlist Predator (<Link href="/login" className="text-primary hover:underline font-mono">/login</Link>) in any browser tab and sign into your account. The extension automatically detects your session cookie and updates its status to &quot;Connected&quot;.
                            </p>
                        </div>

                        <div className="border border-border bg-card p-4 rounded-none space-y-2">
                            <h4 className="font-mono font-semibold text-foreground flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary shrink-0" />
                                <span>The popup displays &quot;No active playlist&quot;. What does this mean?</span>
                            </h4>
                            <p className="text-muted-foreground leading-relaxed pl-6">
                                Navigate to any playlist analysis or tracking page in Playlist Predator (e.g. <code className="bg-muted px-1 py-0.5 border border-border text-foreground">/[playlistId]</code>). As soon as the page loads, the Predator bridge registers it as the current active playlist.
                            </p>
                        </div>

                        <div className="border border-border bg-card p-4 rounded-none space-y-2">
                            <h4 className="font-mono font-semibold text-foreground flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary shrink-0" />
                                <span>Will watching random YouTube videos mess up my playlists?</span>
                            </h4>
                            <p className="text-muted-foreground leading-relaxed pl-6">
                                <strong className="text-foreground">No, absolutely not.</strong> The extension strictly checks whether the YouTube video currently playing belongs to your active playlist in Playlist Predator. Unrelated videos, songs, or channels are completely ignored.
                            </p>
                        </div>

                        <div className="border border-border bg-card p-4 rounded-none space-y-2">
                            <h4 className="font-mono font-semibold text-foreground flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary shrink-0" />
                                <span>What happens if I already marked a video as REWATCH or SKIP?</span>
                            </h4>
                            <p className="text-muted-foreground leading-relaxed pl-6">
                                The extension will <strong className="text-foreground">never overwrite or downgrade</strong> custom states. If you marked a video as REWATCH or SKIP, it will remain in that state even if you watch it again on YouTube. Only videos in NONE or STUDY status are upgraded to DONE.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Bottom Call to Action */}
                <div className="border border-border bg-muted/20 p-8 text-center space-y-4 rounded-none">
                    <h3 className="font-mono font-bold text-xl sm:text-2xl text-foreground">
                        Ready to Automate Your Learning?
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                        Install the companion extension now, open your study playlist, and let Playlist Predator handle the bookkeeping while you focus on studying.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Button asChild className="rounded-none font-mono text-xs sm:text-sm h-10 px-5 gap-2">
                            <a
                                href="/api/extension/download"
                                download="playlist-predator-extension.zip"
                            >
                                <Download className="h-4 w-4" />
                                <span>Download Extension (.zip)</span>
                            </a>
                        </Button>
                        <Button asChild variant="outline" className="rounded-none font-mono text-xs sm:text-sm h-10 px-4 gap-2">
                            <a
                                href={GITHUB_EXTENSION_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Github className="h-4 w-4" />
                                <span>Clone on GitHub</span>
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </a>
                        </Button>
                        <Button asChild variant="ghost" className="rounded-none font-mono text-xs sm:text-sm h-10 px-4 gap-2">
                            <Link href="/">
                                <Play className="h-4 w-4" />
                                <span>Back to Home</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
