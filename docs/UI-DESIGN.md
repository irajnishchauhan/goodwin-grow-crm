# Goodwin Grow CRM — UI/UX Design System Specification

## 1. Visual Identity & Brand Direction

Goodwin Grow CRM reflects a modern, high-precision enterprise aesthetic combining crisp light surfaces, deep charcoal typography, subtle border delineations, and vibrant green accents drawn from the **Goodwin Grow AI** corporate brand palette.

### 1.1 Color Tokens

- **Brand Primary (Goodwin Green):**
  - `primary-50`: `#ECFDF5` (Soft emerald background)
  - `primary-100`: `#D1FAE5`
  - `primary-500`: `#10B981` (Vibrant accent)
  - `primary-600`: `#059669` (Primary action button / active tab)
  - `primary-700`: `#047857` (Hover state)
  - `primary-900`: `#064E3B`
- **Neutrals (Slate & Charcoal):**
  - Background Light: `#F8FAFC` (Slate 50)
  - Surface Card Light: `#FFFFFF`
  - Border Light: `#E2E8F0` (Slate 200)
  - Text Primary Light: `#0F172A` (Slate 900)
  - Text Secondary Light: `#64748B` (Slate 500)
  - Surface Dark: `#0F172A`
  - Background Dark: `#020617`
- **Semantic Accents:**
  - Success: `#10B981` (Won Deals, Converted Leads, Active)
  - Warning: `#F59E0B` (Approaching Due Date, Stale Deals)
  - Danger: `#EF4444` (Lost Deals, Overdue Tasks, Revoked)
  - Info: `#3B82F6` (Proposal Sent, Scheduled Meetings)

---

## 2. Navigation Architecture & Layouts

### 2.1 Workspace CRM Shell (`/app/*`)
- **Top Header Bar:**
  - Company Switcher Dropdown (Displays current company logo, name, and membership list).
  - Global Search Input (Searches leads, contacts, deals, companies within tenant).
  - Quick Action button (`+ New Lead`, `+ New Deal`, `+ Log Activity`).
  - Notification Bell (Unread count badge).
  - User Avatar & Profile Menu (Profile, Company Settings, Sign Out).
- **Collapsible Left Sidebar:**
  - **Overview:** Dashboard
  - **Sales Core:** Leads, Contacts, Companies, Deals, Pipelines
  - **Productivity:** Tasks, Activities, Calendar
  - **Commerce:** Quotations, Products
  - **Intelligence & Setup:** Automations, Reports, Team, Settings

### 2.2 Platform Super Admin Shell (`/platform/*`)
- **Dedicated Independent Shell:**
  - Platform Banner ("Goodwin Grow AI — Platform Control Center")
  - Sidebar: Platform Overview, Client Companies, Subscription Plans, Tenant Usage, Audit Logs, System Health, Platform Settings.
  - Quick tenant provisioning action ("Add Client Company").

---

## 3. Key CRM Component Patterns

1. **Pipedrive-Inspired Deal Pipeline Kanban:**
   - Horizontal scrolling stages with stage header showing count and aggregate deal value.
   - Smooth drag-and-drop deal cards using `dnd-kit`.
   - Deal card displays: Deal title, customer company/contact, deal value with formatted currency, probability badge, owner avatar, and overdue activity warning icon.
   - Instant visual feedback on stage transition with database persistence.

2. **HubSpot-Style 360-Degree Contact & Lead Profile:**
   - Three-column layout:
     - Left Column: Contact details, status badge, assigned owner, custom fields.
     - Center Column: Comprehensive Activity Timeline (filtered by Calls, Emails, Meetings, Tasks, Notes) + Quick Activity composer tabs.
     - Right Column: Associated Deals, Associated Company, Pending Tasks, Issued Quotations.

3. **Enterprise Data Table:**
   - Pagination, sorting, multi-column search, column toggles.
   - Bulk action toolbar (Change Owner, Bulk Status, Export CSV).
   - Distinct empty state with friendly illustration and "Add your first record" call to action.

4. **Accessibility Standards:**
   - Target WCAG 2.2 AA.
   - High contrast ratios (minimum 4.5:1 for body copy).
   - Full keyboard accessibility for modal dialogs and dropdown menus.
