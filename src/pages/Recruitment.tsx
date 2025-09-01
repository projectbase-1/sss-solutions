
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Briefcase, Calendar, UserCheck, Plus, FileText, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MetricCard from '@/components/MetricCard';

const Recruitment = () => {
  const [showPostJobDialog, setShowPostJobDialog] = useState(false);
  const [showJobDetailDialog, setShowJobDetailDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState('postings');
  const [newJob, setNewJob] = useState({
    title: '',
    location: '',
    job_type: '',
    description: '',
    requirements: '',
    application_deadline: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recruitment data
  const { data: jobPostings = [] } = useQuery({
    queryKey: ['jobPostings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['jobApplications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_postings (title)
        `)
        .order('applied_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ['interviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          job_applications (
            candidate_name,
            candidate_email,
            job_postings (title)
          )
        `)
        .order('interview_date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Calculate metrics
  const recruitmentStats = {
    activeJobs: jobPostings.filter(job => job.status === 'active').length,
    totalApplications: applications.length,
    scheduledInterviews: interviews.filter(interview => interview.status === 'scheduled').length,
    hiredThisMonth: applications.filter(app => {
      const appliedDate = new Date(app.applied_at);
      const currentMonth = new Date().getMonth();
      return appliedDate.getMonth() === currentMonth && app.status === 'hired';
    }).length
  };

  const handlePostJob = async () => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .insert([{
          ...newJob,
          department: 'General',
          status: 'active',
          posted_date: new Date().toISOString().split('T')[0]
        }]);
      
      if (error) throw error;
      
      // Refresh the job postings list
      queryClient.invalidateQueries({ queryKey: ['jobPostings'] });
      
      toast({
        title: "Success",
        description: "Job posting created successfully!",
      });
      
      setShowPostJobDialog(false);
      setNewJob({
        title: '',
        
        location: '',
        job_type: '',
        description: '',
        requirements: '',
        application_deadline: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create job posting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewJob = (job) => {
    setSelectedJob(job);
    setShowJobDetailDialog(true);
  };

  const handleGenerateReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Job Title,Applications,Status,Posted Date\n"
      + jobPostings.map(job => {
        const jobApplications = applications.filter(app => app.job_posting_id === job.id);
        return `${job.title},${jobApplications.length},${job.status},${job.posted_date}`;
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "recruitment_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Recruitment report has been exported successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Recruitment</h1>
        <div className="flex space-x-4">
          <Button onClick={handleGenerateReport} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <Dialog open={showPostJobDialog} onOpenChange={setShowPostJobDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Post Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Post New Job</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Job Title"
                  value={newJob.title}
                  onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                />
                <Input
                  placeholder="Location"
                  value={newJob.location}
                  onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                />
                <Select value={newJob.job_type} onValueChange={(value) => setNewJob({...newJob, job_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Job Description"
                  value={newJob.description}
                  onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                />
                <Textarea
                  placeholder="Requirements"
                  value={newJob.requirements}
                  onChange={(e) => setNewJob({...newJob, requirements: e.target.value})}
                />
                <Input
                  type="date"
                  placeholder="Application Deadline"
                  value={newJob.application_deadline}
                  onChange={(e) => setNewJob({...newJob, application_deadline: e.target.value})}
                />
                <Button onClick={handlePostJob} className="w-full">
                  Post Job
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Jobs"
          value={recruitmentStats.activeJobs.toString()}
          icon={Briefcase}
          change="+2 this week"
          changeType="increase"
          color="blue"
        />
        <MetricCard
          title="Total Applications"
          value={recruitmentStats.totalApplications.toString()}
          icon={Users}
          change="+15 this week"
          changeType="increase"
          color="green"
        />
        <MetricCard
          title="Scheduled Interviews"
          value={recruitmentStats.scheduledInterviews.toString()}
          icon={Calendar}
          change="+3 this week"
          changeType="increase"
          color="yellow"
        />
        <MetricCard
          title="Hired This Month"
          value={recruitmentStats.hiredThisMonth.toString()}
          icon={UserCheck}
          change="+1 this month"
          changeType="increase"
          color="purple"
        />
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {['postings', 'candidates', 'interviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'postings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobPostings.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <p className="text-sm text-gray-600">{job.location}</p>
                  </div>
                  <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                    {job.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {job.description ? job.description.substring(0, 100) + '...' : 'No description available'}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {applications.filter(app => app.job_posting_id === job.id).length} applications
                  </span>
                  <Button variant="outline" size="sm" onClick={() => handleViewJob(job)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'candidates' && (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{application.candidate_name}</h3>
                    <p className="text-sm text-gray-600">{application.candidate_email}</p>
                    <p className="text-sm text-gray-500">
                      Applied for: {application.job_postings?.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      application.status === 'hired' ? 'default' :
                      application.status === 'interview' ? 'secondary' :
                      'outline'
                    }>
                      {application.status}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      {application.experience_years} years exp.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'interviews' && (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <Card key={interview.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{interview.job_applications?.candidate_name}</h3>
                    <p className="text-sm text-gray-600">
                      {interview.job_applications?.job_postings?.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(interview.interview_date).toLocaleDateString()} at {interview.interview_time}
                    </p>
                  </div>
                  <Badge variant={
                    interview.status === 'completed' ? 'default' :
                    interview.status === 'scheduled' ? 'secondary' :
                    'outline'
                  }>
                    {interview.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Job Detail Dialog */}
      <Dialog open={showJobDetailDialog} onOpenChange={setShowJobDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedJob?.title}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Location</h4>
                  <p className="text-gray-600">{selectedJob.location}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Job Type</h4>
                  <p className="text-gray-600">{selectedJob.job_type}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Status</h4>
                  <Badge variant={selectedJob.status === 'active' ? 'default' : 'secondary'}>
                    {selectedJob.status}
                  </Badge>
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Description</h4>
                <p className="text-gray-600">{selectedJob.description || 'No description available'}</p>
              </div>
              <div>
                <h4 className="font-semibold">Requirements</h4>
                <p className="text-gray-600">{selectedJob.requirements || 'No requirements specified'}</p>
              </div>
              <div>
                <h4 className="font-semibold">Applications</h4>
                <p className="text-gray-600">
                  {applications.filter(app => app.job_posting_id === selectedJob.id).length} applications received
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recruitment;
