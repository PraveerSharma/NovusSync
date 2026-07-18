const viewTitles = {
  overview: "Campaign overview",
  facts: "Verified business facts",
  campaign: "Campaign proposal",
  approval: "Exact content approval",
  publication: "Manual publication queue",
  leads: "Leads and consent",
  booking: "Booking and attendance",
  learning: "Weekly learning",
};

const state = {
  factCorrected: false,
  approvalComplete: false,
  manualBoundaryConfirmed: false,
  optoutRecorded: false,
  takeoverRecorded: false,
  campaignPaused: false,
  attendanceOutcome: null,
  attendanceHistory: [],
  experimentDecision: null,
};

const taskDefinitions = [
  { key: "fact", label: "Correct the intro price", complete: () => state.factCorrected },
  { key: "approval", label: "Approve the changed carousel", complete: () => state.approvalComplete },
  { key: "manual", label: "Confirm who publishes and messages", complete: () => state.manualBoundaryConfirmed },
  { key: "optout", label: "Record a Lead opt-out", complete: () => state.optoutRecorded },
  {
    key: "outcome",
    label: "Verify attendance and decide the experiment",
    complete: () => state.attendanceOutcome === "attended" && Boolean(state.experimentDecision),
  },
];

const screens = [...document.querySelectorAll("[data-screen]")];
const navItems = [...document.querySelectorAll("[data-view]")];
const currentViewTitle = document.querySelector("#currentViewTitle");
const mainContent = document.querySelector("#main-content");
const liveRegion = document.querySelector("#liveRegion");
const taskProgress = document.querySelector("#taskProgress");
const taskCount = document.querySelector("#taskCount");
const completionPanel = document.querySelector("#completionPanel");

function announce(message) {
  liveRegion.textContent = "";
  window.setTimeout(() => {
    liveRegion.textContent = message;
  }, 10);
}

function showView(viewName, moveFocus = true) {
  if (!viewTitles[viewName]) return;

  screens.forEach((screen) => {
    screen.hidden = screen.dataset.screen !== viewName;
  });

  navItems.forEach((item) => {
    const active = item.dataset.view === viewName;
    item.classList.toggle("is-active", active);
    if (active) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  currentViewTitle.textContent = viewTitles[viewName];
  window.scrollTo({ top: 0, behavior: "auto" });

  if (moveFocus) {
    mainContent.focus({ preventScroll: true });
    announce(`${viewTitles[viewName]} screen opened.`);
  }
}

function updateTaskProgress() {
  const completed = taskDefinitions.filter((task) => task.complete()).length;
  taskProgress.value = completed;
  taskProgress.textContent = `${completed} of 5 complete`;
  taskCount.textContent = `${completed} of 5 complete`;

  taskDefinitions.forEach((task, index) => {
    const row = document.querySelector(`[data-task-row="${task.key}"]`);
    const done = task.complete();
    row.classList.toggle("is-complete", done);
    row.setAttribute("aria-label", `Task ${index + 1}: ${done ? "complete" : "not complete"}. ${task.label}.`);
    row.querySelector(".task-marker").textContent = done ? "Done" : String(index + 1);
  });

  completionPanel.hidden = completed !== 5;
}

navItems.forEach((item) => {
  item.addEventListener("click", () => showView(item.dataset.view));
});

document.querySelectorAll("[data-go-view]").forEach((item) => {
  item.addEventListener("click", () => showView(item.dataset.goView));
});

const priceForm = document.querySelector("#priceCorrectionForm");
const priceInput = document.querySelector("#introPriceInput");
const priceError = document.querySelector("#priceError");
const introPriceValue = document.querySelector("#introPriceValue");
const introPriceStatus = document.querySelector("#introPriceStatus");
const factSummaryStatus = document.querySelector("#factSummaryStatus");
const priceConflictNotice = document.querySelector("#priceConflictNotice");
const campaignPrice = document.querySelector("#campaignPrice");
const approvalPrice = document.querySelector("#approvalPrice");

function normalizedPrice(value) {
  return value.toLowerCase().replaceAll(",", "").replaceAll(" ", "").replace("inr", "");
}

priceForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (normalizedPrice(priceInput.value) !== "999") {
    priceError.textContent = "That does not match the owner-supplied brochure. Review the evidence and enter INR 999.";
    priceError.hidden = false;
    priceInput.setAttribute("aria-invalid", "true");
    priceInput.focus();
    return;
  }

  state.factCorrected = true;
  priceInput.value = "INR 999";
  priceInput.removeAttribute("aria-invalid");
  priceError.hidden = true;
  introPriceValue.textContent = "INR 999";
  campaignPrice.textContent = "INR 999";
  approvalPrice.textContent = "INR 999";
  introPriceStatus.textContent = "Owner verified";
  introPriceStatus.className = "status status-success";
  factSummaryStatus.textContent = "Facts ready for proposal";
  factSummaryStatus.className = "status status-success";
  priceConflictNotice.hidden = true;
  updateTaskProgress();
  announce("Introductory offer price corrected to INR 999. Task 1 complete.");
});

