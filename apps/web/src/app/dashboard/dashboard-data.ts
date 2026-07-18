export type QueueFilter = "attention" | "today" | "approvals" | "all";

export type DueState = "overdue" | "today" | "upcoming";

export type LifecycleStage =
  | "new"
  | "contacted"
  | "qualified"
  | "booking_proposed"
  | "booked"
  | "booking_confirmed"
  | "outcome_verified"
  | "outcome_missed"
  | "conversion_follow_up"
  | "converted"
  | "closed_not_converted";

export type QueueLead = {
  id: string;
  initials: string;
  name: string;
  source: string;
  campaign: string;
  stage: LifecycleStage;
  stageLabel: string;
  version: number;
  nextAction: string;
  dueLabel: string;
  dueState: DueState;
  assignee: string;
  priority: "urgent" | "high" | "normal";
  approval: string | null;
  context: string;
};

export const queueLeads: QueueLead[] = [
  {
    id: "lead-syn-001",
    initials: "MR",
    name: "Maya Rao",
    source: "Social campaign",
    campaign: "Begin with confidence",
    stage: "new",
    stageLabel: "New enquiry",
    version: 1,
    nextAction: "Send the approved welcome reply",
    dueLabel: "18 min overdue",
    dueState: "overdue",
    assignee: "Ari",
    priority: "urgent",
    approval: null,
    context: "Asked for beginner-friendly evening availability and pricing.",
  },
  {
    id: "lead-syn-002",
    initials: "DC",
    name: "Daniel Cho",
    source: "Search",
    campaign: "Local intent capture",
    stage: "qualified",
    stageLabel: "Qualified",
    version: 3,
    nextAction: "Review the recommended booking option",
    dueLabel: "Due in 12 min",
    dueState: "today",
    assignee: "Mina",
    priority: "high",
    approval: "Capacity exception",
    context: "Preferred slot is nearly full. The operator prepared an alternate option.",
  },
  {
    id: "lead-syn-003",
    initials: "NA",
    name: "Noor Ahmed",
    source: "Referral",
    campaign: "Member referral",
    stage: "booking_proposed",
    stageLabel: "Booking proposed",
    version: 4,
    nextAction: "Confirm the selected time",
    dueLabel: "Due today",
    dueState: "today",
    assignee: "Ari",
    priority: "normal",
    approval: null,
    context: "Selected one of two approved introductory appointments.",
  },
  {
    id: "lead-syn-004",
    initials: "LS",
    name: "Lucas Silva",
    source: "Direct",
    campaign: "Website enquiry",
    stage: "booking_confirmed",
    stageLabel: "Booking confirmed",
    version: 6,
    nextAction: "Send the approved reminder",
    dueLabel: "Tomorrow, 09:00",
    dueState: "upcoming",
    assignee: "Mina",
    priority: "normal",
    approval: null,
    context: "Booking is confirmed. Reminder timing follows the workspace rule.",
  },
  {
    id: "lead-syn-005",
    initials: "AC",
    name: "Amara Chen",
    source: "Social campaign",
    campaign: "New season offer",
    stage: "outcome_verified",
    stageLabel: "Outcome verified",
    version: 7,
    nextAction: "Review the membership follow-up",
    dueLabel: "42 min overdue",
    dueState: "overdue",
    assignee: "Ari",
    priority: "high",
    approval: "Welcome offer",
    context: "Attended the introductory appointment and requested package details.",
  },
  {
    id: "lead-syn-006",
    initials: "KO",
    name: "Kenji Okafor",
    source: "Partner",
    campaign: "Neighbourhood partner",
    stage: "outcome_missed",
    stageLabel: "Outcome missed",
    version: 7,
    nextAction: "Offer an approved reschedule",
    dueLabel: "Due today",
    dueState: "today",
    assignee: "Mina",
    priority: "normal",
    approval: null,
    context: "Missed the first booking. No reschedule has been offered yet.",
  },
];

export const metrics = [
  {
    label: "Open enquiries",
    value: "28",
    detail: "5 need attention",
    trend: "+12%",
    tone: "warm",
  },
  {
    label: "Median response",
    value: "14m",
    detail: "Target under 20m",
    trend: "-8m",
    tone: "cool",
  },
  {
    label: "Bookings today",
    value: "09",
    detail: "2 await confirmation",
    trend: "+3",
    tone: "gold",
  },
  {
    label: "Verified outcomes",
    value: "61%",
    detail: "Known source to outcome",
    trend: "+9 pts",
    tone: "ink",
  },
] as const;

export const funnel = [
  { label: "Enquiries", value: 44, percentage: 100 },
  { label: "Qualified", value: 31, percentage: 70 },
  { label: "Booked", value: 25, percentage: 57 },
  { label: "Outcome", value: 17, percentage: 39 },
  { label: "Converted", value: 7, percentage: 16 },
] as const;

export const lifecycleMilestones = [
  "Enquiry",
  "Qualified",
  "Booking",
  "Outcome",
  "Converted",
] as const;

export const lifecycleMilestoneByStage: Record<LifecycleStage, number> = {
  new: 0,
  contacted: 0,
  qualified: 1,
  booking_proposed: 2,
  booked: 2,
  booking_confirmed: 2,
  outcome_verified: 3,
  outcome_missed: 3,
  conversion_follow_up: 4,
  converted: 4,
  closed_not_converted: 4,
};

export const recentActivity = [
  { label: "Attendance verified", detail: "Synthetic lead 018", time: "4m" },
  { label: "Follow-up proposed", detail: "Awaiting owner review", time: "11m" },
  { label: "Booking confirmed", detail: "External calendar reference", time: "23m" },
] as const;
