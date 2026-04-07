# Prakto

Prakto is an internship and career management platform that connects students with companies, streamlining the application process, internship tracking, and professional development.

## Overview

The platform serves both students seeking internships and companies offering placements. It provides tools for managing applications, scheduling, journaling internship progress, and building professional portfolios. An integrated AI assistant helps users with document generation and career guidance.

## Tech Stack

- **Framework:** Next.js 16 with React 19
- **Styling:** Tailwind CSS 4, Radix UI, shadcn/ui, MUI components
- **Database:** Appwrite
- **AI:** OpenAI API integration
- **Rich Text:** TipTap editor
- **PDF:** react-pdf/renderer, pdf-lib, pdf-parse
- **Data Fetching:** TanStack React Query
- **Forms:** TanStack React Form
- **Email:** Resend
- **Error Tracking:** Sentry
- **Deployment:** Vercel

## Features

- Student and company dashboards
- Internship listing and search
- Application management with status tracking
- Internship journal for daily reflections
- Portfolio builder
- Calendar and scheduling
- Chat and messaging inbox
- Kanban board for task organization
- AI-powered tools for CV and document assistance
- PDF generation and document handling
- Admin panel for platform management
- Form builder with custom elements
- Notification system
- Billing and subscription management
- Resource library

## Project Structure

```
src/
  app/
    dashboard/
      admin/          Platform administration
      applications/   Application tracking
      ai-tools/       AI-powered utilities
      calendar/       Scheduling
      chat/           Messaging
      companies/      Company profiles
      forms/          Form management
      inbox/          Unified inbox
      internships/    Internship listings
      journal/        Internship journal
      kanban/         Task boards
      listings/       Job and internship listings
      portfolio/      Portfolio builder
      profile/        User profiles
      students/       Student management
      support/        Help and support
    api/              API routes
    auth/             Authentication
  components/         Shared UI components
  config/             Application configuration
  lib/                Utilities and helpers
  types/              TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+
- Appwrite project
- API keys for OpenAI, Resend (as needed)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
npm start
```

## Environment Variables

Configure the required environment variables for database connections, API keys, and service credentials before running the application.

## License

All rights reserved.
