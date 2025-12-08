# Titanium - Secure Cloud & P2P File Sharing

## Overview

Titanium is a modern web application for secure file sharing, supporting both cloud-based and peer-to-peer (P2P) transfer methods. The application provides a full-stack solution with user authentication, session management, and a polished dark-themed user interface built with React and shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React 18 with TypeScript, built using Vite as the build tool and development server.

**UI Framework**: The application uses shadcn/ui component library (New York style variant) built on top of Radix UI primitives. TailwindCSS v4 provides styling with a custom dark theme configuration.

**State Management**: React Query (@tanstack/react-query) handles server state management, data fetching, and caching. Client-side routing is implemented using Wouter, a lightweight routing library.

**Form Handling**: React Hook Form with Zod resolvers for type-safe form validation.

**Animation**: Framer Motion for declarative animations and transitions.

**File Upload**: React Dropzone for drag-and-drop file upload functionality.

**Design System**: 
- Custom CSS variables for theming (defined in `index.css`)
- Dark mode as default with neutral color palette
- Custom fonts: Inter for UI text, JetBrains Mono for code/monospace elements
- Responsive design with mobile-first approach

### Backend Architecture

**Runtime & Framework**: Node.js with Express.js, written in TypeScript and compiled using esbuild for production.

**Development Server**: In development, the backend serves the Vite dev server through middleware mode, enabling hot module replacement (HMR) over the same HTTP server.

**API Design**: RESTful API endpoints under the `/api` namespace. Non-API routes fall through to serve the single-page application's index.html.

**Build Strategy**: 
- Server code is bundled with esbuild, with selective dependency bundling (allowlist approach) to reduce cold start times
- Client is built with Vite and outputs to `dist/public`
- Production server serves pre-built static assets from `dist/public`

### Authentication & Session Management

**Strategy**: Passport.js with dual authentication strategies:
1. Local strategy (email/password) using bcrypt for password hashing
2. Google OAuth 2.0 strategy for social login

**Session Storage**: In-memory sessions using `memorystore` for session storage. Sessions have a 7-day TTL.

**Session Security**:
- HTTP-only cookies
- Secure flag enabled in production
- SameSite: lax for CSRF protection
- Session secret from environment variable

**User Model**: Users can authenticate via local credentials or OAuth providers (tracked via `provider` and `providerId` fields).

### Data Storage

**Database**: Turso (SQLite-based edge database) accessed through Drizzle ORM (libsql driver).

**Schema Management**: Drizzle Kit for migrations with schema defined in `shared/schema.ts`. Uses SQLite syntax for table definitions.

**Tables**:
- `users`: Stores user accounts with support for both local and OAuth authentication
- `sessions`: Stores Express session data with automatic expiration

**Data Access Layer**: Abstracted through a storage interface (`IStorage`) with a concrete `DatabaseStorage` implementation, enabling potential future storage backend changes.

### External Dependencies

**Database**: Turso (configured via `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` environment variables)

**Third-party Services**:
- Google OAuth 2.0 for social authentication
- Replit-specific integrations:
  - Vite plugins for runtime error overlay and dev banner
  - Meta image plugin for OpenGraph tags with Replit deployment URLs
  - Cartographer plugin for development tooling

**Required Environment Variables**:
- `TURSO_DATABASE_URL`: Turso database URL (libsql://...)
- `TURSO_AUTH_TOKEN`: Turso authentication token
- `SESSION_SECRET`: Secret key for session encryption (defaults to dev-secret in development)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_CALLBACK_URL`: OAuth callback URL

**NPM Dependencies** (key libraries):
- `drizzle-orm` & `drizzle-zod`: Database ORM and validation
- `@libsql/client`: Turso/libSQL client
- `passport`, `passport-local`, `passport-google-oauth20`: Authentication
- `express-session`, `memorystore`: Session management
- `bcrypt`: Password hashing
- `zod`: Schema validation
- `@tanstack/react-query`: Data fetching
- `react-dropzone`: File upload UI
- `framer-motion`: Animations
- Complete shadcn/ui component library (@radix-ui/*)

**Build Tools**:
- Vite: Frontend bundler and dev server
- esbuild: Server-side bundler
- TypeScript: Type checking and compilation
- TailwindCSS: Utility-first CSS framework
- PostCSS with Autoprefixer: CSS processing