const approvalStatus = document.querySelector("#approvalStatus");
const reviewConfirmation = document.querySelector("#reviewConfirmation");
const approvalError = document.querySelector("#approvalError");
const approvalRecord = document.querySelector("#approvalRecord");
const approveVersion = document.querySelector("#approveVersion");

approveVersion.addEventListener("click", () => {
  if (!state.factCorrected) {
    priceError.textContent = "Correct the conflicting offer price before approving content that uses it.";
    priceError.hidden = false;
    priceInput.setAttribute("aria-invalid", "true");
    showView("facts");
    priceInput.focus();
    announce("Approval is blocked until the conflicting offer price is corrected.");
    return;
  }

  if (!reviewConfirmation.checked) {
    approvalError.textContent = "Confirm that you reviewed the exact current version before approving it.";
    approvalError.hidden = false;
    reviewConfirmation.focus();
    return;
  }

  state.approvalComplete = true;
  approvalError.hidden = true;
  approvalStatus.textContent = "Exact version 3 approved";
  approvalStatus.className = "status status-success";
  approvalRecord.textContent = "Prototype record: owner approved content item 04, exact version 3. Any later change requires a new approval.";
  approveVersion.disabled = true;
  updateTaskProgress();
  announce("Exact version 3 approved. Task 2 complete.");
});

document.querySelector("#requestChange").addEventListener("click", () => {
  state.approvalComplete = false;
  approvalStatus.textContent = "Change requested";
  approvalStatus.className = "status status-warning";
  approvalRecord.textContent = "Prototype record: change requested. Version 3 is not authorized for manual publication.";
  approveVersion.disabled = false;
  updateTaskProgress();
  announce("Change requested. Version 3 remains unapproved.");
});

const manualBoundaryButton = document.querySelector("#confirmManualBoundary");
const manualBoundaryRecord = document.querySelector("#manualBoundaryRecord");

manualBoundaryButton.addEventListener("click", () => {
  state.manualBoundaryConfirmed = true;
  manualBoundaryRecord.textContent = "Recorded for this test: software prepares and records; named humans publish and message through official accounts.";
  manualBoundaryRecord.hidden = false;
  manualBoundaryButton.disabled = true;
  updateTaskProgress();
  announce("Manual channel responsibility confirmed. Task 3 complete.");
});

const optoutDialog = document.querySelector("#optoutDialog");
const openOptoutDialog = document.querySelector("#openOptoutDialog");
const confirmOptout = document.querySelector("#confirmOptout");
const lead103Status = document.querySelector("#lead103Status");
const lead103Next = document.querySelector("#lead103Next");

openOptoutDialog.addEventListener("click", () => {
  if (typeof optoutDialog.showModal === "function") {
    optoutDialog.showModal();
  } else {
    optoutDialog.setAttribute("open", "");
  }
});

confirmOptout.addEventListener("click", () => {
  state.optoutRecorded = true;
  lead103Status.textContent = "Opted out";
  lead103Status.className = "status status-success";
  lead103Next.textContent = "Product drafts and reminders suppressed; human stop instruction recorded";
  openOptoutDialog.disabled = true;
  updateTaskProgress();
  announce("Synthetic Lead L-103 opted out. Product follow-up suppressed. Task 4 complete.");
});

const recordTakeover = document.querySelector("#recordTakeover");
const pauseCampaign = document.querySelector("#pauseCampaign");
const lead102Status = document.querySelector("#lead102Status");
const lead102Next = document.querySelector("#lead102Next");
const ownerControlRecord = document.querySelector("#ownerControlRecord");
const campaignPauseStatus = document.querySelector("#campaignPauseStatus");

recordTakeover.addEventListener("click", () => {
  state.takeoverRecorded = true;
  lead102Status.textContent = "Owner takeover";
  lead102Status.className = "status status-warning";
  lead102Next.textContent = "Owner handles this Lead; product drafts and reminders suppressed";
  ownerControlRecord.textContent =
    "Prototype record: the owner took over L-102. The product stops guidance for this Lead but cannot control off-platform human actions.";
  ownerControlRecord.hidden = false;
  recordTakeover.disabled = true;
  announce("Owner takeover recorded for synthetic Lead L-102. Product guidance for that Lead is suppressed.");
});

