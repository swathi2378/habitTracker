export type QuestionType = 'yes-no' | 'fill-in';

export interface Habit {
  id: string;
  name: string;
  questionText: string;
  type: QuestionType;
  createdAt: string;
}

export interface Entry {
  habitId: string;
  date: string; // YYYY-MM-DD
  value: boolean | string | number;
}
