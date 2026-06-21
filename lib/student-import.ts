import "server-only";

import { db } from "@/lib/db";
import {
  EnrollmentStatus,
  MembershipRole,
  UserStatus,
} from "@/lib/generated/prisma/enums";
import { hashPassword } from "@/lib/auth/password";
import type {
  StudentImportCommitState,
  StudentImportCommitSummary,
  StudentImportPreviewRow,
  StudentImportPreviewState,
  StudentImportSectionOption,
} from "@/lib/student-import/types";
import {
  emptyStudentImportPreviewSummary,
  STUDENT_IMPORT_MAX_FILE_SIZE_BYTES,
  STUDENT_IMPORT_MAX_ROWS,
} from "@/lib/student-import/types";

type StudentImportScope = {
  organizationId: string;
  actorUserId: string;
  allowedSectionIds?: string[];
};

type StudentImportPreviewInput = StudentImportScope & {
  file: File | null;
  defaultSectionId: string;
};

type StudentImportCommitInput = StudentImportScope & {
  csvText: string;
  defaultSectionId: string;
};

type ParsedCsvRow = {
  rowNumber: number;
  name: string;
  email: string;
  studentNo: string;
  sectionCode: string;
  password: string;
};

type AnalyzedStudentImport = {
  csvText: string;
  defaultSectionId: string;
  summary: StudentImportPreviewState["summary"];
  rows: StudentImportPreviewRow[];
  validRows: Array<
    ParsedCsvRow & {
      normalizedEmail: string;
      sectionId: string | null;
      existingStudent: boolean;
    }
  >;
};

const DEFAULT_IMPORT_PASSWORD = "AttendlyDev123!";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_HEADERS = ["name", "email"] as const;
const OPTIONAL_HEADERS = ["studentNo", "sectionCode", "password"] as const;

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeHeader(value: string) {
  return value.trim().replace(/^\uFEFF/, "").toLowerCase();
}

function normalizeSectionCode(value: string) {
  return value.trim().toLowerCase();
}

function isCsvFile(file: File) {
  const fileName = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return (
    fileName.endsWith(".csv") ||
    type === "text/csv" ||
    type === "application/csv" ||
    type === "application/vnd.ms-excel"
  );
}

function getDefaultPassword() {
  const password = process.env.SEED_PASSWORD?.trim();

  return password && password.length >= 8 ? password : DEFAULT_IMPORT_PASSWORD;
}

function formatSectionLabel(section: {
  code: string | null;
  name: string;
  course: {
    code: string;
    title: string;
  };
}) {
  const sectionName = section.code
    ? `${section.code} · ${section.name}`
    : section.name;

  return `${section.course.code} · ${sectionName}`;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  rows.push(currentRow);

  return rows.filter((row) => row.some((cell) => cell.trim() !== ""));
}

function getHeaderIndexMap(headers: string[]) {
  const map = new Map<string, number>();

  headers.forEach((header, index) => {
    const normalizedHeader = normalizeHeader(header);

    if (normalizedHeader === "studentno" || normalizedHeader === "student_no") {
      map.set("studentNo", index);
      return;
    }

    if (normalizedHeader === "sectioncode" || normalizedHeader === "section_code") {
      map.set("sectionCode", index);
      return;
    }

    if (
      normalizedHeader === "name" ||
      normalizedHeader === "email" ||
      normalizedHeader === "password"
    ) {
      map.set(normalizedHeader, index);
    }
  });

  return map;
}

function getCell(row: string[], indexMap: Map<string, number>, key: string) {
  const index = indexMap.get(key);

  if (index === undefined) {
    return "";
  }

  return row[index] ?? "";
}

