# Vitto MFI Dashboard — Complete Codebase Walkthrough

> A comprehensive guide to the **Vitto Microfinance MFI Dashboard** — a React-based admin panel for managing microfinance loan operations, users, collections, payments, and reporting.

---

## 1. Project Identity & Purpose

| Field | Value |
|---|---|
| **Product** | Vitto MFI Dashboard (branded as **VGo**) |
| **Domain** | Microfinance / Lending-as-a-Service |
| **Type** | Internal admin dashboard for MFI (Microfinance Institution) operators |
| **Backend API** | `https://apis-staging.vitto.money` (staging) |
| **Company** | Uthaan Technologies Pvt. Ltd. (trading as **Vitto**) |

The dashboard enables MFI staff (admins, branch managers, field officers) to:
- Manage loan lifecycle (apply → approve → disburse → repay → close)
- Manage users, roles, and organizational hierarchy
- Track demands, collections, and repayments
- View reports (PAR, disbursement, principal outstanding)
- Handle autopay/e-collect payments
- Onboard new organizations with offices, products, and funders

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 17 (Class Components + some Hooks) |
| **Routing** | `react-router-dom` v5 (`BrowserRouter`, `Switch`, `Route`) |
| **State Mgmt** | Redux 4 + `react-redux` (sidebar, layout, theme, toastr) |
| **UI Libraries** | Reactstrap (Bootstrap 4), MUI v5, `react-bootstrap` |
| **HTTP Client** | Axios |
| **Auth** | JWT (stored in localStorage), OTP-based login |
| **Charts** | ApexCharts (`react-apexcharts`), Chart.js |
| **Maps** | Mapbox GL (`react-map-gl`) |
| **Tables** | `react-bootstrap-table-next` / `react-bootstrap-table-nextgen` |
| **PDF** | `jspdf`, `jspdf-autotable`, `react-pdf`, `html2pdf.js` |
| **Excel** | `exceljs`, `xlsx`, `react-export-table-to-excel` |
| **Styling** | SCSS (50+ files), compiled via `node-sass-chokidar` |
| **Toast/Alerts** | `react-hot-toast`, `react-redux-toastr`, `react-toastify` |
| **i18n** | Manual JSON-based (Hindi, Bengali, Gujarati, English) |
| **Deployment** | Google Cloud Platform (App Engine via `app.yaml` + `cloudbuild.yaml`) |
| **Production Server** | Express.js (`server.js`) serving the `build/` folder |

---

## 3. Project Structure

