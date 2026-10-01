import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  Loader2,
  Save,
  Scale,
  TestTube2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DecisionTableEditor } from "@/components/admin/decision-table-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { useDictionaryEntities, useDictionaryEntityFields } from "@/components/admin/use-dictionary-entities";
import { Box, Grid, HStack, Heading, Text } from "@/components/ui/layout";

export const Route = createFileRoute("/admin/rules/new")({
  component: NewRulePage,
});

const OPERATIONS = [
  { value: "CREATE", label: "Create", description: "Triggered when a new record is created" },
  { value: "UPDATE", label: "Update", description: "Triggered when a record is modified" },
  { value: "DELETE", label: "Delete", description: "Triggered when a record is deleted" },
  { value: "ALL", label: "All Operations", description: "Triggered on create, update, and delete" },
];

const DEFAULT_JDM = JSON.stringify(
  {
    contentType: "application/vnd.gorules.decision",
    nodes: [
      { id: "input-1", name: "Request", type: "inputNode", position: { x: 100, y: 200 } },
      {
        id: "dt-1",
        name: "Decision Table",
        type: "decisionTableNode",
        position: { x: 350, y: 200 },
        content: {
          hitPolicy: "collect",
          inputs: [{ id: "cond-1", name: "email", field: "email", type: "expression" }],
          outputs: [
            { id: "act-1", name: "action", field: "action", type: "expression" },
            { id: "act-2", name: "message", field: "message", type: "expression" },
            { id: "act-3", name: "workflowName", field: "workflowName", type: "expression" },
          ],
          rules: [
            {
              "cond-1": "== null",
              "act-1": '"prevent"',
              "act-2": '"Email is required"',
              "act-3": "",
            },
          ],
        },
      },
      { id: "output-1", name: "Response", type: "outputNode", position: { x: 600, y: 200 } },
    ],
    edges: [
      { id: "e1", sourceId: "input-1", targetId: "dt-1", type: "edge" },
      { id: "e2", sourceId: "dt-1", targetId: "output-1", type: "edge" },
    ],
  },
  null,
  2
);

