"use client";
import dynamic from "next/dynamic";
const DocsPortal = dynamic(() => import("./DocsPortal"), { ssr: false });
export default function Page() { return <DocsPortal />; }
