import json
import re
import pandas as pd
import requests
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlglot import parse_one, exp
from openai import OpenAI  # pip install openai
import os
from dotenv import load_dotenv

load_dotenv()


schema_text = """
public._prisma_migrations(id:character varying, checksum:character varying, finished_at:timestamp with time zone, migration_name:character varying, logs:text, rolled_back_at:timestamp with time zone, started_at:timestamp with time zone, applied_steps_count:integer)
public.activities(id:text, type:USER-DEFINED, description:text, user_id:text, ticket_id:text, metadata:text, ip_address:text, user_agent:text, created_at:timestamp without time zone)
public.ambulance_zone_logs(id:text, ambulance_id:text, hospital_id:text, zone_type:text, entry_time:timestamp without time zone, exit_time:timestamp without time zone, duration_minutes:integer, created_at:timestamp without time zone, zone_name:text)
public.ambulances(id:text, vehicle_imei:text, call_sign:text, plate_number:text, model:text, year:integer, type:USER-DEFINED, manufacturer:text, vin:text, base_station:text, status:USER-DEFINED, current_location_lat:double precision, current_location_lng:double precision, current_location_address:text, last_updated:timestamp without time zone, driver_name:text, driver_phone:text, driver_id:text, equipment_status:USER-DEFINED, fuel_level:double precision, mileage:double precision, last_maintenance_date:timestamp without time zone, next_maintenance_due:timestamp without time zone, is_active:boolean, created_at:timestamp without time zone, updated_at:timestamp without time zone, deleted_at:timestamp without time zone)
public.case_note_recipients(id:text, case_note_id:text, user_id:text, deliveryStatus:USER-DEFINED, deliveryMethod:USER-DEFINED, email_sent:boolean, email_sent_at:timestamp without time zone, sms_sent:boolean, sms_sent_at:timestamp without time zone, is_read:boolean, read_at:timestamp without time zone, created_at:timestamp without time zone, updated_at:timestamp without time zone)
public.case_notes(id:text, content:text, priority:USER-DEFINED, case_type:USER-DEFINED, case_id:text, ticket_id:text, patient_id:text, patient_name:text, notify_team:boolean, metadata:text, created_at:timestamp without time zone, updated_at:timestamp without time zone, created_by_id:text)
public.critical_cases(id:text, patient_name:text, case_type:USER-DEFINED, severity:USER-DEFINED, status:USER-DEFINED, start_time:timestamp without time zone, last_update:timestamp without time zone, description:text, hospital_id:text, created_by_id:text, created_at:timestamp without time zone, updated_at:timestamp without time zone, deleted_at:timestamp without time zone)
public.driver_schedules(id:text, driver_id:text, ambulance_id:text, shift_start:timestamp without time zone, shift_end:timestamp without time zone, shift_type:USER-DEFINED, status:USER-DEFINED, break_start:timestamp without time zone, break_end:timestamp without time zone, overtime_hours:double precision, notes:text, created_at:timestamp without time zone, updated_at:timestamp without time zone, deleted_at:timestamp without time zone)
public.ems_alerts(id:text, type:USER-DEFINED, priority:USER-DEFINED, message:text, ambulance_id:text, driver_id:text, equipment_id:text, status:USER-DEFINED, acknowledged_by:text, acknowledged_at:timestamp without time zone, resolved_at:timestamp without time zone, metadata:text, escalation_level:integer, created_at:timestamp without time zone, updated_at:timestamp without time zone)
public.ems_assignments(id:text, ticket_id:text, ambulance_id:text, driver_id:text, assigned_at:timestamp without time zone, status:USER-DEFINED, ems_contact_time:timestamp without time zone, actual_arrival_time:timestamp without time zone, journey_start_time:timestamp without time zone, journey_end_time:timestamp without time zone, distance_km:double precision, notes:text, created_by:text, created_at:timestamp without time zone, updated_at:timestamp without time zone, deleted_at:timestamp without time zone)
public.ems_performance_metrics(id:text, ambulance_id:text, date:timestamp without time zone, total_transfers:integer, average_response_time:double precision, average_transfer_time:double precision, total_distance_km:double precision, fuel_consumption_liters:double precision, maintenance_hours:double precision, driver_rating:double precision, patient_satisfaction_score:double precision, on_time_arrivals:integer, delayed_arrivals:integer, cancelled_transfers:integer, equipment_failures:integer, created_at:timestamp without time zone, updated_at:timestamp without time zone)
public.equipment_inventory(id:text, ambulance_id:text, equipment_type:text, serial_number:text, manufacturer:text, model:text, status:USER-DEFINED, last_inspection_date:timestamp without time zone, next_inspection_due:timestamp without time zone, maintenance_notes:text, purchase_date:timestamp without time zone, warranty_expiry:timestamp without time zone, location:text, created_at:timestamp without time zone, updated_at:timestamp without time zone, deleted_at:timestamp without time zone)
public.gps_api_logs(id:text, vehicle_id:text, endpoint:text, status_code:integer, response_time:integer, error:text, timestamp:timestamp without time zone)
public.gps_tracking_logs(id:text, ambulance_id:text, latitude:double precision, longitude:double precision, speed:double precision, direction:double precision, timestamp:timestamp without time zone, fuel_level:double precision, engine_status:boolean, location_address:text, accuracy:double precision, created_at:timestamp without time zone)
public.gps_validation_logs(id:text, vehicle_id:text, is_valid:boolean, error:text, validation_rules:text, timestamp:timestamp without time zone)
public.hospital_tickets(id:text, title:text, description:text, type:USER-DEFINED, priority:USER-DEFINED, status:USER-DEFINED, hospital_id:text, created_by_id:text, assigned_to_id:text, created_at:timestamp without time zone, updated_at:timestamp without time zone, deleted_at:timestamp without time zone)
public.hospitals(id:text, name:text, address:text, latitude:double precision, longitude:double precision, icu_beds:integer, icu_beds_available:integer, picu_beds:integer, picu_beds_available:integer, male_beds:integer, male_beds_available:integer, female_beds:integer, female_beds_available:integer, pediatric_beds:integer, pediatric_beds_available:integer, standard_beds:integer, standard_beds_available:integer, has_stemi_service:boolean, has_stroke_service:boolean, has_trauma_service:boolean, cluster:text, status:USER-DEFINED, contact_phone:text, contact_email:text, update_token:text, update_token_expiry:timestamp without time zone, emergency_dept_status:text, nicu_beds:integer, nicu_beds_available:integer, has_stroke_unit:boolean, trauma_level:USER-DEFINED, has_cardiology_center:boolean, stroke_unit_beds:integer, stroke_unit_beds_available:integer, has_thrombolysis:boolean, has_thrombectomy:boolean, stroke_24x7_service:boolean, avg_door_to_ct_scan_minutes:integer, avg_door_to_needle_minutes:integer, avg_door_to_mechanical_thrombectomy_minutes:integer, last_stroke_case:timestamp without time zone, stroke_cases_per_month:integer, stroke_cases_current_year:integer, stroke_success_rate:double precision, stroke_certification_level:text, created_at:timestamp without time zone, updated_at:timestamp without time zone, deleted_at:timestamp without time zone)
public.maintenance_records(id:text, ambulance_id:text, equipment_id:text, type:USER-DEFINED, status:USER-DEFINED, description:text, work_performed:text, scheduled_date:timestamp without time zone, start_date:timestamp without time zone, completion_date:timestamp without time zone, cost:double precision, labor_hours:double precision, parts_used:text, technician_name:text, mileage_at_service:double precision, next_service_due:timestamp without time zone, warranty_work:boolean, created_at:timestamp without time zone, updated_at:timestamp without time zone, created_by:text)
public.medical_records(id:text, patient_id:text, record_type:USER-DEFINED, title:text, description:text, diagnosis:text, treatment:text, medications:text, testResults:text, attachments:text, record_date:timestamp without time zone, created_at:timestamp without time zone, updated_at:timestamp without time zone, deleted_at:timestamp without time zone, created_by_id:text)
public.notification_recipients(id:text, notification_id:text, user_id:text, deliveryStatus:USER-DEFINED, deliveryMethod:USER-DEFINED, email_sent:boolean, email_sent_at:timestamp without time zone, sms_sent:boolean, sms_sent_at:timestamp without time zone, is_read:boolean, read_at:timestamp without time zone, deleted_at:timestamp without time zone, created_at:timestamp without time zone, updated_at:timestamp without time zone)
public.notifications(id:text, type:USER-DEFINED, priority:USER-DEFINED, title:text, message:text, case_type:USER-DEFINED, case_id:text, ticket_id:text, patient_id:text, patient_name:text, status:USER-DEFINED, is_read:boolean, read_at:timestamp without time zone, read_by:text, metadata:text, created_at:timestamp without time zone, updated_at:timestamp without time zone, created_by_id:text)
public.patient_access_logs(id:text, patient_id:text, user_id:text, accessType:USER-DEFINED, access_method:text, ip_address:text, user_agent:text, reason:text, timestamp:timestamp without time zone)
public.patients(id:text, medical_record_number:text, national_id:text, first_name:text, last_name:text, middle_name:text, date_of_birth:timestamp without time zone, age:integer, gender:USER-DEFINED, marital_status:USER-DEFINED, phone_number:text, email:text, address:text, city:text, state:text, zip_code:text, country:text, emergency_contact:text, emergency_phone:text, emergency_email:text, emergency_relationship:text, insurance_provider:text, insurance_number:text, insurance_group:text, insurance_expiry:timestamp without time zone, blood_type:text, rh_factor:text, allergies:text, medications:text, medical_history:text, risk_factors:text, chronic_conditions:text, weight:double precision, height:double precision, bmi:double precision, data_encryption_key:text, privacy_level:USER-DEFINED, consent_given:boolean, consent_date:timestamp without time zone, data_retention_policy:text, duplicate_group_id:text, is_primary_record:boolean, created_at:timestamp without time zone, updated_at:timestamp without time zone, deleted_at:timestamp without time zone, created_by_id:text, last_accessed_at:timestamp without time zone, last_accessed_by:text)
public.replies(id:text, content:text, priority:USER-DEFINED, case_note_id:text, parent_reply_id:text, case_type:USER-DEFINED, case_id:text, patient_id:text, patient_name:text, is_edited:boolean, edited_at:timestamp without time zone, deleted_at:timestamp without time zone, metadata:text, created_at:timestamp without time zone, updated_at:timestamp without time zone, created_by_id:text)
public.stemi_cases(id:text, ticket_id:text, patient_id:text, origin_hospital_id:text, destination_hospital_id:text, heart_score:integer, clinical_risk_level:text, presenting_symptoms:text, symptom_onset:timestamp without time zone, symptom_duration:integer, mi_type:text, outcome:text, current_status:text, selected_treatment:text, pathway_started:timestamp without time zone, pathway_completed:timestamp without time zone, mode_of_arrival:text, transfer_request_date_time:timestamp without time zone, transfer_arrival_date_time:timestamp without time zone, rcc_activated:boolean, rcc_unit:text, case_type:text, triage_time:timestamp without time zone, first_ecg_time:timestamp without time zone, ecg_result:text, ecg_findings:text, eligible_for_primary_pci:boolean, pci_type:text, pci_location:text, door_out_time:timestamp without time zone, balloon_inflation_time:timestamp without time zone, thrombolytic_given:boolean, thrombolytic_admin_time:timestamp without time zone, fibrinolytic_absolute_contraindications:text, fibrinolytic_relative_contraindications:text, cath_lab_activation_time:timestamp without time zone, cath_lab_arrival_time:timestamp without time zone, pci_procedure_start_time:timestamp without time zone, pci_procedure_complete_time:timestamp without time zone, post_pci_complications:text, discharge_status:text, discharge_medications:text, follow_up_appointment_date:timestamp without time zone, follow_up_appointment_provider:text, outcome_form_completed:boolean, outcome_form_completion_date:timestamp without time zone, outcome_percentage_completeness:integer, successful:boolean, complications:text, discharge_date:timestamp without time zone, thirty_day_readmission:boolean, follow_up_call_completed:boolean, follow_up_call_date:timestamp without time zone, door_to_ecg_minutes:integer, rcc_activation_to_door_out_minutes:integer, door_in_door_out_minutes:integer, door_to_needle_minutes:integer, door_to_balloon_minutes:integer, met_kpi_1:boolean, met_kpi_2:boolean, met_kpi_2_direct:boolean, met_kpi_2_transfer:boolean, met_kpi_3:boolean, met_kpi_4:boolean, met_kpi_5:boolean, met_kpi_6:boolean, met_kpi_11:boolean, created_at:timestamp without time zone, updated_at:timestamp without time zone, deleted_at:timestamp without time zone, created_by_id:text)
public.stroke_assessment_scores(id:text, stroke_case_id:text, patient_id:text, assessment_type:text, assessment_timing:text, totalScore:integer, sub_scores:text, assessor_name:text, assessor_qualification:text, assessment_date_time:timestamp without time zone, assessment_notes:text, created_at:timestamp without time zone, created_by_id:text)
public.stroke_cases(id:text, ticket_id:text, patient_id:text, origin_hospital_id:text, destination_hospital_id:text, strokeType:USER-DEFINED, stroke_subtype:text, strokeSeverity:USER-DEFINED, nihss_baseline:integer, nihss_24hr:integer, nihss_discharge:integer, mrs_baseline:integer, mrs_90day:integer, barthel_baseline:integer, barthel_discharge:integer, aspects_score:integer, gcs_baseline:integer, chief_complaint:text, mode_of_arrival:USER-DEFINED, transfer_request_date_time:timestamp without time zone, transfer_arrival_date_time:timestamp without time zone, srca_call_time:timestamp without time zone, time_of_symptom_onset:timestamp without time zone, last_known_normal:timestamp without time zone, time_of_registration:timestamp without time zone, time_of_triage:timestamp without time zone, time_of_physician_assessment:timestamp without time zone, presenting_symptoms:text, symptom_onset:timestamp without time zone, symptom_to_hospital_minutes:integer, last_known_well:timestamp without time zone, wake_up_stroke:boolean, stroke_type_detailed:USER-DEFINED, swallowing_screening_performed:boolean, time_of_swallowing_screening:timestamp without time zone, swallowing_screening_result:USER-DEFINED, ct_scan_performed:boolean, time_of_ct_scan_start:timestamp without time zone, time_of_ct_report_final:timestamp without time zone, ct_findings:USER-DEFINED, lvo_detected:boolean, candidate_for_iv_thrombolysis:USER-DEFINED, thrombolysis_order_time:timestamp without time zone, iv_thrombolysis_administration_time:timestamp without time zone, iv_thrombolysis_given:USER-DEFINED, reason_for_not_administering_iv:text, candidate_for_mechanical_thrombectomy:USER-DEFINED, time_of_mechanical_thrombectomy_puncture:timestamp without time zone, mechanical_thrombectomy_performed:boolean, time_of_thrombectomy_complete:timestamp without time zone, current_status:USER-DEFINED, selected_treatment:USER-DEFINED, eligible_for_thrombolysis:boolean, thrombolysis_contraindications:text, eligible_for_thrombectomy:boolean, thrombectomy_contraindications:text, pathway_started:timestamp without time zone, pathway_completed:timestamp without time zone, stroke_unit_admission_time:timestamp without time zone, door_to_ct_scan_minutes:integer, door_to_needle_minutes:integer, door_to_mechanical_thrombectomy_minutes:integer, symptom_needle_minutes:integer, symptom_to_mechanical_thrombectomy_minutes:integer, imaging_to_needle_minutes:integer, imaging_to_mechanical_thrombectomy_minutes:integer, dysphagia_screening_minutes:integer, early_mobilization_hours:integer, speech_therapy_hours:integer, physiotherapy_hours:integer, occupational_therapy_hours:integer, ct_results:text, cta_results:text, ctp_results:text, mri_results:text, mra_results:text, echocardiogram:text, carotid_ucs_doppler:text, successful:boolean, recanalization_grade:text, complications:text, secondary_prevention:text, facility_has_ct:boolean, transfer_to_another_hospital:boolean, time_of_transfer_activation:timestamp without time zone, time_of_transfer_departure:timestamp without time zone, prehospital_notification_by_srca:boolean, prehospital_notification_by_ucc_phc:boolean, disposition:USER-DEFINED, referral_to:ARRAY, admitted_to_stroke_unit:boolean, follow_up_contact_attempted:boolean, modified_rankin_scale_at_90_days:USER-DEFINED, discharge_destination:text, discharge_date:timestamp without time zone, length_of_stay_days:integer, thirty_day_readmission:boolean, ninety_day_mortality:boolean, follow_up_call_completed:boolean, follow_up_call_date:timestamp without time zone, discharge_type:text, follow_up_not_completed_reason:text, follow_up_specify:text, follow_up_type:text, discharge_modified_rankin_scale:integer, follow_up_modified_rankin_scale:integer, closure_report:text, functional_status:text, mortality:text, outcome_form_completed:boolean, outcome_form_completion_date:timestamp without time zone, outcome_percentage_completeness:integer, met_kpi1:boolean, met_kpi2:boolean, met_kpi3:boolean, met_kpi4:boolean, met_kpi5:boolean, met_kpi6:boolean, met_kpi7:boolean, met_kpi8:boolean, met_kpi9:boolean, met_kpi10:boolean, met_kpi11:boolean, door_to_physician_minutes:integer, door_to_ct_report_minutes:integer, door_to_thrombolysis_order_minutes:integer, registration_to_ct_minutes:integer, registration_to_thrombolysis_minutes:integer, registration_to_mechanical_thrombectomy_minutes:integer, srca_call_to_arrival_minutes:integer, transfer_activation_to_departure_minutes:integer, swallowing_screening_within_4_hours:boolean, created_at:timestamp without time zone, updated_at:timestamp without time zone, deleted_at:timestamp without time zone, created_by_id:text)
public.stroke_kpi_summary(id:text, hospital_id:text, cluster:text, year:integer, month:integer, total_stroke_volume:integer, ischemic_stroke_volume:integer, hemorrhagic_stroke_volume:integer, tia_volume:integer, lvo_stroke_volume:integer, thrombolysis_cases:integer, thrombectomy_cases:integer, avg_door_to_ct_scan_minutes:double precision, avg_door_to_needle_minutes:double precision, avg_door_to_mechanical_thrombectomy_minutes:double precision, avg_stroke_unit_admission_minutes:double precision, median_door_to_ct_scan_minutes:integer, median_door_to_needle_minutes:integer, median_door_to_mechanical_thrombectomy_minutes:integer, best_door_to_ct_scan_minutes:integer, worst_door_to_ct_scan_minutes:integer, best_door_to_needle_minutes:integer, worst_door_to_needle_minutes:integer, performance_trend_ct_scan:double precision, performance_trend_thrombolysis:double precision, performance_trend_thrombectomy:double precision, volume_trend:double precision, complication_rate:double precision, mortality_rate_inhospital:double precision, mortality_rate_30day:double precision, mortality_rate_90day:double precision, readmission_rate_30day:double precision, average_length_of_stay_days:integer, independent_discharge_rate:double precision, kpi1_total_cases:integer, kpi1_within_25min:integer, kpi1_percentage:double precision, kpi1_status:text, kpi2_total_cases:integer, kpi2_within_60min:integer, kpi2_percentage:double precision, kpi2_status:text, kpi3_total_cases:integer, kpi3_within_90min:integer, kpi3_percentage:double precision, kpi3_status:text, kpi4_total_cases:integer, kpi4_within_4hr:integer, kpi4_percentage:double precision, kpi4_status:text, kpi5_total_cases:integer, kpi5_within_4hr:integer, kpi5_percentage:double precision, kpi5_status:text, kpi6_total_cases:integer, kpi6_within_24hr:integer, kpi6_percentage:double precision, kpi6_status:text, kpi7_total_cases:integer, kpi7_prescribed:integer, kpi7_percentage:double precision, kpi7_status:text, kpi8_total_cases:integer, kpi8_referred:integer, kpi8_percentage:double precision, kpi8_status:text, created_at:timestamp without time zone, updated_at:timestamp without time zone)
public.stroke_rehabilitation(id:text, stroke_case_id:text, patient_id:text, rehabilitation_type:text, startDate:timestamp without time zone, endDate:timestamp without time zone, frequency:text, duration_minutes:integer, initial_goals:text, progress_notes:text, discharge_recommendations:text, functional_improvement:boolean, goals_meet:boolean, therapist_id:text, rehabilitation_center_id:text, created_at:timestamp without time zone, updated_at:timestamp without time zone, created_by_id:text)
public.stroke_timeline(id:text, stroke_case_id:text, ticket_id:text, from_status:USER-DEFINED, to_status:USER-DEFINED, event_timestamp:timestamp without time zone, event_description:text, event_location:text, event_type:USER-DEFINED, triggered_by:text, minutes_from_symptom:integer, minutes_from_admission:integer, within_target:boolean, target_minutes:integer, nihss_at_session:integer, clinical_notes:text, created_at:timestamp without time zone, created_by_id:text)
public.system_config(id:text, key:text, value:text, description:text, is_encrypted:boolean, created_at:timestamp without time zone, updated_at:timestamp without time zone)
public.tickets(id:text, ticket_number:text, patient_id:text, origin_hospital_id:text, destination_hospital_id:text, priority:USER-DEFINED, status:USER-DEFINED, pathway:USER-DEFINED, vitals:text, diagnostics:text, treatment_plan:text, ems_contact_time:timestamp without time zone, actual_arrival:timestamp without time zone, transport_mode:text, transfer_request_date_time:timestamp without time zone, transfer_arrival_date_time:timestamp without time zone, ems_unit:text, transport_notes:text, ems_assignment_status:USER-DEFINED, ems_status_updated_at:timestamp without time zone, ems_status_updated_by:text, requires_blood:boolean, requires_specialist:boolean, requires_icu:boolean, requires_ventilator:boolean, required_resources:text, is_emergency:boolean, emergency_type:text, emergency_severity:text, notes:text, internal_notes:text, external_notes:text, created_at:timestamp without time zone, updated_at:timestamp without time zone, deleted_at:timestamp without time zone, created_by_id:text, assigned_to_id:text, completed_by_id:text, completed_at:timestamp without time zone, acknowledged_at:timestamp without time zone, acknowledged_by_id:text)
public.timeline_events(id:text, event_type:text, event_category:text, ticket_id:text, stroke_case_id:text, ambulance_id:text, driver_id:text, event_timestamp:timestamp without time zone, event_description:text, event_location:text, gps_coordinates:text, distance_km:double precision, speed:double precision, fuel_level:double precision, from_status:text, to_status:text, minutes_from_symptom:integer, minutes_from_admission:integer, within_target:boolean, target_minutes:integer, nihss_at_session:integer, clinical_notes:text, triggered_by:text, metadata:text, created_at:timestamp without time zone, created_by_id:text)
public.trauma_cases(id:text, ticket_id:text, patient_id:text, origin_hospital_id:text, destination_hospital_id:text, arrival_date_time:timestamp without time zone, incident_date_time:timestamp without time zone, mode_of_arrival:USER-DEFINED, transfer_request_date_time:timestamp without time zone, transfer_arrival_date_time:timestamp without time zone, transfer_duration_minutes:integer, chief_complaint:text, mechanism_of_injury:USER-DEFINED, vital_signs:text, glasgow_coma_scale:integer, systolic_blood_pressure:integer, respiratory_rate:integer, additional_vital_signs:text, primary_survey_findings:text, ed_disposition:USER-DEFINED, additional_notes:text, disposition:text, response_time_minutes:integer, critical_case:boolean, transfer_case:boolean, created_at:timestamp without time zone, updated_at:timestamp without time zone, deleted_at:timestamp without time zone, created_by_id:text, head_and_neck_injury:text, face_injury:text, chest_injury:text, abdomen_injury:text, extremities_injury:text, external_injury:text)
public.user_registration_requests(id:text, email:text, first_name:text, last_name:text, phone_number:text, password_hash:text, requested_role:USER-DEFINED, hospital_id:text, justification:text, status:USER-DEFINED, reviewed_by:text, reviewed_at:timestamp without time zone, admin_comments:text, created_at:timestamp without time zone, updated_at:timestamp without time zone)
public.users(id:text, email:text, first_name:text, last_name:text, phone_number:text, role:USER-DEFINED, status:USER-DEFINED, is_email_verified:boolean, password_hash:text, last_login:timestamp without time zone, login_attempts:integer, locked_until:timestamp without time zone, password_reset_token:text, password_reset_expiry:timestamp without time zone, refresh_token:text, session_expiry:timestamp without time zone, hospital_id:text, created_at:timestamp without time zone, updated_at:timestamp without time zone, deleted_at:timestamp without time zone)

"""

