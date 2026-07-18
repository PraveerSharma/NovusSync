#!/usr/bin/env ruby

require "csv"

EXPECTED_HEADERS = %w[
  interview_code
  studio_code
  interview_sequence
  eligibility_result
  eligibility_reason_category
  denominator_exclusion_reason
  pain_1_result
  pain_2_result
  four_week_baseline_status
  willingness_stage
  concrete_next_step_category
  counter_evidence_summary
  new_material_finding
  contradiction_category
  contradiction_severity
  contradiction_disposition_status
  partner_candidate
  prototype_test_candidate
  manual_workflow_candidate
].freeze

INTERVIEW_CODE_PATTERN = /\A(?:TRN-)?INT-[0-9]{3,}\z/i
STUDIO_CODE_PATTERN = /\A(?:TRN-)?STU-[0-9]{3,}\z/i

CONTRADICTION_CATEGORIES = %w[
  MARKET
  WORKFLOW
  PLATFORM
  PRIVACY
  COMMERCIAL
  BOOKING
  OUTCOME
].freeze

DENOMINATOR_EXCLUSION_REASONS = %w[
  DUPLICATE_STUDIO_FOLLOW_UP
  PROTOCOL_DEVIATION
  INSUFFICIENT_PRIVATE_EVIDENCE
].freeze

ALLOWED = {
  "eligibility_result" => %w[ELIGIBLE INELIGIBLE],
  "denominator_exclusion_reason" => DENOMINATOR_EXCLUSION_REASONS,
  "pain_1_result" => %w[YES NO],
  "pain_2_result" => %w[YES NO],
  "four_week_baseline_status" => %w[USABLE PARTIAL NONE UNKNOWN],
  "willingness_stage" => %w[NONE VERBAL_INTEREST CONCRETE_NEXT_STEP SIGNED PAID_OR_DEPOSIT_BACKED],
  "new_material_finding" => %w[YES NO],
  "contradiction_category" => CONTRADICTION_CATEGORIES,
  "contradiction_severity" => %w[LOW MEDIUM HIGH FATAL],
  "contradiction_disposition_status" => %w[OPEN MITIGATED ACCEPTED REJECTED],
  "partner_candidate" => %w[YES NO MAYBE],
  "prototype_test_candidate" => %w[YES NO MAYBE],
  "manual_workflow_candidate" => %w[YES NO MAYBE]
}.freeze

def clean(value)
  value.to_s.strip.upcase
end

def present?(value)
  !value.to_s.strip.empty?
end

def percentage(numerator, denominator)
  return "N/A" if denominator.zero?

  format("%.1f%%", (numerator.to_f / denominator) * 100)
end

def count(rows, field, value)
  rows.count { |row| clean(row[field]) == value }
end

path = ARGV[0]

if path.nil? || path.strip.empty?
  warn "Usage: ruby scripts/discovery/analyze_handoff.rb PATH_TO_REDACTED_HANDOFF.csv"
  exit 2
end

unless File.file?(path)
  warn "Handoff file not found: #{path}"
  exit 2
end

begin
  raw_rows = CSV.read(path)
rescue CSV::MalformedCSVError => e
  warn "Handoff validation failed: malformed CSV (#{e.message})."
  exit 1
end

if raw_rows.empty?
  warn "The handoff file is empty."
  exit 2
end

malformed_rows = raw_rows.each_index.select do |index|
  row = raw_rows[index]
  next false if row.all? { |value| !present?(value) }

  row.length != EXPECTED_HEADERS.length
end

unless malformed_rows.empty?
  warn "Handoff validation failed: rows #{malformed_rows.map { |index| index + 1 }.join(', ')} do not have exactly #{EXPECTED_HEADERS.length} columns."
  exit 1
end

table = CSV.read(path, headers: true)
actual_headers = table.headers || []
missing_headers = EXPECTED_HEADERS - actual_headers
unexpected_headers = actual_headers - EXPECTED_HEADERS

unless missing_headers.empty? && unexpected_headers.empty?
  warn "Unsafe or incompatible handoff schema."
  warn "Missing headers: #{missing_headers.join(', ')}" unless missing_headers.empty?
  warn "Unexpected headers: #{unexpected_headers.join(', ')}" unless unexpected_headers.empty?
  warn "Use docs/discovery/templates/redacted_handoff.csv and do not add identity or private-evidence columns."
  exit 2
end

rows = table.reject do |row|
  row.to_h.values.all? { |value| !present?(value) }
end

if rows.empty?
  warn "No coded interview rows found. The blank template is not evidence."
  exit 2
end

errors = []
seen_interview_codes = {}
seen_sequences = {}
seen_included_studio_codes = {}

