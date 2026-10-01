import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  History,
  Loader2,
  Save,
  TestTube2,
  ToggleLeft,
  ToggleRight,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DecisionTableEditor } from "@/components/admin/decision-table-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/api-client";
import { Box, Grid, HStack, Heading, Text } from "@/components/ui/layout";
import { useDictionaryEntityFields } from "@/components/admin/use-dictionary-entities";

export const Route = createFileRoute("/admin/rules/$id/edit")({
  component: EditRulePage,
});


interface Rule {
  id: string;
  entityName: string;
  ruleName: string;
  operation: string;
  version: number;
  isActive: boolean;
  jdmContent: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

/** A workflow a `trigger-workflow` rule action can target. */
interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
}

function EditRulePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [jdmContent, setJdmContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dry run state
  const [testData, setTestData] = useState("{}");
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);

  const { data: rule, isLoading } = useQuery({
    queryKey: ["admin", "rules", id],
    queryFn: async () => {
      return await apiClient.get<Rule>(`/rules/${id}`);
    },
  });

  // The workflows a `trigger-workflow` action can target. This mirrors the
  // sibling `new.tsx` page — the edit page referenced `availableWorkflows`
  // without ever defining it, so it did not compile and the workflow picker in
  // the decision table had nothing to offer.
  const { data: workflowsData } = useQuery({
    queryKey: ["workflow-definitions"],
    queryFn: async () => {
      const data = await apiClient.get<WorkflowDefinition[]>(
        "/workflow-definitions?isActive=true"
      );
      return Array.isArray(data) ? data : [];
    },
  });
  const availableWorkflows = (workflowsData ?? []).map((wf) => ({
    id: wf.id,
    name: wf.name,
    description: wf.description,
  }));

  useEffect(() => {
    if (rule) {
      try {
        setJdmContent(JSON.stringify(JSON.parse(rule.jdmContent), null, 2));
      } catch {
        setJdmContent(rule.jdmContent);
      }
      setIsActive(rule.isActive);
    }
  }, [rule]);

  const updateMutation = useMutation({
    mutationFn: async (data: { jdmContent?: string; isActive?: boolean }) => {
      return await apiClient.put(`/rules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rules"] });
      toast.success("Rule updated successfully");
      navigate({ to: "/admin/rules" });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update rule: ${error.message}`);
    },
  });

  const dryRunMutation = useMutation({
    mutationFn: async (data: { testData: Record<string, unknown> }) => {
      return await apiClient.post("/rules/evaluate", {
        entityName: rule?.entityName || "Account",
        operation: rule?.operation || "CREATE",
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
    updateMutation.mutate({ jdmContent, isActive });
  };

  const handleDryRun = () => {
    try {
      const parsed = JSON.parse(testData);
      dryRunMutation.mutate({ testData: parsed });
    } catch {
      toast.error("Invalid test data JSON");
    }
  };

  if (isLoading) {
    return (
      <HStack align="center" justify="center" className="min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </HStack>
    );
  }

  if (!rule) {
    return (
      <HStack align="center" justify="center" className="min-h-screen bg-white">
        <div className="text-center">
          <Text color="secondary" block className="mb-4">Rule not found</Text>
          <Link to="/admin/rules">
            <Button variant="outline" className="rounded-none">
              Back to Rules
            </Button>
          </Link>
        </div>
      </HStack>
    );
  }

  const { data: entityFields } = useDictionaryEntityFields(rule.entityName);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-4 border-black bg-white">
        <Box paddingInline={8} paddingBlock={8} className="max-w-6xl mx-auto">
          <HStack align="center" justify="between">
            <HStack align="center" gap={4}>
              <Link to="/admin/rules">
                <Button variant="ghost" size="sm" className="rounded-none">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div>
                <Heading level={1} color="primary" className="text-3xl tracking-tight">Edit Rule</Heading>
                <Text size="sm" color="secondary" block className="mt-1">{rule.ruleName}</Text>
              </div>
            </HStack>
            <HStack align="center" gap={3}>
              <Badge variant="outline" className="font-mono text-xs">
                v{rule.version}
              </Badge>
              <Badge
                variant={rule.operation === "ALL" ? "default" : "secondary"}
                className="text-xs"
              >
                {rule.operation}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {rule.entityName}
              </Badge>
            </HStack>
          </HStack>
        </Box>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <form onSubmit={handleSubmit}>
          {/* Rule metadata display (read-only) */}
          <Box marginBottom={8} border="strong">
            <Box bg="subtle" paddingInline={6} paddingBlock={3} border="strong" borderSide="bottom">
              <Heading level={2} uppercase>Rule Details</Heading>
            </Box>
            <div className="p-6">
              <Grid columns={4} gap={6}>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Entity
                  </Label>
                  <Text weight="medium" block className="mt-1">{rule.entityName}</Text>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Operation
                  </Label>
                  <Text weight="medium" block className="mt-1">{rule.operation}</Text>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Version
                  </Label>
                  <Text weight="medium" block className="mt-1">v{rule.version}</Text>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Status
                  </Label>
                  <HStack align="center" gap={2} className="mt-1">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    <span
                      className={`text-sm font-medium ${isActive ? "text-emerald-600" : "text-gray-400"}`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </HStack>
                </div>
              </Grid>
              <Grid columns={2} gap={6} className="mt-4 pt-4 border-t border-gray-100">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Created
                  </Label>
                  <Text size="sm" color="secondary" block className="mt-1">
                    {new Date(rule.createdAt).toLocaleString()}
                    {rule.createdBy && <Text color="secondary"> by {rule.createdBy}</Text>}
                  </Text>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Last Updated
                  </Label>
                  <Text size="sm" color="secondary" block className="mt-1">
                    {new Date(rule.updatedAt).toLocaleString()}
                    {rule.updatedBy && <Text color="secondary"> by {rule.updatedBy}</Text>}
                  </Text>
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
              entityName={rule.entityName}
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
                                    : r.actions?.some((a: any) =>
                                          (a.type as string)?.startsWith("cascade")
                                        )
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {r.actions?.some((a: any) => a.type === "prevent") ? (
                                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                ) : r.actions?.some((a: any) =>
                                    (a.type as string)?.startsWith("cascade")
                                  ) ? (
                                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                )}
                                <div>
                                  <Text weight="semibold" block>{r.ruleName}</Text>
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
              disabled={updateMutation.isPending}
              className="bg-black text-white hover:bg-gray-800 rounded-none px-8"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </HStack>
        </form>
      </main>
    </div>
  );
}
