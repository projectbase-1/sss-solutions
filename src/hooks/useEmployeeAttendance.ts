
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeAttendanceStats {
  employee_id: string;
  present_days: number;
  absent_days: number;
  late_days: number;
  ot_hours: number;
  total_days: number;
  food: number;
  uniform: number;
  deduction: number;
}

export const useEmployeeAttendanceStats = (employeeId: string, selectedMonth?: string) => {
  return useQuery({
    queryKey: ['employee-attendance-stats', employeeId, selectedMonth],
    queryFn: async (): Promise<EmployeeAttendanceStats> => {
      // Determine date range based on selected month or current month (LOCAL date, no timezone shift)
      const formatLocalDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      let startOfMonth: string;
      let endOfMonth: string;

      if (selectedMonth) {
        const [yearStr, monthStr] = selectedMonth.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        startOfMonth = formatLocalDate(new Date(year, month - 1, 1));
        endOfMonth = formatLocalDate(new Date(year, month, 0));
      } else {
        const now = new Date();
        startOfMonth = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
        endOfMonth = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      }

      console.log('=== FETCHING EMPLOYEE STATS ===');
      console.log('Employee ID:', employeeId);
      console.log('Date range:', startOfMonth, 'to', endOfMonth);

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching attendance:', error);
        throw error;
      }

      console.log('=== RAW ATTENDANCE DATA ===');
      console.log('Records found:', data?.length || 0);
      console.log('Data:', data);

      const stats = {
        employee_id: employeeId,
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        ot_hours: 0,
        total_days: data?.length || 0,
        food: 0,
        uniform: 0,
        deduction: 0,
      };

      // Process each attendance record
      data?.forEach(record => {
        console.log('=== PROCESSING RECORD ===');
        console.log('Record:', record);
        
        // PRIORITY 1: Use direct database column values (these are the primary source)
        const directPresent = Number(record.present_days) || 0;
        const directAbsent = Number(record.absent_days) || 0;
        const directLate = Number(record.late_days) || 0;
        const directOT = Number(record.ot_hours) || 0;
        const directFood = Number(record.food) || 0;
        const directUniform = Number(record.uniform) || 0;
        const directDeduction = Number(record.deduction) || 0;

        console.log('Direct column values:');
        console.log('- Present:', directPresent);
        console.log('- Absent:', directAbsent);
        console.log('- Late:', directLate);
        console.log('- OT:', directOT);
        console.log('- Food:', directFood);
        console.log('- Uniform:', directUniform);

        // Add direct values to stats
        stats.present_days += directPresent;
        stats.absent_days += directAbsent;
        stats.late_days += directLate;
        stats.ot_hours += directOT;
        stats.food += directFood;
        stats.uniform += directUniform;
        stats.deduction += directDeduction;

        console.log('Updated stats after direct values:', stats);
        
        // PRIORITY 2: If no direct values and we have notes, parse them as fallback
        if (!directPresent && !directAbsent && !directLate && !directOT && record.notes) {
          try {
            const parsedNotes = JSON.parse(record.notes);
            console.log('Parsing notes as fallback:', parsedNotes);
            
            if (typeof parsedNotes === 'object' && parsedNotes !== null) {
              const notesPresent = Number(parsedNotes.present_days) || 0;
              const notesAbsent = Number(parsedNotes.absent_days) || 0;
              const notesLate = Number(parsedNotes.late_days) || 0;
              const notesOT = Number(parsedNotes.ot_hours) || 0;
              const notesFood = Number(parsedNotes.food) || 0;
              const notesUniform = Number(parsedNotes.uniform) || 0;
              
              stats.present_days += notesPresent;
              stats.absent_days += notesAbsent;
              stats.late_days += notesLate;
              stats.ot_hours += notesOT;
              stats.food += notesFood;
              stats.uniform += notesUniform;
              
              console.log('Added from notes - Present:', notesPresent, 'Absent:', notesAbsent, 'OT:', notesOT);
            }
          } catch (e) {
            console.log('Failed to parse notes, using status fallback:', e);
            
            // PRIORITY 3: Last resort - count based on status
            switch (record.status) {
              case 'present':
                stats.present_days += 1;
                break;
              case 'absent':
                stats.absent_days += 1;
                break;
              case 'late':
                stats.late_days += 1;
                break;
            }
          }
        }
      });

      console.log('=== FINAL CALCULATED STATS ===');
      console.log('Employee:', employeeId);
      console.log('Present:', stats.present_days);
      console.log('Absent:', stats.absent_days);
      console.log('Late:', stats.late_days);
      console.log('OT Hours:', stats.ot_hours);
      console.log('Food:', stats.food);
      console.log('Uniform:', stats.uniform);

      return stats;
    },
    enabled: !!employeeId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache results
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });
};