# =========================================================
# 1) CONFIG (NO ENV VARS)
# =========================================================

# ---- NVIDIA API (OpenAI-compatible) ----
NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")

# IMPORTANT: Use an INSTRUCT model you actually have access to.
# Try one of these:
#   - "meta/llama-3.1-8b-instruct"
#   - "meta/llama-3.1-70b-instruct"
#   - "mistralai/mistral-7b-instruct-v0.3"
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "meta/llama-3.1-405b-instruct")

# ---- Postgres ----
# ---- Postgres ----
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "")
DB_USER = os.getenv("DB_USER", "")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")


# ---- Safety/perf ----
MAX_ROWS = 200
STATEMENT_TIMEOUT_MS = 8000
SCHEMA_MAX_TABLES = 40
LLM_TIMEOUT_SECONDS = 120


# =========================================================
# 2) CLIENTS
# =========================================================
client = OpenAI(base_url=NVIDIA_BASE_URL, api_key=NVIDIA_API_KEY)


def make_engine():
    url = URL.create(
        drivername="postgresql+psycopg2",
        username=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
    )
    return create_engine(url, pool_pre_ping=True)


# =========================================================
# 3) SCHEMA (CAPPED)
# =========================================================
def get_schema_text(engine) -> str:
    q = """
    SELECT table_schema, table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name, ordinal_position;
    """
    df = pd.read_sql(q, engine)
    # print(df)
    lines = []
    grouped = df.groupby(["table_schema", "table_name"])
    for i, ((schema, table), g) in enumerate(grouped):
        if i >= SCHEMA_MAX_TABLES:
            break
        cols = ", ".join([f"{r.column_name}:{r.data_type}" for r in g.itertuples(index=False)])
        lines.append(f"{schema}.{table}({cols})")

    if len(grouped) > SCHEMA_MAX_TABLES:
        lines.append(f"... (schema truncated to first {SCHEMA_MAX_TABLES} tables)")
    return "\n".join(lines)


