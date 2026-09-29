/**
 * CODEVISION 2026 — UNIFIED SUPABASE CLOUD & REALTIME ENGINE
 * Directly connects to Supabase for all CRUD operations:
 * - Teams (Online & Spot Registrations)
 * - Coordinators & Team Profiles (with photo/avatar storage)
 * - Event Day Themes (Problem tracks)
 * - Event Schedule & Timings
 * Seamlessly caches to LocalStorage and falls back gracefully.
 */

(function() {
  const STORAGE_KEYS = {
    THEMES: 'codevision_data_themes',
    TEAMS: 'codevision_data_teams',
    COORDINATORS: 'codevision_data_coordinators',
    EVENT_SCHEDULE: 'codevision_data_event_schedule',
    ADMIN_SESSION: 'codevision_admin_session'
  };

  // Supabase Configuration
  const SUPABASE_URL = "https://ezlmspomkhbluxwxpdge.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6bG1zcG9ta2hibHV4d3hwZGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MzA3MTMsImV4cCI6MjEwNjIwNjcxM30.0QL0FlvewJj-mKoUQlhKdcVRxEVmr-Hyt4TIs4iXyTo";

  // BroadcastChannel for instant inter-tab real-time sync
  let broadcastChannel = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannel = new BroadcastChannel('codevision_realtime_bus');
    }
  } catch (e) {
    console.warn("BroadcastChannel not supported", e);
  }

  // Active listeners maps
  const themeListeners = new Set();
  const allTeamsListeners = new Set();
  const coordinatorListeners = new Set();
  const scheduleListeners = new Set();
  const singleTeamListeners = new Map(); // teamId -> Set of callbacks
  const authListeners = new Set();

  // Initial Seed Data — Challenge Themes
  const INITIAL_THEMES = [
    {
      themeId: 'thm_01',
      number: '01',
      title: 'AI-Powered Smart Interfaces',
      description: 'Design intelligent, context-aware web dashboards that predict user intentions and provide reactive conversational experiences.',
      icon: 'brain',
      difficulty: 'Advanced',
      active: true,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      themeId: 'thm_02',
      number: '02',
      title: 'Smart Campus & Student Ecosystem',
      description: 'Architect a unified college portal with interactive schedule tracking, lab slot reservations, and automated peer project submissions.',
      icon: 'building',
      difficulty: 'Intermediate',
      active: true,
      createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
    },
    {
      themeId: 'thm_03',
      number: '03',
      title: 'FinTech & Decentralized Web',
      description: 'Build high-speed financial visualization interfaces with interactive charts, wallet telemetry, and real-time transaction streaming.',
      icon: 'credit-card',
      difficulty: 'Advanced',
      active: true,
      createdAt: new Date(Date.now() - 3600000 * 16).toISOString()
    },
    {
      themeId: 'thm_04',
      number: '04',
      title: 'Sustainable Tomorrow & Green Energy',
      description: 'Craft visually compelling platforms monitoring carbon footprint metrics, campus solar output, and gamified eco-challenges.',
      icon: 'leaf',
      difficulty: 'Intermediate',
      active: true,
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString()
    }
  ];

  // Initial Seed Data — Sample Teams
  const INITIAL_TEAMS = [
    {
      teamId: 'CV26-K9X42',
      teamName: 'ByteCrafters',
      teamLogo: 'CV',
      teamSize: 2,
      leader: {
        name: 'A. Rajesh Kumar',
        email: 'rajesh.bytecraft@gmail.com',
        phone: '9848022334',
        rollNo: '234M1A0501',
        classYear: 'III B.Tech',
        section: 'A'
      },
      member2: {
        name: 'K. Sneha Reddy',
        email: 'sneha.reddy@gmail.com',
        phone: '9848099881',
        rollNo: '234M1A0518',
        classYear: 'III B.Tech',
        section: 'A'
      },
      member1: 'A. Rajesh Kumar',
      rollNo: '234M1A0501',
      classYear: 'III B.Tech',
      section: 'A',
      email: 'rajesh.bytecraft@gmail.com',
      phone: '9848022334',
      college: 'Vemu Institute of Technology',
      department: 'Computer Science & Engineering',
      registrationType: 'ONLINE',
      status: 'CONFIRMED',
      notes: 'Online Verified Registration — CSE Lab 3',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      confirmedAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      teamId: 'CV26-T3M81',
      teamName: 'DevNinjas',
      teamLogo: 'CV',
      teamSize: 1,
      leader: {
        name: 'M. Dinesh Naidu',
        email: 'dinesh.devninjas@gmail.com',
        phone: '9123456789',
        rollNo: '234M1A0535',
        classYear: 'III B.Tech',
        section: 'B'
      },
      member2: null,
      member1: 'M. Dinesh Naidu',
      rollNo: '234M1A0535',
      classYear: 'III B.Tech',
      section: 'B',
      email: 'dinesh.devninjas@gmail.com',
      phone: '9123456789',
      college: 'Vemu Institute of Technology',
      department: 'Computer Science & Engineering',
      registrationType: 'ONLINE',
      status: 'CONFIRMED',
      notes: 'Solo Participant — CSE Lab 3',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      confirmedAt: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      teamId: 'CV26-W5Z19',
      teamName: 'PixelPioneers',
      teamLogo: 'CV',
      teamSize: 2,
      leader: {
        name: 'R. Tarun Teja',
        email: 'tarun.pixel@gmail.com',
        phone: '9876543210',
        rollNo: '244M1A0562',
        classYear: 'II B.Tech',
        section: 'A'
      },
      member2: {
        name: 'S. Bhavana',
        email: 'bhavana.pixel@gmail.com',
        phone: '9876509876',
        rollNo: '244M1A0570',
        classYear: 'II B.Tech',
        section: 'A'
      },
      member1: 'R. Tarun Teja',
      rollNo: '244M1A0562',
      classYear: 'II B.Tech',
      section: 'A',
      email: 'tarun.pixel@gmail.com',
      phone: '9876543210',
      college: 'Vemu Institute of Technology',
      department: 'Computer Science & Engineering',
      registrationType: 'SPOT',
      status: 'CONFIRMED',
      notes: 'Spot Walk-in Registration — CSE Lab 4',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      confirmedAt: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ];

  // Initial Seed Data — Event Coordinators
  const INITIAL_COORDINATORS = [
    {
      coordId: 'CV26-CRD-101',
      name: 'Prof. M. Sandhya',
      role: 'Faculty Coordinator',
      designation: 'Associate Professor, Dept of CSE',
      department: 'Computer Science & Engineering',
      email: 'sandhya.cse@vemu.org',
      phone: '9440123456',
      rollOrEmpId: 'EMP-CSE-108',
      desk: 'Control Room — CSE Lab 3',
      avatar: 'CV',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    {
      coordId: 'CV26-CRD-102',
      name: 'P. Sai Teja',
      role: 'Student Lead Coordinator',
      designation: 'IV B.Tech Student Lead',
      department: 'Computer Science & Engineering',
      email: 'saiteja.lead@gmail.com',
      phone: '9988776655',
      rollOrEmpId: '224M1A0542',
      desk: 'Stage & Challenge Operations',
      avatar: 'CV',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      coordId: 'CV26-CRD-103',
      name: 'V. Keerthi',
      role: 'Technical Operations Lead',
      designation: 'Technical Head & Systems Chair',
      department: 'Computer Science & Engineering',
      email: 'keerthi.tech@gmail.com',
      phone: '9876501234',
      rollOrEmpId: '224M1A0560',
      desk: 'Lab Network & Workstations Desk',
      avatar: 'CV',
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
    },
    {
      coordId: 'CV26-CRD-104',
      name: 'K. Lokesh',
      role: 'Registration & Gate Lead',
      designation: 'Discipline & Gate Verification',
      department: 'Computer Science & Engineering',
      email: 'lokesh.gate@gmail.com',
      phone: '9701234567',
      rollOrEmpId: '234M1A0522',
      desk: 'Seminar Hall Entrance Gate',
      avatar: 'CV',
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString()
    }
  ];

  // Default Event Schedule
  const DEFAULT_EVENT_SCHEDULE = {
    eventDate: '2026-10-24',
    eventDateFormatted: 'Saturday, Oct 24, 2026',
    startTime: '10:00',
    startTimeFormatted: '10:00 AM',
    endTime: '15:00',
    endTimeFormatted: '03:00 PM',
    durationHours: 5,
    reportingTime: '09:30',
    reportingTimeFormatted: '09:30 AM',
    venue: 'CSE Labs, Vemu IT',
    updatedAt: new Date().toISOString()
  };

  // Initialize localStorage if empty
  function initLocalStorageData() {
    if (!localStorage.getItem(STORAGE_KEYS.THEMES)) {
      localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(INITIAL_THEMES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(INITIAL_TEAMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COORDINATORS)) {
      localStorage.setItem(STORAGE_KEYS.COORDINATORS, JSON.stringify(INITIAL_COORDINATORS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENT_SCHEDULE)) {
      localStorage.setItem(STORAGE_KEYS.EVENT_SCHEDULE, JSON.stringify(DEFAULT_EVENT_SCHEDULE));
    }
  }
  initLocalStorageData();

  // Storage getters/setters
  function getStoredThemes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.THEMES);
      return raw ? JSON.parse(raw) : INITIAL_THEMES;
    } catch (e) {
      return INITIAL_THEMES;
    }
  }

  function saveStoredThemes(themes) {
    localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(themes));
  }

  function getStoredTeams() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TEAMS);
      return raw ? JSON.parse(raw) : INITIAL_TEAMS;
    } catch (e) {
      return INITIAL_TEAMS;
    }
  }

  function saveStoredTeams(teams) {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  }

  function getStoredCoordinators() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COORDINATORS);
      return raw ? JSON.parse(raw) : INITIAL_COORDINATORS;
    } catch (e) {
      return INITIAL_COORDINATORS;
    }
  }

  function saveStoredCoordinators(coords) {
    localStorage.setItem(STORAGE_KEYS.COORDINATORS, JSON.stringify(coords));
  }

  function formatScheduleObject(input) {
    if (!input) return DEFAULT_EVENT_SCHEDULE;
    const eventDate = input.eventDate || input.event_date || '2026-10-24';
    const startTime = input.startTime || input.start_time || '10:00';
    let durationHours = parseFloat(input.durationHours || input.duration_hours);
    if (isNaN(durationHours) || durationHours <= 0) durationHours = 5;

    let endTime = input.endTime || input.end_time;
    if (!endTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const totalMinutes = (sh * 60 + sm) + Math.round(durationHours * 60);
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }

    let reportingTime = input.reportingTime || input.reporting_time;
    if (!reportingTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const repMinutes = (sh * 60 + sm) - 30;
      const repH = Math.floor((repMinutes < 0 ? repMinutes + 1440 : repMinutes) / 60) % 24;
      const repM = (repMinutes < 0 ? repMinutes + 1440 : repMinutes) % 60;
      reportingTime = `${String(repH).padStart(2, '0')}:${String(repM).padStart(2, '0')}`;
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [y, m, d] = eventDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const eventDateFormatted = !isNaN(dateObj.getTime())
      ? `${days[dateObj.getDay()]}, ${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`
      : (input.eventDateFormatted || input.event_date_formatted || eventDate);

    function to12Hr(tStr) {
      if (!tStr) return '';
      const [h, min] = tStr.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${period}`;
    }

    return {
      eventDate,
      eventDateFormatted,
      startTime,
      startTimeFormatted: input.startTimeFormatted || input.start_time_formatted || to12Hr(startTime),
      endTime,
      endTimeFormatted: input.endTimeFormatted || input.end_time_formatted || to12Hr(endTime),
      durationHours,
      reportingTime,
      reportingTimeFormatted: input.reportingTimeFormatted || input.reporting_time_formatted || to12Hr(reportingTime),
      venue: input.venue || 'CSE Labs, Vemu IT',
      updatedAt: new Date().toISOString()
    };
  }

  function getStoredSchedule() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EVENT_SCHEDULE);
      if (raw) return formatScheduleObject(JSON.parse(raw));
    } catch (e) {}
    return DEFAULT_EVENT_SCHEDULE;
  }

  function saveStoredSchedule(schedule) {
    localStorage.setItem(STORAGE_KEYS.EVENT_SCHEDULE, JSON.stringify(schedule));
  }

  // Realtime notification dispatcher
  function notifyChange(type, payload = {}) {
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type, payload });
      } catch (e) {
        console.warn("Broadcast error", e);
      }
    }
    handleRealtimeEvent(type, payload);
  }

  function handleRealtimeEvent(type, payload) {
    if (type.startsWith('THEME_')) {
      const themes = getStoredThemes();
      themeListeners.forEach(cb => {
        try { cb(themes); } catch (e) { console.error(e); }
      });
    }

    if (type.startsWith('TEAM_') || type.startsWith('STATUS_')) {
      const teams = getStoredTeams();
      allTeamsListeners.forEach(cb => {
        try { cb(teams); } catch (e) { console.error(e); }
      });

      if (payload && payload.teamId && singleTeamListeners.has(payload.teamId.toUpperCase())) {
        const team = teams.find(t => t.teamId.toUpperCase() === payload.teamId.toUpperCase());
        singleTeamListeners.get(payload.teamId.toUpperCase()).forEach(cb => {
          try { cb(team); } catch (e) { console.error(e); }
        });
      }
    }

    if (type.startsWith('COORD_')) {
      const coords = getStoredCoordinators();
      coordinatorListeners.forEach(cb => {
        try { cb(coords); } catch (e) { console.error(e); }
      });
    }

    if (type.startsWith('SCHEDULE_')) {
      const schedule = getStoredSchedule();
      scheduleListeners.forEach(cb => {
        try { cb(schedule); } catch (e) { console.error(e); }
      });
    }
  }

  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type) handleRealtimeEvent(type, payload);
    };
  }

  // ==============================================================================
  // SUPABASE REST CLIENT & DATA MAPPERS
  // ==============================================================================
  async function supabaseRequest(endpoint, method = 'GET', body = null, headers = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const reqHeaders = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      ...headers
    };
    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      reqHeaders['Content-Type'] = 'application/json';
      if (!reqHeaders['Prefer']) {
        reqHeaders['Prefer'] = 'return=representation';
      }
    }

    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : null
    });

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.message) errorMsg = errJson.message;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  // Mappers: Teams
  function teamToSupabaseRow(t) {
    const leaderName = (t.leader ? t.leader.name : t.member1) || '';
    const leaderEmail = (t.leader ? t.leader.email : t.email) || '';
    const leaderPhone = (t.leader ? t.leader.phone : t.phone) || '';
    const leaderRollNo = (t.leader ? t.leader.rollNo : t.rollNo) || '';
    const leaderClassYear = (t.leader ? t.leader.classYear : t.classYear) || 'III B.Tech';
    const leaderSection = (t.leader ? t.leader.section : t.section) || 'A';
    const m2 = t.member2;

    return {
      team_id: t.teamId,
      team_name: (t.teamName || '').trim(),
      team_logo: t.teamLogo || 'CV',
      team_size: Number(t.teamSize || (m2 ? 2 : 1)),
      leader_name: leaderName.trim(),
      leader_email: leaderEmail.trim().toLowerCase(),
      leader_phone: leaderPhone.trim(),
      leader_roll_no: leaderRollNo.trim().toUpperCase(),
      leader_class_year: leaderClassYear.trim(),
      leader_section: leaderSection.trim().toUpperCase(),
      leader_photo_url: t.leaderPhotoUrl || (t.leader && t.leader.photoUrl) || null,
      member2_name: m2 ? (typeof m2 === 'object' ? (m2.name || '') : String(m2)).trim() : null,
      member2_email: m2 && typeof m2 === 'object' && m2.email ? m2.email.trim().toLowerCase() : null,
      member2_phone: m2 && typeof m2 === 'object' && m2.phone ? m2.phone.trim() : null,
      member2_roll_no: m2 && typeof m2 === 'object' && m2.rollNo ? m2.rollNo.trim().toUpperCase() : null,
      member2_class_year: m2 && typeof m2 === 'object' && m2.classYear ? m2.classYear.trim() : null,
      member2_section: m2 && typeof m2 === 'object' && m2.section ? m2.section.trim().toUpperCase() : null,
      member2_photo_url: t.member2PhotoUrl || (m2 && m2.photoUrl) || null,
      college: (t.college || 'Vemu Institute of Technology').trim(),
      department: (t.department || 'Computer Science & Engineering').trim(),
      registration_type: t.registrationType || 'ONLINE',
      status: t.status || 'CONFIRMED',
      notes: t.notes || (t.registrationType === 'SPOT' ? 'Spot Registration at Help Desk' : 'Online Registration Confirmed'),
      created_at: t.createdAt || new Date().toISOString(),
      confirmed_at: t.confirmedAt || new Date().toISOString()
    };
  }

  function supabaseRowToTeam(r) {
    return {
      teamId: r.team_id,
      teamName: r.team_name,
      teamLogo: r.team_logo || 'CV',
      teamSize: Number(r.team_size || 1),
      leader: {
        name: r.leader_name || '',
        email: r.leader_email || '',
        phone: r.leader_phone || '',
        rollNo: r.leader_roll_no || '',
        classYear: r.leader_class_year || 'III B.Tech',
        section: r.leader_section || 'A',
        photoUrl: r.leader_photo_url || null
      },
      member2: r.member2_name ? {
        name: r.member2_name || '',
        email: r.member2_email || '',
        phone: r.member2_phone || '',
        rollNo: r.member2_roll_no || '',
        classYear: r.member2_class_year || 'III B.Tech',
        section: r.member2_section || 'A',
        photoUrl: r.member2_photo_url || null
      } : null,
      member1: r.leader_name || '',
      rollNo: r.leader_roll_no || '',
      classYear: r.leader_class_year || 'III B.Tech',
      section: r.leader_section || 'A',
      email: r.leader_email || '',
      phone: r.leader_phone || '',
      college: r.college || 'Vemu Institute of Technology',
      department: r.department || 'Computer Science & Engineering',
      registrationType: r.registration_type || 'ONLINE',
      status: r.status || 'CONFIRMED',
      notes: r.notes || '',
      leaderPhotoUrl: r.leader_photo_url || null,
      member2PhotoUrl: r.member2_photo_url || null,
      createdAt: r.created_at,
      confirmedAt: r.confirmed_at
    };
  }

  // Mappers: Coordinators
  function coordToSupabaseRow(c) {
    return {
      coord_id: c.coordId,
      name: (c.name || '').trim(),
      role: (c.role || 'Event Coordinator').trim(),
      designation: (c.designation || 'Student Coordinator').trim(),
      department: (c.department || 'Computer Science & Engineering').trim(),
      email: (c.email || '').trim().toLowerCase(),
      phone: (c.phone || '').trim(),
      roll_or_emp_id: (c.rollOrEmpId || '').trim().toUpperCase(),
      desk: (c.desk || 'General Help Desk').trim(),
      avatar: c.avatar || 'CV',
      image_url: c.imageUrl || (c.avatar && (c.avatar.startsWith('http') || c.avatar.startsWith('data:')) ? c.avatar : null),
      bio: c.bio || '',
      github_url: c.githubUrl || null,
      linkedin_url: c.linkedinUrl || null,
      display_order: Number(c.displayOrder || 0),
      created_at: c.createdAt || new Date().toISOString()
    };
  }

  function supabaseRowToCoord(r) {
    return {
      coordId: r.coord_id,
      name: r.name,
      role: r.role,
      designation: r.designation,
      department: r.department,
      email: r.email,
      phone: r.phone,
      rollOrEmpId: r.roll_or_emp_id,
      desk: r.desk,
      avatar: r.image_url || r.avatar || 'CV',
      imageUrl: r.image_url || null,
      bio: r.bio || '',
      githubUrl: r.github_url || null,
      linkedinUrl: r.linkedin_url || null,
      displayOrder: r.display_order || 0,
      createdAt: r.created_at
    };
  }

  // Mappers: Themes
  function themeToSupabaseRow(t) {
    return {
      theme_id: t.themeId,
      number: t.number || '',
      title: t.title || '',
      description: t.description || '',
      icon: t.icon || 'code',
      difficulty: t.difficulty || 'Intermediate',
      active: t.active !== false,
      created_at: t.createdAt || new Date().toISOString()
    };
  }

  function supabaseRowToTheme(r) {
    return {
      themeId: r.theme_id,
      number: r.number,
      title: r.title,
      description: r.description,
      icon: r.icon,
      difficulty: r.difficulty,
      active: Boolean(r.active),
      createdAt: r.created_at
    };
  }

  // Mappers: Event Schedule
  function scheduleToSupabaseRow(s) {
    return {
      id: 'current',
      event_date: s.eventDate || '2026-10-24',
      event_date_formatted: s.eventDateFormatted || 'Saturday, Oct 24, 2026',
      start_time: s.startTime || '10:00',
      start_time_formatted: s.startTimeFormatted || '10:00 AM',
      end_time: s.endTime || '15:00',
      end_time_formatted: s.endTimeFormatted || '03:00 PM',
      duration_hours: Number(s.durationHours || 5),
      reporting_time: s.reportingTime || '09:30',
      reporting_time_formatted: s.reportingTimeFormatted || '09:30 AM',
      venue: s.venue || 'CSE Labs, Vemu IT',
      updated_at: new Date().toISOString()
    };
  }

  function supabaseRowToSchedule(r) {
    return formatScheduleObject({
      eventDate: r.event_date,
      eventDateFormatted: r.event_date_formatted,
      startTime: r.start_time,
      startTimeFormatted: r.start_time_formatted,
      endTime: r.end_time,
      endTimeFormatted: r.end_time_formatted,
      durationHours: Number(r.duration_hours || 5),
      reportingTime: r.reporting_time,
      reportingTimeFormatted: r.reporting_time_formatted,
      venue: r.venue,
      updatedAt: r.updated_at
    });
  }

  // Realtime subscription starter
  let realtimeSubscribed = false;
  function initSupabaseRealtime() {
    if (realtimeSubscribed) return;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        client.channel('public_codevision_realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, async () => {
            await DB.getAllTeams();
            notifyChange('TEAM_SYNC', {});
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'coordinators' }, async () => {
            await DB.getCoordinators();
            notifyChange('COORD_SYNC', {});
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'themes' }, async () => {
            await DB.getThemes();
            notifyChange('THEME_SYNC', {});
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'event_schedule' }, async () => {
            await DB.getEventSchedule();
            notifyChange('SCHEDULE_SYNC', {});
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              realtimeSubscribed = true;
            }
          });
      } catch (e) {
        console.warn("Could not attach Supabase Realtime", e);
      }
    }
  }

  if (typeof window !== 'undefined') {
    setTimeout(initSupabaseRealtime, 800);
  }

  // ==============================================================================
  // PUBLIC DATABASE API (DIRECT SUPABASE CRUD)
  // ==============================================================================
  const DB = {
    // ----------------------------------------
    // 1. THEMES CRUD
    // ----------------------------------------
    async getThemes(onlyActive = true) {
      try {
        const rows = await supabaseRequest('themes?select=*&order=number.asc');
        if (Array.isArray(rows) && rows.length > 0) {
          const list = rows.map(supabaseRowToTheme);
          saveStoredThemes(list);
          return onlyActive ? list.filter(t => t.active !== false) : list;
        }
      } catch (err) {
        console.warn("Supabase getThemes error, using local cache:", err.message);
      }

      let list = getStoredThemes();
      if (onlyActive) list = list.filter(t => t.active !== false);
      return list.sort((a, b) => (a.number || '').localeCompare(b.number || ''));
    },

    onThemesChange(callback, onlyActive = true) {
      themeListeners.add(callback);
      DB.getThemes(onlyActive).then(themes => callback(themes));
      return () => themeListeners.delete(callback);
    },

    async addTheme(themeData) {
      const themeId = 'thm_' + Date.now().toString(36);
      const newTheme = {
        themeId,
        number: themeData.number || String(getStoredThemes().length + 1).padStart(2, '0'),
        title: themeData.title,
        description: themeData.description,
        icon: themeData.icon || 'code',
        difficulty: themeData.difficulty || 'Intermediate',
        active: themeData.active !== false,
        createdAt: new Date().toISOString()
      };

      try {
        await supabaseRequest('themes', 'POST', themeToSupabaseRow(newTheme));
      } catch (err) {
        console.warn("Supabase addTheme error:", err.message);
      }

      const themes = getStoredThemes();
      themes.push(newTheme);
      saveStoredThemes(themes);
      notifyChange('THEME_ADDED', { theme: newTheme });
      return newTheme;
    },

    async updateTheme(themeId, updates) {
      try {
        const rowUpdates = {};
        if (updates.title !== undefined) rowUpdates.title = updates.title;
        if (updates.description !== undefined) rowUpdates.description = updates.description;
        if (updates.icon !== undefined) rowUpdates.icon = updates.icon;
        if (updates.difficulty !== undefined) rowUpdates.difficulty = updates.difficulty;
        if (updates.active !== undefined) rowUpdates.active = updates.active;
        if (updates.number !== undefined) rowUpdates.number = updates.number;

        await supabaseRequest(`themes?theme_id=eq.${encodeURIComponent(themeId)}`, 'PATCH', rowUpdates);
      } catch (err) {
        console.warn("Supabase updateTheme error:", err.message);
      }

      const themes = getStoredThemes();
      const index = themes.findIndex(t => t.themeId === themeId);
      if (index !== -1) {
        themes[index] = { ...themes[index], ...updates };
        saveStoredThemes(themes);
        notifyChange('THEME_UPDATED', { themeId, theme: themes[index] });
        return themes[index];
      }
      throw new Error("Theme not found");
    },

    async deleteTheme(themeId) {
      try {
        await supabaseRequest(`themes?theme_id=eq.${encodeURIComponent(themeId)}`, 'DELETE');
      } catch (err) {
        console.warn("Supabase deleteTheme error:", err.message);
      }

      const themes = getStoredThemes().filter(t => t.themeId !== themeId);
      saveStoredThemes(themes);
      notifyChange('THEME_DELETED', { themeId });
      return true;
    },

    // ----------------------------------------
    // 2. TEAMS CRUD (Online & Spot Registrations)
    // ----------------------------------------
    async registerTeam(teamData) {
      const teamId = window.CodevisionUtils ? window.CodevisionUtils.generateTeamId() : 'CV26-' + Math.random().toString(36).substr(2, 5).toUpperCase();
      
      const teamSize = Number(teamData.teamSize || (teamData.member2 ? 2 : 1));
      const leaderName = (teamData.leader ? teamData.leader.name : teamData.member1) || '';
      const leaderEmail = (teamData.leader ? teamData.leader.email : teamData.email) || '';
      const leaderPhone = (teamData.leader ? teamData.leader.phone : teamData.phone) || '';
      const leaderRollNo = (teamData.leader ? teamData.leader.rollNo : teamData.rollNo) || '';
      const leaderClassYear = (teamData.leader ? teamData.leader.classYear : teamData.classYear) || 'III B.Tech';
      const leaderSection = (teamData.leader ? teamData.leader.section : teamData.section) || 'A';

      const member2Obj = (teamSize === 2 && teamData.member2) ? {
        name: typeof teamData.member2 === 'object' ? (teamData.member2.name || '') : String(teamData.member2),
        email: typeof teamData.member2 === 'object' ? (teamData.member2.email || '') : '',
        phone: typeof teamData.member2 === 'object' ? (teamData.member2.phone || '') : '',
        rollNo: typeof teamData.member2 === 'object' ? (teamData.member2.rollNo || '') : '',
        classYear: typeof teamData.member2 === 'object' ? (teamData.member2.classYear || leaderClassYear) : leaderClassYear,
        section: typeof teamData.member2 === 'object' ? (teamData.member2.section || leaderSection) : leaderSection
      } : null;

      const record = {
        teamId,
        teamName: (teamData.teamName || '').trim(),
        teamLogo: teamData.teamLogo || 'CV',
        teamSize,
        leader: {
          name: leaderName.trim(),
          email: leaderEmail.trim().toLowerCase(),
          phone: leaderPhone.trim(),
          rollNo: leaderRollNo.trim().toUpperCase(),
          classYear: leaderClassYear.trim(),
          section: leaderSection.trim().toUpperCase(),
          photoUrl: teamData.leaderPhotoUrl || null
        },
        member2: member2Obj ? {
          name: member2Obj.name.trim(),
          email: member2Obj.email.trim().toLowerCase(),
          phone: member2Obj.phone.trim(),
          rollNo: member2Obj.rollNo.trim().toUpperCase(),
          classYear: member2Obj.classYear.trim(),
          section: member2Obj.section.trim().toUpperCase(),
          photoUrl: teamData.member2PhotoUrl || null
        } : null,
        member1: leaderName.trim(),
        rollNo: leaderRollNo.trim().toUpperCase(),
        classYear: leaderClassYear.trim(),
        section: leaderSection.trim().toUpperCase(),
        email: leaderEmail.trim().toLowerCase(),
        phone: leaderPhone.trim(),
        college: (teamData.college || 'Vemu Institute of Technology').trim(),
        department: (teamData.department || 'Computer Science & Engineering').trim(),
        registrationType: teamData.registrationType || 'ONLINE',
        status: 'CONFIRMED',
        notes: teamData.notes || (teamData.registrationType === 'SPOT' ? 'Spot Registration at Help Desk' : 'Online Registration Confirmed'),
        leaderPhotoUrl: teamData.leaderPhotoUrl || null,
        member2PhotoUrl: teamData.member2PhotoUrl || null,
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString()
      };

      // Direct write to Supabase
      try {
        await supabaseRequest('teams', 'POST', teamToSupabaseRow(record));
      } catch (err) {
        console.warn("Supabase registerTeam error, saving locally:", err.message);
      }

      const teams = getStoredTeams();
      teams.unshift(record);
      saveStoredTeams(teams);
      notifyChange('TEAM_REGISTERED', { teamId, team: record });
      return record;
    },

    async getTeamById(teamId) {
      if (!teamId) return null;
      const targetId = teamId.trim().toUpperCase();

      try {
        const rows = await supabaseRequest(`teams?team_id=ilike.${encodeURIComponent(targetId)}&select=*`);
        if (Array.isArray(rows) && rows.length > 0) {
          const team = supabaseRowToTeam(rows[0]);
          return team;
        }
      } catch (err) {
        console.warn("Supabase getTeamById error:", err.message);
      }

      const teams = getStoredTeams();
      return teams.find(t => t.teamId.toUpperCase() === targetId) || null;
    },

    async getTeamByEmailOrId(query) {
      if (!query) return null;
      const q = query.trim().toLowerCase();

      try {
        const rows = await supabaseRequest(
          `teams?or=(team_id.ilike.${encodeURIComponent(q)},leader_email.ilike.${encodeURIComponent(q)},leader_roll_no.ilike.${encodeURIComponent(q)},member2_roll_no.ilike.${encodeURIComponent(q)})&select=*`
        );
        if (Array.isArray(rows) && rows.length > 0) {
          return supabaseRowToTeam(rows[0]);
        }
      } catch (err) {
        console.warn("Supabase getTeamByEmailOrId error:", err.message);
      }

      const teams = getStoredTeams();
      return teams.find(t => 
        (t.email && t.email.toLowerCase() === q) ||
        (t.teamId && t.teamId.toLowerCase() === q) ||
        (t.leader && t.leader.rollNo && t.leader.rollNo.toLowerCase() === q) ||
        (t.rollNo && t.rollNo.toLowerCase() === q) ||
        (t.member2 && t.member2.rollNo && t.member2.rollNo.toLowerCase() === q)
      ) || null;
    },

    onTeamChange(teamId, callback) {
      if (!teamId) return () => {};
      const tid = teamId.trim().toUpperCase();

      if (!singleTeamListeners.has(tid)) {
        singleTeamListeners.set(tid, new Set());
      }
      singleTeamListeners.get(tid).add(callback);

      DB.getTeamById(tid).then(t => {
        if (t) callback(t);
      });

      return () => {
        const set = singleTeamListeners.get(tid);
        if (set) set.delete(callback);
      };
    },

    async getAllTeams() {
      try {
        const rows = await supabaseRequest('teams?select=*&order=created_at.desc');
        if (Array.isArray(rows) && rows.length > 0) {
          const list = rows.map(supabaseRowToTeam);
          saveStoredTeams(list);
          return list;
        }
      } catch (err) {
        console.warn("Supabase getAllTeams error, using local cache:", err.message);
      }

      return getStoredTeams().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    onAllTeamsChange(callback) {
      allTeamsListeners.add(callback);
      DB.getAllTeams().then(teams => callback(teams));
      return () => allTeamsListeners.delete(callback);
    },

    async updateTeam(teamId, updates) {
      try {
        const rowUpdates = {};
        if (updates.teamName !== undefined) rowUpdates.team_name = updates.teamName;
        if (updates.teamLogo !== undefined) rowUpdates.team_logo = updates.teamLogo;
        if (updates.status !== undefined) rowUpdates.status = updates.status;
        if (updates.notes !== undefined) rowUpdates.notes = updates.notes;
        if (updates.leaderPhotoUrl !== undefined) rowUpdates.leader_photo_url = updates.leaderPhotoUrl;
        if (updates.member2PhotoUrl !== undefined) rowUpdates.member2_photo_url = updates.member2PhotoUrl;

        await supabaseRequest(`teams?team_id=ilike.${encodeURIComponent(teamId)}`, 'PATCH', rowUpdates);
      } catch (err) {
        console.warn("Supabase updateTeam error:", err.message);
      }

      const teams = getStoredTeams();
      const index = teams.findIndex(t => t.teamId.toUpperCase() === teamId.toUpperCase());
      if (index !== -1) {
        teams[index] = { ...teams[index], ...updates };
        saveStoredTeams(teams);
        notifyChange('TEAM_UPDATED', { teamId, team: teams[index] });
        return teams[index];
      }
      throw new Error("Team not found");
    },

    async deleteTeam(teamId) {
      try {
        await supabaseRequest(`teams?team_id=ilike.${encodeURIComponent(teamId)}`, 'DELETE');
      } catch (err) {
        console.warn("Supabase deleteTeam error:", err.message);
      }

      const teams = getStoredTeams().filter(t => t.teamId.toUpperCase() !== teamId.toUpperCase());
      saveStoredTeams(teams);
      notifyChange('TEAM_DELETED', { teamId });
      return true;
    },

    // ----------------------------------------
    // 3. EVENT COORDINATORS & TEAM PROFILES CRUD
    // ----------------------------------------
    async getCoordinators() {
      try {
        const rows = await supabaseRequest('coordinators?select=*&order=display_order.asc');
        if (Array.isArray(rows) && rows.length > 0) {
          const list = rows.map(supabaseRowToCoord);
          saveStoredCoordinators(list);
          return list;
        }
      } catch (err) {
        console.warn("Supabase getCoordinators error, using local cache:", err.message);
      }

      return getStoredCoordinators().sort((a, b) => (a.coordId || '').localeCompare(b.coordId || ''));
    },

    onCoordinatorsChange(callback) {
      coordinatorListeners.add(callback);
      DB.getCoordinators().then(coords => callback(coords));
      return () => coordinatorListeners.delete(callback);
    },

    async addCoordinator(coordData) {
      const coordId = window.CodevisionUtils ? window.CodevisionUtils.generateCoordinatorId() : 'CV26-CRD-' + Math.floor(100 + Math.random() * 900);
      const newCoord = {
        coordId,
        name: (coordData.name || '').trim(),
        role: (coordData.role || 'Event Coordinator').trim(),
        designation: (coordData.designation || 'Student Coordinator').trim(),
        department: (coordData.department || 'Computer Science & Engineering').trim(),
        email: (coordData.email || '').trim().toLowerCase(),
        phone: (coordData.phone || '').trim(),
        rollOrEmpId: (coordData.rollOrEmpId || '').trim().toUpperCase(),
        desk: (coordData.desk || 'General Help Desk').trim(),
        avatar: coordData.avatar || 'CV',
        imageUrl: coordData.imageUrl || (coordData.avatar && (coordData.avatar.startsWith('http') || coordData.avatar.startsWith('data:')) ? coordData.avatar : null),
        bio: coordData.bio || '',
        githubUrl: coordData.githubUrl || null,
        linkedinUrl: coordData.linkedinUrl || null,
        displayOrder: Number(coordData.displayOrder || (getStoredCoordinators().length + 1)),
        createdAt: new Date().toISOString()
      };

      try {
        await supabaseRequest('coordinators', 'POST', coordToSupabaseRow(newCoord));
      } catch (err) {
        console.warn("Supabase addCoordinator error:", err.message);
      }

      const coords = getStoredCoordinators();
      coords.push(newCoord);
      saveStoredCoordinators(coords);
      notifyChange('COORD_ADDED', { coord: newCoord });
      return newCoord;
    },

    async updateCoordinator(coordId, updates) {
      try {
        const rowUpdates = {};
        if (updates.name !== undefined) rowUpdates.name = updates.name;
        if (updates.role !== undefined) rowUpdates.role = updates.role;
        if (updates.designation !== undefined) rowUpdates.designation = updates.designation;
        if (updates.department !== undefined) rowUpdates.department = updates.department;
        if (updates.email !== undefined) rowUpdates.email = updates.email;
        if (updates.phone !== undefined) rowUpdates.phone = updates.phone;
        if (updates.rollOrEmpId !== undefined) rowUpdates.roll_or_emp_id = updates.rollOrEmpId;
        if (updates.desk !== undefined) rowUpdates.desk = updates.desk;
        if (updates.avatar !== undefined) rowUpdates.avatar = updates.avatar;
        if (updates.imageUrl !== undefined) rowUpdates.image_url = updates.imageUrl;

        await supabaseRequest(`coordinators?coord_id=ilike.${encodeURIComponent(coordId)}`, 'PATCH', rowUpdates);
      } catch (err) {
        console.warn("Supabase updateCoordinator error:", err.message);
      }

      const coords = getStoredCoordinators();
      const index = coords.findIndex(c => c.coordId.toUpperCase() === coordId.toUpperCase());
      if (index !== -1) {
        coords[index] = { ...coords[index], ...updates };
        saveStoredCoordinators(coords);
        notifyChange('COORD_UPDATED', { coordId, coord: coords[index] });
        return coords[index];
      }
      throw new Error("Coordinator not found");
    },

    async deleteCoordinator(coordId) {
      try {
        await supabaseRequest(`coordinators?coord_id=ilike.${encodeURIComponent(coordId)}`, 'DELETE');
      } catch (err) {
        console.warn("Supabase deleteCoordinator error:", err.message);
      }

      const coords = getStoredCoordinators().filter(c => c.coordId.toUpperCase() !== coordId.toUpperCase());
      saveStoredCoordinators(coords);
      notifyChange('COORD_DELETED', { coordId });
      return true;
    },

    async getCoordinatorById(query) {
      if (!query) return null;
      const q = query.trim().toLowerCase();
      const coords = await DB.getCoordinators();
      return coords.find(c => 
        (c.coordId && c.coordId.toLowerCase() === q) ||
        (c.email && c.email.toLowerCase() === q) ||
        (c.rollOrEmpId && c.rollOrEmpId.toLowerCase() === q) ||
        (c.phone && c.phone === q)
      ) || null;
    },

    // ----------------------------------------
    // 4. STATS METRICS
    // ----------------------------------------
    async getStats() {
      const teams = await DB.getAllTeams();
      const coords = await DB.getCoordinators();
      const totalTeams = teams.length;
      const onlineTeams = teams.filter(t => (t.registrationType || 'ONLINE') === 'ONLINE').length;
      const spotTeams = teams.filter(t => (t.registrationType || '').toUpperCase() === 'SPOT').length;
      const totalCoordinators = coords.length;

      return { totalTeams, onlineTeams, spotTeams, totalCoordinators };
    },

    // ----------------------------------------
    // 5. ADMIN AUTHENTICATION
    // ----------------------------------------
    async loginAdmin(username, password) {
      const cleanUser = String(username || '').trim().toLowerCase();
      const cleanPass = String(password || '').trim();

      if ((cleanUser === 'codevision' || cleanUser === 'codevision@vemu.org' || cleanUser === 'codevision@codevision.edu') && cleanPass === 'codevision2026') {
        const session = {
          uid: 'adm_codevision_main',
          username: 'codevision',
          email: 'codevision@vemu.org',
          displayName: 'Codevision Admin',
          role: 'Administrator',
          provider: 'local',
          loginAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
        authListeners.forEach(cb => cb(session));
        return { success: true, admin: session };
      }

      return {
        success: false,
        error: 'Invalid credentials. Please enter username: codevision and password: codevision2026'
      };
    },

    getCurrentAdmin() {
      try {
        const session = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
        return session ? JSON.parse(session) : null;
      } catch (e) {
        return null;
      }
    },

    async logoutAdmin() {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      authListeners.forEach(cb => cb(null));
      return true;
    },

    onAdminAuthChange(callback) {
      authListeners.add(callback);
      callback(DB.getCurrentAdmin());
      return () => authListeners.delete(callback);
    },

    // ----------------------------------------
    // 6. EVENT SCHEDULE & TIMINGS CRUD
    // ----------------------------------------
    async getEventSchedule() {
      try {
        const rows = await supabaseRequest('event_schedule?id=eq.current&select=*');
        if (Array.isArray(rows) && rows.length > 0) {
          const sched = supabaseRowToSchedule(rows[0]);
          saveStoredSchedule(sched);
          return sched;
        }
      } catch (err) {
        console.warn("Supabase getEventSchedule error, using local cache:", err.message);
      }
      return getStoredSchedule();
    },

    async updateEventSchedule(newSchedule) {
      const formatted = formatScheduleObject(newSchedule);
      saveStoredSchedule(formatted);

      try {
        await supabaseRequest('event_schedule', 'POST', scheduleToSupabaseRow(formatted), {
          'Prefer': 'resolution=merge-duplicates,return=representation'
        });
      } catch (err) {
        console.warn("Supabase updateEventSchedule error:", err.message);
      }

      notifyChange('SCHEDULE_UPDATED', formatted);
      return formatted;
    },

    onEventScheduleChange(callback) {
      scheduleListeners.add(callback);
      DB.getEventSchedule().then(sched => callback(sched));
      return () => scheduleListeners.delete(callback);
    },

    // Reset helper
    resetToDefaults() {
      localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(INITIAL_THEMES));
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(INITIAL_TEAMS));
      localStorage.setItem(STORAGE_KEYS.COORDINATORS, JSON.stringify(INITIAL_COORDINATORS));
      localStorage.setItem(STORAGE_KEYS.EVENT_SCHEDULE, JSON.stringify(DEFAULT_EVENT_SCHEDULE));
      notifyChange('THEME_RESET', {});
      notifyChange('TEAM_RESET', {});
      notifyChange('COORD_RESET', {});
      notifyChange('SCHEDULE_UPDATED', DEFAULT_EVENT_SCHEDULE);
      return true;
    }
  };

  // Expose globally
  window.CodevisionDB = DB;
})();
