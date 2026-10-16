import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ADDetailShell } from "@/components/admin/ad-detail-shell";
import { TABLE_LEVEL } from "@/components/admin/ad-window-configs";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { Box, HStack, Text } from "@/components/ui/layout";

export const Route = createFileRoute("/admin/table/$tableId/")({
  component: TableDetailPage,
});

function SetupDictionaryButton({ tableId }: { tableId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  // Load the table record to get the entity name
  const { data: tableRecord } = useQuery({
    queryKey: ["sys_table", tableId],
    queryFn: () => apiClient.get<{ table_name: string; name: string }>(`/sys/tables/${tableId}`),
  });

  const handleSetup = async () => {
    if (!tableRecord?.table_name) return;
    const tableName = tableRecord.table_name;
    // strip 'bus_' prefix to get entity name
    const entity = tableName.startsWith("bus_") ? tableName.slice(4) : tableName;
    setStatus("loading");
    try {
      const result = await apiClient.post<{ created: string[] }>(
        `/bus/${entity}/setup-dictionary`,
        {}
      );
      const count = result.created.length;
      setMessage(
        count === 0
          ? "Already configured — nothing to create."
          : `Created ${count} record(s): ${result.created.join(", ")}`
      );
      setStatus("done");
    } catch (err: any) {
      setMessage(err?.message || "Failed to setup dictionary.");
      setStatus("error");
    }
  };

  if (!tableRecord?.table_name) return null;

  return (
    <HStack align="center" gap={3} paddingInline={6} paddingBlock={3} className="border-b bg-amber-50">
      <Button
        size="sm"
        variant="outline"
        onClick={handleSetup}
        disabled={status === "loading"}
        className="border-amber-400 text-amber-800 hover:bg-amber-100"
      >
        {status === "loading" ? "Setting up…" : "⚙ Set up window, tab and fields"}
      </Button>
      {status !== "idle" && (
        <span
          className={`text-sm ${status === "error" ? "text-red-600" : status === "done" ? "text-green-700" : "text-amber-700"}`}
        >
          {message}
        </span>
      )}
      {status === "idle" && (
        <Text size="xs" className="text-amber-700">
          Creates the window, tab and fields for this table, so it appears in the application's
          menu and dashboard.
        </Text>
      )}
    </HStack>
  );
}

function TableDetailPage() {
  const { tableId } = Route.useParams();
  return (
    <div className="flex flex-col h-full">
      <SetupDictionaryButton tableId={tableId} />
      <Box grow scrollable>
        <ADDetailShell level={TABLE_LEVEL} recordId={tableId} parentContext={[]} />
      </Box>
    </div>
  );
}
