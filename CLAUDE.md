# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KostKa Úvěry is a React-based client management system for mortgage brokers, built with TypeScript, Vite, and Supabase. The application manages client data, generates PDF forms, and provides mortgage calculation tools.

## Development Commands

```bash
# Development server (with hot reload)
npm run dev

# Development with Netlify functions
npm run dev:netlify

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** as build tool and dev server
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend & Database
- **Supabase** for authentication and PostgreSQL database
- **Netlify Functions** for serverless backend functions
- **Python scripts** for PDF processing (located in `/scripts/`)

### Key Services Architecture

**Client Management Flow:**
1. `ClientService` handles all database operations for clients
2. `AdminService` manages dropdown lists and system settings
3. Authentication handled through `useAuth` hook with Supabase

**PDF Generation Flow:**
1. Frontend components call services in `/src/services/`
2. Services may call Netlify functions in `/netlify/functions/`
3. Netlify functions execute Python scripts for PDF processing
4. Generated PDFs returned as base64 encoded data

### Core Components Structure

```
src/
├── components/
│   ├── forms/           # Form components (BusinessSection, PersonalInfo, etc.)
│   ├── ClientForm.tsx   # Main client form
│   ├── ClientList.tsx   # Client listing with search
│   └── BohemikaFormGenerator.tsx  # PDF form generator
├── services/            # Business logic and API calls
├── hooks/              # React hooks (useAuth, useToast, useTheme)
├── lib/                # Supabase configuration
└── utils/              # Helper functions
```

### Database Schema

The application uses Supabase with these main tables:
- `clients` - Main client data (applicant & co-applicant)
- `employers` - Employment information
- `properties` - Property details for loans
- `liabilities` - Client debts and obligations
- `children` - Dependent children data
- `loans` - Loan applications
- `businesses` - Business entity data
- `admin_lists` - System dropdown values

## Environment Setup

Required environment variables:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development Guidelines

### Testing
- Uses **Vitest** for unit testing with jsdom environment
- Test files located in `src/components/forms/__tests__/`
- Run single test: `npm test -- BusinessSection.test.tsx`

### PDF Processing
- PDF templates stored in `/public/` directory
- Python scripts in `/scripts/` handle PDF field filling
- Uses `pypdf` library for PDF manipulation
- Font files in `/public/fonts/` for PDF generation

### State Management
- No global state library - uses React hooks and prop drilling
- `useAuth` for authentication state
- `useToast` for notification system
- URL parameters for client selection (`?client=id`)

### Code Conventions
- TypeScript strict mode enabled
- ESLint with React hooks rules
- Prefer functional components with hooks
- Use Tailwind utility classes for styling
- Czech language for UI text and comments

## Netlify Deployment

- Build command: `npm install --no-audit --no-fund && npm run build`
- Functions in `/netlify/functions/` are serverless endpoints
- Static files served from `/dist/` directory
- Python functions require Python 3.8 runtime