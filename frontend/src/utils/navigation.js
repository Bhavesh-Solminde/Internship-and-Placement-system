/**
 * Get the dashboard URL for a given role.
 * Single source of truth for role-based redirects.
 */
export const getDashboardPath = (role) => {
  switch (role) {
    case "student":     return "/student/dashboard";
    case "company":     return "/company/dashboard";
    case "coordinator": return "/coordinator/dashboard";
    default:            return "/";
  }
};
