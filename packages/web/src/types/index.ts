export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
}

export interface TeamMember {
  userId: string;
  username: string;
  displayName: string;
  role: 'owner' | 'admin' | 'member';
  timeTrackingEnabled: boolean;
  defaultRate: number;
  rateOverrides: { groupId: string; rate: number }[];
  joinedAt: string;
}

export interface Team {
  _id: string;
  handle: string;
  displayName: string;
  createdBy: string;
  members: TeamMember[];
}

export interface Group {
  _id: string;
  teamId: string;
  name: string;
  sortOrder: number;
  archived: boolean;
}

export interface Subtask {
  _id: string;
  title: string;
  completed: boolean;
  sortOrder: number;
}

export interface Task {
  _id: string;
  teamId: string;
  groupId: string;
  title: string;
  notes: string;
  status: 'active' | 'completed' | 'deleted';
  pipelineSection: 'above' | 'below' | 'waiting' | 'someday';
  pipelineOrder: string;
  groupOrder: string;
  assignees: string[];
  dueDate: string | null;
  reminders: { date: string; sent: boolean }[];
  subtasks: Subtask[];
  createdBy: string;
  completedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  _id: string;
  teamId: string;
  taskId: string | null;
  groupId: string;
  userId: string;
  hours: number;
  date: string;
  note: string;
}
