import type {
  SalaryProposalBenchmarkRow,
  SalaryProposalBenchmarkFilters,
  SalaryProposalBenchmarkScope,
  SalaryProposalBenchmarkScopeKey,
} from "@/types/compensation";

const EMPTY_SCOPE: SalaryProposalBenchmarkScope = {
  society: false,
  department: false,
  office: false,
  category: false,
};

export const SALARY_PROPOSAL_SCOPE_KEYS: SalaryProposalBenchmarkScopeKey[] = [
  "society",
  "department",
  "office",
  "category",
];

type SalaryProposalBenchmarkTarget = {
  societyId?: number | null;
  societyName?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  officeId?: number | null;
  officeName?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
};

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function hasDimensionValue(
  id: number | null | undefined,
  name: string | null | undefined,
) {
  return typeof id === "number" || normalizeText(name).length > 0;
}

export function buildSalaryProposalBenchmarkScope(
  target: SalaryProposalBenchmarkTarget | null | undefined,
): SalaryProposalBenchmarkScope {
  if (!target) return { ...EMPTY_SCOPE };

  return {
    society: hasDimensionValue(target.societyId, target.societyName),
    department: hasDimensionValue(target.departmentId, target.departmentName),
    office: hasDimensionValue(target.officeId, target.officeName),
    category: hasDimensionValue(target.categoryId, target.categoryName),
  };
}

export function sanitizeSalaryProposalBenchmarkScope(
  scope: SalaryProposalBenchmarkScope,
  availableScope: SalaryProposalBenchmarkScope,
) {
  return SALARY_PROPOSAL_SCOPE_KEYS.reduce<SalaryProposalBenchmarkScope>(
    (acc, key) => {
      acc[key] = availableScope[key] ? scope[key] : false;
      return acc;
    },
    { ...EMPTY_SCOPE },
  );
}

export function formatSalaryProposalBenchmarkScope(
  scope: SalaryProposalBenchmarkScope,
) {
  const labels = SALARY_PROPOSAL_SCOPE_KEYS.filter((key) => scope[key]).map(
    (key) => {
      switch (key) {
        case "society":
          return "Sociedad";
        case "department":
          return "Departamento";
        case "office":
          return "Oficina";
        case "category":
          return "Categoría";
      }
    },
  );

  return labels.length > 0 ? labels.join(" + ") : "Global";
}

export function buildSalaryProposalBenchmarkFilters(
  target: SalaryProposalBenchmarkTarget | null | undefined,
) {
  if (!target) return {};

  const filters: SalaryProposalBenchmarkFilters = {};

  if (typeof target.societyId === "number") {
    filters.society_id = target.societyId;
  }

  if (typeof target.departmentId === "number") {
    filters.department_id = target.departmentId;
  }

  if (typeof target.officeId === "number") {
    filters.office_id = target.officeId;
  }

  if (typeof target.categoryId === "number") {
    filters.category_id = target.categoryId;
  }

  return filters;
}

function isRowDimensionEmpty(
  id: number | null | undefined,
  name: string | null | undefined,
) {
  return id == null && normalizeText(name).length === 0;
}

function matchesActiveDimension(
  rowId: number | null | undefined,
  rowName: string | null | undefined,
  targetId: number | null | undefined,
  targetName: string | null | undefined,
) {
  if (typeof rowId === "number" && typeof targetId === "number") {
    return rowId === targetId;
  }

  const normalizedRowName = normalizeText(rowName);
  const normalizedTargetName = normalizeText(targetName);

  if (normalizedRowName && normalizedTargetName) {
    return normalizedRowName === normalizedTargetName;
  }

  return false;
}

export function findSalaryProposalBenchmark(
  rows: SalaryProposalBenchmarkRow[],
  target: SalaryProposalBenchmarkTarget | null | undefined,
  scope: SalaryProposalBenchmarkScope,
) {
  if (!target) return null;

  return (
    rows.find((row) => {
      return SALARY_PROPOSAL_SCOPE_KEYS.every((key) => {
        if (key === "society") {
          return scope.society
            ? matchesActiveDimension(
                row.society_id,
                row.society_name,
                target.societyId,
                target.societyName,
              )
            : isRowDimensionEmpty(row.society_id, row.society_name);
        }

        if (key === "department") {
          return scope.department
            ? matchesActiveDimension(
                row.department_id,
                row.department_name,
                target.departmentId,
                target.departmentName,
              )
            : isRowDimensionEmpty(row.department_id, row.department_name);
        }

        if (key === "office") {
          return scope.office
            ? matchesActiveDimension(
                row.office_id,
                row.office_name,
                target.officeId,
                target.officeName,
              )
            : isRowDimensionEmpty(row.office_id, row.office_name);
        }

        return scope.category
          ? matchesActiveDimension(
              row.category_id,
              row.category_name,
              target.categoryId,
              target.categoryName,
            )
          : isRowDimensionEmpty(row.category_id, row.category_name);
      });
    }) ?? null
  );
}
