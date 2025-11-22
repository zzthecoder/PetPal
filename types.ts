export enum ViewState {
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  PET_PROFILE = 'PET_PROFILE',
  AI_HUB = 'AI_HUB',
  HEALTH_RECORDS = 'HEALTH_RECORDS',
  TRAINING_LOGS = 'TRAINING_LOGS',
  CALENDAR = 'CALENDAR',
  SETTINGS = 'SETTINGS',
  USER_PROFILE = 'USER_PROFILE'
}

export interface Pet {
  id: string;
  name: string;
  type: 'Dog' | 'Cat' | 'Other';
  breed: string;
  age: number;
  weight: number; // kg
  image: string;
  nextVetVisit: string;
}

export interface Task {
  id: string;
  title: string;
  time: string;
  completed: boolean;
  petId: string;
  type: 'food' | 'medication' | 'grooming' | 'walk';
}

export interface HealthRecord {
  id: string;
  date: string;
  type: string;
  notes: string;
  vet: string;
}

export interface TrainingSession {
  date: string;
  command: string;
  durationMin: number;
  successRate: number; // 0-100
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}