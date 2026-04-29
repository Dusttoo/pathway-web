# D&D Campaign Manager - Frontend

A Next.js web application for managing D&D campaigns, custom character classes, and species templates.

## Features

- **Campaign Management**: Create and manage D&D campaigns with custom settings
- **Class Templates**: Design custom character classes with unique abilities and features
- **Species Templates**: Create custom playable races/species with traits and bonuses
- **Template Linking**: Associate templates with campaigns to control available content
- **Era Settings**: Configure time period-specific equipment and abilities

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **TanStack Query** for server state management
- **React Hook Form** for form handling
- **Zod** for schema validation

## Getting Started

### Prerequisites

- Node.js 18+
- Running API server (see main project README)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Update `.env.local` with your API URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── campaigns/         # Campaign pages
│   ├── templates/         # Template pages (classes, species)
│   └── page.tsx          # Dashboard
├── components/            # React components
│   ├── layout/           # Layout components (Header, Sidebar)
│   ├── ui/               # Reusable UI components
│   ├── campaigns/        # Campaign-specific components
│   ├── templates/        # Template-specific components
│   └── forms/            # Form components
└── lib/                  # Utilities and hooks
    ├── api/              # API client
    ├── hooks/            # React Query hooks
    ├── types/            # TypeScript types
    └── utils/            # Utility functions
```

## API Integration

The app connects to the FastAPI backend at the URL specified in `NEXT_PUBLIC_API_URL`.

### Authentication

Currently uses a hardcoded Discord user ID for testing. In production, this should be replaced with proper authentication (JWT, OAuth, etc.).

### Available Endpoints

- `/api/v1/campaigns` - Campaign CRUD
- `/api/v1/templates/classes` - Class template CRUD
- `/api/v1/templates/species` - Species template CRUD

See the main API documentation for full endpoint details.

## Development Notes

- The app uses React Query for data fetching and caching
- All API requests are type-safe using TypeScript
- Forms use React Hook Form with Zod validation
- Tailwind CSS is configured with a dark theme for D&D aesthetics

## Next Steps

- [ ] Implement template editor forms
- [ ] Add campaign editor with template linking UI
- [ ] Implement proper authentication
- [ ] Add real-time updates with WebSockets
- [ ] Add image upload for templates
- [ ] Implement advanced filtering and search
