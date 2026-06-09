"use client";

import { useState, useEffect, useRef } from "react";
import { EmployeesSidebar } from "@/components/EmployeeSidebar";
import type { EmployeeRow } from "@/components/EmployeeCard";
import { useSession, signIn } from "next-auth/react";
import { EmployeeView } from "@/components/EmployeeView";
import { SidebarCollapseToggle } from "@/components/SidebarCollapseToggle";

export default function EmployeesPage() {
  const [selected, setSelected] = useState<EmployeeRow | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [savedProposalEmployeeIds, setSavedProposalEmployeeIds] = useState<
    ReadonlySet<number>
  >(new Set());

  const { status } = useSession();
  const started = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated" && !started.current) {
      started.current = true;
      void signIn("azure-ad", { callbackUrl: "/" });
    }
  }, [status]);

  return (
    <main className="h-screen flex flex-col bg-[var(--exec-bg)] text-slate-900 dark:text-slate-100">
      {/* App frame */}
      <div
        className={[
          "h-dvh w-full",
        ].join(" ")}
      >
        <div className="flex h-full min-h-0 overflow-hidden">
          {/* Sidebar column */}
          <aside className="relative flex">
            {/* Sidebar */}
            <div className=" ">
              <EmployeesSidebar
                office="Barcelona"
                collapsed={collapsed}
                demoMode={demoMode}
                savedProposalEmployeeIds={savedProposalEmployeeIds}
                onToggleCollapse={(c) => setCollapsed(c)}
                department="PEOPLE & CULTURE"
                society="RSM SPAIN SERVICIOS ADMINISTRATIVOS, SL"
                limit={100}
                offset={0}
                onSelectEmployee={setSelected}
              />
            </div>

            {/* Toggle overlay: siempre visible, anclado al borde del sidebar */}
            <div
              className={[
                "pointer-events-none absolute",      // evita bloquear clicks alrededor
                "top-[70%]",                         // tercio inferior aprox
                collapsed ? "left-[76px]" : "left-[320px]", // coincide con el ancho del sidebar
                "-translate-y-1/2",
                "z-20",
              ].join(" ")}
            >
              <div className="pointer-events-auto">
                <SidebarCollapseToggle
                  collapsed={collapsed}
                  onToggle={() => setCollapsed((c) => !c)}
                  controlsId="employees-sidebar"
                />
              </div>
            </div>
          </aside>

          {/* Content column */}
          <section className="flex-1 min-h-0">
            {/* Fondo interior suave como mockup */}
            <div className="h-full min-h-0 ">
              {/* EmployeeView ya gestiona su layout; evitamos overflow-y-auto aquí */}
              <EmployeeView
                employee={selected}
                demoMode={demoMode}
                savedProposalEmployeeIds={savedProposalEmployeeIds}
                onProposalSavedChange={(employeeId, isSaved) => {
                  setSavedProposalEmployeeIds((current) => {
                    const next = new Set(current);

                    if (isSaved) {
                      next.add(employeeId);
                    } else {
                      next.delete(employeeId);
                    }

                    return next;
                  });
                }}
                onToggleDemoMode={() => setDemoMode((current) => !current)}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
