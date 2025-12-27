import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Student, Grade, AttendanceRecord, gradeLabels, GradeSection } from '@/types/student';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_ATTENDANCE: AttendanceRecord = {
  present: [false, false, false, false],
  absent: [false, false, false, false],
};

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const parseAttendance = (data: unknown): AttendanceRecord => {
    if (data && typeof data === 'object' && 'present' in data && 'absent' in data) {
      return data as AttendanceRecord;
    }
    return DEFAULT_ATTENDANCE;
  };

  // Fetch students from database
  const fetchStudents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const mappedStudents: Student[] = (data || []).map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade as Grade,
        subject: s.subject || 'default',
        attendance: parseAttendance(s.attendance),
        performanceTasks: s.performance_tasks,
        participation: s.participation,
        book: s.book,
        homework: s.homework,
        exam1: s.exam1,
        exam2: s.exam2,
      }));

      setStudents(mappedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const addStudents = useCallback(async (names: string[], grade: Grade, subject: string = 'default') => {
    try {
      const defaultAttendanceJson = { present: [false, false, false, false], absent: [false, false, false, false] };
      const newStudents = names.map(name => ({
        name,
        grade,
        subject,
        attendance: defaultAttendanceJson,
        performance_tasks: 0,
        participation: 0,
        book: 0,
        homework: 0,
        exam1: 0,
        exam2: 0,
      }));

      const { data, error } = await supabase
        .from('students')
        .insert(newStudents as never[])
        .select();

      if (error) throw error;

      const mappedStudents: Student[] = (data || []).map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade as Grade,
        subject: s.subject || 'default',
        attendance: parseAttendance(s.attendance),
        performanceTasks: s.performance_tasks,
        participation: s.participation,
        book: s.book,
        homework: s.homework,
        exam1: s.exam1,
        exam2: s.exam2,
      }));

      setStudents(prev => [...prev, ...mappedStudents]);

      toast({
        title: 'تمت الإضافة بنجاح',
        description: `تم إضافة ${names.length} طالبة إلى ${gradeLabels[grade]}`,
      });
    } catch (error) {
      console.error('Error adding students:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إضافة الطالبات',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
      if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
      if (updates.attendance !== undefined) dbUpdates.attendance = updates.attendance;
      if (updates.performanceTasks !== undefined) dbUpdates.performance_tasks = updates.performanceTasks;
      if (updates.participation !== undefined) dbUpdates.participation = updates.participation;
      if (updates.book !== undefined) dbUpdates.book = updates.book;
      if (updates.homework !== undefined) dbUpdates.homework = updates.homework;
      if (updates.exam1 !== undefined) dbUpdates.exam1 = updates.exam1;
      if (updates.exam2 !== undefined) dbUpdates.exam2 = updates.exam2;

      const { error } = await supabase
        .from('students')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setStudents(prev =>
        prev.map(student =>
          student.id === id ? { ...student, ...updates } : student
        )
      );
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث البيانات',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const deleteStudent = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStudents(prev => prev.filter(student => student.id !== id));
      
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الطالبة من القائمة',
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الطالبة',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Get students by grade and subject
  const getStudentsByGradeAndSubject = useCallback((grade: Grade, subject: string) =>
    students.filter(student => student.grade === grade && student.subject === subject), [students]);

  // Get all unique grade sections (grade + subject combinations)
  const getGradeSections = useCallback((): GradeSection[] => {
    const sections = new Map<string, GradeSection>();
    students.forEach(student => {
      const key = `${student.grade}_${student.subject}`;
      if (!sections.has(key)) {
        sections.set(key, { grade: student.grade, subject: student.subject });
      }
    });
    return Array.from(sections.values());
  }, [students]);

  // Transfer a student to a different grade/subject
  const transferStudent = useCallback(async (id: string, newGrade: Grade, newSubject?: string) => {
    try {
      const student = students.find(s => s.id === id);
      if (!student) return;

      const updates: Record<string, unknown> = { grade: newGrade };
      if (newSubject !== undefined) {
        updates.subject = newSubject;
      }

      const { error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setStudents(prev =>
        prev.map(s => s.id === id ? { ...s, grade: newGrade, ...(newSubject !== undefined ? { subject: newSubject } : {}) } : s)
      );

      toast({
        title: 'تم النقل بنجاح',
        description: `تم نقل الطالبة "${student.name}" إلى ${gradeLabels[newGrade]}`,
      });
    } catch (error) {
      console.error('Error transferring student:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء نقل الطالبة',
        variant: 'destructive',
      });
    }
  }, [students, toast]);

  // Duplicate grade section to another grade or same grade with new subject
  const duplicateGradeSection = useCallback(async (
    sourceGrade: Grade, 
    sourceSubject: string,
    targetGrade: Grade, 
    targetSubject: string,
    includeScores: boolean
  ) => {
    try {
      const sourceStudents = students.filter(s => s.grade === sourceGrade && s.subject === sourceSubject);
      
      if (sourceStudents.length === 0) {
        toast({
          title: 'لا توجد طالبات',
          description: 'لا توجد طالبات في الصف المصدر للنسخ',
          variant: 'destructive',
        });
        return;
      }

      const defaultAttendanceJson = { present: [false, false, false, false], absent: [false, false, false, false] };
      
      const newStudents = sourceStudents.map(student => ({
        name: student.name,
        grade: targetGrade,
        subject: targetSubject,
        attendance: includeScores ? student.attendance : defaultAttendanceJson,
        performance_tasks: includeScores ? student.performanceTasks : 0,
        participation: includeScores ? student.participation : 0,
        book: includeScores ? student.book : 0,
        homework: includeScores ? student.homework : 0,
        exam1: includeScores ? student.exam1 : 0,
        exam2: includeScores ? student.exam2 : 0,
      }));

      const { data, error } = await supabase
        .from('students')
        .insert(newStudents as never[])
        .select();

      if (error) throw error;

      const mappedStudents: Student[] = (data || []).map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade as Grade,
        subject: s.subject || 'default',
        attendance: parseAttendance(s.attendance),
        performanceTasks: s.performance_tasks,
        participation: s.participation,
        book: s.book,
        homework: s.homework,
        exam1: s.exam1,
        exam2: s.exam2,
      }));

      setStudents(prev => [...prev, ...mappedStudents]);

      const subjectLabel = targetSubject !== 'default' ? ` (${targetSubject})` : '';
      toast({
        title: 'تم التكرار بنجاح',
        description: `تم نسخ ${sourceStudents.length} طالبة إلى ${gradeLabels[targetGrade]}${subjectLabel}`,
      });
    } catch (error) {
      console.error('Error duplicating grade section:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تكرار الصف',
        variant: 'destructive',
      });
    }
  }, [students, toast]);

  return {
    students,
    loading,
    addStudents,
    updateStudent,
    deleteStudent,
    getStudentsByGradeAndSubject,
    getGradeSections,
    transferStudent,
    duplicateGradeSection,
  };
};