function getRowsFromCsvText(csvText: string):
  | {
      ok: true;
      rows: ParsedCsvRow[];
    }
  | {
      ok: false;
      message: string;
    } {
  const parsedRows = parseCsv(csvText);
  const [headers, ...dataRows] = parsedRows;

  if (!headers) {
    return {
      ok: false,
      message: "CSV dosyası boş görünüyor.",
    };
  }

  const indexMap = getHeaderIndexMap(headers);
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !indexMap.has(header));

  if (missingHeaders.length > 0) {
    return {
      ok: false,
      message: `CSV başlığında zorunlu kolon eksik: ${missingHeaders.join(", ")}.`,
    };
  }

  if (dataRows.length > STUDENT_IMPORT_MAX_ROWS) {
    return {
      ok: false,
      message: `Tek seferde en fazla ${STUDENT_IMPORT_MAX_ROWS} satır yükleyebilirsiniz.`,
    };
  }

  return {
    ok: true,
    rows: dataRows.map((row, index) => ({
      rowNumber: index + 2,
      name: normalizeText(getCell(row, indexMap, "name")),
      email: getCell(row, indexMap, "email").trim().toLowerCase(),
      studentNo: getCell(row, indexMap, "studentNo").trim(),
      sectionCode: getCell(row, indexMap, "sectionCode").trim(),
      password: getCell(row, indexMap, "password"),
    })),
  };
}

async function getScopedSections(
  organizationId: string,
  allowedSectionIds?: string[],
) {
  return db.section.findMany({
    where: {
      organizationId,
      isActive: true,
      course: {
        is: {
          isActive: true,
        },
      },
      ...(allowedSectionIds
        ? {
            id: {
              in: allowedSectionIds,
            },
          }
        : {}),
    },
    orderBy: [
      {
        courseId: "asc",
      },
      {
        name: "asc",
      },
    ],
    select: {
      id: true,
      code: true,
      name: true,
      course: {
        select: {
          code: true,
          title: true,
        },
      },
      _count: {
        select: {
          enrollments: {
            where: {
              status: EnrollmentStatus.ACTIVE,
            },
          },
        },
      },
    },
  });
}

export async function getStudentImportOptions(
  organizationId: string,
  input?: {
    allowedSectionIds?: string[];
  },
): Promise<{
  sections: StudentImportSectionOption[];
}> {
  const sections = await getScopedSections(
    organizationId,
    input?.allowedSectionIds,
  );

  return {
    sections: sections.map((section) => ({
      id: section.id,
      code: section.code,
      name: section.name,
      courseCode: section.course.code,
      courseTitle: section.course.title,
      activeEnrollmentCount: section._count.enrollments,
    })),
  };
}

async function analyzeStudentImportCsv(
  input: StudentImportScope & {
    csvText: string;
    defaultSectionId: string;
  },
): Promise<
  | {
      ok: true;
      analysis: AnalyzedStudentImport;
    }
  | {
      ok: false;
      message: string;
    }
