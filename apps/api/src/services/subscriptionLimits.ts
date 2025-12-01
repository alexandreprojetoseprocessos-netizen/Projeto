export const getOrgLimitForPlan = (code?: string | null): number | null => {
  switch (code) {
    case "START":
      return 1;
    case "BUSINESS":
      return 3;
    case "ENTERPRISE":
      return null;
    default:
      return 1;
  }
};

export const getProjectLimitForPlan = (code?: string | null): number | null => {
  switch (code) {
    case "START":
      return 5;
    case "BUSINESS":
      return 50;
    case "ENTERPRISE":
      return null;
    default:
      return 5;
  }
};
