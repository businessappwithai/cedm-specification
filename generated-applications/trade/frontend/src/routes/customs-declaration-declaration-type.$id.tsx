import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/customs-declaration-declaration-type/$id')({
  component: CustomsDeclarationDeclarationTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CustomsDeclarationDeclarationTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="customs_declaration_declaration_type" recordId={id} />;
}
