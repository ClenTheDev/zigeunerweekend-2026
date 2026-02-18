export interface Participant {
  id: string;
  name: string;
  emoji: string; // fun avatar emoji
  joinedAt: number;
}

export interface Wish {
  id: string;
  participantId: string;
  participantName: string;
  category: 'eten' | 'drinken' | 'overig';
  text: string;
  createdAt: number;
}

export interface Activity {
  id: string;
  participantId: string;
  participantName: string;
  title: string;
  description: string;
  votes: string[]; // participant IDs
  createdAt: number;
}

export interface PackItem {
  id: string;
  item: string;
  assignedTo: string; // participant name or empty
  assignedToId: string;
  checked: boolean;
  addedBy: string;
}

export interface Expense {
  id: string;
  participantId: string;
  participantName: string;
  description: string;
  amount: number; // in cents
  splitBetween: string[]; // participant IDs (empty = everyone)
  createdAt: number;
}

export interface ScheduleItem {
  id: string;
  day: string; // e.g., "Vrijdag", "Zaterdag", "Zondag"
  time: string; // e.g., "09:00"
  activity: string;
  addedBy: string;
}

export interface WeekendData {
  participants: Participant[];
  wishes: Wish[];
  activities: Activity[];
  packList: PackItem[];
  expenses: Expense[];
  schedule: ScheduleItem[];
}
