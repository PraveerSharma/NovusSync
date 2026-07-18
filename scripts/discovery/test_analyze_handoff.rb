#!/usr/bin/env ruby

require "open3"
require "rbconfig"

ANALYZER = File.join(__dir__, "analyze_handoff.rb")
FIXTURE_DIR = File.join(__dir__, "fixtures")
REPOSITORY_ROOT = File.expand_path("../..", __dir__)
SYNTHETIC_EXAMPLE = File.join(REPOSITORY_ROOT, "docs/discovery/examples/synthetic_redacted_handoff.csv")
BLANK_TEMPLATE = File.join(REPOSITORY_ROOT, "docs/discovery/templates/redacted_handoff.csv")

TestCase = Struct.new(:name, :path, :exit_status, :required_text, keyword_init: true)

def fixture(name)
  File.join(FIXTURE_DIR, name)
end

TEST_CASES = [
  TestCase.new(
    name: "documented synthetic example reaches only the remaining-validation checkpoint",
    path: SYNTHETIC_EXAMPLE,
    exit_status: 0,
    required_text: [
      "Included unique eligible studios/owners | 10",
      "High/fatal contradictions across all coded rows | 1",
      "Open high/fatal contradictions across all coded rows | 0",
      "**PROCEED_TO_REMAINING_G0_VALIDATION**",
      "not a Gate G0 pass"
    ]
  ),
  TestCase.new(
    name: "small unique sample continues research",
    path: fixture("continue_research.csv"),
    exit_status: 0,
    required_text: ["**CONTINUE_RESEARCH**"]
  ),
  TestCase.new(
    name: "recent material finding continues toward 20",
    path: fixture("continue_toward_20.csv"),
    exit_status: 0,
    required_text: ["**CONTINUE_TOWARD_20**"]
  ),
  TestCase.new(
    name: "dual-pain rate below threshold recommends rework or stop",
    path: fixture("rework_low_pain.csv"),
    exit_status: 0,
    required_text: ["Both-pain rate | 60.0%", "**REWORK_OR_STOP**"]
  ),
  TestCase.new(
    name: "open fatal contradiction on an ineligible row is still visible and blocking",
    path: fixture("ineligible_open_fatal.csv"),
    exit_status: 0,
    required_text: [
      "High/fatal contradictions across all coded rows | 1",
      "Open high/fatal contradictions across all coded rows | 1",
      "Unresolved fatal contradictions across all coded rows | 1",
      "**REWORK_OR_STOP**"
    ]
  ),
  TestCase.new(
    name: "duplicate included studio is rejected",
    path: fixture("duplicate_included.csv"),
    exit_status: 1,
    required_text: ["duplicate included eligible studio_code TRN-STU-001"]
  ),
  TestCase.new(
    name: "explicitly excluded duplicate follow-up is reported but not counted",
    path: fixture("duplicate_explicit_exclusion.csv"),
    exit_status: 0,
    required_text: [
      "Included unique eligible studios/owners | 1",
      "Eligible rows explicitly excluded | 1",
      "DUPLICATE_STUDIO_FOLLOW_UP",
      "**CONTINUE_RESEARCH**"
    ]
  ),
  TestCase.new(
    name: "partial contradiction triple is rejected",
    path: fixture("malformed_contradiction.csv"),
    exit_status: 1,
    required_text: ["must be supplied together or all left blank"]
  ),
  TestCase.new(
    name: "unrecognized contradiction category is rejected",
    path: fixture("invalid_contradiction_category.csv"),
    exit_status: 1,
    required_text: ["contradiction_category=\"UNBOUNDED_CATEGORY\" is not allowed"]
  ),
  TestCase.new(
    name: "ineligible row without a reason category is rejected",
    path: fixture("missing_ineligible_reason.csv"),
    exit_status: 1,
    required_text: ["eligibility_reason_category is required for an ineligible conversation"]
  ),
  TestCase.new(
    name: "eligible row without every candidate flag is rejected",
    path: fixture("missing_candidate_flag.csv"),
    exit_status: 1,
    required_text: ["manual_workflow_candidate is required for an eligible interview"]
  ),
  TestCase.new(
    name: "malformed CSV is rejected cleanly",
    path: fixture("malformed.csv"),
    exit_status: 1,
    required_text: ["Handoff validation failed: malformed CSV"]
  ),
  TestCase.new(
    name: "blank schema template is never treated as evidence",
    path: BLANK_TEMPLATE,
    exit_status: 2,
    required_text: ["No coded interview rows found. The blank template is not evidence."]
  )
].freeze

failures = []

puts "# Synthetic redacted-handoff checker regression suite"
puts "These tests are fictional tooling checks, not customer evidence and not a Gate G0 pass."
puts

TEST_CASES.each do |test_case|
  stdout, stderr, status = Open3.capture3(RbConfig.ruby, ANALYZER, test_case.path)
  combined_output = [stdout, stderr].reject(&:empty?).join("\n")
  case_failures = []

  unless status.exitstatus == test_case.exit_status
    case_failures << "expected exit #{test_case.exit_status}, got #{status.exitstatus}"
  end

  test_case.required_text.each do |expected|
    case_failures << "missing #{expected.inspect}" unless combined_output.include?(expected)
  end

  if case_failures.empty?
    puts "PASS: #{test_case.name}"
  else
    puts "FAIL: #{test_case.name}"
    case_failures.each { |failure| puts "  - #{failure}" }
    failures << [test_case, combined_output]
  end
end

puts

if failures.empty?
  puts "#{TEST_CASES.length} synthetic regression cases passed."
  exit 0
end

puts "#{failures.length} of #{TEST_CASES.length} synthetic regression cases failed."
failures.each do |test_case, output|
  puts
  puts "--- #{test_case.name} output ---"
  puts output
end
exit 1