# =========================================================
# 4) LLM HELPERS
# =========================================================
def nvidia_chat(messages):
    """
    Chat Completion via NVIDIA OpenAI-compatible endpoint.
    """
    resp = client.chat.completions.create(
        model=NVIDIA_MODEL,
        messages=messages,
        temperature=0.2,
        timeout=LLM_TIMEOUT_SECONDS,
    )
    return resp.choices[0].message.content


def extract_json(text_out: str) -> dict:
    """
    Extract JSON object from model output (handles code fences or extra prose).
    """
    s = text_out.strip()
    s = re.sub(r"^```(?:json)?\s*", "", s)
    s = re.sub(r"\s*```$", "", s)

    m = re.search(r"\{.*\}", s, flags=re.DOTALL)
    if not m:
        raise ValueError("Model did not return JSON. Raw output:\n" + text_out[:5000])
    return json.loads(m.group(0))


# =========================================================
# 5) SQL SAFETY
# =========================================================
# def enforce_select_only(sql: str) -> str:
#     sql = sql.strip().strip(";")
#
#     if ";" in sql:
#         raise ValueError("Rejected: multiple statements detected.")
#
#     try:
#         ast = parse_one(sql, read="postgres")
#     except Exception as e:
#         raise ValueError(f"Rejected: SQL parse failed: {e}")
#
#     if not isinstance(ast, exp.Select) and not isinstance(ast, exp.Subqueryable):
#         raise ValueError("Rejected: only SELECT queries are allowed.")
#
#     lowered = sql.lower()
#     banned = ["insert", "update", "delete", "drop", "alter", "truncate", "create", "grant", "revoke"]
#     if any(b in lowered for b in banned):
#         raise ValueError("Rejected: write/admin keywords detected.")
#
#     # Enforce a LIMIT if missing
#     if " limit " not in lowered:
#         sql = f"{sql}\nLIMIT {MAX_ROWS}"
#
#     return sql
from sqlglot import parse_one, exp

