export interface TripMember {
  id: string;
  username: string;
  displayName: string;
  billIds: string[];
  totalSpent: number;
  totalPaid: number;
}

export interface Trip {
  id: string;
  name: string;
  members: TripMember[];
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  tripDescription: string;
  isConcluded: boolean;
  eventIds: string[];
}

export interface MonthOption {
  label: string;
  value: number;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  startDateTime: Date;
  endDateTime: Date;
  memberIds: string[];
  billIds: string[];
}