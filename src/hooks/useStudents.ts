import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Student, Grade } from '@/types/student';
import { useToast } from '@/hooks/use-toast';

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch students from database
  const fetchStudents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedStudents: Student[] = (data || []).map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade as Grade,
        attendance: s.attendance as 'present' | 'absent' | null,
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

  const addStudents = useCallback(async (names: string[], grade: Grade) => {
    try {
      const newStudents = names.map(name => ({
        name,
        grade,
        attendance: null,
        performance_tasks: 0,
        participation: 0,
        book: 0,
        homework: 0,
        exam1: 0,
        exam2: 0,
      }));

      const { data, error } = await supabase
        .from('students')
        .insert(newStudents)
        .select();

      if (error) throw error;

      const mappedStudents: Student[] = (data || []).map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade as Grade,
        attendance: s.attendance as 'present' | 'absent' | null,
        performanceTasks: s.performance_tasks,
        participation: s.participation,
        book: s.book,
        homework: s.homework,
        exam1: s.exam1,
        exam2: s.exam2,
      }));

      setStudents(prev => [...prev, ...mappedStudents]);

      const gradeNames: Record<Grade, string> = {
        first: 'الأول',
        second: 'الثاني',
        third: 'الثالث',
        fourth: 'الرابع',
        fifth: 'الخامس',
        sixth: 'السادس',
      };

      toast({
        title: 'تمت الإضافة بنجاح',
        description: `تم إضافة ${names.length} طالبة إلى الصف ${gradeNames[grade]}`,
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

  const getStudentsByGrade = useCallback((grade: Grade) =>
    students.filter(student => student.grade === grade), [students]);

  return {
    students,
    loading,
    addStudents,
    updateStudent,
    deleteStudent,
    getStudentsByGrade,
  };
};