pauseCampaign.addEventListener("click", () => {
  state.campaignPaused = true;
  campaignPauseStatus.textContent = "Campaign guidance paused";
  campaignPauseStatus.className = "status status-warning";
  ownerControlRecord.textContent = state.takeoverRecorded
    ? "Prototype record: L-102 remains under owner takeover and all new campaign drafts, reminders, and manual-publication due work are paused. Humans must separately stop any off-platform action."
    : "Prototype record: all new campaign drafts, reminders, and manual-publication due work are paused. Humans must separately stop any off-platform action.";
  ownerControlRecord.hidden = false;
  pauseCampaign.disabled = true;
  announce("Synthetic campaign guidance paused. No external action was attempted.");
});

const attendanceStatus = document.querySelector("#attendanceStatus");
const attendanceRecordTitle = document.querySelector("#attendanceRecordTitle");
const attendanceRecordBody = document.querySelector("#attendanceRecordBody");
const attendedMetric = document.querySelector("#attendedMetric");
const attendedMetricNote = document.querySelector("#attendedMetricNote");

const attendanceLabels = {
  attended: "Attended",
  no_show: "No-show",
  cancelled: "Cancelled",
};

document.querySelectorAll("[data-attendance-outcome]").forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    const nextOutcome = button.dataset.attendanceOutcome;
    const priorOutcome = state.attendanceOutcome;

    if (priorOutcome && priorOutcome !== nextOutcome) {
      state.attendanceHistory.push(priorOutcome);
    }

    state.attendanceOutcome = nextOutcome;

    document.querySelectorAll("[data-attendance-outcome]").forEach((choice) => {
      const selected = choice === button;
      choice.classList.toggle("is-selected", selected);
      choice.setAttribute("aria-pressed", selected ? "true" : "false");
    });

    const label = attendanceLabels[nextOutcome];
    const correctionCopy = priorOutcome && priorOutcome !== nextOutcome
      ? ` Correction appended: ${attendanceLabels[priorOutcome]} is preserved as superseded.`
      : "";

    attendanceStatus.textContent = `${label} · owner verified`;
    attendanceStatus.className = nextOutcome === "attended" ? "status status-success" : "status status-warning";
    attendanceRecordTitle.textContent = `${label} outcome verified by Priya S.`;
    attendanceRecordBody.textContent =
      `Prototype record: the authorized studio owner recorded ${label.toLowerCase()} for Asha Demo's Beginner Flow appointment on 19 July.${correctionCopy}`;

    if (nextOutcome === "attended") {
      attendedMetric.textContent = "3 / 4";
      attendedMetricNote.textContent = "3 verified attended · 1 no-show";
    } else {
      attendedMetric.textContent = "2 / 4";
      attendedMetricNote.textContent = nextOutcome === "no_show"
        ? "2 verified attended · 2 no-shows"
        : "2 verified attended · 1 no-show · 1 cancelled";
    }

    updateTaskProgress();
    announce(
      nextOutcome === "attended"
        ? "Attendance verified by the synthetic studio owner. Choose an experiment decision to complete task 5."
        : `${label} recorded. It does not count as attendance; choose Attended only when supported by evidence.`,
    );
  });
});

document.querySelectorAll(".experiment-choice").forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    state.experimentDecision = button.dataset.decision;

    document.querySelectorAll(".experiment-choice").forEach((choice) => {
      const selected = choice === button;
      choice.classList.toggle("is-selected", selected);
      choice.setAttribute("aria-pressed", selected ? "true" : "false");
    });

    const experimentRecord = document.querySelector("#experimentRecord");
    experimentRecord.textContent = `Prototype record: experiment ${state.experimentDecision.toLowerCase()}. This creates no campaign or external work.`;
    experimentRecord.hidden = false;
    updateTaskProgress();

    if (state.attendanceOutcome === "attended") {
      announce(`Experiment ${state.experimentDecision.toLowerCase()}. Task 5 complete.`);
    } else {
      announce(`Experiment ${state.experimentDecision.toLowerCase()}. Verify attendance to complete task 5.`);
    }
  });
});

document.querySelector("#resetDemo").addEventListener("click", () => {
  const confirmed = window.confirm("Reset every synthetic task and return to the starting screen?");
  if (confirmed) window.location.reload();
});

updateTaskProgress();
showView("overview", false);
