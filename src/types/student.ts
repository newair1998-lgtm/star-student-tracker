export type Grade = 'first' | 'second' | 'third' | 'fourth' | 'fifth' | 'sixth';

export interface Student {
  id: string;
  name: string;
  grade: Grade;
  attendance: 'present' | 'absent' | null;
  performanceTasks: number;
  participation: number;
  book: number;
  homework: number;
  exam1: number;
  exam2: number;
}

export const gradeLabels: Record<Grade, string> = {
  first: 'الصف الأول',
  second: 'الصف الثاني',
  third: 'الصف الثالث',
  fourth: 'الصف الرابع',
  fifth: 'الصف الخامس',
  sixth: 'الصف السادس',
};

export const gradeColors: Record<Grade, string> = {
  first: 'grade-one',
  second: 'grade-two',
  third: 'grade-three',
  fourth: 'grade-four',
  fifth: 'grade-five',
  sixth: 'grade-six',
};