```
microfinance-mfi-dashboard/
├── public/                    # Static assets, index.html, favicons
│   ├── css/                   # Compiled CSS (corporate.css, classic.css, modern.css)
│   ├── img/                   # Public images
│   └── privacy/               # Privacy policy page
├── src/
│   ├── App.js                 # Root component (Router + Redux Provider + Toasters)
│   ├── index.js               # ReactDOM entry point
│   ├── assets/
│   │   ├── fonts/             # Custom fonts
│   │   ├── image-assets/      # Image assets
│   │   ├── locales/           # Translation JSON files (bengali, hindi, gujarati)
│   │   ├── scss/              # 50+ SCSS files for every module
│   │   └── svg/               # SVG assets
│   ├── components/            # Shared layout & UI components
│   │   ├── Sidebar.js         # Main sidebar navigation
│   │   ├── Navbar.js          # Top navbar (user menu, notifications, logout)
│   │   ├── Wrapper.js         # Page wrapper
│   │   ├── Main.js            # Main content area
│   │   ├── Content.js         # Content wrapper
│   │   ├── Loading.jsx        # Loading spinner
│   │   ├── Search.jsx         # Search component
│   │   ├── filter.js          # Filter component
│   │   └── ui-elements/       # AuthCarousel
│   ├── config/                # App-wide configuration
│   │   ├── UserConfig.js      # Password length, status constants
│   │   ├── buttonConfigs.js   # Button style maps (Sanctioned, In-Transit, Rejected)
│   │   ├── colorConfigs.js    # Color palettes, gradient maps, badge colors
│   │   ├── loanStatusConfig.js # Loan status pipeline definition
│   │   └── Version.js         # App version
│   ├── hooks/
│   │   └── useDebounce.js     # Debounce hook for search inputs
│   ├── layouts/               # Page layout wrappers
│   │   ├── DashboardLayout.js # Sidebar + Navbar + Content
│   │   ├── AuthLayout.js      # Minimal layout for auth pages
│   │   └── AccessDenied.js    # 404 / Access Denied page
│   ├── pages/                 # All feature pages (18 modules — see §5)
│   ├── redux/                 # Redux store
│   │   ├── actions/           # sidebarActions, layoutActions, themeActions
│   │   ├── reducers/          # sidebar, layout, theme, toastr
│   │   ├── store/             # Store creation
│   │   └── constants.js       # Action type strings
│   ├── routes/                # Route definitions
│   │   ├── index.js           # All route configs + sidebarRoutes export
│   │   └── Routes.js          # Route rendering with permission filtering
│   ├── services/
│   │   └── themeService.js    # CSS theme switching (classic/corporate/modern)
│   ├── utilities/             # Shared utilities
│   │   ├── commonUtil.js      # Permissions, validation, host URLs, i18n, route filtering
│   │   ├── devMode.js         # Dev mode: seeds mock JWT + skips auth
│   │   ├── localStorageUtil.js # localStorage get/set/remove helpers
│   │   ├── sessionStorageUtil.js
│   │   ├── apiUtils/          # All API call functions (7 files)
│   │   └── EditableEntries/   # Editable loan detail fields
│   └── img/                   # 94+ icons, logos, SVGs, PNGs
├── server.js                  # Express production server
├── package.json               # Dependencies & scripts
├── app.yaml                   # GCP App Engine config
├── cloudbuild.yaml            # GCP Cloud Build pipeline
└── .env                       # Environment variables
```

---

## 4. Application Bootstrap & Auth Flow

### 4.1 Entry Point

[index.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/index.js) → calls `seedDevData()` (for dev mode) → renders `<App />`

### 4.2 App.js — Root Component

[App.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/App.js) wraps everything in:
1. **Redux `<Provider>`** — global state store
2. **`<BrowserRouter>`** with three route categories:
   - `/login` → shows `SignIn` (or redirects to `/dashboard` if token exists / dev mode)
   - `/` → redirects to `/dashboard`
   - `*` → Protected routes (checks token in production, skips in dev mode)
3. **`<ReduxToastr>`** + **`<Toaster>`** — notification systems

### 4.3 Development Mode

[devMode.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/utilities/devMode.js) — When `REACT_APP_ENVIRONMENT=development`:
- Seeds a hardcoded JWT token, username, permissions, and org details into localStorage
- `isAuthRequired()` returns `false`, bypassing all login/token checks
- Token expiry redirects are suppressed

### 4.4 Authentication Flow (Production)

1. User visits any page → no token → redirected to `/login`
2. **SignIn** page: user enters 10-digit phone → `sendLoginOTP()` API call
3. OTP modal opens → user enters OTP → `verifyOTP()` API call
4. On success: JWT token + permissions + user profile stored in localStorage
5. Redirect to `/dashboard`
6. **Logout**: clears localStorage/sessionStorage, redirects to `/login`

### 4.5 JWT Token Structure

The JWT `client` payload contains:
- `id`, `firstName`, `lastName`, `userName`, `organizationId`
- `organizationName`, `organizationLogo`
- `Permissions` — array of permission strings
- `permissionTree` — branches/offices the user can access
- `roleIds`, `level` (COUNTRY/STATE/DISTRICT/BRANCH)
- `taggedOfficeId`

---

## 5. Routing & Navigation Architecture

### 5.1 Route Definition Pattern

Routes are defined as **objects** in [routes/index.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/routes/index.js) with this shape:

```js
{
  path: "/loans",
  name: "BL Loans Requests",
  icon: loansLogo,           // SVG icon component
  children: {
    loanRequests: {
      path: "/loans",
      name: "BL Loan Requests",
      permission: "loanRequests-list",   // Required permission
      component: Loans,
    },
    // ... more child routes
  }
}
```

### 5.2 Permission-Based Route Filtering

