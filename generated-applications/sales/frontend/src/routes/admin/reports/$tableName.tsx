/**
 * The designer for one entity's report.
 *
 * The entity's display name and its column list both come from the
 * dictionary, so the data-source tree offers what this application actually
 * holds rather than a fixed list — the same reasoning as the rule editors,
 * and the same hooks.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Home } from "lucide-react";
import { ADSidebar } from "@/components/admin/ad-sidebar";
import {
  useDictionaryEntities,
  useDictionaryEntityFields,
} from "@/components/admin/use-dictionary-entities";
import { ReportDesigner } from "@/components/reports/report-designer";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/reports/$tableName")({
  component: ReportDesignPage,
});

function ReportDesignPage() {
  const { tableName } = Route.useParams();
  const { data: entities } = useDictionaryEntities();
  const { data: columns, isLoading } = useDictionaryEntityFields(tableName);

  const entityLabel =
    entities?.find((entity) => entity.table === tableName)?.label ??
    tableName.replace(/^bus_/, "");

  return (
    <ADSidebar>
      <div className="flex flex-col h-full">
        <header className="border-b border-border bg-card px-8 py-6 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <span>/</span>
            <Link to="/admin" className="hover:text-primary transition-colors">
              Admin
            </Link>
            <span>/</span>
            <Link to="/admin/reports" className="hover:text-primary transition-colors">
              Report Designs
            </Link>
            <span>/</span>
            <span className="text-foreground">{entityLabel}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            Report Designer — <span className="text-primary">{entityLabel}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drag fields from the data source onto the page. Saving here is what puts a Print
            button on this entity&rsquo;s records.
          </p>
        </header>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <ReportDesigner
              tableName={tableName}
              entityLabel={entityLabel}
              columns={columns ?? []}
            />
          )}
        </div>
      </div>
    </ADSidebar>
  );
}
