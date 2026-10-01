import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { BusEntityPage } from "@/components/admin/bus-entity-page";
import { useTableMetadata } from "@/hooks/use-entities";

export const Route = createFileRoute("/$entity")({
  component: DynamicEntityListPage,
});

function DynamicEntityListPage() {
  const { entity } = Route.useParams();
  const childMatches = useChildMatches();
  const entityName = entity.startsWith("bus_") ? entity.slice(4) : entity;

  // This route matches *any* unclaimed top-level path, so `entity` is only a
  // business entity when the dictionary says so. Rendering BusEntityPage first
  // and asking later meant every wrong URL — including the redirect hop through
  // `/login` — fired `/bus/<segment>/fields/form` and `/fields/grid`, which 401
  // for a signed-out visitor and put two red errors in the console of the
  // sign-in page of every generated app.
  //
  // `/sys/tables` is an open read and shares its 30-minute cache with the rest
  // of the app, so this check costs nothing on a real entity.
  const { data: table, isLoading } = useTableMetadata(`bus_${entityName.replace(/-/g, "_")}`);

  if (childMatches.length > 0) return <Outlet />;
  if (isLoading) return null;
  if (!table) return <UnknownEntity segment={entity} />;

  return <BusEntityPage entityName={entityName} />;
}

function UnknownEntity({ segment }: { segment: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        There is no <code>{segment}</code> in this application.
      </p>
      <Link to="/dashboard" className="underline">
        Back to the dashboard
      </Link>
    </div>
  );
}
