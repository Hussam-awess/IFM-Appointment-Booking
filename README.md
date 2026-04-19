# IFM Appointment Booking System

A modern student-lecturer appointment booking system for the Institute of Finance Management.

## Features

- 🔐 Secure authentication with Supabase
- 👥 Role-based access (student/lecturer)
- 📅 Appointment booking and management
- 📋 Availability management for lecturers
- 🔔 Notification system
- 🎨 Modern UI with IFM branding
- 📱 Fully responsive design

## Environment Variables

Create a `.env.local` file in the project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### For Vercel Deployment:

Add these environment variables in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`
5. Build for production: `npm run build`

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Supabase
- **Icons**: Lucide React
- **Deployment**: Vercel
