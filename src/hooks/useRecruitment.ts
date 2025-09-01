
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  job_type: string;
  description: string | null;
  requirements: string | null;
  status: string;
  posted_date: string;
  application_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_posting_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string | null;
  resume_url: string | null;
  cover_letter: string | null;
  experience_years: number;
  status: string;
  applied_at: string;
  updated_at: string;
  job_postings: {
    title: string;
  };
}

export interface Interview {
  id: string;
  application_id: string;
  interviewer_id: string;
  interview_date: string;
  interview_time: string;
  interview_type: string;
  status: string;
  notes: string | null;
  score: number | null;
  created_at: string;
  updated_at: string;
  job_applications: {
    candidate_name: string;
    job_postings: {
      title: string;
    };
  };
  employees: {
    name: string;
  };
}

export const useJobPostings = () => {
  return useQuery({
    queryKey: ['job-postings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as JobPosting[];
    },
  });
};

export const useJobApplications = () => {
  return useQuery({
    queryKey: ['job-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_postings (
            title
          )
        `)
        .order('applied_at', { ascending: false });
      
      if (error) throw error;
      return data as JobApplication[];
    },
  });
};

export const useInterviews = () => {
  return useQuery({
    queryKey: ['interviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          job_applications (
            candidate_name,
            job_postings (
              title
            )
          ),
          employees (
            name
          )
        `)
        .order('interview_date', { ascending: true });
      
      if (error) throw error;
      return data as Interview[];
    },
  });
};

export const useRecruitmentStats = () => {
  return useQuery({
    queryKey: ['recruitment-stats'],
    queryFn: async () => {
      const [jobsResult, applicationsResult, interviewsResult] = await Promise.all([
        supabase.from('job_postings').select('status'),
        supabase.from('job_applications').select('status'),
        supabase.from('interviews').select('status'),
      ]);
      
      if (jobsResult.error) throw jobsResult.error;
      if (applicationsResult.error) throw applicationsResult.error;
      if (interviewsResult.error) throw interviewsResult.error;
      
      const activeJobs = jobsResult.data.filter(j => j.status === 'active').length;
      const totalApplications = applicationsResult.data.length;
      const scheduledInterviews = interviewsResult.data.filter(i => i.status === 'scheduled').length;
      const hiredThisMonth = applicationsResult.data.filter(a => a.status === 'hired').length;
      
      return {
        activeJobs,
        totalApplications,
        scheduledInterviews,
        hiredThisMonth,
      };
    },
  });
};