[Routes.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/routes/Routes.js) and `filterPermittedRoutesArray()` in commonUtil:
1. Read `userPermissions` from localStorage (comma-separated string)
2. Filter each route's `children` — keep only those whose `permission` is in the user's list
3. Remove route groups with zero permitted children
4. Render only permitted routes as `<ProtectedRoute>` components

### 5.3 Sidebar Sections

The sidebar (`sidebarRoutes` export) is organized into **5 sections**:

| Section | Routes |
|---|---|
| **Insights** | Dashboard |
| **User Management** | Users, Roles |
| **Loans** | Draft Loans, Loan Requests, Loan Leads, Loan Agreements, Loan Products, Demands, Collections, Repayments, Basic Reports, QA Testing, Repayment Only, Autopay Requests |
| **API Services** | API Consumption Insights |
| **Payments** | Transactions, EasyCollect, AutoCollect |

### 5.4 Layouts

| Layout | Used For | Components |
|---|---|---|
| **DashboardLayout** | All protected pages | Sidebar + Navbar + Content |
| **AuthLayout** | Login, onboarding pages | Minimal wrapper (just children) |
| **AccessDenied** | 404 / forbidden | Full layout with 404 message |

---

## 6. Page Modules — Detailed Breakdown

### 6.1 Dashboard (`/dashboard`)

- **File**: [Dashboard.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/dashboards/Dashboard.js) — **212 KB**, the largest single file
- Overview of loan portfolio, charts (ApexCharts), key metrics
- Aggregated data views across branches, agents

### 6.2 Loan Management

#### Loan Requests (`/loans`)
- **File**: [Loans.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/loans/Loans.js) — Paginated table of all loan requests
- Filters: status, date range, name, source, group/individual mode
- Status pipeline: `Applied → Pre-Credit-Approved → Credit-Approved → Sanctioned → Disburse-Approved → Active → Closed` (also `Rejected`, `Auto-Rejected`)

#### Single Loan Detail (`/loans/singleLoan/:loanId`)
- **File**: [singleLoan.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/jlgPage/singleLoan.js) — **152 KB**
- Full loan details: borrower info, documents, EMI schedule, comments, status actions
- Status transition buttons (approve, reject, disburse)
- Document upload/verification (Aadhar, PAN, Voter ID)
- Co-applicant management, field visit scheduling
- Bank account verification, credit risk assessment
- Loan metadata editing

#### Group Page (`/loans/groupPage/:groupId`)
- **File**: [groupPage.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/jlgPage/groupPage.js) — **181 KB**
- JLG (Joint Liability Group) loan management
- Shows all members in a group with individual loan details

#### Loan Repayments (`/loans/:loanId/repayment`)
- **File**: [loanRepayments.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/jlgPage/loanRepayments.js)
- EMI installment history and repayment tracking

#### Draft Loans (`/draftLoans`)
- **Files**: [ViewDraftLoans.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/loans/ViewDraftLoans.js), [DraftLoanDetails.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/loans/DraftLoanDetails.js)
- Incomplete loan applications that are still being filled

#### Loan Leads (`/loanLeads`)
- **Files**: [loanLeads.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/loans/loanLeads.js), [LoanLeadsDetails.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/loans/LoanLeadsDetails.js)
- Sourced loan leads from agents/partners, with approve/reject workflow

#### Create New Loan (`/loans/create-new-loan`)
- **File**: [CreateNewLoanForm.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/loans/CreateNewLoanForm.js)
- Form to create a new loan request with borrower details

### 6.3 Loan Products (`/loanProducts`)

- **Files**: [productsList.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/products/productsList.js), [productDetails.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/products/productDetails.js), [AddProductModal.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/products/AddProductModal.js) (182 KB)
- CRUD for loan products: interest rates, tenure, moratorium, arrears/penalty charges, additional fees
- Calculation methods: Simple Interest, Fixed Flat
- Product categories: Personal Loan, SME Loan, Business Loan, etc.

### 6.4 User Management (`/users`)

- **Files**: [Users.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/users/Users.js) → placeholder, [AddUser.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/users/AddUser.js), [Profile.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/users/Profile.js)
- Create users with phone, Aadhar last 4 digits, role assignment
- Activate/deactivate users, edit roles and permissions
- User profile page with password change

### 6.5 Roles Management (`/roles`)

