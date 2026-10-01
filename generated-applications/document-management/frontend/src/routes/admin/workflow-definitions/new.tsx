import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import type { BpmnCanvasHandle } from "../../../components/admin/bpmn-canvas";
import BpmnCanvas from "../../../components/admin/bpmn-canvas";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { apiClient } from "../../../lib/api-client";
import { Box } from "@/components/ui/layout";

export const Route = createFileRoute("/admin/workflow-definitions/new")({
  component: NewWorkflowDefinition,
});

const OPERATIONS = ["ALL", "CREATE", "UPDATE", "DELETE"] as const;

function NewWorkflowDefinition() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canvasRef = useRef<BpmnCanvasHandle>(null);

  const [name, setName] = useState("");
  const [entityName, setEntityName] = useState("");
  const [operation, setOperation] = useState<"ALL" | "CREATE" | "UPDATE" | "DELETE">("ALL");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: tables = [] } = useQuery<any[]>({
    queryKey: ["sys-tables"],
    queryFn: async () => {
      const res = await apiClient.get("/sys/tables?prefix=bus_");
      return Array.isArray(res) ? res : ((res as any)?.data ?? []);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (dto: any) => apiClient.post("/workflow-definitions", dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-definitions"] });
      navigate({ to: "/admin/workflow-definitions" });
    },
    onError: (err: any) => setError(err.message ?? "Save failed"),
  });

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) return setError("Name is required");
    if (!entityName) return setError("Entity is required");
    if (!canvasRef.current) return setError("Canvas not ready");

    try {
      const bpmnXml = await canvasRef.current.getXml();
      createMutation.mutate({ name, entityName, operation, bpmnXml, description });
    } catch (e: any) {
      setError(e.message ?? "Failed to export BPMN");
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-4 py-3 border-b bg-white shadow-sm">
        <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm text-gray-500">
          <Link to="/dashboard" className="hover:text-gray-700 hover:underline">
            Dashboard
          </Link>
          <ChevronRight size={14} />
          <Link to="/admin/workflow-definitions" className="hover:text-gray-700 hover:underline">
            Workflow Designer
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">New</span>
        </nav>
        <h1 className="font-semibold text-gray-800">New Workflow Definition</h1>
        <div className="flex-1" />
        {error && <span className="text-xs text-red-600">{error}</span>}
        <Button size="sm" onClick={handleSave} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Saving…" : "Save Workflow"}
        </Button>
      </div>

      {/* Metadata bar */}
      <div className="flex items-end gap-4 px-4 py-3 border-b bg-gray-50">
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Name *</Label>
          <Input
            className="h-8 text-sm w-56"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apply Gold Discount"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Entity *</Label>
          <Select value={entityName} onValueChange={setEntityName}>
            <SelectTrigger className="h-8 text-sm w-48">
              <SelectValue placeholder="Select entity…" />
            </SelectTrigger>
            <SelectContent>
              {/* The value is the physical table, the label is the human name.
                  They are not interchangeable: the executor resolves
                  `entityName` through the dictionary, so storing "Deviation
                  Report" here produced a workflow that saved cleanly and then
                  failed every run with `Unknown entity`. */}
              {tables.map((t: any) => (
                <SelectItem
                  key={t.table_name ?? t.name}
                  value={t.table_name ?? t.name}
                  className="text-xs"
                >
                  {t.name ?? t.table_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Trigger on</Label>
          <Select value={operation} onValueChange={(v: any) => setOperation(v)}>
            <SelectTrigger className="h-8 text-sm w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATIONS.map((o) => (
                <SelectItem key={o} value={o} className="text-xs">
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 flex-1">
          <Label className="text-xs text-gray-600">Description</Label>
          <Input
            className="h-8 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>
      </div>

      {/* Canvas */}
      <Box grow padding={4} className="min-h-0">
        {/* The chain's WHEN line reads the trigger from here; without it every
            definition was described as firing on create, update and delete,
            whatever the Trigger on field above said. */}
        <BpmnCanvas
          ref={canvasRef}
          className="h-full"
          entityName={entityName}
          triggerOperation={operation}
        />
      </Box>
    </div>
  );
}
