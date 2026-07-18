"use client";

import {
  BUSINESS_PROFILE_SECTIONS,
  createBusinessProfileDraft,
  getBusinessProfileCompletion,
  restoreBusinessProfileDraft,
  reviseBusinessProfileDraft,
  validateBusinessProfileDraft,
} from "@novussync/domain";
import type {
  BusinessProfileDraft,
  BusinessProfileFieldDefinition,
  BusinessProfileSection,
  BusinessProfileValue,
} from "@novussync/domain";
import { YOGA_STUDIO_PLAYBOOK_V1 } from "@novussync/vertical-yoga";
import { useEffect, useMemo, useState } from "react";

import styles from "./profile.module.css";

const STORAGE_KEY = "novussync.synthetic.business-profile.v1";
const PROFILE_ID = "synthetic-browser-profile";
const SYNTHETIC_TENANT = Object.freeze({
  organizationId: "synthetic-org",
  workspaceId: "synthetic-workspace",
});
const INITIAL_TIME = "2026-07-18T00:00:00.000Z";

const SECTION_COPY: Record<BusinessProfileSection, Readonly<{ label: string; summary: string }>> = {
  business: { label: "Business", summary: "Identity and operating context" },
  offer: { label: "Offer", summary: "The exact introductory experience" },
  audience: { label: "Audience", summary: "Who the offer is and is not for" },
  voice: { label: "Voice", summary: "How approved language should sound" },
  faqs: { label: "FAQs", summary: "Owner-approved customer answers" },
  claims: { label: "Claims", summary: "What can and cannot be promised" },
  restrictions: { label: "Restrictions", summary: "Cases requiring human approval" },
  booking: { label: "Booking", summary: "The external route and outcome proof" },
};