- **Files**: [Roles.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/roles/Roles.js), [CreateRole.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/roles/CreateRole.js)
- Create/edit roles with granular permission assignment

### 6.6 Demands & Collections

#### Demands (`/demands`)
- **File**: [demand.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/collection%26demands/demand.js)
- View scheduled repayment demands by date, branch, agent

#### Collections (`/collections`)
- **File**: [collection.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/collection%26demands/collection.js)
- Track actual collections, enter repayments, demand-collection reports
- Sub-pages: Received Through Vitto, Enter Repayment

#### Search Client (`/search`)
- Global client search across all loans/borrowers

### 6.7 Reports (`/basicReport`)

| Report | File | Purpose |
|---|---|---|
| Basic Report | `basicReports.js` | Overview report dashboard |
| Principal Outstanding | `principalOutstanding.js` | Outstanding principal balances |
| PAR & Overdue Summary | `par&OverDueSummary.js` | Portfolio At Risk analysis |
| PAR & Overdue Report | `parOverdueReport.js` | Detailed PAR report |
| Disbursement | `disburseReport.js` | Disbursement analytics |
| Demand Collection | `demandCollReport.js` | Demand vs collection comparison |

### 6.8 Real-Time Data / Repayments (`/realTimeData`)
- **File**: [realTimeData.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/weeklyReport/realTimeData.js)
- Live repayment tracking dashboard

### 6.9 Payments Module

| Page | Path | Purpose |
|---|---|---|
| Transactions | `/transactions` | View all payment transactions |
| EasyCollect | `/easycollect` | Payment link generation and management |
| AutoCollect | `/autocollect` | Automated collection via autopay mandates |

### 6.10 Autopay Requests (`/autopayRequest`)
- **Files**: `AutopayRequests.js`, `RegisterAutopay.js`, `DebitRequest.js`, `SchedularRequests.js`, `AutopayDetails.js`
- Manage UPI autopay mandates, raise debit requests, schedule automated collections

### 6.11 Onboarding (`/onboardingSteps`, `/createOrganization`, etc.)
- Multi-step org onboarding: create org → add company info → add offices → add users → add loan products → add funders → add financial info
- **File**: [addProduct.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/pages/onboarding/addProduct.js) (88 KB) — comprehensive product creation form

### 6.12 Other Pages

| Page | Purpose |
|---|---|
| QA Testing (`/qaTesting`) | Internal testing tools (delete loans, remove KYC, revoke agents) |
| API Insights (`/api-insights`) | API consumption analytics dashboard (86 KB file) |
| Repayment Only (`/repaymentOnly`) | Simplified repayment entry interface |
| Loan Agreements (`/loanAgreements`) | View generated loan agreement documents |

---

## 7. API Layer Architecture

### 7.1 API Hosts

All API calls go to the backend configured via `.env`:

```
REACT_APP_HOST_DOMAIN = "apis-staging.vitto.money"
```

Two base URLs are constructed:
- **Loan Service**: `https://apis-staging.vitto.money/loans`
- **User/Customer Service**: `https://apis-staging.vitto.money/customers` and `.../users`

### 7.2 API Utility Files

| File | Responsibility | Key Functions |
|---|---|---|
| [loanApis.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/utilities/apiUtils/loanApis.js) (69KB, 2098 lines) | All loan CRUD, status changes, EMI, demands, collections, products | `getLoanRequests`, `changeLoanStatus`, `disburseLoan`, `generateEMISchedule`, `getDemands`, `markCollection`, `addLoanProduct`, etc. |
| [userApis.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/utilities/apiUtils/userApis.js) | Auth, user CRUD, documents, bank accounts, credit reports | `sendLoginOTP`, `verifyOTP`, `createUser`, `getBorrowerDocuments`, `verifyBankAccount`, `fetchCreditCheckReport` |
| [borrowerApis.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/utilities/apiUtils/borrowerApis.js) | Borrower data, KYC, documents, co-applicants, metadata | `getBorrowerData`, `uploadUserDocuments`, `kycDetails`, `getCreditRiskAssessmentData` |
| [rolesApis.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/utilities/apiUtils/rolesApis.js) | Role CRUD, permissions | Role management APIs |
| [permissionApis.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/utilities/apiUtils/permissionApis.js) | Permission listing | Permission APIs |
| [superAdminApis.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/utilities/apiUtils/superAdminApis.js) | Org creation, office management | Super admin operations |
| [ifscApis.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/utilities/apiUtils/ifscApis.js) | IFSC code lookup | Bank IFSC validation |

