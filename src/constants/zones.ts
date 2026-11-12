import { ZoneInfo } from '../types';

export const HOSPITAL_ZONES: ZoneInfo[] = [
  {
    id: 'general_entrance',
    name: 'General Entrance',
    isRestricted: false,
    department: 'Main Lobby & Reception',
    description: 'Public entrance and triage lobby. Visitors and attendants allowed.',
    allowedRoles: ['Doctor', 'Nurse', 'Staff', 'Approved Visitor', 'Patient Attendant'],
  },
  {
    id: 'ward',
    name: 'Inpatient Ward',
    isRestricted: false,
    department: 'Patient Care Wings (Floors 2-4)',
    description: 'Patient recovery and convalescence corridors. Registered visitors allowed during visiting hours.',
    allowedRoles: ['Doctor', 'Nurse', 'Staff', 'Approved Visitor', 'Patient Attendant'],
  },
  {
    id: 'icu',
    name: 'ICU (Intensive Care)',
    isRestricted: true,
    department: 'Critical Care Division',
    description: 'High-dependency critical care unit. Strict security protocol; non-authorized personnel trigger alert.',
    allowedRoles: ['Doctor', 'Nurse', 'Staff'],
  },
  {
    id: 'operation_theatre',
    name: 'Operation Theatre',
    isRestricted: true,
    department: 'Surgical Wing (Wing B)',
    description: 'Sterile surgical suites. Only cleared surgeons, surgical nurses, and anesthesiologists permitted.',
    allowedRoles: ['Doctor', 'Nurse'],
  },
  {
    id: 'pharmacy',
    name: 'Central Pharmacy',
    isRestricted: true,
    department: 'Medication & Controlled Narcotics Vault',
    description: 'Controlled dispensary and pharmaceutical stores. Unverified visitors strictly prohibited.',
    allowedRoles: ['Doctor', 'Staff', 'Nurse'],
  },
];