def enforce_select_only(sql: str) -> str:
    sql = sql.strip().strip(";")

    # Block multiple statements early
    if ";" in sql:
        raise ValueError("Rejected: multiple statements are not allowed.")

    # Parse SQL
    try:
        ast = parse_one(sql, read="postgres")
    except Exception as e:
        raise ValueError(f"Rejected: SQL parse failed: {e}")

    # Allow SELECT (including WITH / CTE)
    if not isinstance(ast, (exp.Select, exp.With)):
        raise ValueError("Rejected: only SELECT queries are allowed.")

    # List ONLY node types that exist across sqlglot versions
    banned_nodes = (
        exp.Insert,
        exp.Update,
        exp.Delete,
        exp.Create,
        exp.Drop,
        exp.Alter,
    )

    for node_type in banned_nodes:
        if ast.find(node_type):
            raise ValueError("Rejected: write/admin SQL detected.")

    # Enforce LIMIT if missing
    if not ast.find(exp.Limit):
        sql = f"{sql}\nLIMIT {MAX_ROWS}"

    return sql




def run_query(engine, sql: str) -> pd.DataFrame:
    with engine.connect() as conn:
        conn.execute(text(f"SET statement_timeout = {STATEMENT_TIMEOUT_MS};"))
        return pd.read_sql(text(sql), conn)