### 7.3 API Call Pattern

Every API function follows this consistent pattern:
```js
export let someApiCall = async (params) => {
  let token = retrieveFromLocalStorage("token");
  let url = `${host}/api/v1/...`;
  try {
    let response = await axios.get(url, {
      headers: { Authorization: "Bearer " + token }
    });
    return response.data;
  } catch (err) {
    if (!err.response) throw networkError;
    if (err.response.status === 401) redirectOnTokenExpiry();
    throw err.response.data;
  }
};
```

---

## 8. Permission System

### 8.1 Permission Strings

Permissions are granular string identifiers stored in the JWT token and in localStorage under `userPermissions`. Key permission groups:

| Category | Permissions |
|---|---|
| **Users** | `user-list`, `user-create`, `user-update`, `user-activate`, `user-deactivate` |
| **Roles** | `role-list`, `role-create`, `role-update` |
| **Loans** | `loanRequests-list`, `loanRequest-details`, `loanRequest-update`, `disburse-loan` |
| **Loan Products** | `get-all-loan-products`, `create-loan-product`, `update-loan-product` |
| **Collections** | `view-collection-tab`, `mark-repayment` |
| **Reports** | `View-reports` |
| **Loan Leads** | `admin-view-loan-leads`, `agent-view-loan-leads`, `edit-loan-lead` |
| **Autopay** | `autopay-list`, `autopay-create` |
| **API Services** | `api-service` |
| **Payments** | `list-transactions`, `create-payment-link`, `register-autopay` |
| **Testing** | `testing-enabled` |
| **Credit** | `credit-risk-assessment`, `fetch-credit-check-report` |

### 8.2 Permission Hierarchy

Users have a geographic hierarchy level: `COUNTRY > STATE > DISTRICT > BLOCK/WARD/TEHSIL > BRANCH`
Combined with a `taggedOfficeId` to scope data access.

---

## 9. Loan Status Pipeline

