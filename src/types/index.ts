export type Role =
  | 'Doctor'
  | 'Nurse'
  | 'Staff'
  | 'Approved Visitor'
  | 'Patient Attendant';

export type ZoneId =
  | 'general_entrance'
  | 'ward'
  | 'icu'
  | 'operation_theatre'
  | 'pharmacy';

export interface ZoneInfo {
  id: ZoneId;
  name: string;
  isRestricted: boolean;
  department: string;
  description: string;
  allowedRoles: Role[];
}

export interface RegisteredPerson {
  id: string;
  name: string;
  role: Role;
  department: string;
  cardId?: string;
  photos: string[]; // data URLs or asset paths
  descriptors: number[][]; // serialized Float32Array -> Array<number> for storage
  registeredAt: string;
  notes?: string;
}

export interface DetectedFaceResult {
  id: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isAuthorized: boolean;
  matchPerson?: RegisteredPerson;
  confidence: number; // 0 to 100
  distance: number;
  threshold?: number;
  descriptor?: number[];
  thumbnailDataUrl?: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  zoneId: ZoneId;
  zoneName: string;
  reason: string;
  faceThumbnail?: string;
  faceCount: number;
  acknowledged: boolean;
}

export interface LiveCounters {
  authorizedStaff: number;
  approvedVisitors: number;
  unknownDetections: number;
  alertsToday: number;
}
