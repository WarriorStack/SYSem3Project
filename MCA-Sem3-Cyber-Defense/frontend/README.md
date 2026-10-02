# Sentinel Guard

You are the senior frontend engineer responsible for building the frontend of an MCA Semester 3 cybersecurity project.

PROJECT

Build the frontend for:

AI-Powered Cyber Defense and Security Analytics Platform using Machine Learning for Real-Time Threat Detection

This is a cybersecurity analytics platform designed to collect/analyze network-security data, use machine-learning models to detect and classify threats, calculate risk, generate alerts, map threats to MITRE ATT&CK techniques, provide explainability, and present security information through an interactive dashboard.

The backend will be developed separately using Python/FastAPI by another AI engineering workflow.

Your frontend MUST be designed around the API contract specified below.

Do not invent a different architecture.

1. TECHNOLOGY STACK

Use:

React.js

TypeScript

Vite

Tailwind CSS

Axios

React Router

Recharts or another suitable React charting library

Lucide React or equivalent icon library

WebSocket client for real-time events

Use a clean modular component architecture.

Do not introduce a completely different frontend framework.

2. DESIGN DIRECTION

Create a professional cybersecurity/SOC-style dashboard.

The design should feel:

modern

technical

professional

clean

information-dense without becoming cluttered

suitable for an MCA project demonstration

responsive

accessible

Use a dark security-dashboard visual language with restrained accent colors.

Avoid excessive neon effects, excessive animations, or gaming-style UI.

Important information such as:

critical alerts

attack severity

risk scores

detection status

system status

must have clear visual hierarchy.

Use cards, tables, charts, badges, filters, tabs, drawers/modals and data panels where appropriate.

3. APPLICATION STRUCTURE

Create the following main routes.

Authentication

/login

/register

Main application

/dashboard

/detections

/detections/:id

/alerts

/incidents

/threats

/mitre

/analytics

/reports

/models

/profile

Administration

/admin/users

/admin/system

Only expose admin routes to users with the admin role.

4. LOGIN PAGE

Create a professional login screen.

Fields:

email

password

Features:

validation

loading state

API error display

successful authentication

JWT storage

redirect to dashboard

Do not implement fake authentication.

Use:

POST /api/auth/login

5. REGISTRATION

Fields:

name

email

password

Use:

POST /api/auth/register

Show validation errors returned by the backend.

After registration, provide an appropriate login flow.

Do not create unsupported registration fields.

6. DASHBOARD

The dashboard is the main SOC-style security monitoring screen.

Display:

total detections

critical/high/medium/low alerts

active incidents

current risk level

attack distribution

detection trend

recent alerts

recent detections

top attack categories

model status

system status

Use analytical charts.

Possible visualizations:

line chart for detection trends

bar chart for attack categories

donut/pie chart for severity distribution

risk distribution

recent event table

The dashboard must consume real API data.

Do NOT hardcode fake production data.

During development, loading/empty states are acceptable.

7. REAL-TIME MONITORING

Connect to:

ws://localhost:8000/api/ws/dashboard

and:

ws://localhost:8000/api/ws/alerts

Use WebSockets for live events.

When a new detection or alert arrives:

update relevant dashboard data

update alert counters

display an unobtrusive notification

update recent-event lists

Handle:

connection failure

reconnection

loading

disconnected state

Do not crash the application if WebSocket connectivity is unavailable.

8. DETECTIONS PAGE

Route:

/detections

Provide:

detection table

timestamp

source/destination information where available

protocol

attack type

prediction

confidence

severity

risk score

status

Provide filters for:

date

severity

attack type

prediction

status

Support pagination if the backend provides pagination.

Clicking a detection opens:

/detections/:id

9. DETECTION DETAILS

Display:

detection ID

timestamp

source information

destination information

extracted features where available

predicted class

confidence

severity

risk score

explanation

MITRE ATT&CK technique

recommended action

related alerts

