-- ==============================================================================
-- CODEVISION 2026 — SUPABASE PRODUCTION DATABASE SCHEMA & STORAGE SETUP
-- Project URL: https://ezlmspomkhbluxwxpdge.supabase.co
-- Description: Complete schema for Teams, Team Profiles & Images, Coordinators,
--              Themes, Event Schedule, Storage Bucket & Realtime Sync.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLE: TEAMS (Online & Spot Registrations + Team Profiles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id VARCHAR(50) UNIQUE NOT NULL,            -- e.g. 'CV26-K9X42'
    team_name VARCHAR(150) NOT NULL,
    team_logo TEXT DEFAULT 'CV',                    -- Image URL or Emblem
    team_size INT NOT NULL DEFAULT 2 CHECK (team_size IN (2, 3)),
    
    -- Leader / Member 1 Details
    leader_name VARCHAR(150) NOT NULL,
    leader_email VARCHAR(150) NOT NULL,
    leader_phone VARCHAR(30) NOT NULL,
    leader_roll_no VARCHAR(50) NOT NULL,
    leader_class_year VARCHAR(50) DEFAULT 'III B.Tech',
    leader_section VARCHAR(20) DEFAULT 'A',
    leader_photo_url TEXT DEFAULT NULL,            -- Profile image URL in Supabase Storage
    
    -- Member 2 Details (Required for Duo & Trio teams)
    member2_name VARCHAR(150) NOT NULL,
    member2_email VARCHAR(150) DEFAULT NULL,
    member2_phone VARCHAR(30) DEFAULT NULL,
    member2_roll_no VARCHAR(50) NOT NULL,
    member2_class_year VARCHAR(50) DEFAULT 'III B.Tech',
    member2_section VARCHAR(20) DEFAULT 'A',
    member2_photo_url TEXT DEFAULT NULL,           -- Member 2 Profile image URL
    
    -- Member 3 Details (Required for Trio teams)
    member3_name VARCHAR(150) DEFAULT NULL,
    member3_email VARCHAR(150) DEFAULT NULL,
    member3_phone VARCHAR(30) DEFAULT NULL,
    member3_roll_no VARCHAR(50) DEFAULT NULL,
    member3_class_year VARCHAR(50) DEFAULT NULL,
    member3_section VARCHAR(20) DEFAULT NULL,
    member3_photo_url TEXT DEFAULT NULL,           -- Member 3 Profile image URL

    -- Institution & Event Meta
    college VARCHAR(200) NOT NULL DEFAULT 'Vemu Institute of Technology',
    department VARCHAR(150) NOT NULL DEFAULT 'Computer Science & Engineering',
    registration_type VARCHAR(20) NOT NULL DEFAULT 'ONLINE' CHECK (registration_type IN ('ONLINE', 'SPOT')),
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'PENDING', 'CANCELLED', 'CHECKED_IN')),
    notes TEXT DEFAULT '',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_teams_team_id ON public.teams (upper(team_id));
CREATE INDEX IF NOT EXISTS idx_teams_leader_email ON public.teams (lower(leader_email));
CREATE INDEX IF NOT EXISTS idx_teams_leader_roll ON public.teams (upper(leader_roll_no));
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON public.teams (created_at DESC);