Defined in [loanStatusConfig.js](file:///c:/Users/1/Desktop/vitto-dashboard/microfinance-mfi-dashboard/src/config/loanStatusConfig.js):

```
Applied → Pre-Credit-Approved → Credit-Approved → Sanctioned → Disburse-Approved → Active → Closed
                                                                                          ↘ Rejected
                                                                                          ↘ Auto-Rejected
```

Each status transition requires specific permissions (e.g., `sanction-level1`, `sanction-level2`, `disburse-loan`).

---

## 10. Redux State Management

The Redux store manages **UI-only state** (no business data):

| Reducer | Purpose | Actions |
|---|---|---|
| `sidebar` | Sidebar open/close, sticky toggle | `SIDEBAR_VISIBILITY_TOGGLE`, `SIDEBAR_STICKY_TOGGLE` |
| `layout` | Boxed layout toggle | `LAYOUT_BOXED_TOGGLE` |
| `theme` | Theme switching | `THEME_TOGGLE` |
| `toastr` | Toast notification state | Managed by `react-redux-toastr` |

> [!NOTE]
> Business data (loans, users, etc.) is **NOT** in Redux. It's fetched directly in components via API utility functions and held in component-level `state`.

---

## 11. Styling Architecture

- **SCSS files** in `src/assets/scss/` — one per module (50+ files)
- **Theme system**: `corporate.scss`, `classic.scss`, `modern.scss` → compiled to `public/css/`
- **Theme switching**: `themeService.js` dynamically swaps `<link>` stylesheets
- **Responsive design**: CSS classes `for-mobile-tabletview`, `for-desktopview`, `for-mobile-tablets`, `for-mobile-tab` for responsive breakpoints

---

## 12. Internationalization (i18n)

- 4 languages: English (default), Hindi, Bengali, Gujarati
- Translation files: `src/assets/locales/` (Bengali has content; Hindi & Gujarati are empty `{}`)
- `getTranslatedText(text)` in `commonUtil.js` looks up translations
- Language stored in localStorage as `currentLanguage`

---

## 13. Deployment

### GCP App Engine
- `app.yaml` — Node.js runtime config
- `cloudbuild.yaml` — CI/CD pipeline (install deps → build → deploy)
- `server.js` — Express server serves `build/` with SPA fallback (`/*` → `index.html`)
- `env_maker.sh` — Script to generate `.env` from GCP substitution variables

### Build Scripts
```bash
npm start          # Dev server (react-scripts with --openssl-legacy-provider)
npm run build      # Production build
npm run build:css  # Compile SCSS → CSS
```

---

## 14. Key UI Components

| Component | File | Purpose |
|---|---|---|
| **Sidebar** | `components/Sidebar.js` | Permission-filtered nav with expandable categories |
| **Navbar** | `components/Navbar.js` | User avatar, username, dropdown (profile, language, logout), notifications |
| **ResponseModal** | `pages/ui-elements/ResponseModal.js` | Generic success/error modal |
| **OTPModal** | `pages/ui-elements/OTPModal.js` | OTP input with resend functionality |
| **ConfirmationModal** | `pages/ui-elements/ConfirmationModal.js` | Yes/No confirmation dialog |
| **StatusModal** | `pages/ui-elements/StatusModal.js` | Loan status change modal |
| **DisburseModal** | `pages/ui-elements/DisburseModal.js` | Loan disbursement form |
| **RejectionModal** | `pages/ui-elements/RejectionConfirmationModal.js` | Rejection with reason selection |
| **MapModal** | `pages/ui-elements/MapModal.js` | Mapbox location display |
| **PaginationComponent** | `pages/ui-elements/PaginationComponent.js` | Reusable pagination |
| **QaTestingModal** | `pages/ui-elements/QaTestingModal.js` | QA testing actions (delete loans, etc.) |
| **AuthCarousel** | `components/ui-elements/AuthCarousel.js` | Login page carousel |
| **Loading** | `components/Loading.jsx` | Spinner overlay |

---

## 15. Important Patterns for New Developers

### 15.1 Adding a New Page
1. Create component in `src/pages/yourModule/`
2. Import it in `src/routes/index.js`
3. Add route config with `path`, `name`, `permission`, `component`
4. Add it to a `sidebarRoutes` section for sidebar visibility
5. Create SCSS file in `src/assets/scss/`

### 15.2 Adding a New API Call
1. Add function in the appropriate file under `src/utilities/apiUtils/`
2. Follow the standard pattern: get token → build URL → axios call → handle 401 → return data/throw error

### 15.3 Checking Permissions in UI
```js
const perms = retrieveFromLocalStorage("userPermissions") || "";
if (perms.includes("some-permission")) { /* show feature */ }
```

### 15.4 Key localStorage Keys
| Key | Content |
|---|---|
| `token` | JWT auth token |
| `username` | Current user's username |
| `userPermissions` | Comma-separated permission strings |
| `userProfileURL` | Profile picture URL |
| `orgDetails` | Organization logo URL |
| `currentLanguage` | Selected UI language |

---

## 16. File Size Hot Spots

These large files may benefit from refactoring:

| File | Size | Notes |
|---|---|---|
| `Dashboard.js` | 212 KB | Main dashboard — likely monolithic |
| `LoanProducts.js` | 198 KB | Legacy product management |
| `AddProductModal.js` | 182 KB | Product creation form |
| `groupPage.js` | 181 KB | JLG group management |
| `singleLoan.js` | 152 KB | Single loan detail view |
| `addOffice.js` | 152 KB | Office management during onboarding |
| `AutoCollect.js` | 90 KB | Auto-collection management |
| `addProduct.js` | 88 KB | Product onboarding |
| `ApiInsights.js` | 86 KB | API consumption dashboard |
| `loanApis.js` | 69 KB | Loan API utilities (2098 lines) |

---

> [!TIP]
> **Quick Start for New Developers**: Set `REACT_APP_ENVIRONMENT=development` in `.env`, run `npm start`, and the app will bypass login using mock data with full admin permissions. The staging API at `apis-staging.vitto.money` will be used for all backend calls.
