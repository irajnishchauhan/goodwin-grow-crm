import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { Calendar as CalendarIcon, Clock, CheckCircle2, Phone, Mail, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function CalendarPage() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) redirect("/login");

  const tenantId = tenantCtx.tenant.id;

  const [tasks, activities] = await Promise.all([
    prisma.task.findMany({
      where: { tenantId },
      orderBy: { dueDate: "asc" },
      include: {
        assignedTo: { select: { fullName: true } },
        lead: { select: { firstName: true, lastName: true } },
        contact: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.activity.findMany({
      where: { tenantId },
      orderBy: { occurredAt: "desc" },
      take: 20,
      include: {
        performedBy: { select: { fullName: true } },
      },
    }),
  ]);

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Calendar & Agenda</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified schedule of task deadlines, follow-ups, and customer engagement events.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Tasks & Follow-ups */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <CalendarIcon className="w-4 h-4 text-emerald-600" />
              <span>Upcoming Follow-ups & Deadlines</span>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              {tasks.length} tasks
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No scheduled tasks on calendar.</div>
            ) : (
              tasks.map((task) => {
                const isOverdue = task.status !== "COMPLETED" && task.dueDate && new Date(task.dueDate) < now;
                return (
                  <div key={task.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${task.status === "COMPLETED" ? "line-through text-slate-400" : "text-slate-900"}`}>
                          {task.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          task.priority === "URGENT" ? "bg-rose-100 text-rose-800" :
                          task.priority === "HIGH" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {task.contact ? `Contact: ${task.contact.firstName} ${task.contact.lastName}` :
                         task.lead ? `Lead: ${task.lead.firstName} ${task.lead.lastName}` : "General task"}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-xs font-bold ${isOverdue ? "text-rose-600" : "text-slate-700"}`}>
                        {formatDate(task.dueDate)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {task.assignedTo?.fullName?.split(" ")[0] || "Unassigned"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Activity Log Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Completed Client Touchpoints</span>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Recent Events
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {activities.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No recorded activities.</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">{act.title}</div>
                    {act.description && <div className="text-xs text-slate-500">{act.description}</div>}
                    <div className="text-[10px] text-slate-400 font-medium pt-0.5">By {act.performedBy?.fullName}</div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono shrink-0">
                    {formatDate(act.occurredAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
