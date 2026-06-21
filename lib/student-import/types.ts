export const STUDENT_IMPORT_MAX_FILE_SIZE_BYTES = 512 * 1024;
export const STUDENT_IMPORT_MAX_ROWS = 500;
export const STUDENT_IMPORT_SAMPLE_CSV =
  "name,email,studentNo,sectionCode,password\nZeynep Demir,zeynep@example.com,B210100001,CSE101-A,AttendlyDev123!";

export type StudentImportSectionOption = {
  id: string;
  code: string | null;
  name: string;
  courseCode: string;
  courseTitle: string;
  activeEnrollmentCount: number;
};

export type StudentImportRowStatus = "valid" | "error";

export type StudentImportPreviewRow = {
  rowNumber: number;
  name: string;
  email: string;
  studentNo: string;
  sectionCode: string;
  passwordProvided: boolean;
  targetSectionLabel: string | null;
  existingStudent: boolean;
  status: StudentImportRowStatus;
  issues: string[];
};

export type StudentImportPreviewSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateEmails: number;
  missingNameOrEmail: number;
  invalidEmails: number;
  unknownSectionCodes: number;
  existingStudents: number;
};

export type StudentImportPreviewState = {
  status: "idle" | "error" | "preview";
  message: string | null;
  fileName: string | null;
  csvText: string;
  defaultSectionId: string;
  summary: StudentImportPreviewSummary;
  rows: StudentImportPreviewRow[];
};

export type StudentImportCommitSummary = {
  importedRows: number;
  createdStudents: number;
  existingStudents: number;
  createdMemberships: number;
  createdEnrollments: number;
  reactivatedEnrollments: number;
  skippedDuplicateEnrollments: number;
  invalidRows: number;
};

export type StudentImportCommitState = {
  status: "idle" | "error" | "success";
  message: string | null;
  summary: StudentImportCommitSummary | null;
  invalidRows: StudentImportPreviewRow[];
};

export const emptyStudentImportPreviewSummary: StudentImportPreviewSummary = {
  totalRows: 0,
  validRows: 0,
  invalidRows: 0,
  duplicateEmails: 0,
  missingNameOrEmail: 0,
  invalidEmails: 0,
  unknownSectionCodes: 0,
  existingStudents: 0,
};

export const initialStudentImportPreviewState: StudentImportPreviewState = {
  status: "idle",
  message: null,
  fileName: null,
  csvText: "",
  defaultSectionId: "",
  summary: emptyStudentImportPreviewSummary,
  rows: [],
};

export const initialStudentImportCommitState: StudentImportCommitState = {
  status: "idle",
  message: null,
  summary: null,
  invalidRows: [],
};