function createEmptyDraft(): BusinessProfileDraft {
  return createBusinessProfileDraft({
    profileId: PROFILE_ID,
    tenant: SYNTHETIC_TENANT,
    playbook: YOGA_STUDIO_PLAYBOOK_V1,
    now: INITIAL_TIME,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStoredDraft(serialized: string): BusinessProfileDraft {
  const parsed: unknown = JSON.parse(serialized);
  if (!isRecord(parsed) || !isRecord(parsed.tenant) || !isRecord(parsed.playbook)) {
    throw new Error("Stored profile shape is invalid.");
  }
  if (
    parsed.profileId !== PROFILE_ID ||
    parsed.tenant.organizationId !== SYNTHETIC_TENANT.organizationId ||
    parsed.tenant.workspaceId !== SYNTHETIC_TENANT.workspaceId ||
    parsed.playbook.id !== YOGA_STUDIO_PLAYBOOK_V1.id ||
    parsed.playbook.version !== YOGA_STUDIO_PLAYBOOK_V1.version ||
    !isRecord(parsed.values) ||
    typeof parsed.version !== "number" ||
    typeof parsed.createdAt !== "string" ||
    typeof parsed.updatedAt !== "string"
  ) {
    throw new Error("Stored profile identity is invalid.");
  }

  const values: Record<string, BusinessProfileValue> = {};
  for (const [key, value] of Object.entries(parsed.values)) {
    if (typeof value === "string") {
      values[key] = value;
    } else if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      values[key] = value;
    } else {
      throw new Error("Stored profile values are invalid.");
    }
  }

  return restoreBusinessProfileDraft({
    profileId: PROFILE_ID,
    tenant: SYNTHETIC_TENANT,
    playbook: YOGA_STUDIO_PLAYBOOK_V1,
    values,
    version: parsed.version,
    createdAt: parsed.createdAt,
    updatedAt: parsed.updatedAt,
  });
}

function valueForField(draft: BusinessProfileDraft, field: BusinessProfileFieldDefinition): string {
  const value = draft.values[field.key];
  if (typeof value === "string") return value;
  return value ? value.join("\n") : "";
}

export function BusinessProfileClient() {
  const [draft, setDraft] = useState<BusinessProfileDraft>(createEmptyDraft);
  const [activeSection, setActiveSection] = useState<BusinessProfileSection>("business");
  const [saveStatus, setSaveStatus] = useState("Browser draft not saved yet");
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [touchedFields, setTouchedFields] = useState<ReadonlySet<string>>(() => new Set());
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setDraft(parseStoredDraft(stored));
          setSaveStatus("Draft restored from this browser");
        } catch {
          window.sessionStorage.removeItem(STORAGE_KEY);
          setSaveStatus("Invalid browser draft removed; starting empty");
        }
      }
      setHasLoadedStorage(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  const issues = useMemo(
    () => validateBusinessProfileDraft(draft, YOGA_STUDIO_PLAYBOOK_V1),
    [draft],
  );
  const completion = useMemo(
    () => getBusinessProfileCompletion(draft, YOGA_STUDIO_PLAYBOOK_V1),
    [draft],
  );
  const completionPercent =
    completion.totalRequired === 0
      ? 0
      : Math.round((completion.completedRequired / completion.totalRequired) * 100);
  const activeFields = YOGA_STUDIO_PLAYBOOK_V1.fields.filter(
    (field) => field.section === activeSection,
  );
  const activeIndex = BUSINESS_PROFILE_SECTIONS.indexOf(activeSection);

  function changeField(field: BusinessProfileFieldDefinition, rawValue: string) {
    const isEmpty = rawValue.trim().length === 0;
    const nextValue: BusinessProfileValue | null =
      field.kind === "list"
        ? isEmpty
          ? null
          : rawValue.split("\n").map((item) => item.trimEnd())
        : isEmpty
          ? null
          : rawValue;

    setDraft((current) =>
      reviseBusinessProfileDraft(current, {
        expectedVersion: current.version,
        playbook: YOGA_STUDIO_PLAYBOOK_V1,
        changes: { [field.key]: nextValue },
        now: new Date().toISOString(),
      }),
    );
    setTouchedFields((current) => new Set([...current, field.key]));
    setSaveStatus("Changes not yet saved");
  }

  function saveDraft() {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setHasAttemptedSave(true);
    setSaveStatus("Draft saved in this browser only");
  }

  function moveSection(offset: number) {
    const next = BUSINESS_PROFILE_SECTIONS[activeIndex + offset];
    if (next) {
      setActiveSection(next);
      document.getElementById("section-heading")?.focus();
    }
  }

  return (
    <main className={styles.main} id="profile-main" tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="profile-title">
        <div>
          <p className={styles.eyebrow}>Business brain / Guided setup</p>
          <h1 id="profile-title">Teach NovusSync what is true.</h1>
          <p className={styles.heroCopy}>
            Record approved facts once. Every future proposal can reference the same boundaries
            without inventing an offer, promise, audience, or booking rule.
          </p>
        </div>
        <div className={styles.sandboxNote}>
          <span>Browser-only synthetic draft</span>
          <strong>No live data or external effects</strong>
          <p>This setup cannot publish, message customers, spend money, or change bookings.</p>
        </div>
      </section>

      <section className={styles.progressPanel} aria-label="Profile completion">
        <div>
          <span>Required facts</span>
          <strong>
            {completion.completedRequired} of {completion.totalRequired}
          </strong>
        </div>
        <div
          aria-label={`${completionPercent}% complete`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={completionPercent}
          className={styles.progressTrack}
          role="progressbar"
        >
          <i style={{ width: `${completionPercent}%` }} />
        </div>
        <p>
          {completion.isComplete
            ? "All required facts pass the current playbook checks."
            : `${issues.length} required or invalid ${issues.length === 1 ? "item" : "items"} remain.`}
        </p>
      </section>

      <div className={styles.workspaceGrid}>
        <aside className={styles.sectionRail} aria-label="Business profile sections">
          <p>Profile map</p>
          <ol>
            {BUSINESS_PROFILE_SECTIONS.map((section, index) => {
              const fields = YOGA_STUDIO_PLAYBOOK_V1.fields.filter(
                (field) => field.section === section,
              );
              const requiredFields = fields.filter((field) => field.required);
              const completed = requiredFields.filter((field) => {
                const value = draft.values[field.key];
                return typeof value === "string" ? Boolean(value.trim()) : Boolean(value?.length);
              }).length;

              return (
                <li key={section}>
                  <button
                    aria-current={activeSection === section ? "step" : undefined}
                    className={activeSection === section ? styles.sectionActive : undefined}
                    onClick={() => setActiveSection(section)}
                    type="button"
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>
                      <strong>{SECTION_COPY[section].label}</strong>
                      <small>{SECTION_COPY[section].summary}</small>
                    </span>
                    <em>
                      {completed}/{requiredFields.length}
                    </em>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className={styles.editorPanel} aria-labelledby="section-heading">
          <header className={styles.editorHeader}>
            <div>
              <p>
                Section {activeIndex + 1} of {BUSINESS_PROFILE_SECTIONS.length}
              </p>
              <h2 id="section-heading" tabIndex={-1}>
                {SECTION_COPY[activeSection].label}
              </h2>
              <span>{SECTION_COPY[activeSection].summary}</span>
            </div>
            <span className={styles.versionBadge}>Draft v{draft.version}</span>
          </header>

          <div className={styles.fieldStack}>
            {activeFields.map((field) => {
              const fieldIssues = issues.filter((issue) => issue.fieldKey === field.key);
              const visibleIssues =
                hasAttemptedSave || touchedFields.has(field.key) ? fieldIssues : [];
              const fieldId = `profile-${field.key}`;
              const descriptionId = `${fieldId}-description`;
              const errorId = `${fieldId}-error`;
              const describedBy = visibleIssues.length
                ? `${descriptionId} ${errorId}`
                : descriptionId;
              const value = valueForField(draft, field);

              return (
                <div className={styles.fieldGroup} key={field.key}>
                  <div className={styles.fieldLabelRow}>
                    <label htmlFor={fieldId}>{field.label}</label>
                    {field.required ? <span>Required</span> : <span>Optional</span>}
                  </div>
                  <p id={descriptionId}>{field.description}</p>
                  {field.kind === "long_text" || field.kind === "list" ? (
                    <textarea
                      aria-describedby={describedBy}
                      aria-invalid={visibleIssues.length > 0}
                      id={fieldId}
                      maxLength={field.kind === "long_text" ? field.maxLength : undefined}
                      onChange={(event) => changeField(field, event.target.value)}
                      placeholder={
                        field.kind === "list"
                          ? "Add one approved item per line"
                          : "Enter only owner-approved facts"
                      }
                      required={field.required}
                      rows={field.kind === "list" ? 6 : 5}
                      value={value}
                    />
                  ) : (
                    <input
                      aria-describedby={describedBy}
                      aria-invalid={visibleIssues.length > 0}
                      id={fieldId}
                      maxLength={field.maxLength}
                      onChange={(event) => changeField(field, event.target.value)}
                      placeholder="Enter only owner-approved facts"
                      required={field.required}
                      type={field.kind === "url" ? "url" : "text"}
                      value={value}
                    />
                  )}
                  {field.kind === "list" ? (
                    <small className={styles.listHint}>One approved item per line.</small>
                  ) : null}
                  {visibleIssues.length ? (
                    <p className={styles.fieldError} id={errorId} role="alert">
                      {visibleIssues[0]?.message}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <footer className={styles.editorFooter}>
            <button
              className={styles.secondaryButton}
              disabled={activeIndex === 0}
              onClick={() => moveSection(-1)}
              type="button"
            >
              Previous section
            </button>
            <div>
              <p aria-live="polite" role="status">
                {hasLoadedStorage ? saveStatus : "Checking this browser for a draft"}
              </p>
              <button className={styles.saveButton} onClick={saveDraft} type="button">
                Save browser draft
              </button>
            </div>
            <button
              className={styles.secondaryButton}
              disabled={activeIndex === BUSINESS_PROFILE_SECTIONS.length - 1}
              onClick={() => moveSection(1)}
              type="button"
            >
              Next section
            </button>
          </footer>
        </section>

        <aside className={styles.guardrailCard} aria-labelledby="guardrail-title">
          <p>Deterministic boundary</p>
          <h2 id="guardrail-title">Control stays with the business.</h2>
          <ul>
            <li>No invented profile defaults</li>
            <li>No health or outcome claim approval</li>
            <li>No autonomous publishing or messaging</li>
            <li>No booking capacity or payment changes</li>
          </ul>
          <div>
            <span>Active playbook</span>
            <strong>Independent yoga studio</strong>
            <small>Version 1 / English (India)</small>
          </div>
        </aside>
      </div>
    </main>
  );
}
