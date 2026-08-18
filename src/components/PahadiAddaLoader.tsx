"use client";

import dynamic from "next/dynamic";

const PahadiAdda = dynamic(() => import("./PahadiAdda"), { ssr: false });

export default function PahadiAddaLoader() {
  return <PahadiAdda />;
}
