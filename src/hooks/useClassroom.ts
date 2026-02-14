import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface BehaviorRecord {
  points: number;
}

export interface DisturbanceRecord {
  count: number;
}

export interface PointsRecord {
  points: number;
}

export interface ClassroomGroup {
  id: string;
  name: string;
  points: number;
  sectionKey: string;
  members: string[];
}

export interface StudentNote {
  id: string;
  studentId: string;
  studentName: string;
  text: string;
  date: string;
  type: 'positive' | 'negative' | 'general';
}

export const useClassroom = (sectionKey: string) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [behaviorRecords, setBehaviorRecords] = useState<Record<string, BehaviorRecord>>({});
  const [disturbanceRecords, setDisturbanceRecords] = useState<Record<string, DisturbanceRecord>>({});
  const [cooperationRecords, setCooperationRecords] = useState<Record<string, PointsRecord>>({});
  const [cleanlinessRecords, setCleanlinessRecords] = useState<Record<string, PointsRecord>>({});
  const [groups, setGroups] = useState<ClassroomGroup[]>([]);
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [loadingClassroom, setLoadingClassroom] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) { setLoadingClassroom(false); return; }
    setLoadingClassroom(true);
    try {
      const [behaviorRes, disturbanceRes, cooperationRes, cleanlinessRes, groupsRes, notesRes] = await Promise.all([
        supabase.from('behavior_records').select('*'),
        supabase.from('disturbance_records').select('*'),
        supabase.from('cooperation_records').select('*'),
        supabase.from('cleanliness_records').select('*'),
        supabase.from('classroom_groups').select('*, classroom_group_members(student_id)').eq('section_key', sectionKey),
        supabase.from('classroom_notes').select('*').order('created_at', { ascending: false }),
      ]);

      if (behaviorRes.data) {
        const map: Record<string, BehaviorRecord> = {};
        behaviorRes.data.forEach((r: any) => { map[r.student_id] = { points: r.points }; });
        setBehaviorRecords(map);
      }
      if (disturbanceRes.data) {
        const map: Record<string, DisturbanceRecord> = {};
        disturbanceRes.data.forEach((r: any) => { map[r.student_id] = { count: r.count }; });
        setDisturbanceRecords(map);
      }
      if (cooperationRes.data) {
        const map: Record<string, PointsRecord> = {};
        cooperationRes.data.forEach((r: any) => { map[r.student_id] = { points: r.points }; });
        setCooperationRecords(map);
      }
      if (cleanlinessRes.data) {
        const map: Record<string, PointsRecord> = {};
        cleanlinessRes.data.forEach((r: any) => { map[r.student_id] = { points: r.points }; });
        setCleanlinessRecords(map);
      }
      if (groupsRes.data) {
        setGroups(groupsRes.data.map((g: any) => ({
          id: g.id, name: g.name, points: g.points, sectionKey: g.section_key,
          members: (g.classroom_group_members || []).map((m: any) => m.student_id),
        })));
      }
      if (notesRes.data) {
        setNotes(notesRes.data.map((n: any) => ({
          id: n.id, studentId: n.student_id, studentName: n.student_name,
          text: n.text, date: new Date(n.created_at).toLocaleDateString('ar-SA'),
          type: n.type as 'positive' | 'negative' | 'general',
        })));
      }
    } catch (err) {
      console.error('Error fetching classroom data:', err);
    } finally {
      setLoadingClassroom(false);
    }
  }, [user, sectionKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Behavior
  const getBehavior = (studentId: string): BehaviorRecord => behaviorRecords[studentId] || { points: 0 };
  const addPoints = useCallback(async (studentId: string, amount: number) => {
    if (!user) return;
    const newPoints = (behaviorRecords[studentId]?.points || 0) + amount;
    setBehaviorRecords(prev => ({ ...prev, [studentId]: { points: newPoints } }));
    await supabase.from('behavior_records').upsert({ user_id: user.id, student_id: studentId, points: newPoints }, { onConflict: 'user_id,student_id' });
  }, [user, behaviorRecords]);
  const resetBehavior = useCallback(async (studentId: string) => {
    if (!user) return;
    setBehaviorRecords(prev => ({ ...prev, [studentId]: { points: 0 } }));
    await supabase.from('behavior_records').upsert({ user_id: user.id, student_id: studentId, points: 0 }, { onConflict: 'user_id,student_id' });
  }, [user]);

  // Disturbance
  const getDisturbance = (studentId: string): DisturbanceRecord => disturbanceRecords[studentId] || { count: 0 };
  const addDisturbance = useCallback(async (studentId: string) => {
    if (!user) return;
    const newCount = (disturbanceRecords[studentId]?.count || 0) + 1;
    setDisturbanceRecords(prev => ({ ...prev, [studentId]: { count: newCount } }));
    await supabase.from('disturbance_records').upsert({ user_id: user.id, student_id: studentId, count: newCount }, { onConflict: 'user_id,student_id' });
  }, [user, disturbanceRecords]);
  const resetDisturbance = useCallback(async (studentId: string) => {
    if (!user) return;
    setDisturbanceRecords(prev => ({ ...prev, [studentId]: { count: 0 } }));
    await supabase.from('disturbance_records').upsert({ user_id: user.id, student_id: studentId, count: 0 }, { onConflict: 'user_id,student_id' });
  }, [user]);

  // Generic points helper for cooperation & cleanliness
  const useGenericPoints = (
    table: 'cooperation_records' | 'cleanliness_records',
    records: Record<string, PointsRecord>,
    setRecords: React.Dispatch<React.SetStateAction<Record<string, PointsRecord>>>
  ) => {
    const get = (studentId: string): PointsRecord => records[studentId] || { points: 0 };
    const add = async (studentId: string, amount: number) => {
      if (!user) return;
      const newPoints = (records[studentId]?.points || 0) + amount;
      setRecords(prev => ({ ...prev, [studentId]: { points: newPoints } }));
      await supabase.from(table).upsert({ user_id: user.id, student_id: studentId, points: newPoints }, { onConflict: 'user_id,student_id' });
    };
    const reset = async (studentId: string) => {
      if (!user) return;
      setRecords(prev => ({ ...prev, [studentId]: { points: 0 } }));
      await supabase.from(table).upsert({ user_id: user.id, student_id: studentId, points: 0 }, { onConflict: 'user_id,student_id' });
    };
    return { get, add, reset };
  };

  const cooperation = useGenericPoints('cooperation_records', cooperationRecords, setCooperationRecords);
  const cleanliness = useGenericPoints('cleanliness_records', cleanlinessRecords, setCleanlinessRecords);

  // Groups
  const addGroup = useCallback(async (name: string) => {
    if (!user || !name.trim()) return;
    const { data, error } = await supabase.from('classroom_groups').insert({ user_id: user.id, name: name.trim(), section_key: sectionKey }).select().single();
    if (error) return;
    setGroups(prev => [...prev, { id: data.id, name: data.name, points: data.points, sectionKey: data.section_key, members: [] }]);
  }, [user, sectionKey]);
  const deleteGroup = useCallback(async (groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    await supabase.from('classroom_groups').delete().eq('id', groupId);
  }, []);
  const addGroupPoints = useCallback(async (groupId: string, amount: number) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const newPoints = group.points + amount;
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, points: newPoints } : g));
    await supabase.from('classroom_groups').update({ points: newPoints }).eq('id', groupId);
  }, [groups]);
  const toggleGroupMember = useCallback(async (groupId: string, studentId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const isMember = group.members.includes(studentId);
    if (isMember) {
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: g.members.filter(m => m !== studentId) } : g));
      await supabase.from('classroom_group_members').delete().eq('group_id', groupId).eq('student_id', studentId);
    } else {
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: [...g.members, studentId] } : g));
      await supabase.from('classroom_group_members').insert({ group_id: groupId, student_id: studentId });
    }
  }, [groups]);

  // Notes
  const addNote = useCallback(async (studentId: string, studentName: string, text: string, type: 'positive' | 'negative' | 'general') => {
    if (!user || !text.trim()) return;
    const { data, error } = await supabase.from('classroom_notes').insert({ user_id: user.id, student_id: studentId, student_name: studentName, text: text.trim(), type }).select().single();
    if (error) return;
    setNotes(prev => [{ id: data.id, studentId: data.student_id, studentName: data.student_name, text: data.text, date: new Date(data.created_at).toLocaleDateString('ar-SA'), type: data.type as any }, ...prev]);
  }, [user]);
  const deleteNote = useCallback(async (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    await supabase.from('classroom_notes').delete().eq('id', noteId);
  }, []);

  return {
    loadingClassroom,
    getBehavior, addPoints, resetBehavior,
    getDisturbance, addDisturbance, resetDisturbance,
    getCooperation: cooperation.get, addCooperation: cooperation.add, resetCooperation: cooperation.reset,
    getCleanliness: cleanliness.get, addCleanliness: cleanliness.add, resetCleanliness: cleanliness.reset,
    groups, addGroup, deleteGroup, addGroupPoints, toggleGroupMember,
    notes, addNote, deleteNote,
  };
};
