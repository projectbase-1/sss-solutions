
import React, { useState } from 'react';
import { Target, TrendingUp, Award, Star, Plus, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MetricCard from '@/components/MetricCard';
import { usePerformanceStats, useGoals, usePerformanceReviews } from '@/hooks/usePerformance';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Performance = () => {
  const { data: performanceStats } = usePerformanceStats();
  const { data: goals = [], refetch: refetchGoals } = useGoals();
  const { data: reviews = [] } = usePerformanceReviews();
  const { data: employees = [] } = useEmployees();
  const { toast } = useToast();

  const [showSetGoal, setShowSetGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    employee_id: '',
    title: '',
    description: '',
    target_date: ''
  });

  const handleSetGoal = async () => {
    try {
      const selectedEmployee = employees.find(emp => emp.id === goalForm.employee_id);

      const { data, error } = await supabase
        .from('goals')
        .insert([goalForm]);

      if (error) throw error;

      toast({
        title: "Goal Set",
        description: `Goal has been set for ${selectedEmployee?.name}.`,
      });

      setShowSetGoal(false);
      setGoalForm({
        employee_id: '',
        title: '',
        description: '',
        target_date: ''
      });
      
      refetchGoals();
    } catch (error) {
      console.error('Error setting goal:', error);
      toast({
        title: "Error",
        description: "Failed to set goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAnalytics = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Employee,Performance Score,Goals Completed,Review Status\n"
      + employees.map(emp => {
        const empReviews = reviews.filter(r => r.employee_id === emp.id);
        const empGoals = goals.filter(g => g.employee_id === emp.id);
        const avgScore = empReviews.length > 0 ? empReviews.reduce((sum, r) => sum + r.overall_score, 0) / empReviews.length : 0;
        const completedGoals = empGoals.filter(g => g.status === 'completed').length;
        return `${emp.name},${avgScore.toFixed(1)},${completedGoals},${empReviews.length > 0 ? empReviews[0].status : 'No Review'}`;
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "performance_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Analytics Generated",
      description: "Performance analytics report has been downloaded.",
    });
  };

  // Get top performers for this quarter
  const topPerformers = reviews
    .filter(review => review.overall_score >= 4.0)
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 5)
    .map(review => {
      const employee = employees.find(emp => emp.id === review.employee_id);
      return { ...review, employee };
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Performance Management</h1>
        <div className="flex space-x-4">
          <Button onClick={handleAnalytics} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Dialog open={showSetGoal} onOpenChange={setShowSetGoal}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Set Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set New Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select value={goalForm.employee_id} onValueChange={(value) => setGoalForm({...goalForm, employee_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.employee_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Goal Title</Label>
                  <Input
                    id="title"
                    value={goalForm.title}
                    onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                    placeholder="Enter goal title..."
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={goalForm.description}
                    onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                    placeholder="Describe the goal..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="target_date">Target Date</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={goalForm.target_date}
                    onChange={(e) => setGoalForm({...goalForm, target_date: e.target.value})}
                  />
                </div>
                <Button onClick={handleSetGoal} className="w-full">
                  Set Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Avg Performance Score"
          value={performanceStats?.averageScore || "4.2"}
          icon={TrendingUp}
          change="+0.3 from last quarter"
          changeType="increase"
          color="green"
        />
        <MetricCard
          title="Goals Completed"
          value={performanceStats?.completedGoals || goals.filter(g => g.status === 'completed').length}
          icon={Target}
          change="+12 this quarter"
          changeType="increase"
          color="blue"
        />
        <MetricCard
          title="Pending Reviews"
          value={performanceStats?.pendingReviews || reviews.filter(r => r.status === 'draft').length}
          icon={Award}
          change="-3 from last month"
          changeType="decrease"
          color="yellow"
        />
        <MetricCard
          title="Top Performers"
          value={performanceStats?.topPerformers || topPerformers.length}
          icon={Star}
          change="+2 this quarter"
          changeType="increase"
          color="purple"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performers This Quarter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={performer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">#{index + 1}</span>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">
                      {performer.employee?.name?.split(' ').map(n => n[0]).join('') || '??'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{performer.employee?.name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-600">{performer.employee?.position || ''}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold text-lg">{performer.overall_score.toFixed(1)}</p>
                    <p className="text-sm text-gray-600">Performance Score</p>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(performer.overall_score)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            {topPerformers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No performance reviews available for this quarter.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.slice(0, 5).map((goal) => {
                const employee = employees.find(emp => emp.id === goal.employee_id);
                return (
                  <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{goal.title}</h4>
                      <p className="text-sm text-gray-600">{employee?.name || 'Unknown Employee'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-blue-600 rounded-full" 
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{goal.progress}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Performance Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.slice(0, 5).map((review) => {
                const employee = employees.find(emp => emp.id === review.employee_id);

                return (
                  <div key={review.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{employee?.name || 'Unknown Employee'}</h4>
                      <p className="text-sm text-gray-600">{employee?.position || ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{review.overall_score.toFixed(1)}</p>
                      <p className="text-sm text-gray-600">Score</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Performance;
