// Education stages
export type EducationStage = 'primary' | 'middle' | 'secondary';

// Grade levels within stages
export type GradeLevel = 'first' | 'second' | 'third' | 'fourth' | 'fifth' | 'sixth';

// Full grade key combining stage and level (stored in database)
export type Grade = 
  | 'primary_first' | 'primary_second' | 'primary_third' | 'primary_fourth' | 'primary_fifth' | 'primary_sixth'
  | 'middle_first' | 'middle_second' | 'middle_third'
  | 'secondary_first' | 'secondary_second' | 'secondary_third';

export interface AttendanceRecord {
  present: boolean[];
  absent: boolean[];
}

export interface Student {
  id: string;
  name: string;
  grade: Grade;
  attendance: AttendanceRecord;
  performanceTasks: number;
  participation: number;
  book: number;
  homework: number;
  exam1: number;
  exam2: number;
}

// Grade labels for display
export const gradeLabels: Record<Grade, string> = {
  primary_first: 'الصف الأول ابتدائي',
  primary_second: 'الصف الثاني ابتدائي',
  primary_third: 'الصف الثالث ابتدائي',
  primary_fourth: 'الصف الرابع ابتدائي',
  primary_fifth: 'الصف الخامس ابتدائي',
  primary_sixth: 'الصف السادس ابتدائي',
  middle_first: 'الصف الأول متوسط',
  middle_second: 'الصف الثاني متوسط',
  middle_third: 'الصف الثالث متوسط',
  secondary_first: 'الصف الأول ثانوي',
  secondary_second: 'الصف الثاني ثانوي',
  secondary_third: 'الصف الثالث ثانوي',
};

// Short grade labels (just the number)
export const gradeShortLabels: Record<Grade, string> = {
  primary_first: 'الصف الأول',
  primary_second: 'الصف الثاني',
  primary_third: 'الصف الثالث',
  primary_fourth: 'الصف الرابع',
  primary_fifth: 'الصف الخامس',
  primary_sixth: 'الصف السادس',
  middle_first: 'الصف الأول',
  middle_second: 'الصف الثاني',
  middle_third: 'الصف الثالث',
  secondary_first: 'الصف الأول',
  secondary_second: 'الصف الثاني',
  secondary_third: 'الصف الثالث',
};

// Education stage labels
export const stageLabels: Record<EducationStage, string> = {
  primary: 'ابتدائي',
  middle: 'متوسط',
  secondary: 'ثانوي',
};

// Get grades for a specific education stage
export const getGradesForStage = (stage: EducationStage): Grade[] => {
  switch (stage) {
    case 'primary':
      return ['primary_first', 'primary_second', 'primary_third', 'primary_fourth', 'primary_fifth', 'primary_sixth'];
    case 'middle':
      return ['middle_first', 'middle_second', 'middle_third'];
    case 'secondary':
      return ['secondary_first', 'secondary_second', 'secondary_third'];
  }
};

// Extract education stage from grade
export const getStageFromGrade = (grade: Grade): EducationStage => {
  if (grade.startsWith('primary_')) return 'primary';
  if (grade.startsWith('middle_')) return 'middle';
  return 'secondary';
};

// Grade colors for styling
export const gradeColors: Record<Grade, string> = {
  primary_first: 'grade-one',
  primary_second: 'grade-two',
  primary_third: 'grade-three',
  primary_fourth: 'grade-four',
  primary_fifth: 'grade-five',
  primary_sixth: 'grade-six',
  middle_first: 'grade-one',
  middle_second: 'grade-two',
  middle_third: 'grade-three',
  secondary_first: 'grade-one',
  secondary_second: 'grade-two',
  secondary_third: 'grade-three',
};