export const useAllEmployeesAttendanceStats = (selectedMonth?: string) => {
  return useQuery({
    queryKey: ['all-employees-attendance-stats', selectedMonth],
    queryFn: async (): Promise<Record<string, EmployeeAttendanceStats>> => {
      // Determine date range based on selected month or current month (LOCAL date, no timezone shift)
      const formatLocalDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      let startOfMonth: string;
      let endOfMonth: string;

      if (selectedMonth) {
        const [yearStr, monthStr] = selectedMonth.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        startOfMonth = formatLocalDate(new Date(year, month - 1, 1));
        endOfMonth = formatLocalDate(new Date(year, month, 0));
      } else {
        const now = new Date();
        startOfMonth = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
        endOfMonth = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      }

      console.log('=== FETCHING ALL EMPLOYEES STATS ===');
      console.log('Date range:', startOfMonth, 'to', endOfMonth);

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching all attendance:', error);
        throw error;
      }

      console.log('=== RAW ALL EMPLOYEES DATA ===');
      console.log('Total records found:', data?.length || 0);

      const employeeStats: Record<string, EmployeeAttendanceStats> = {};

      data?.forEach(record => {
        if (!employeeStats[record.employee_id]) {
          employeeStats[record.employee_id] = {
            employee_id: record.employee_id,
            present_days: 0,
            absent_days: 0,
            late_days: 0,
            ot_hours: 0,
            total_days: 0,
            food: 0,
            uniform: 0,
            deduction: 0,
          };
        }

        const stats = employeeStats[record.employee_id];
        stats.total_days++;

        console.log('=== PROCESSING RECORD FOR EMPLOYEE:', record.employee_id, '===');
        console.log('Record data:', record);

        // PRIORITY 1: Use direct database column values
        const directPresent = Number(record.present_days) || 0;
        const directAbsent = Number(record.absent_days) || 0;
        const directLate = Number(record.late_days) || 0;
        const directOT = Number(record.ot_hours) || 0;
        const directFood = Number(record.food) || 0;
        const directUniform = Number(record.uniform) || 0;
        const directDeduction = Number(record.deduction) || 0;

        console.log('Direct values - Present:', directPresent, 'Absent:', directAbsent, 'OT:', directOT);

        // Add direct values
        stats.present_days += directPresent;
        stats.absent_days += directAbsent;
        stats.late_days += directLate;
        stats.ot_hours += directOT;
        stats.food += directFood;
        stats.uniform += directUniform;
        stats.deduction += directDeduction;

        // PRIORITY 2: If no direct values and we have notes, parse them
        if (!directPresent && !directAbsent && !directLate && !directOT && record.notes) {
          try {
            const parsedNotes = JSON.parse(record.notes);
            console.log('Parsing notes for employee', record.employee_id, ':', parsedNotes);
            
            if (typeof parsedNotes === 'object' && parsedNotes !== null) {
              const notesPresent = Number(parsedNotes.present_days) || 0;
              const notesAbsent = Number(parsedNotes.absent_days) || 0;
              const notesLate = Number(parsedNotes.late_days) || 0;
              const notesOT = Number(parsedNotes.ot_hours) || 0;
              const notesFood = Number(parsedNotes.food) || 0;
              const notesUniform = Number(parsedNotes.uniform) || 0;
              
              stats.present_days += notesPresent;
              stats.absent_days += notesAbsent;
              stats.late_days += notesLate;
              stats.ot_hours += notesOT;
              stats.food += notesFood;
              stats.uniform += notesUniform;
              
              console.log('Added from notes - Present:', notesPresent, 'Absent:', notesAbsent, 'OT:', notesOT);
            }
          } catch (e) {
            console.log('Failed to parse notes for employee', record.employee_id, ':', e);
            
            // PRIORITY 3: Last resort - count based on status
            switch (record.status) {
              case 'present':
                stats.present_days += 1;
                break;
              case 'absent':
                stats.absent_days += 1;
                break;
              case 'late':
                stats.late_days += 1;
                break;
            }
          }
        }

        console.log('Updated stats for employee', record.employee_id, ':', stats);
      });

      console.log('=== FINAL ALL EMPLOYEE STATS ===');
      Object.entries(employeeStats).forEach(([employeeId, stats]) => {
        console.log(`Employee ${employeeId}:`, {
          present: stats.present_days,
          absent: stats.absent_days,
          late: stats.late_days,
          ot: stats.ot_hours,
          food: stats.food,
          uniform: stats.uniform
        });
      });

      return employeeStats;
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache results
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });
};