> {
  const csvText = input.csvText.trim();

  if (!csvText) {
    return {
      ok: false,
      message: "CSV içeriği boş.",
    };
  }

  if (Buffer.byteLength(csvText, "utf8") > STUDENT_IMPORT_MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      message: "CSV dosyası çok büyük. En fazla 512 KB yükleyebilirsiniz.",
    };
  }

  const parsed = getRowsFromCsvText(csvText);

  if (!parsed.ok) {
    return parsed;
  }

  const sections = await getScopedSections(
    input.organizationId,
    input.allowedSectionIds,
  );
  const sectionByCode = new Map(
    sections
      .filter((section) => section.code)
      .map((section) => [normalizeSectionCode(section.code ?? ""), section]),
  );
  const sectionById = new Map(sections.map((section) => [section.id, section]));
  const defaultSection = input.defaultSectionId
    ? sectionById.get(input.defaultSectionId)
    : null;

  if (input.defaultSectionId && !defaultSection) {
    return {
      ok: false,
      message: "Varsayılan şube bulunamadı veya bu şube için yetkiniz yok.",
    };
  }

  const emailCounts = new Map<string, number>();

  for (const row of parsed.rows) {
    if (row.email) {
      emailCounts.set(row.email, (emailCounts.get(row.email) ?? 0) + 1);
    }
  }

  const uniqueEmails = Array.from(emailCounts.keys());
  const existingUsers = uniqueEmails.length
    ? await db.user.findMany({
        where: {
          email: {
            in: uniqueEmails,
          },
        },
        select: {
          id: true,
          email: true,
          status: true,
          memberships: {
            where: {
              organizationId: input.organizationId,
            },
            select: {
              id: true,
              role: true,
            },
          },
        },
      })
    : [];
  const existingUserByEmail = new Map(
    existingUsers.map((user) => [user.email.toLowerCase(), user]),
  );
  const duplicateSeen = new Set<string>();
  const rows: StudentImportPreviewRow[] = [];
  const validRows: AnalyzedStudentImport["validRows"] = [];
  let duplicateEmails = 0;
  let missingNameOrEmail = 0;
  let invalidEmails = 0;
  let unknownSectionCodes = 0;
  let existingStudents = 0;

  for (const row of parsed.rows) {
    const issues: string[] = [];
    const normalizedEmail = row.email.trim().toLowerCase();

    if (!row.name || !normalizedEmail) {
      missingNameOrEmail += 1;
      if (!row.name && !normalizedEmail) {
        issues.push(`${row.rowNumber}. satır: ad soyad ve e-posta boş.`);
      } else if (!row.name) {
        issues.push(`${row.rowNumber}. satır: ad soyad boş.`);
      } else {
        issues.push(`${row.rowNumber}. satır: e-posta boş.`);
      }
    }

    if (normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)) {
      invalidEmails += 1;
      issues.push(`${row.rowNumber}. satır: e-posta formatı geçersiz.`);
    }

    if (normalizedEmail && emailCounts.get(normalizedEmail)! > 1) {
      if (duplicateSeen.has(normalizedEmail)) {
        duplicateEmails += 1;
        issues.push(`${row.rowNumber}. satır: CSV içinde tekrarlanan e-posta var.`);
      } else {
        duplicateSeen.add(normalizedEmail);
      }
    }

    if (row.password && row.password.length < 8) {
      issues.push(`${row.rowNumber}. satır: şifre en az 8 karakter olmalıdır.`);
    }

    const targetSection = row.sectionCode
      ? sectionByCode.get(normalizeSectionCode(row.sectionCode))
      : defaultSection;

    if (row.sectionCode && !targetSection) {
      unknownSectionCodes += 1;
      issues.push(`${row.rowNumber}. satır: sectionCode bulunamadı.`);
    }

    const existingUser = existingUserByEmail.get(normalizedEmail) ?? null;
    const existingMembership = existingUser?.memberships[0] ?? null;
    const isExistingStudent =
      existingMembership?.role === MembershipRole.STUDENT;

    if (
      existingUser &&
      (existingUser.status === UserStatus.SUSPENDED ||
        existingUser.status === UserStatus.ARCHIVED)
    ) {
      issues.push(
        `${row.rowNumber}. satır: bu e-posta pasif bir kullanıcıya ait.`,
      );
    }

    if (
      existingMembership &&
      existingMembership.role !== MembershipRole.STUDENT
    ) {
      issues.push(
        `${row.rowNumber}. satır: bu e-posta kurumda öğrenci rolünde değil.`,
      );
    }

    if (isExistingStudent) {
      existingStudents += 1;
    }

    const status = issues.length > 0 ? "error" : "valid";
    const previewRow: StudentImportPreviewRow = {
      rowNumber: row.rowNumber,
      name: row.name,
      email: normalizedEmail,
      studentNo: row.studentNo,
      sectionCode: row.sectionCode,
      passwordProvided: Boolean(row.password),
      targetSectionLabel: targetSection ? formatSectionLabel(targetSection) : null,
      existingStudent: isExistingStudent,
      status,
      issues,
    };

    rows.push(previewRow);

    if (status === "valid") {
      validRows.push({
        ...row,
        normalizedEmail,
        sectionId: targetSection?.id ?? null,
        existingStudent: isExistingStudent,
      });
    }
  }

  const invalidRows = rows.filter((row) => row.status === "error").length;

  return {
    ok: true,
    analysis: {
      csvText,
      defaultSectionId: input.defaultSectionId,
      summary: {
        totalRows: rows.length,
        validRows: rows.length - invalidRows,
        invalidRows,
        duplicateEmails,
        missingNameOrEmail,
        invalidEmails,
        unknownSectionCodes,
        existingStudents,
      },
      rows,
      validRows,
    },
  };
}