rows.each_with_index do |row, index|
  row_number = index + 2
  interview_code = row["interview_code"].to_s.strip
  studio_code = row["studio_code"].to_s.strip
  sequence = row["interview_sequence"].to_s.strip
  eligibility = clean(row["eligibility_result"])
  eligibility_reason = row["eligibility_reason_category"].to_s.strip
  denominator_exclusion_reason = clean(row["denominator_exclusion_reason"])

  if interview_code.empty? || interview_code !~ INTERVIEW_CODE_PATTERN
    errors << "row #{row_number}: interview_code must be INT-### or TRN-INT-###"
  elsif seen_interview_codes.key?(interview_code.upcase)
    errors << "row #{row_number}: duplicate interview_code #{interview_code}"
  else
    seen_interview_codes[interview_code.upcase] = true
  end

  if studio_code.empty? || studio_code !~ STUDIO_CODE_PATTERN
    errors << "row #{row_number}: studio_code must be STU-### or TRN-STU-###"
  end

  if sequence !~ /\A[1-9][0-9]*\z/
    errors << "row #{row_number}: interview_sequence must be a positive integer"
  elsif seen_sequences.key?(sequence.to_i)
    errors << "row #{row_number}: duplicate interview_sequence #{sequence}"
  else
    seen_sequences[sequence.to_i] = true
  end

  ALLOWED.each do |field, allowed_values|
    value = clean(row[field])
    next if value.empty?

    errors << "row #{row_number}: #{field}=#{value.inspect} is not allowed" unless allowed_values.include?(value)
  end

  if eligibility.empty?
    errors << "row #{row_number}: eligibility_result is required"
  elsif eligibility == "ELIGIBLE"
    %w[
      pain_1_result
      pain_2_result
      four_week_baseline_status
      willingness_stage
      new_material_finding
      partner_candidate
      prototype_test_candidate
      manual_workflow_candidate
    ].each do |field|
      errors << "row #{row_number}: #{field} is required for an eligible interview" unless present?(row[field])
    end

    if present?(eligibility_reason)
      errors << "row #{row_number}: eligibility_reason_category must be blank for an eligible interview; use denominator_exclusion_reason for an explicit denominator exclusion"
    end

    if denominator_exclusion_reason.empty? && studio_code.match?(STUDIO_CODE_PATTERN)
      normalized_studio_code = studio_code.upcase
      if seen_included_studio_codes.key?(normalized_studio_code)
        first_row = seen_included_studio_codes[normalized_studio_code]
        errors << "row #{row_number}: duplicate included eligible studio_code #{studio_code}; row #{first_row} already represents this owner-operated business. Mark a genuine follow-up with denominator_exclusion_reason=DUPLICATE_STUDIO_FOLLOW_UP"
      else
        seen_included_studio_codes[normalized_studio_code] = row_number
      end
    end
  elsif eligibility == "INELIGIBLE"
    unless present?(eligibility_reason)
      errors << "row #{row_number}: eligibility_reason_category is required for an ineligible conversation"
    end

    if present?(denominator_exclusion_reason)
      errors << "row #{row_number}: denominator_exclusion_reason must be blank for an ineligible conversation; eligibility already excludes it"
    end
  end

  if present?(eligibility_reason) && eligibility_reason !~ /\A[A-Z][A-Z0-9_]*\z/i
    errors << "row #{row_number}: eligibility_reason_category must be a non-identifying category token such as NO_DECISION_AUTHORITY"
  end

  severity = clean(row["contradiction_severity"])
  category = clean(row["contradiction_category"])
  disposition = clean(row["contradiction_disposition_status"])

  contradiction_values = [category, severity, disposition]
  populated_contradiction_values = contradiction_values.count { |value| !value.empty? }
  if populated_contradiction_values.positive? && populated_contradiction_values != contradiction_values.length
    errors << "row #{row_number}: contradiction_category, contradiction_severity, and contradiction_disposition_status must be supplied together or all left blank"
  end
end

rows.each_with_index do |row, index|
  next unless clean(row["eligibility_result"]) == "ELIGIBLE"
  next unless clean(row["denominator_exclusion_reason"]) == "DUPLICATE_STUDIO_FOLLOW_UP"

  studio_code = row["studio_code"].to_s.strip
  has_included_original = rows.any? do |candidate|
    clean(candidate["eligibility_result"]) == "ELIGIBLE" &&
      candidate["studio_code"].to_s.strip.casecmp?(studio_code) &&
      !present?(candidate["denominator_exclusion_reason"])
  end
  unless has_included_original
    errors << "row #{index + 2}: DUPLICATE_STUDIO_FOLLOW_UP requires another included eligible row for studio_code #{studio_code}"
  end
end

unless errors.empty?
  warn "Handoff validation failed:"
  errors.each { |error| warn "- #{error}" }
  exit 1
end

eligible_rows = rows
  .select { |row| clean(row["eligibility_result"]) == "ELIGIBLE" }
  .sort_by { |row| row["interview_sequence"].to_i }
