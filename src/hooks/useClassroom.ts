import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Stars: array of 10 values - 0=empty, 1=green, 2=red
export type StarValue = 0 | 1 | 2;
export type StarsArray = [StarValue, StarValue, StarValue, StarValue, StarValue, StarValue, StarValue, StarValue, StarValue, StarValue];

const DEFAULT_STARS: StarsArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export interface StarRecord {
  stars: StarsArray;
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

type StarTable = 'behavior_records' | 'disturbance_records' | 'cooperation_records' | 'cleanliness_records';

const parseStars = (data: unknown): StarsArray => {
  if (Array.isArray(data) && data.length === 10) return data as StarsArray;
  return [...DEFAULT_STARS] as StarsArray;
};

export const useClassroom = (sectionKey: string) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [behaviorRecords, setBehaviorRecords] = useState<Record<string, StarRecord>>({});
  const [disturbanceRecords, setDisturbanceRecords] = useState<Record<string, StarRecord>>({});
  const [cooperationRecords, setCooperationRecords] = useState<Record<string, StarRecord>>({});
  const [cleanlinessRecords, setCleanlinessRecords] = useState<Record<string, StarRecord>>({});
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

      const mapStars = (data: any[] | null): Record<string, StarRecord> => {
        const map: Record<string, StarRecord> = {};
        (data || []).forEach((r: any) => { map[r.student_id] = { stars: parseStars(r.stars) }; });
        return map;
      };

      setBehaviorRecords(mapStars(behaviorRes.data));
      setDisturbanceRecords(mapStars(disturbanceRes.data));
      setCooperationRecords(mapStars(cooperationRes.data));
      setCleanlinessRecords(mapStars(cleanlinessRes.data));

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

  // Generic star toggle for all 4 tables
  const createStarHandlers = (
    table: StarTable,
    records: Record<string, StarRecord>,
    setRecords: React.Dispatch<React.SetStateAction<Record<string, StarRecord>>>
  ) => {
    const getStars = (studentId: string): StarsArray => records[studentId]?.stars || [...DEFAULT_STARS] as StarsArray;

    const toggleStar = async (studentId: string, index: number) => {
      if (!user) return;
      const current = [...getStars(studentId)] as StarsArray;
      // Cycle: 0 → 1(green) → 2(red) → 0(empty)
      current[index] = ((current[index] + 1) % 3) as StarValue;
      setRecords(prev => ({ ...prev, [studentId]: { stars: current } }));
      await supabase.from(table).upsert(
        { user_id: user.id, student_id: studentId, stars: current },
        { onConflict: 'user_id,student_id' }
      );
    };

    const resetStars = async (studentId: string) => {
      if (!user) return;
      const empty = [...DEFAULT_STARS] as StarsArray;
      setRecords(prev => ({ ...prev, [studentId]: { stars: empty } }));
      await supabase.from(table).upsert(
        { user_id: user.id, student_id: studentId, stars: empty },
        { onConflict: 'user_id,student_id' }
      );
    };

    const fillAllGreen = async (studentId: string) => {
      if (!user) return;
      const allGreen: StarsArray = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      setRecords(prev => ({ ...prev, [studentId]: { stars: allGreen } }));
      await supabase.from(table).upsert(
        { user_id: user.id, student_id: studentId, stars: allGreen },
        { onConflict: 'user_id,student_id' }
      );
    };

    const fillOneRed = async (studentId: string) => {
      if (!user) return;
      const current = [...(records[studentId]?.stars || DEFAULT_STARS)] as StarsArray;
      current[0] = 2;
      setRecords(prev => ({ ...prev, [studentId]: { stars: current } }));
      await supabase.from(table).upsert(
        { user_id: user.id, student_id: studentId, stars: current },
        { onConflict: 'user_id,student_id' }
      );
    };

    return { getStars, toggleStar, resetStars, fillAllGreen, fillOneRed };
  };

  const behavior = createStarHandlers('behavior_records', behaviorRecords, setBehaviorRecords);
  const disturbance = createStarHandlers('disturbance_records', disturbanceRecords, setDisturbanceRecords);
  const cooperation = createStarHandlers('cooperation_records', cooperationRecords, setCooperationRecords);
  const cleanliness = createStarHandlers('cleanliness_records', cleanlinessRecords, setCleanlinessRecords);

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
    if (group.members.includes(studentId)) {
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
    getBehaviorStars: behavior.getStars, toggleBehaviorStar: behavior.toggleStar, resetBehaviorStars: behavior.resetStars, fillBehaviorGreen: behavior.fillAllGreen, fillBehaviorOneRed: behavior.fillOneRed,
    getDisturbanceStars: disturbance.getStars, toggleDisturbanceStar: disturbance.toggleStar, resetDisturbanceStars: disturbance.resetStars, fillDisturbanceGreen: disturbance.fillAllGreen, fillDisturbanceOneRed: disturbance.fillOneRed,
    getCooperationStars: cooperation.getStars, toggleCooperationStar: cooperation.toggleStar, resetCooperationStars: cooperation.resetStars, fillCooperationGreen: cooperation.fillAllGreen, fillCooperationOneRed: cooperation.fillOneRed,
    getCleanlinessStars: cleanliness.getStars, toggleCleanlinessStar: cleanliness.toggleStar, resetCleanlinessStars: cleanliness.resetStars, fillCleanlinessGreen: cleanliness.fillAllGreen, fillCleanlinessOneRed: cleanliness.fillOneRed,
    groups, addGroup, deleteGroup, addGroupPoints, toggleGroupMember,
    notes, addNote, deleteNote,
  };
};
