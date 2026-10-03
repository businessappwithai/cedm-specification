/** Types for `automation.js`, the automation reader and writer of 18f5792. See README.md. */

import type { Automation } from "../../../automation/model";

/** Read the Mermaid dialect the automations screen wrote. */
export function parseAutomation(source: string, fallbackEntity?: string): Automation;

/** Write an automation in that dialect — used to tell what a reading kept. */
export function serializeAutomation(automation: Automation, options?: { header?: boolean }): string;

export function emptyAutomation(entity: string): Automation;