Use visual indicators for confidence and risk.

Do not expose raw technical data in a confusing way.

Organize information into sections/tabs.

10. DETECTION ANALYSIS

Provide an interface where an authorized user can submit supported network/security feature data for analysis.

Endpoint:

POST /api/detection/analyze

The frontend must send the exact backend-defined request schema.

The response may contain:

prediction

attack type

confidence

severity

risk score

explanation

MITRE mapping

Display these results professionally.

Do not implement machine-learning prediction inside React.

11. ALERTS

Route:

/alerts

Display:

alert ID

timestamp

severity

attack type

risk score

source

status

related detection

Provide:

filtering

search

sorting

alert details

resolve action

Endpoints:

GET /api/alerts

GET /api/alerts/{id}

PATCH /api/alerts/{id}

POST /api/alerts/{id}/resolve

Critical alerts should receive stronger visual emphasis.

12. INCIDENT MANAGEMENT

Route:

/incidents

Allow users to view and manage security incidents.

Display:

incident title

severity

status

created date

related alerts

description

assigned user if available

Endpoints:

GET /api/incidents

POST /api/incidents

GET /api/incidents/{id}

PATCH /api/incidents/{id}

Use statuses such as those returned by the backend rather than inventing unsupported status values.

13. THREAT INFORMATION

Route:

/threats

Display detected attack/threat categories and associated information.

Endpoint:

GET /api/threats

GET /api/threats/{id}

Provide useful filtering and detailed threat views.

14. MITRE ATT&CK

Route:

/mitre

Display MITRE ATT&CK mappings associated with detected attacks.

Endpoints:

GET /api/mitre/techniques

GET /api/mitre/{technique_id}

Show:

technique ID

technique name

description

associated attack category

detections/incidents where available

Make the mapping understandable to a security analyst.

15. ANALYTICS

Route:

/analytics

Provide analytical views of:

attack frequency

attack categories

severity distribution

risk trends

detection trends

confidence distribution

time-based patterns

Endpoints:

GET /api/analytics/overview

GET /api/analytics/attacks

GET /api/analytics/risk

Use interactive charts and filters.

16. REPORTS

Route:

/reports

Provide report-oriented views based on backend-generated data.

Display:

date range

detection statistics

attack statistics

severity statistics

risk summary

notable incidents

Use:

GET /api/reports

Do not invent a PDF-generation API unless the backend contract later explicitly provides one.

17. ML MODELS

Route:

/models

Display information about available detection models.

Endpoint:

GET /api/models

GET /api/models/{id}

Potential information:

model name

algorithm

version

status

supported detection type

performance metrics where available

Do not allow the frontend to directly execute or load ML model files.

18. PROFILE

Route:

/profile

Use:

GET /api/users/me

PATCH /api/users/me

Display/update supported user information.

Do not expose passwords or sensitive authentication secrets.

19. ADMIN

Admin dashboard should provide administrative functionality supported by the backend.

Examples:

user management

system status

audit information

Never expose admin functionality to normal users.

The frontend must rely on backend authorization rather than only hiding UI elements.

20. AUTHENTICATION

Authentication uses JWT.

After successful login, store the authentication state securely according to the application's frontend architecture.

Authenticated API requests must send:

Authorization: Bearer <JWT_TOKEN>

Create a centralized Axios/API client.

Implement:

authentication state

protected routes

role-based route protection

automatic handling of expired sessions

logout

redirect to login when authentication becomes invalid

Do not implement an incompatible authentication system.

21. SHARED API CONTRACT

Base URL:

http://localhost:8000/api

Endpoints:

POST /auth/register

POST /auth/login

GET /auth/me

POST /auth/logout

GET /dashboard/summary

GET /dashboard/trends

GET /dashboard/attack-distribution

POST /detection/analyze

POST /detection/batch

GET /detection

GET /detection/{id}

GET /alerts

GET /alerts/{id}

PATCH /alerts/{id}

