import React from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Register",
};

const layout = ({ children }: { children: React.ReactNode }) => {
    return <div>{children}</div>;
};

export default layout;
