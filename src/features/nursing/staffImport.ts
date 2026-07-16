import type { NursingStaffAdmin } from "../../lib/supabase/nursing";

/**
 * Parser for the "paste from Excel" staff importer. When you copy a range of
 * cells out of Excel/Sheets the clipboard is tab-separated; a pasted CSV works
 * too. We read the first row as a header and map each column — by Arabic or
 * English name — onto a nursing_staff field. Employee number + name are the
 * only required columns.
 */

export type StaffField = keyof Pick<
  NursingStaffAdmin,
  | "employee_number"
  | "full_name"
  | "national_id"
  | "specialty"
  | "department"
  | "phone"
  | "email"
  | "gender"
  | "qualification"
  | "nationality"
  | "hire_date"
  | "birth_date"
  | "employer"
  | "program_type"
  | "staffing_entity"
  | "notes"
>;

/* Header aliases — matched as substrings, case-insensitive. */
const ALIASES: Record<StaffField, string[]> = {
  employee_number: ["الرقم الوظيفي", "الرقم الوظيفى", "رقم الموظف", "employee", "emp no", "emp#", "staff no"],
  full_name: ["الاسم", "اسم الموظف", "full name", "name"],
  national_id: ["الهوية", "رقم الهوية", "national", "iqama", "id number"],
  specialty: ["التخصص", "المسمى", "specialty", "speciality", "job title", "position"],
  department: ["القسم", "الإدارة", "الادارة", "department", "dept", "unit"],
  phone: ["الجوال", "الهاتف", "phone", "mobile", "contact"],
  email: ["البريد", "الايميل", "الإيميل", "email", "e-mail"],
  gender: ["الجنس", "gender", "sex"],
  qualification: ["المؤهل", "qualification", "degree"],
  nationality: ["الجنسية", "nationality"],
  hire_date: ["المباشرة", "التعيين", "hire", "join", "start date"],
  birth_date: ["الميلاد", "birth", "dob"],
  employer: ["جهة العمل", "employer"],
  program_type: ["البرنامج", "program", "programme"],
  staffing_entity: ["جهة التوظيف", "staffing", "agency"],
  notes: ["ملاحظات", "notes", "remark"]
};

const DATE_FIELDS: StaffField[] = ["hire_date", "birth_date"];

function splitRow(line: string): string[] {
  /* Tab wins (Excel default); fall back to comma for pasted CSV. */
  return (line.includes("\t") ? line.split("\t") : line.split(",")).map((c) => c.trim());
}

function matchField(header: string): StaffField | null {
  const h = header.trim().toLowerCase();
  if (!h) return null;
  for (const field of Object.keys(ALIASES) as StaffField[]) {
    if (ALIASES[field].some((a) => h.includes(a.toLowerCase()))) return field;
  }
  return null;
}

/* Normalise to YYYY-MM-DD; anything unrecognised becomes null so the insert
   never fails on a stray date string. */
function normalizeDate(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const dmy = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

export type ParseResult = {
  rows: Partial<NursingStaffAdmin>[];
  mapped: StaffField[];
  unmatchedHeaders: string[];
  skipped: number;
  error?: string;
};

export function parseStaffPaste(text: string): ParseResult {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], mapped: [], unmatchedHeaders: [], skipped: 0, error: "need_header_and_rows" };
  }
  const headerCells = splitRow(lines[0]);
  const mapping = headerCells.map(matchField);
  const mapped = mapping.filter((m): m is StaffField => m !== null);
  const unmatchedHeaders = headerCells.filter((_, i) => mapping[i] === null && headerCells[i] !== "");

  if (!mapped.includes("employee_number") || !mapped.includes("full_name")) {
    return { rows: [], mapped, unmatchedHeaders, skipped: 0, error: "missing_required" };
  }

  const rows: Partial<NursingStaffAdmin>[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = splitRow(lines[i]);
    const row: Partial<NursingStaffAdmin> = {};
    mapping.forEach((field, col) => {
      if (!field) return;
      const raw = (cells[col] ?? "").trim();
      if (!raw) return;
      if (DATE_FIELDS.includes(field)) {
        (row as Record<string, unknown>)[field] = normalizeDate(raw);
      } else {
        (row as Record<string, unknown>)[field] = raw;
      }
    });
    const emp = (row.employee_number || "").toString().trim();
    if (!emp || !row.full_name || seen.has(emp)) {
      skipped++;
      continue;
    }
    seen.add(emp);
    row.is_active = true;
    rows.push(row);
  }

  return { rows, mapped, unmatchedHeaders, skipped };
}