export async function previewStudentImportCsv(
  input: StudentImportPreviewInput,
): Promise<StudentImportPreviewState> {
  const file = input.file;

  if (!file || file.size === 0) {
    return {
      status: "error",
      message: "Lütfen CSV dosyası seçin.",
      fileName: null,
      csvText: "",
      defaultSectionId: input.defaultSectionId,
      summary: emptyStudentImportPreviewSummary,
      rows: [],
    };
  }

  if (!isCsvFile(file)) {
    return {
      status: "error",
      message: "Dosya tipi CSV olmalıdır.",
      fileName: file.name,
      csvText: "",
      defaultSectionId: input.defaultSectionId,
      summary: emptyStudentImportPreviewSummary,
      rows: [],
    };
  }

  if (file.size > STUDENT_IMPORT_MAX_FILE_SIZE_BYTES) {
    return {
      status: "error",
      message: "CSV dosyası çok büyük. En fazla 512 KB yükleyebilirsiniz.",
      fileName: file.name,
      csvText: "",
      defaultSectionId: input.defaultSectionId,
      summary: emptyStudentImportPreviewSummary,
      rows: [],
    };
  }

  const csvText = await file.text();
  const analysis = await analyzeStudentImportCsv({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    allowedSectionIds: input.allowedSectionIds,
    csvText,
    defaultSectionId: input.defaultSectionId,
  });

  if (!analysis.ok) {
    return {
      status: "error",
      message: analysis.message,
      fileName: file.name,
      csvText: "",
      defaultSectionId: input.defaultSectionId,
      summary: emptyStudentImportPreviewSummary,
      rows: [],
    };
  }

  return {
    status: "preview",
    message: "Önizleme hazır. Veritabanına yazmak için içe aktarımı onaylayın.",
    fileName: file.name,
    csvText: analysis.analysis.csvText,
    defaultSectionId: input.defaultSectionId,
    summary: analysis.analysis.summary,
    rows: analysis.analysis.rows,
  };
}

