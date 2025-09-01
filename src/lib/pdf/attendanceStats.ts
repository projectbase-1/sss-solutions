
import { supabase } from '@/integrations/supabase/client';

export interface AttendanceStats {
  employee_id: string;
  present_days: number;
  absent_days: number;
  late_days: number;
  ot_hours: number;
  food: number;
  uniform: number;
}

export const fetchAttendanceStats = async (selectedMonth: string): Promise<Record<string, AttendanceStats>> => {
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const startOfMonth = formatLocalDate(new Date(year, month - 1, 1));
  const endOfMonth = formatLocalDate(new Date(year, month, 0));

  const { data, error } = await supabase
    .from('attendance')
    .select('employee_id, status, check_in_time, check_out_time, notes')
    .gte('date', startOfMonth)
    .lte('date', endOfMonth);

  if (error) throw error;

  const employeeStats: Record<string, AttendanceStats> = {};

  data.forEach(record => {
    if (!employeeStats[record.employee_id]) {
      employeeStats[record.employee_id] = {
        employee_id: record.employee_id,
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        ot_hours: 0,
        food: 0,
        uniform: 0,
      };
    }

    const stats = employeeStats[record.employee_id];

    try {
      // Check if this is a manual entry with JSON data in notes
      if (record.notes && record.status === 'present') {
        const parsedNotes = JSON.parse(record.notes);
        if (parsedNotes.present_days !== undefined) {
          stats.present_days += parsedNotes.present_days || 0;
          stats.absent_days += parsedNotes.absent_days || 0;
          stats.late_days += parsedNotes.late_days || 0;
          stats.ot_hours += parsedNotes.ot_hours || 0;
          stats.food += parsedNotes.food || 0;
          stats.uniform += parsedNotes.uniform || 0;
          return;
        }
      }
    } catch (e) {
      // If JSON parsing fails, fall back to counting individual records
    }

    // Count individual records for non-manual entries
    switch (record.status) {
      case 'present':
        stats.present_days++;
        break;
      case 'absent':
        stats.absent_days++;
        break;
      case 'late':
        stats.late_days++;
        break;
    }

    // Calculate OT hours based on check-in/check-out times
    if (record.check_in_time && record.check_out_time) {
      const checkIn = new Date(`1970-01-01T${record.check_in_time}`);
      const checkOut = new Date(`1970-01-01T${record.check_out_time}`);
      const workHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      
      if (workHours > 8) {
        stats.ot_hours += (workHours - 8);
      }
    }
  });

  return employeeStats;
};