eligible = eligible_rows.reject { |row| present?(row["denominator_exclusion_reason"]) }
excluded_eligible = eligible_rows.select { |row| present?(row["denominator_exclusion_reason"]) }
ineligible = rows.count { |row| clean(row["eligibility_result"]) == "INELIGIBLE" }
pain_1_yes = count(eligible, "pain_1_result", "YES")
pain_2_yes = count(eligible, "pain_2_result", "YES")
both_yes = eligible.count do |row|
  clean(row["pain_1_result"]) == "YES" && clean(row["pain_2_result"]) == "YES"
end
both_rate = eligible.empty? ? 0.0 : (both_yes.to_f / eligible.length) * 100
usable_baseline = count(eligible, "four_week_baseline_status", "USABLE")
new_findings = count(eligible, "new_material_finding", "YES")
last_three_have_new_finding = eligible.last(3).any? do |row|
  clean(row["new_material_finding"]) == "YES"
end

material_contradictions = rows.count do |row|
  %w[HIGH FATAL].include?(clean(row["contradiction_severity"]))
end
open_material_contradictions = rows.count do |row|
  %w[HIGH FATAL].include?(clean(row["contradiction_severity"])) &&
    clean(row["contradiction_disposition_status"]) == "OPEN"
end
unresolved_fatal = rows.count do |row|
  clean(row["contradiction_severity"]) == "FATAL" &&
    clean(row["contradiction_disposition_status"]) == "OPEN"
end

recommendation = if unresolved_fatal.positive?
                   "REWORK_OR_STOP"
                 elsif eligible.length < 10
                   "CONTINUE_RESEARCH"
                 elsif both_rate < 70.0
                   "REWORK_OR_STOP"
                 elsif last_three_have_new_finding
                   "CONTINUE_TOWARD_20"
                 else
                   "PROCEED_TO_REMAINING_G0_VALIDATION"
                 end

puts "# Redacted Interview Checkpoint"
puts
puts "This is a discovery checkpoint, not a Gate G0 pass and not authorization to scaffold the application."
puts
puts "| Measure | Result |"
puts "|---|---:|"
puts "| Coded conversations | #{rows.length} |"
puts "| Included unique eligible studios/owners | #{eligible.length} |"
puts "| Eligible rows explicitly excluded | #{excluded_eligible.length} |"
puts "| Ineligible conversations excluded | #{ineligible} |"
puts "| Pain 1 YES | #{pain_1_yes} |"
puts "| Pain 2 YES | #{pain_2_yes} |"
puts "| Both pains YES | #{both_yes} |"
puts "| Both-pain rate | #{percentage(both_yes, eligible.length)} |"
puts "| Usable four-week baseline | #{usable_baseline} |"
puts "| Interviews with a new material finding | #{new_findings} |"
puts "| High/fatal contradictions across all coded rows | #{material_contradictions} |"
puts "| Open high/fatal contradictions across all coded rows | #{open_material_contradictions} |"
puts "| Unresolved fatal contradictions across all coded rows | #{unresolved_fatal} |"
puts

unless excluded_eligible.empty?
  puts "## Explicit denominator exclusions"
  puts
  excluded_eligible.each do |row|
    puts "- `#{row['interview_code']}` / `#{row['studio_code']}`: `#{clean(row['denominator_exclusion_reason'])}`"
  end
  puts
end

puts "## Candidate pipeline"
puts
puts "| Candidate type | YES | MAYBE |"
puts "|---|---:|---:|"
puts "| Design partner | #{count(eligible, 'partner_candidate', 'YES')} | #{count(eligible, 'partner_candidate', 'MAYBE')} |"
puts "| Prototype test | #{count(eligible, 'prototype_test_candidate', 'YES')} | #{count(eligible, 'prototype_test_candidate', 'MAYBE')} |"
puts "| Manual workflow | #{count(eligible, 'manual_workflow_candidate', 'YES')} | #{count(eligible, 'manual_workflow_candidate', 'MAYBE')} |"
puts
puts "## Willingness stages"
puts
%w[NONE VERBAL_INTEREST CONCRETE_NEXT_STEP SIGNED PAID_OR_DEPOSIT_BACKED].each do |stage|
  puts "- `#{stage}`: #{count(eligible, 'willingness_stage', stage)}"
end
puts
puts "## Automated checkpoint recommendation"
puts
puts "**#{recommendation}**"
puts

case recommendation
when "CONTINUE_RESEARCH"
  puts "Fewer than 10 included unique eligible studios/owners are present. Continue with the same script and preserve every included eligible NO response in the denominator."
when "REWORK_OR_STOP"
  puts "The dual-pain threshold is below 70% or an unresolved fatal contradiction exists in the coded packet. Review the evidence and affected decisions before more validation work."
when "CONTINUE_TOWARD_20"
  puts "The threshold is currently met, but at least one of the last three eligible rows adds a material finding. Continue toward 20 until findings stabilize."
when "PROCEED_TO_REMAINING_G0_VALIDATION"
  puts "The interview checkpoint is ready for human review. Continue with partner readiness, prototype tests, manual workflows, commitments, feasibility, and contradiction disposition; do not start application scaffolding yet."
end

puts
puts "Free-text cells still require a human privacy review before this file is shared."
