"use client"

import Link from "next/link"

import { DECISION_QUEUE } from "@/app/lib/admin-data"
import AdminShell from "./AdminShell"

export default function AdminDisputes() {
  return (
    <AdminShell page="disputes">
      <header className="dash-head">
        <div>
          <p className="dash-eyebrow">Admin console</p>
          <h1 className="dash-title">Disputes queue</h1>
          <p className="dash-sub">
            Items that need a decision. Full disputes tooling is not in this
            build — these four rows match the overview queue.
          </p>
        </div>
        <div className="dash-head__actions">
          <Link href="/dashboard/admin" className="dash-btn dash-btn--ghost">
            Back to overview
          </Link>
        </div>
      </header>

      <section className="dash-card">
        <h2 className="dash-card__title">Needs a decision</h2>
        <div style={{ marginTop: 12 }}>
          {DECISION_QUEUE.map((row) => (
            <div key={row.id} className="queue-row">
              <div>
                <p className="queue-row__title">{row.title}</p>
                <p className="queue-row__detail">{row.detail}</p>
              </div>
              <span className={`urgency urgency--${row.tone}`}>{row.tag}</span>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  )
}
