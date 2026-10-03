import { Mastra } from "@mastra/core";
import { domainAgent, entityAgent, relationshipAgent } from "./agents";
import { erdDesignWorkflow } from "./workflows";

// Initialize Mastra instance ⭐
export const mastra = new Mastra({
  agents: {
    domainAgent,
    entityAgent,
    relationshipAgent,
  },
  workflows: {
    erdDesignWorkflow,
  },
});

// Export for external use
export { domainAgent, entityAgent, erdDesignWorkflow, relationshipAgent };