POST /alerts/{id}/resolve

GET /incidents

POST /incidents

GET /incidents/{id}

PATCH /incidents/{id}

GET /threats

GET /threats/{id}

GET /mitre/techniques

GET /mitre/{technique_id}

GET /analytics/overview

GET /analytics/attacks

GET /analytics/risk

GET /reports

GET /models

GET /models/{id}

GET /users/me

PATCH /users/me

WebSocket:

/ws/alerts

/ws/dashboard

22. DATA CONTRACT

Use consistent names for the core concepts:

User

Detection

Alert

Incident

Threat

MitreTechnique

Analytics

Model

AuditLog

Do not rename backend fields.

If the backend returns snake_case fields, preserve them at the API boundary and use a clearly defined transformation layer only if required by the frontend.

Do not silently change:

IDs

timestamps

severity

confidence

risk_score

attack_type

prediction

status

technique_id

23. ERROR HANDLING

Create consistent handling for:

400 validation errors

401 authentication errors

403 authorization errors

404 not found

409 conflicts

422 validation errors

429 rate limits

500 server errors

Provide useful user-facing messages without exposing internal server details.

24. LOADING AND EMPTY STATES

Every API-driven page must have:

loading state

error state

empty state

retry option where appropriate

Never leave blank screens.

25. RESPONSIVENESS

The application must work on:

desktop

laptop

tablet

The primary target is desktop because this is a security analytics dashboard.

Use responsive navigation and layouts.

26. COMPONENT ARCHITECTURE

Create reusable components such as:

AppLayout

Sidebar

TopBar

ProtectedRoute

RoleGuard

StatCard

SeverityBadge

RiskIndicator

DetectionTable

AlertTable

IncidentTable

ThreatCard

AnalyticsChart

DetectionDetails

AlertDetails

EmptyState

LoadingState

ErrorState

NotificationToast

SearchFilter

Pagination

Modal

ConfirmationDialog

Keep components modular.

27. FRONTEND ENVIRONMENT VARIABLES

Use:

VITE_API_BASE_URL=http://localhost:8000/api

VITE_WS_BASE_URL=ws://localhost:8000/api

Never hardcode production secrets.

28. IMPORTANT RESTRICTIONS

DO NOT:

invent backend endpoints

invent database fields

rename API fields

implement ML in the browser

use fake production functionality

hardcode authentication

bypass authorization

expose backend secrets

store ML models in frontend assets

create unrelated features

replace FastAPI with another backend

replace PostgreSQL with another database

replace the agreed authentication mechanism

The backend generated separately by Claude is the source of truth for API behavior.

If an API contract is ambiguous, keep the frontend implementation modular and clearly isolate the API service layer so the contract can be adjusted without rewriting the UI.

29. DEVELOPMENT QUALITY

Use:

TypeScript types

reusable components

centralized API services

centralized authentication state

route protection

clean folder structure

proper error handling

accessible UI

responsive design

maintainable code

The final application must be ready to connect to the actual FastAPI backend.

Do not merely generate a static mockup.

Build a functional frontend architecture.

30. FINAL REQUIREMENT

Treat this frontend and the separately generated FastAPI backend as ONE application.

Every API, field, authentication mechanism, role and business concept must remain compatible.

Before considering the frontend complete, verify:

API base URL is configurable.

Authentication is JWT-compatible.

Protected routes exist.

Admin routes are role protected.

Detection APIs are correctly integrated.

Alert APIs are correctly integrated.

Incident APIs are correctly integrated.

Analytics APIs are correctly integrated.

MITRE APIs are correctly integrated.

WebSocket integration is implemented.

Loading/error/empty states exist.

No fake production functionality is presented as real.

No backend endpoint has been invented beyond the agreed contract.

The frontend can run independently while the backend is being developed.

The architecture is ready for direct integration with the FastAPI backend.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5a47db49-3ca4-4a3c-9b23-16a8fef292b6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
