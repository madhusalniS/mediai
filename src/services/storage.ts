import { LiveCounters, RegisteredPerson, SecurityAlert, ZoneId } from '../types';

const STORAGE_KEY_PERSONS = 'mediguard_registered_persons_v2';
const STORAGE_KEY_SESSION_UNKNOWNS = 'mediguard_session_unknowns_v2';
const STORAGE_KEY_ALERTS = 'mediguard_alerts_v2';
const STORAGE_KEY_THEME = 'mediguard_theme_mode';

export const SAMPLE_IMAGES = [
  {
    id: 'icu_unauthorized',
    title: 'ICU Doorway (Unknown Visitor Test)',
    zone: 'icu' as ZoneId,
    description: 'Unverified individual at ICU perimeter doors. Tests restricted perimeter security alert.',
    path: '/src/assets/images/hospital_unauthorized_visitor_1793255801610.jpg',
  },
  {
    id: 'reception_visitor',
    title: 'Reception Desk (Vikram Patel - Visitor)',
    zone: 'general_entrance' as ZoneId,
    description: 'Registered visitor verification checkpoint at main reception desk.',
    path: '/src/assets/images/hospital_visitor_triage_1793255801703.jpg',
  },
  {
    id: 'doctor_check',
    title: 'Dr. Anjali Swaminathan (Doctor Scan)',
    zone: 'icu' as ZoneId,
    description: 'Chief Cardiologist biometric verification scan.',
    path: '/src/assets/images/hospital_doctor_portrait_1793254401347.jpg',
  },
  {
    id: 'nurse_check',
    title: 'Rajesh Kumar (ICU Staff Nurse Scan)',
    zone: 'icu' as ZoneId,
    description: 'Senior ICU Nurse biometric authorization scan.',
    path: '/src/assets/images/hospital_nurse_portrait_1793254399942.jpg',
  },
  {
    id: 'icu_corridor',
    title: 'ICU & Surgical Wing Hallway',
    zone: 'icu' as ZoneId,
    description: 'Corridor surveillance feed outside Critical Care and Operation Theatre suites.',
    path: '/src/assets/images/hospital_icu_corridor_1793254399431.jpg',
  },
];

export const INITIAL_REGISTERED_PERSONS: RegisteredPerson[] = [
  {
    id: 'rkh-doc-01',
    name: 'Dr. Anjali Swaminathan',
    role: 'Doctor',
    department: 'Cardiology & Intensive Care',
    cardId: 'RKH-MED-042',
    photos: ['/src/assets/images/hospital_doctor_portrait_1793254401347.jpg'],
    descriptors: [], // Auto-computed on initialization
    registeredAt: '2026-03-12T08:30:00Z',
    notes: 'Chief of Interventional Cardiology. Full clearance for all zones including ICU and Operation Theatre.',
  },
  {
    id: 'rkh-nur-02',
    name: 'Rajesh Kumar',
    role: 'Nurse',
    department: 'Critical Care / ICU Unit',
    cardId: 'RKH-NUR-118',
    photos: ['/src/assets/images/hospital_nurse_portrait_1793254399942.jpg'],
    descriptors: [], // Auto-computed on initialization
    registeredAt: '2026-04-05T09:15:00Z',
    notes: 'Senior Critical Care Staff Nurse. Cleared for ICU, Wards, and Central Pharmacy.',
  },
  {
    id: 'rkh-vis-03',
    name: 'Vikram Patel',
    role: 'Approved Visitor',
    department: 'Inpatient Care (Attending Room 304)',
    cardId: 'RKH-VIS-709',
    photos: ['/src/assets/images/hospital_visitor_triage_1793255801703.jpg'],
    descriptors: [], // Auto-computed on initialization
    registeredAt: '2026-10-28T09:00:00Z',
    notes: 'Approved family attendant for Patient #304 in West Wing. General entrance and ward pass.',
  },
];

export function getStoredPersons(): RegisteredPerson[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERSONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PERSONS, JSON.stringify(INITIAL_REGISTERED_PERSONS));
      return INITIAL_REGISTERED_PERSONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_PERSONS, JSON.stringify(INITIAL_REGISTERED_PERSONS));
      return INITIAL_REGISTERED_PERSONS;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading registered persons from localStorage:', err);
    return INITIAL_REGISTERED_PERSONS;
  }
}

export function savePersons(persons: RegisteredPerson[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PERSONS, JSON.stringify(persons));
  } catch (err) {
    console.error('Error saving persons to localStorage:', err);
  }
}

export function addOrUpdatePerson(person: RegisteredPerson): RegisteredPerson[] {
  const current = getStoredPersons();
  const existingIdx = current.findIndex((p) => p.id === person.id);
  let updated: RegisteredPerson[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = person;
  } else {
    updated = [person, ...current];
  }
  savePersons(updated);
  return updated;
}

export function deletePerson(personId: string): RegisteredPerson[] {
  const current = getStoredPersons();
  const updated = current.filter((p) => p.id !== personId);
  savePersons(updated);
  return updated;
}

/**
 * Real live counters computed dynamically from actual data
 */
export function calculateLiveCounters(
  persons: RegisteredPerson[],
  sessionUnknowns: number,
  alertsList: SecurityAlert[]
): LiveCounters {
  const staffCount = persons.filter(
    (p) => p.role === 'Doctor' || p.role === 'Nurse' || p.role === 'Staff'
  ).length;

  const visitorCount = persons.filter(
    (p) => p.role === 'Approved Visitor' || p.role === 'Patient Attendant'
  ).length;

  const alertsCount = alertsList.length;

  return {
    authorizedStaff: staffCount,
    approvedVisitors: visitorCount,
    unknownDetections: sessionUnknowns,
    alertsToday: alertsCount,
  };
}

export function getStoredSessionUnknowns(): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_SESSION_UNKNOWNS);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function setStoredSessionUnknowns(count: number): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_SESSION_UNKNOWNS, count.toString());
  } catch (err) {
    console.error(err);
  }
}

export function getStoredAlerts(): SecurityAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALERTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addSecurityAlert(alert: SecurityAlert): SecurityAlert[] {
  try {
    const alerts = getStoredAlerts();
    const updated = [alert, ...alerts].slice(0, 50);
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function acknowledgeAlert(alertId: string): SecurityAlert[] {
  try {
    const alerts = getStoredAlerts();
    const updated = alerts.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a));
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearAlerts(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_ALERTS);
  } catch (err) {
    console.error(err);
  }
}

export function getStoredTheme(): 'dark' | 'light' {
  try {
    const val = localStorage.getItem(STORAGE_KEY_THEME);
    if (val === 'light' || val === 'dark') return val;
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function setStoredTheme(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch (err) {
    console.error(err);
  }
}
