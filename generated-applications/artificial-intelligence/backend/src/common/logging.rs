//! The event catalogue this application logs against.
//!
//! Derived from the log specification for artificial-intelligence. Regenerate rather
//! than edit: this file is generated from
//! `packages/core/src/logging/log-spec.json`, which is where an event's
//! level and message are decided, and a change made here is lost on the next
//! run and disagrees with the catalogue in the meantime.
//!
//! A call site names what happened rather than a level and a sentence:
//!
//! ```ignore
//! log_event!(rules_action_unknown, action = other);
//! ```
//!
//! Every line carries an `event` field, so a query can ask for one kind of
//! event without matching on wording that is free to change. The transport is
//! Loco's own subscriber — this adds a vocabulary, not a second logger.

/// Emit a catalogued event through `tracing`.
///
/// The macro is exported at the crate root, so call sites write
/// `crate::log_event!(...)` from anywhere in the crate.
#[macro_export]
macro_rules! log_event {
    // entity — error
    (entity_audit_unavailable) => {
        ::tracing::error!(event = "entity.audit.unavailable", "The audit service is not initialised, so this write was not recorded")
    };
    (entity_audit_unavailable, $($field:tt)+) => {
        ::tracing::error!(event = "entity.audit.unavailable", $($field)+, "The audit service is not initialised, so this write was not recorded")
    };
    // entity — error
    (entity_promotion_unavailable) => {
        ::tracing::error!(event = "entity.promotion.unavailable", "The promotion service is not initialised, so the row keeps its draft status")
    };
    (entity_promotion_unavailable, $($field:tt)+) => {
        ::tracing::error!(event = "entity.promotion.unavailable", $($field)+, "The promotion service is not initialised, so the row keeps its draft status")
    };
    // entity — error
    (entity_promotion_failed) => {
        ::tracing::error!(event = "entity.promotion.failed", "Promotion failed; the row was left as a draft")
    };
    (entity_promotion_failed, $($field:tt)+) => {
        ::tracing::error!(event = "entity.promotion.failed", $($field)+, "Promotion failed; the row was left as a draft")
    };
    // entity — error
    (entity_draft_discard_failed) => {
        ::tracing::error!(event = "entity.draft.discard_failed", "A rejected draft could not be discarded and is still in the table")
    };
    (entity_draft_discard_failed, $($field:tt)+) => {
        ::tracing::error!(event = "entity.draft.discard_failed", $($field)+, "A rejected draft could not be discarded and is still in the table")
    };
    // entity — warn
    (entity_column_undecodable) => {
        ::tracing::warn!(event = "entity.column.undecodable", "A column's value could not be decoded and was served as null")
    };
    (entity_column_undecodable, $($field:tt)+) => {
        ::tracing::warn!(event = "entity.column.undecodable", $($field)+, "A column's value could not be decoded and was served as null")
    };
    // entity — debug
    (entity_delete_no_match) => {
        ::tracing::debug!(event = "entity.delete.no_match", "A delete step matched no row")
    };
    (entity_delete_no_match, $($field:tt)+) => {
        ::tracing::debug!(event = "entity.delete.no_match", $($field)+, "A delete step matched no row")
    };
    // rules — error
    (rules_jdm_invalid) => {
        ::tracing::error!(event = "rules.jdm.invalid", "A stored decision graph is not valid JDM and was skipped")
    };
    (rules_jdm_invalid, $($field:tt)+) => {
        ::tracing::error!(event = "rules.jdm.invalid", $($field)+, "A stored decision graph is not valid JDM and was skipped")
    };
    // rules — error
    (rules_evaluation_failed) => {
        ::tracing::error!(event = "rules.evaluation.failed", "Rule evaluation failed; the write was allowed to stand")
    };
    (rules_evaluation_failed, $($field:tt)+) => {
        ::tracing::error!(event = "rules.evaluation.failed", $($field)+, "Rule evaluation failed; the write was allowed to stand")
    };
    // rules — error
    (rules_action_failed) => {
        ::tracing::error!(event = "rules.action.failed", "A rule action failed; the write stands")
    };
    (rules_action_failed, $($field:tt)+) => {
        ::tracing::error!(event = "rules.action.failed", $($field)+, "A rule action failed; the write stands")
    };
    // rules — warn
    (rules_action_unknown) => {
        ::tracing::warn!(event = "rules.action.unknown", "A matched rule named an action this runtime does not implement")
    };
    (rules_action_unknown, $($field:tt)+) => {
        ::tracing::warn!(event = "rules.action.unknown", $($field)+, "A matched rule named an action this runtime does not implement")
    };
    // rules — warn
    (rules_target_unknown) => {
        ::tracing::warn!(event = "rules.target.unknown", "A rule action named a table or column the dictionary does not describe")
    };
    (rules_target_unknown, $($field:tt)+) => {
        ::tracing::warn!(event = "rules.target.unknown", $($field)+, "A rule action named a table or column the dictionary does not describe")
    };
    // rules — warn
    (rules_workflow_incomplete) => {
        ::tracing::warn!(event = "rules.workflow.incomplete", "A rule-triggered workflow did not complete; the run is recorded as failed")
    };
    (rules_workflow_incomplete, $($field:tt)+) => {
        ::tracing::warn!(event = "rules.workflow.incomplete", $($field)+, "A rule-triggered workflow did not complete; the run is recorded as failed")
    };
    // workflow — debug
    (workflow_node_executing) => {
        ::tracing::debug!(event = "workflow.node.executing", "Executing a workflow node")
    };
    (workflow_node_executing, $($field:tt)+) => {
        ::tracing::debug!(event = "workflow.node.executing", $($field)+, "Executing a workflow node")
    };
    // workflow — warn
    (workflow_node_unknown) => {
        ::tracing::warn!(event = "workflow.node.unknown", "A workflow node names a type this runtime does not implement; skipped")
    };
    (workflow_node_unknown, $($field:tt)+) => {
        ::tracing::warn!(event = "workflow.node.unknown", $($field)+, "A workflow node names a type this runtime does not implement; skipped")
    };
    // workflow — debug
    (workflow_decision_published) => {
        ::tracing::debug!(event = "workflow.decision.published", "A decision step published variables to the run context")
    };
    (workflow_decision_published, $($field:tt)+) => {
        ::tracing::debug!(event = "workflow.decision.published", $($field)+, "A decision step published variables to the run context")
    };
    // jobs — info
    (jobs_queued) => {
        ::tracing::info!(event = "jobs.queued", "A background job was accepted")
    };
    (jobs_queued, $($field:tt)+) => {
        ::tracing::info!(event = "jobs.queued", $($field)+, "A background job was accepted")
    };
    // jobs — warn
    (jobs_mailer_absent) => {
        ::tracing::warn!(event = "jobs.mailer.absent", "No mailer is configured, so the message was not sent")
    };
    (jobs_mailer_absent, $($field:tt)+) => {
        ::tracing::warn!(event = "jobs.mailer.absent", $($field)+, "No mailer is configured, so the message was not sent")
    };
    // dictionary — debug
    (dictionary_cache_invalidated) => {
        ::tracing::debug!(event = "dictionary.cache.invalidated", "Cached metadata was dropped after a dictionary write")
    };
    (dictionary_cache_invalidated, $($field:tt)+) => {
        ::tracing::debug!(event = "dictionary.cache.invalidated", $($field)+, "Cached metadata was dropped after a dictionary write")
    };
    // dictionary — warn
    (dictionary_column_absent) => {
        ::tracing::warn!(event = "dictionary.column.absent", "The dictionary names an ordering column the table does not have; ordered by primary key instead")
    };
    (dictionary_column_absent, $($field:tt)+) => {
        ::tracing::warn!(event = "dictionary.column.absent", $($field)+, "The dictionary names an ordering column the table does not have; ordered by primary key instead")
    };
    // dictionary — warn
    (dictionary_config_unreadable) => {
        ::tracing::warn!(event = "dictionary.config.unreadable", "sys_system could not be read; configuration resolved from the settings block alone")
    };
    (dictionary_config_unreadable, $($field:tt)+) => {
        ::tracing::warn!(event = "dictionary.config.unreadable", $($field)+, "sys_system could not be read; configuration resolved from the settings block alone")
    };
    // request — info
    (request_completed) => {
        ::tracing::info!(event = "request.completed", "Request completed")
    };
    (request_completed, $($field:tt)+) => {
        ::tracing::info!(event = "request.completed", $($field)+, "Request completed")
    };
    // request — warn
    (request_refused) => {
        ::tracing::warn!(event = "request.refused", "Request refused")
    };
    (request_refused, $($field:tt)+) => {
        ::tracing::warn!(event = "request.refused", $($field)+, "Request refused")
    };
    // request — error
    (request_failed) => {
        ::tracing::error!(event = "request.failed", "Request failed")
    };
    (request_failed, $($field:tt)+) => {
        ::tracing::error!(event = "request.failed", $($field)+, "Request failed")
    };
    // request — error
    (request_unhandled) => {
        ::tracing::error!(event = "request.unhandled", "An error reached the top of a request handler")
    };
    (request_unhandled, $($field:tt)+) => {
        ::tracing::error!(event = "request.unhandled", $($field)+, "An error reached the top of a request handler")
    };
    // assistant — warn
    (assistant_plan_unparseable) => {
        ::tracing::warn!(event = "assistant.plan.unparseable", "The model returned a query plan that could not be parsed")
    };
    (assistant_plan_unparseable, $($field:tt)+) => {
        ::tracing::warn!(event = "assistant.plan.unparseable", $($field)+, "The model returned a query plan that could not be parsed")
    };
    // entity — error
    (entity_audit_write_failed) => {
        ::tracing::error!(event = "entity.audit.write_failed", "An audit entry could not be written; the operation it records was NOT rolled back")
    };
    (entity_audit_write_failed, $($field:tt)+) => {
        ::tracing::error!(event = "entity.audit.write_failed", $($field)+, "An audit entry could not be written; the operation it records was NOT rolled back")
    };
    // jobs — error
    (jobs_upstream_unreachable) => {
        ::tracing::error!(event = "jobs.upstream.unreachable", "An upstream service this application proxies to could not be reached")
    };
    (jobs_upstream_unreachable, $($field:tt)+) => {
        ::tracing::error!(event = "jobs.upstream.unreachable", $($field)+, "An upstream service this application proxies to could not be reached")
    };
}

/// Every event id this catalogue defines, for the suite that checks it.
///
/// A list rather than a doc comment: a test can read it, and a catalogue
/// nothing can enumerate is one nothing can hold to the spec.
pub const EVENT_IDS: [&str; 27] = [
    "entity.audit.unavailable",
    "entity.promotion.unavailable",
    "entity.promotion.failed",
    "entity.draft.discard_failed",
    "entity.column.undecodable",
    "entity.delete.no_match",
    "rules.jdm.invalid",
    "rules.evaluation.failed",
    "rules.action.failed",
    "rules.action.unknown",
    "rules.target.unknown",
    "rules.workflow.incomplete",
    "workflow.node.executing",
    "workflow.node.unknown",
    "workflow.decision.published",
    "jobs.queued",
    "jobs.mailer.absent",
    "dictionary.cache.invalidated",
    "dictionary.column.absent",
    "dictionary.config.unreadable",
    "request.completed",
    "request.refused",
    "request.failed",
    "request.unhandled",
    "assistant.plan.unparseable",
    "entity.audit.write_failed",
    "jobs.upstream.unreachable",
];