# =========================================================
# 6) PROMPTS
# =========================================================
SQL_SYSTEM = """You are an expert PostgreSQL analyst.
Return ONLY JSON with keys: sql, rationale.
Rules:
- Produce ONE single SELECT query only.
- No INSERT/UPDATE/DELETE/DDL.
- Use only tables/columns from the provided schema.
- Keep it efficient and concise.
- Always use admission time or time of registration instead of created_at.
"""
# - If user asks "last week", interpret as CURRENT_DATE - 7 days through CURRENT_DATE.


REPORT_SYSTEM = """You are a reporting assistant.
Write a concise report using ONLY the provided query results.
Do not invent numbers.
If results are empty, say so and suggest likely reasons.
"""


def generate_sql(user_prompt: str, schema_text: str) -> str:
    messages = [
        {"role": "system", "content": SQL_SYSTEM},
        {"role": "user", "content": f"Schema:\n{schema_text}\n\nUser request:\n{user_prompt}\n\nReturn JSON only."},
    ]
    out = nvidia_chat(messages)
    data = extract_json(out)
    return data["sql"]


def generate_report(user_prompt: str, sql: str, df: pd.DataFrame) -> str:
    preview_rows = min(len(df), 30)
    preview = df.head(preview_rows).to_dict(orient="records")

    messages = [
        {"role": "system", "content": REPORT_SYSTEM},
        {"role": "user", "content": (
            f"User request:\n{user_prompt}\n\n"
            f"SQL used:\n{sql}\n\n"
            f"Result preview (up to {preview_rows} rows):\n{json.dumps(preview, ensure_ascii=False, indent=2)}\n\n"
            "Also include:\n- Key findings (bullets)\n- Caveats (bullets)\n"
        )},
    ]
    return nvidia_chat(messages)


