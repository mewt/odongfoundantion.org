"use client";
import { LoadError } from "@/components/load-error";
export default function ErrorPage({ reset }: { reset: () => void }) { return <LoadError reset={reset} locale="id" />; }