function NewRulePage() {
  const navigate = useNavigate();
  const [entityName, setEntityName] = useState("");
  // Entities come from the dictionary, so this offers what the app has rather
  // than what the template was first written against.
  const { data: entities = [] } = useDictionaryEntities();
  const [ruleName, setRuleName] = useState("");
  const [operation, setOperation] = useState("CREATE");
  const [jdmContent, setJdmContent] = useState(DEFAULT_JDM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dry run state
  const [testData, setTestData] = useState("{}");
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: {
      entityName: string;
      ruleName: string;
      operation: string;
      jdmContent: string;
    }) => {
      return await apiClient.post("/rules", data);
    },
    onSuccess: () => {
      toast.success("Rule created successfully");
      navigate({ to: "/admin/rules" });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create rule: ${error.message}`);
    },
  });

  const { data: workflowsData } = useQuery({
    queryKey: ["workflow-definitions"],
    queryFn: async () => {
      const data = await apiClient.get<any[]>("/workflow-definitions?isActive=true");
      return Array.isArray(data) ? data : [];
    },
  });
  const availableWorkflows = (workflowsData ?? []).map((wf: any) => ({
    id: wf.id,
    name: wf.name,
    description: wf.description,
  }));

  const dryRunMutation = useMutation({
    mutationFn: async (data: { jdmContent: string; testData: Record<string, unknown> }) => {
      return await apiClient.post("/rules/evaluate", {
        entityName: entityName || "Account",
        operation,
        data: data.testData,
      });
    },
    onSuccess: (result) => {
      setTestResult(result);
    },
    onError: (error: Error) => {
      setTestResult({ error: error.message });
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!entityName) newErrors.entityName = "Entity is required";
    if (!ruleName.trim()) newErrors.ruleName = "Rule name is required";
    if (!operation) newErrors.operation = "Operation is required";
    try {
      JSON.parse(jdmContent);
    } catch {
      newErrors.jdmContent = "Invalid JDM content";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate({ entityName, ruleName, operation, jdmContent });
  };

  const handleDryRun = () => {
    try {
      const parsed = JSON.parse(testData);
      dryRunMutation.mutate({ jdmContent, testData: parsed });
    } catch {
      toast.error("Invalid test data JSON");
    }
  };

  const { data: entityFields } = useDictionaryEntityFields(entityName || undefined);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-4 border-black bg-white">
        <Box paddingInline={8} paddingBlock={8} className="max-w-6xl mx-auto">
          <HStack align="center" gap={4}>
            <Link to="/admin/rules">
              <Button variant="ghost" size="sm" className="rounded-none">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <Heading level={1} color="primary" className="text-3xl tracking-tight">Create Business Rule</Heading>
              <Text size="sm" color="secondary" block className="mt-1">
                Define conditions and actions that run automatically when entity records are
                created, updated, or deleted.
              </Text>
            </div>
          </HStack>
        </Box>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <form onSubmit={handleSubmit}>
          {/* Rule metadata section */}
          <Box marginBottom={8} border="strong">
            <Box bg="subtle" paddingInline={6} paddingBlock={3} border="strong" borderSide="bottom">
              <Heading level={2} uppercase>Rule Configuration</Heading>
            </Box>
            <div className="p-6">
              <Grid columns={3} gap={6}>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Entity *
                  </Label>
                  <Select value={entityName} onValueChange={setEntityName}>
                    <SelectTrigger className="mt-1 border-2 border-gray-300 rounded-none">
                      <SelectValue placeholder="Select entity..." />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.entityName && (
                    <Text size="xs" color="danger" block className="mt-1">{errors.entityName}</Text>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Rule Name *
                  </Label>
                  <Input
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="e.g. Validate Email Format"
                    className="mt-1 border-2 border-gray-300 rounded-none"
                  />
                  {errors.ruleName && (
                    <Text size="xs" color="danger" block className="mt-1">{errors.ruleName}</Text>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Trigger Operation *
                  </Label>
                  <Select value={operation} onValueChange={setOperation}>
                    <SelectTrigger className="mt-1 border-2 border-gray-300 rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATIONS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          <div>
                            <span>{op.label}</span>
                            <Text size="xs" color="secondary" className="ml-2">— {op.description}</Text>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.operation && (
                    <Text size="xs" color="danger" block className="mt-1">{errors.operation}</Text>
                  )}
                </div>
              </Grid>
            </div>
          </Box>

          {/* Decision Table Editor */}
          <Box marginBottom={8} border="strong">
            <Box bg="subtle" paddingInline={6} paddingBlock={3} border="strong" borderSide="bottom">
              <HStack align="center" justify="between">
                <Heading level={2} uppercase>Decision Logic</Heading>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-none text-xs"
                  onClick={() => setShowTestPanel(!showTestPanel)}
                >
                  <TestTube2 className="h-3.5 w-3.5 mr-1" />
                  {showTestPanel ? "Hide Test" : "Test Rule"}
                </Button>
              </HStack>
            </Box>
            <DecisionTableEditor
              value={jdmContent}
              onChange={setJdmContent}
              entityName={entityName}
              entityFields={entityFields}
              availableWorkflows={availableWorkflows}
            />
            {errors.jdmContent && (
              <Text size="xs" color="danger" block className="px-4 pb-2">{errors.jdmContent}</Text>
            )}
          </Box>

          {/* Test Panel */}
          {showTestPanel && (
            <Box marginBottom={8} border="strong">
              <Box paddingInline={6} paddingBlock={3} border="strong" borderSide="bottom" className="bg-amber-50">
                <Heading level={2} uppercase className="flex items-center gap-2">
                  <TestTube2 size={16} />
                  Dry Run — Test Your Rule
                </Heading>
                <Text size="xs" color="secondary" block className="mt-1">
                  Enter sample entity data to see how your rule would evaluate it.
                </Text>
              </Box>
              <div className="p-6">
                <Grid columns={2} gap={6}>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">
                      Test Data (JSON)
                    </Label>
                    <textarea
                      className="w-full h-40 font-mono text-xs border-2 border-gray-300 p-3 rounded-none"
                      value={testData}
                      onChange={(e) => setTestData(e.target.value)}
                      placeholder={`{\n  "name": "Test Account",\n  "email": null,\n  "status": "active"\n}`}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="mt-2 rounded-none bg-amber-600 text-white hover:bg-amber-700"
                      onClick={handleDryRun}
                      disabled={dryRunMutation.isPending}
                    >
                      {dryRunMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <TestTube2 className="h-3.5 w-3.5 mr-1" />
                      )}
                      Run Test
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">
                      Result
                    </Label>
                    {testResult ? (
                      <Box scrollable padding={3} bg="subtle" border="default" className="h-40 text-xs">
                        {testResult.error ? (
                          <HStack align="start" gap={2} className="text-red-600">
                            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <Text weight="semibold" block>Error</Text>
                              <p>{testResult.error}</p>
                            </div>
                          </HStack>
                        ) : testResult.results?.length > 0 ? (
                          <div className="space-y-2">
                            {testResult.results.map((r: any, i: number) => (
                              <div
                                key={r.ruleId ?? i}
                                className={`flex items-start gap-2 p-2 rounded ${
                                  r.actions?.some((a: any) => a.type === "prevent")
                                    ? "bg-red-50 text-red-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {r.actions?.some((a: any) => a.type === "prevent") ? (
                                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                )}
                                <div>
                                  <Text weight="semibold" block>{r.ruleId}</Text>
                                  {r.actions?.map((a: any, j: number) => (
                                    <p key={`${a.type}-${a.config?.message ?? j}`}>
                                      [{a.type}] {a.config?.message}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <HStack align="center" gap={2} className="text-green-600">
                            <CheckCircle size={16} />
                            <Text weight="semibold">All checks passed — no violations</Text>
                          </HStack>
                        )}
                      </Box>
                    ) : (
                      <HStack align="center" justify="center" className="h-40 border-2 border-dashed border-gray-200 text-gray-400 text-xs">
                        Click "Run Test" to see results
                      </HStack>
                    )}
                  </div>
                </Grid>
              </div>
            </Box>
          )}

          {/* Actions */}
          <HStack align="center" justify="between">
            <Link to="/admin/rules">
              <Button
                type="button"
                variant="outline"
                className="rounded-none border-2 border-black"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-black text-white hover:bg-gray-800 rounded-none px-8"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {createMutation.isPending ? "Creating..." : "Create Rule"}
            </Button>
          </HStack>
        </form>
      </main>
    </div>
  );
}
