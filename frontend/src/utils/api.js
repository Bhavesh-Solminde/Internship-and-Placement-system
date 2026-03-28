import api from "../lib/axiosInstance.js";

// ─── Auth ────────────────────────────────────────────────────────────
export const authAPI = {
  studentRegister:     (data) => api.post("/api/auth/students/register", data),
  studentLogin:        (data) => api.post("/api/auth/students/login", data),
  coordinatorRegister: (data) => api.post("/api/auth/coordinators/register", data),
  coordinatorLogin:    (data) => api.post("/api/auth/coordinators/login", data),
  companyRegister:     (data) => api.post("/api/auth/companies/register", data),
  companyLogin:        (data) => api.post("/api/auth/companies/login", data),
  getMe:               ()     => api.get("/api/auth/me"),
};

// ─── Students ────────────────────────────────────────────────────────
export const studentAPI = {
  getProfile:      ()     => api.get("/api/students/profile"),
  updateProfile:   (data) => api.put("/api/students/profile", data),
  uploadResume:    (file) => {
    const fd = new FormData();
    fd.append("resume", file);
    return api.post("/api/students/resume/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getApplications: ()     => api.get("/api/students/applications"),
  getApplication:  (id)   => api.get(`/api/students/applications/${id}`),
  getDashboard:    ()     => api.get("/api/students/dashboard"),
};

// ─── Internships ─────────────────────────────────────────────────────
export const internshipAPI = {
  list:   (params) => api.get("/api/internships", { params }),
  detail: (id)     => api.get(`/api/internships/${id}`),
  apply:  (id)     => api.post(`/api/internships/${id}/apply`),
};

// ─── Jobs ────────────────────────────────────────────────────────────
export const jobAPI = {
  list:   (params) => api.get("/api/jobs", { params }),
  detail: (id)     => api.get(`/api/jobs/${id}`),
  apply:  (id)     => api.post(`/api/jobs/${id}/apply`),
};

// ─── Offers ──────────────────────────────────────────────────────────
export const offerAPI = {
  accept: (id) => api.put(`/api/offers/${id}/accept`),
  reject: (id) => api.put(`/api/offers/${id}/reject`),
};

// ─── Applications ────────────────────────────────────────────────────
export const applicationAPI = {
  get:      (id) => api.get(`/api/applications/${id}`),
  withdraw: (id) => api.put(`/api/applications/${id}/withdraw`),
};

// ─── Coordinators ────────────────────────────────────────────────────
export const coordinatorAPI = {
  getStudents:       ()         => api.get("/api/coordinators/students"),
  getStudent:        (id)       => api.get(`/api/coordinators/students/${id}`),
  updateStudent:     (id, data) => api.put(`/api/coordinators/students/${id}`, data),
  deleteStudent:     (id)       => api.delete(`/api/coordinators/students/${id}`),
  getCompanies:      ()         => api.get("/api/coordinators/companies"),
  getApplications:   ()         => api.get("/api/coordinators/applications"),
  getApplication:    (id)       => api.get(`/api/coordinators/applications/${id}`),
  updateAppStatus:   (id, data) => api.put(`/api/coordinators/applications/${id}/status`, data),
  getReports:        ()         => api.get("/api/coordinators/reports/summary"),
};

// ─── Companies ───────────────────────────────────────────────────────
export const companyAPI = {
  getProfile:        ()         => api.get("/api/companies/profile"),
  updateProfile:     (data)     => api.put("/api/companies/profile", data),
  getInternships:    ()         => api.get("/api/companies/internships"),
  getJobs:           ()         => api.get("/api/companies/jobs"),
  postInternship:    (data)     => api.post("/api/internships", data),
  postJob:           (data)     => api.post("/api/jobs", data),
  getApplicants:     (type, id) => api.get(`/api/companies/${type}/${id}/applicants`),
  scheduleInterview: (data)     => api.post("/api/interviews", data),
  issueOffer:        (data)     => api.post("/api/offers", data),
};

// ─── Interviews ──────────────────────────────────────────────────────
export const interviewAPI = {
  getByApplication: (applicationId) => api.get(`/api/interviews/application/${applicationId}`),
  update:           (id, data)      => api.put(`/api/interviews/${id}`, data),
  remove:           (id)            => api.delete(`/api/interviews/${id}`),
};

// ─── Onboarding ──────────────────────────────────────────────────────
export const onboardingAPI = {
  create:    (data)     => api.post("/api/onboarding", data),
  getByOffer:(offerId)  => api.get(`/api/onboarding/offer/${offerId}`),
  update:    (id, data) => api.put(`/api/onboarding/${id}`, data),
};
