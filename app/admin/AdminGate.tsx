"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";

export function AdminGate() {
  return (
    <section className="mx-auto max-w-md py-10">
      <Card>
        <h1 className="text-2xl font-semibold text-text-primary">Admin Zugang</h1>
        <p className="mt-2 text-sm text-text-secondary">Bitte über den Admin Login anmelden.</p>
        <div className="mt-6">
          <Link
            href="/admin/login"
            className="inline-flex w-full justify-center rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-light"
          >
            Zum Admin Login
          </Link>
        </div>
      </Card>
    </section>
  );
}

