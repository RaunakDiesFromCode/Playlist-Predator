import type { Metadata } from "next";
import JoinClient from "./JoinClient";

type RouteParams = {
    token: string;
};

export const metadata: Metadata = {
    title: "Join Playlist Crew | Playlist Predator",
    description: "Join a shared YouTube playlist study Crew.",
};

export default async function JoinPage(props: {
    params: Promise<RouteParams>;
}) {
    const { token } = await props.params;

    return <JoinClient token={token} />;
}
