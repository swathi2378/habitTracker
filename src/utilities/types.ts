export type QuestionType = 'yes-no' | 'fill-in';

export interface Habit {
  id: string;
  name: string;
  questionText: string;
  type: QuestionType;
  createdAt: string;
  frequency?: 'everyday' | 'weekly' | 'custom';
  reminderTime?: string | null; // ISO string 
  description?: string;
  notificationId?: string; // To store scheduled notification ID
}

export interface Entry {
  habitId: string;
  date: string; // YYYY-MM-DD
  value: boolean | string | number;
}