# =========================================================
# 7) OPTIONAL: CHECK MODEL ACCESS (helps avoid the 404 function error)
# =========================================================
def verify_model_access():
    """
    Check if the chosen model is available to your NVIDIA account.
    If this fails, either your key/base_url is wrong or you don't have access.
    """
    headers = {"Authorization": f"Bearer {NVIDIA_API_KEY}"}
    r = requests.get(f"{NVIDIA_BASE_URL}/models", headers=headers, timeout=20)
    r.raise_for_status()
    ids = [m["id"] for m in r.json().get("data", [])]
    if NVIDIA_MODEL not in ids:
        raise RuntimeError(
            f"Model '{NVIDIA_MODEL}' is not available for this account.\n"
            f"Available models include (first 15): {ids[:15]}\n"
            f"Pick one of the available ids."
        )


# =========================================================
# 8) MAIN
# =========================================================
def main():
    # Verify NVIDIA model access early (optional but recommended)
    verify_model_access()
    engine = make_engine()
    print(engine)
    df_tables = pd.read_sql("""
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog','information_schema')
    ORDER BY schemaname, tablename;
    """, engine)
    print(df_tables)
    schema_text = get_schema_text(engine)
    print(schema_text)



    print("NVIDIA + Postgres Report Agent (env vars enabled)")
    print("Type 'exit' to quit.\n")

    while True:
        user_prompt = input("User> ").strip()
        if not user_prompt:
            continue
        if user_prompt.lower() in ("exit", "quit"):
            break

        try:
            sql = generate_sql(user_prompt, schema_text)
            print(sql)
            sql = enforce_select_only(sql)
            df = run_query(engine, sql)
            print(f"Query Result{df}")
            report = generate_report(user_prompt, sql, df)

            print("\n--- SQL ---")
            print(sql)
            print("\n--- Report ---")
            print(report)
            print("\n--- Data (first 10 rows) ---")
            print(df.head(10).to_string(index=False))

        except Exception as e:
            print(f"\n[ERROR] {e}\n")


if __name__ == "__main__":
    main()
