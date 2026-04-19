-- IFM Student-Lecturer Appointment System Schema
-- This script creates all necessary tables with RLS policies

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'lecturer');

-- Create enum for appointment status
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Users/Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lecturer availability slots
CREATE TABLE IF NOT EXISTS public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lecturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status appointment_status DEFAULT 'pending',
  lecturer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_appointment_time CHECK (start_time < end_time),
  CONSTRAINT different_users CHECK (student_id != lecturer_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Availability slots policies
CREATE POLICY "Anyone can view active availability slots" ON public.availability_slots
  FOR SELECT USING (is_active = true);

CREATE POLICY "Lecturers can manage their own slots" ON public.availability_slots
  FOR ALL USING (auth.uid() = lecturer_id);

-- Appointments policies
CREATE POLICY "Students can view their appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Lecturers can view appointments with them" ON public.appointments
  FOR SELECT USING (auth.uid() = lecturer_id);

CREATE POLICY "Students can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their pending appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = student_id AND status = 'pending');

CREATE POLICY "Lecturers can update appointments with them" ON public.appointments
  FOR UPDATE USING (auth.uid() = lecturer_id);

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_availability_lecturer ON public.availability_slots(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_student ON public.appointments(student_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lecturer ON public.appointments(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