export async function commitStudentImportCsv(
  input: StudentImportCommitInput,
): Promise<StudentImportCommitState> {
  const analysisResult = await analyzeStudentImportCsv(input);

  if (!analysisResult.ok) {
    return {
      status: "error",
      message: analysisResult.message,
      summary: null,
      invalidRows: [],
    };
  }

  const analysis = analysisResult.analysis;
  const invalidRows = analysis.rows.filter((row) => row.status === "error");

  if (analysis.validRows.length === 0) {
    return {
      status: "error",
      message: "İçe aktarılabilecek geçerli satır bulunamadı.",
      summary: null,
      invalidRows,
    };
  }

  const summary: StudentImportCommitSummary = {
    importedRows: 0,
    createdStudents: 0,
    existingStudents: 0,
    createdMemberships: 0,
    createdEnrollments: 0,
    reactivatedEnrollments: 0,
    skippedDuplicateEnrollments: 0,
    invalidRows: invalidRows.length,
  };
  const defaultPassword = getDefaultPassword();

  await db.$transaction(async (tx) => {
    for (const row of analysis.validRows) {
      const existingUser = await tx.user.findUnique({
        where: {
          email: row.normalizedEmail,
        },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          memberships: {
            where: {
              organizationId: input.organizationId,
            },
            select: {
              id: true,
              role: true,
              studentNo: true,
            },
          },
        },
      });
      const existingMembership = existingUser?.memberships[0] ?? null;

      if (
        existingUser &&
        (existingUser.status === UserStatus.SUSPENDED ||
          existingUser.status === UserStatus.ARCHIVED)
      ) {
        continue;
      }

      if (
        existingMembership &&
        existingMembership.role !== MembershipRole.STUDENT
      ) {
        continue;
      }

      const user =
        existingUser ??
        (await tx.user.create({
          data: {
            email: row.normalizedEmail,
            name: row.name,
            passwordHash: await hashPassword(row.password || defaultPassword),
            status: UserStatus.ACTIVE,
          },
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            memberships: {
              where: {
                organizationId: input.organizationId,
              },
              select: {
                id: true,
                role: true,
                studentNo: true,
              },
            },
          },
        }));

      if (!existingUser) {
        summary.createdStudents += 1;
        await tx.auditLog.create({
          data: {
            organizationId: input.organizationId,
            actorUserId: input.actorUserId,
            action: "student_import.user_created",
            targetType: "User",
            targetId: user.id,
            metadata: {
              email: row.normalizedEmail,
            },
          },
        });
      }

      const membership =
        existingMembership ??
        (await tx.membership.create({
          data: {
            organizationId: input.organizationId,
            userId: user.id,
            role: MembershipRole.STUDENT,
            studentNo: row.studentNo || null,
          },
          select: {
            id: true,
            role: true,
            studentNo: true,
          },
        }));

      if (existingMembership) {
        summary.existingStudents += 1;
      } else {
        summary.createdMemberships += 1;
        await tx.auditLog.create({
          data: {
            organizationId: input.organizationId,
            actorUserId: input.actorUserId,
            action: "student_import.membership_created",
            targetType: "Membership",
            targetId: membership.id,
            metadata: {
              userId: user.id,
              studentNo: row.studentNo || null,
            },
          },
        });
      }

      if (
        row.studentNo &&
        existingMembership &&
        existingMembership.studentNo !== row.studentNo
      ) {
        await tx.membership.update({
          where: {
            id_organizationId: {
              id: existingMembership.id,
              organizationId: input.organizationId,
            },
          },
          data: {
            studentNo: row.studentNo,
          },
        });
      }

      if (row.sectionId) {
        const existingEnrollment = await tx.enrollment.findUnique({
          where: {
            organizationId_sectionId_studentMembershipId: {
              organizationId: input.organizationId,
              sectionId: row.sectionId,
              studentMembershipId: membership.id,
            },
          },
          select: {
            id: true,
            status: true,
          },
        });

        if (existingEnrollment?.status === EnrollmentStatus.ACTIVE) {
          summary.skippedDuplicateEnrollments += 1;
        } else if (existingEnrollment) {
          const enrollment = await tx.enrollment.update({
            where: {
              id_organizationId: {
                id: existingEnrollment.id,
                organizationId: input.organizationId,
              },
            },
            data: {
              status: EnrollmentStatus.ACTIVE,
              endedAt: null,
            },
            select: {
              id: true,
            },
          });

          summary.reactivatedEnrollments += 1;
          await tx.auditLog.create({
            data: {
              organizationId: input.organizationId,
              actorUserId: input.actorUserId,
              action: "student_import.enrollment_reactivated",
              targetType: "Enrollment",
              targetId: enrollment.id,
              metadata: {
                sectionId: row.sectionId,
                studentMembershipId: membership.id,
                studentUserId: user.id,
              },
            },
          });
        } else {
          const enrollment = await tx.enrollment.create({
            data: {
              organizationId: input.organizationId,
              sectionId: row.sectionId,
              studentMembershipId: membership.id,
              status: EnrollmentStatus.ACTIVE,
            },
            select: {
              id: true,
            },
          });

          summary.createdEnrollments += 1;
          await tx.auditLog.create({
            data: {
              organizationId: input.organizationId,
              actorUserId: input.actorUserId,
              action: "student_import.enrollment_created",
              targetType: "Enrollment",
              targetId: enrollment.id,
              metadata: {
                sectionId: row.sectionId,
                studentMembershipId: membership.id,
                studentUserId: user.id,
              },
            },
          });
        }
      }

      summary.importedRows += 1;
    }

    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: "student_import.completed",
        targetType: "StudentImport",
        metadata: summary,
      },
    });
  });

  return {
    status: "success",
    message: "CSV içe aktarımı tamamlandı.",
    summary,
    invalidRows,
  };
}
