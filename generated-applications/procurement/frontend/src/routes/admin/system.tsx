import { createFileRoute } from "@tanstack/react-router";
import { ADListShell } from "@/components/admin/ad-list-shell";
import { SYSTEM_LEVEL } from "@/components/admin/ad-window-configs";

export const Route = createFileRoute("/admin/system")({
  component: SystemConfigPage,
});

function SystemConfigPage() {
  return <ADListShell level={SYSTEM_LEVEL} parentContext={[]} showAdminCrumb />;
}
