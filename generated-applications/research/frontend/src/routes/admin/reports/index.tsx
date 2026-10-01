/**
 * Which entities have a report design, and a way in to draw one.
 *
 * The entity list comes from the Application Dictionary rather than from the
 * designs table, because the useful question is "what could have a report"
 * and the answer to "what already does" is an annotation on it.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Home, Plus } from "lucide-react";
import { ADSidebar } from "@/components/admin/ad-sidebar";
import { useDictionaryEntities } from "@/components/admin/use-dictionary-entities";
import { useReportDesigns } from "@/components/admin/use-report-designs";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/reports/")({
  component: ReportsListPage,
});

function ReportsListPage() {
  const { data: entities, isLoading } = useDictionaryEntities();
  const { data: designs } = useReportDesigns();

  return (
    <ADSidebar>
      <div className="flex flex-col h-full">
        <header className="border-b border-border bg-card px-8 py-8">
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
            <span className="text-foreground">Report Designs</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Report Designs
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Lay out a printable document for an entity. Once a design exists, a Print button
            appears on that entity&rsquo;s records.
          </p>
        </header>

        <div className="flex-1 overflow-auto px-8 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : !entities?.length ? (
            <p className="text-muted-foreground">
              This application has no business entities in its dictionary.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entities.map((entity) => {
                const design = designs?.get(entity.table);
                return (
                  <Link
                    key={entity.table}
                    to="/admin/reports/$tableName"
                    params={{ tableName: entity.table }}
                    className="group rounded-xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <FileText className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      {design ? (
                        <span className="text-xs rounded-full border border-border bg-muted px-2 py-0.5 font-medium text-foreground">
                          Designed
                        </span>
                      ) : (
                        <span className="text-xs rounded-full border border-border bg-muted px-2 py-0.5 flex items-center gap-1 text-muted-foreground">
                          <Plus className="h-3 w-3" />
                          New
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{entity.label}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{entity.table}</p>
                    {design?.updated_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {new Date(design.updated_at).toLocaleDateString()}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      {design ? "Edit design" : "Create design"}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ADSidebar>
  );
}