-- ==============================================================================
-- 3. TABLE: COORDINATORS & TEAM PROFILES (Faculty, Student Leads & Organizers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coordinators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coord_id VARCHAR(50) UNIQUE NOT NULL,           -- e.g. 'CV26-CRD-101'
    name VARCHAR(150) NOT NULL,
    role VARCHAR(100) NOT NULL,                     -- e.g. 'Faculty Coordinator', 'Student Lead'
    designation VARCHAR(150) NOT NULL,              -- e.g. 'Associate Professor, Dept of CSE'
    department VARCHAR(150) NOT NULL DEFAULT 'Computer Science & Engineering',
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    roll_or_emp_id VARCHAR(50) NOT NULL,            -- Roll number or Faculty Emp ID
    desk VARCHAR(150) DEFAULT 'General Help Desk',  -- Desk/Control room location
    avatar TEXT DEFAULT '👨‍💻',                      -- Emoji fallback or image URL
    image_url TEXT DEFAULT NULL,                    -- Uploaded photo URL in Supabase Storage
    bio TEXT DEFAULT '',                            -- Short bio / intro
    github_url TEXT DEFAULT NULL,                   -- Social/Portfolio
    linkedin_url TEXT DEFAULT NULL,                 -- Social/Portfolio
    display_order INT DEFAULT 0,                    -- Sort order
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_coordinators_coord_id ON public.coordinators (upper(coord_id));
CREATE INDEX IF NOT EXISTS idx_coordinators_roll_emp ON public.coordinators (upper(roll_or_emp_id));


-- ==============================================================================
-- 4. TABLE: THEMES (Competition Challenge Problem Tracks)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id VARCHAR(50) UNIQUE NOT NULL,           -- e.g. 'thm_01'
    number VARCHAR(10) NOT NULL,                    -- '01', '02', '03', '04'
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT 'code',
    difficulty VARCHAR(50) DEFAULT 'Intermediate',  -- 'Beginner', 'Intermediate', 'Advanced'
    active BOOLEAN NOT NULL DEFAULT true,           -- Toggle reveal on event day
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_themes_number ON public.themes (number);


-- ==============================================================================
-- 5. TABLE: EVENT_SCHEDULE (Admin-Configurable Schedule & Timings)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.event_schedule (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'current',
    event_date VARCHAR(30) NOT NULL DEFAULT '2026-10-24',
    event_date_formatted VARCHAR(100) NOT NULL DEFAULT 'Saturday, Oct 24, 2026',
    start_time VARCHAR(20) NOT NULL DEFAULT '10:00',
    start_time_formatted VARCHAR(30) NOT NULL DEFAULT '10:00 AM',
    end_time VARCHAR(20) NOT NULL DEFAULT '15:00',
    end_time_formatted VARCHAR(30) NOT NULL DEFAULT '03:00 PM',
    duration_hours NUMERIC NOT NULL DEFAULT 5,
    reporting_time VARCHAR(20) NOT NULL DEFAULT '09:30',
    reporting_time_formatted VARCHAR(30) NOT NULL DEFAULT '09:30 AM',
    venue VARCHAR(200) NOT NULL DEFAULT 'CSE Labs, Vemu IT',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- ==============================================================================
-- 6. SUPABASE STORAGE BUCKET: TEAM PROFILES & IMAGES
-- ==============================================================================
-- Creates a public bucket named 'team-profiles' for storing profile photos, avatars & logos
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'team-profiles',
        'team-profiles',
        true,
        5242880, -- 5 MB
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    )
    ON CONFLICT (id) DO UPDATE SET 
        public = true,
        file_size_limit = 5242880;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Bucket setup note: %', SQLERRM;
END $$;


-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_schedule ENABLE ROW LEVEL SECURITY;

-- TEAMS POLICIES
DROP POLICY IF EXISTS "Public can view teams" ON public.teams;
CREATE POLICY "Public can view teams" ON public.teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert teams" ON public.teams;
CREATE POLICY "Public can insert teams" ON public.teams FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update teams" ON public.teams;
CREATE POLICY "Public can update teams" ON public.teams FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete teams" ON public.teams;
CREATE POLICY "Public can delete teams" ON public.teams FOR DELETE USING (true);

-- COORDINATORS POLICIES
DROP POLICY IF EXISTS "Public can view coordinators" ON public.coordinators;
CREATE POLICY "Public can view coordinators" ON public.coordinators FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can manage coordinators" ON public.coordinators;
CREATE POLICY "Public can manage coordinators" ON public.coordinators FOR ALL USING (true);

-- THEMES POLICIES
DROP POLICY IF EXISTS "Public can view themes" ON public.themes;
CREATE POLICY "Public can view themes" ON public.themes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can manage themes" ON public.themes;
CREATE POLICY "Public can manage themes" ON public.themes FOR ALL USING (true);

-- EVENT SCHEDULE POLICIES
DROP POLICY IF EXISTS "Public can view event schedule" ON public.event_schedule;
CREATE POLICY "Public can view event schedule" ON public.event_schedule FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update event schedule" ON public.event_schedule;
CREATE POLICY "Public can update event schedule" ON public.event_schedule FOR ALL USING (true);

-- STORAGE OBJECTS POLICIES (team-profiles bucket)
DO $$
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Public can view team profile images" ON storage.objects;
        CREATE POLICY "Public can view team profile images" 
            ON storage.objects FOR SELECT 
            USING (bucket_id = 'team-profiles');
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        DROP POLICY IF EXISTS "Public can upload team profile images" ON storage.objects;
        CREATE POLICY "Public can upload team profile images" 
            ON storage.objects FOR INSERT 
            WITH CHECK (bucket_id = 'team-profiles');
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        DROP POLICY IF EXISTS "Public can update team profile images" ON storage.objects;
        CREATE POLICY "Public can update team profile images" 
            ON storage.objects FOR UPDATE 
            USING (bucket_id = 'team-profiles');
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        DROP POLICY IF EXISTS "Public can delete team profile images" ON storage.objects;
        CREATE POLICY "Public can delete team profile images" 
            ON storage.objects FOR DELETE 
            USING (bucket_id = 'team-profiles');
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;


-- ==============================================================================
-- 8. ENABLE REALTIME SYNC ON SUPABASE
-- ==============================================================================
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.coordinators;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.themes;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.event_schedule;
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL; END;
END $$;


-- ==============================================================================
-- 9. SEED INITIAL DATA
-- ==============================================================================

-- 9.1 Event Schedule
INSERT INTO public.event_schedule (
    id, event_date, event_date_formatted, start_time, start_time_formatted,
    end_time, end_time_formatted, duration_hours, reporting_time, reporting_time_formatted, venue
)
VALUES (
    'current',
    '2026-10-24',
    'Saturday, Oct 24, 2026',
    '10:00',
    '10:00 AM',
    '15:00',
    '03:00 PM',
    5,
    '09:30',
    '09:30 AM',
    'CSE Labs, Vemu IT'
)
ON CONFLICT (id) DO UPDATE SET
    event_date = EXCLUDED.event_date,
    event_date_formatted = EXCLUDED.event_date_formatted,
    start_time = EXCLUDED.start_time,
    start_time_formatted = EXCLUDED.start_time_formatted,
    end_time = EXCLUDED.end_time,
    end_time_formatted = EXCLUDED.end_time_formatted,
    venue = EXCLUDED.venue;

-- 9.2 Challenge Themes
INSERT INTO public.themes (theme_id, number, title, description, icon, difficulty, active)
VALUES
    (
        'thm_01',
        '01',
        'AI-Powered Smart Interfaces',
        'Design intelligent, context-aware web dashboards that predict user intentions and provide reactive conversational experiences.',
        'brain',
        'Advanced',
        true
    ),
    (
        'thm_02',
        '02',
        'Smart Campus & Student Ecosystem',
        'Architect a unified college portal with interactive schedule tracking, lab slot reservations, and automated peer project submissions.',
        'building',
        'Intermediate',
        true
    ),
    (
        'thm_03',
        '03',
        'FinTech & Decentralized Web',
        'Build high-speed financial visualization interfaces with interactive charts, wallet telemetry, and real-time transaction streaming.',
        'credit-card',
        'Advanced',
        true
    ),
    (
        'thm_04',
        '04',
        'Sustainable Tomorrow & Green Energy',
        'Craft visually compelling platforms monitoring carbon footprint metrics, campus solar output, and gamified eco-challenges.',
        'leaf',
        'Intermediate',
        true
    )
ON CONFLICT (theme_id) DO NOTHING;

-- 9.3 Event Coordinators & Team Profiles
INSERT INTO public.coordinators (
    coord_id, name, role, designation, department, email, phone, roll_or_emp_id, desk, avatar, display_order
)
VALUES
    (
        'CV26-CRD-101',
        'Prof. M. Sandhya',
        'Faculty Coordinator',
        'Associate Professor, Dept of CSE',
        'Computer Science & Engineering',
        'sandhya.cse@vemu.org',
        '9440123456',
        'EMP-CSE-108',
        'Control Room — CSE Lab 3',
        '👩‍🏫',
        1
    ),
    (
        'CV26-CRD-102',
        'P. Sai Teja',
        'Student Lead Coordinator',
        'IV B.Tech Student Lead',
        'Computer Science & Engineering',
        'saiteja.lead@gmail.com',
        '9988776655',
        '224M1A0542',
        'Stage & Challenge Operations',
        '👨‍💻',
        2
    ),
    (
        'CV26-CRD-103',
        'V. Keerthi',
        'Technical Operations Lead',
        'Technical Head & Systems Chair',
        'Computer Science & Engineering',
        'keerthi.tech@gmail.com',
        '9876501234',
        '224M1A0560',
        'Lab Network & Workstations Desk',
        '👩‍💻',
        3
    ),
    (
        'CV26-CRD-104',
        'K. Lokesh',
        'Registration & Gate Lead',
        'Discipline & Gate Verification',
        'Computer Science & Engineering',
        'lokesh.gate@gmail.com',
        '9701234567',
        '234M1A0522',
        'Seminar Hall Entrance Gate',
        '🛡️',
        4
    )
ON CONFLICT (coord_id) DO NOTHING;

-- 9.4 Registered Sample Teams
INSERT INTO public.teams (
    team_id, team_name, team_logo, team_size,
    leader_name, leader_email, leader_phone, leader_roll_no, leader_class_year, leader_section,
    member2_name, member2_email, member2_phone, member2_roll_no, member2_class_year, member2_section,
    college, department, registration_type, status, notes
)
VALUES
    (
        'CV26-K9X42',
        'ByteCrafters',
        '⚡',
        2,
        'A. Rajesh Kumar',
        'rajesh.bytecraft@gmail.com',
        '9848022334',
        '234M1A0501',
        'III B.Tech',
        'A',
        'K. Sneha Reddy',
        'sneha.reddy@gmail.com',
        '9848099881',
        '234M1A0518',
        'III B.Tech',
        'A',
        'Vemu Institute of Technology',
        'Computer Science & Engineering',
        'ONLINE',
        'CONFIRMED',
        'Online Verified Registration — CSE Lab 3'
    ),
    (
        'CV26-T3M81',
        'DevNinjas',
        '🚀',
        1,
        'M. Dinesh Naidu',
        'dinesh.devninjas@gmail.com',
        '9123456789',
        '234M1A0535',
        'III B.Tech',
        'B',
        NULL, NULL, NULL, NULL, NULL, NULL,
        'Vemu Institute of Technology',
        'Computer Science & Engineering',
        'ONLINE',
        'CONFIRMED',
        'Solo Participant — CSE Lab 3'
    ),
    (
        'CV26-W5Z19',
        'PixelPioneers',
        '💻',
        2,
        'R. Tarun Teja',
        'tarun.pixel@gmail.com',
        '9876543210',
        '244M1A0562',
        'II B.Tech',
        'A',
        'S. Bhavana',
        'bhavana.pixel@gmail.com',
        '9876509876',
        '244M1A0570',
        'II B.Tech',
        'A',
        'Vemu Institute of Technology',
        'Computer Science & Engineering',
        'SPOT',
        'CONFIRMED',
        'Spot Walk-in Registration — CSE Lab 4'
    )
ON CONFLICT (team_id) DO NOTHING;

-- Verification
SELECT 'Codevision 2026 Supabase Schema successfully configured!' AS message;
