import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Zap, Globe, Palette, Key, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { 
  useGeneralSettings, 
  useUpdateGeneralSettings,
  useNotificationSettings,
  useUpdateNotificationSettings,
  useSecuritySettings,
  useUpdateSecuritySettings 
} from '@/hooks/useSettings';
import { usePayrollSettings, useUpdatePayrollSettings, useCreatePayrollSettings } from '@/hooks/usePayrollSettings';
import TwoFactorAuth from '@/components/settings/TwoFactorAuth';
import DeleteSection from '@/components/settings/DeleteSection';

const Settings = () => {
  return (
    <SettingsProvider>
      <SettingsContent />
    </SettingsProvider>
  );
};

const SettingsContent = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { user } = useAuth();
  
  // Hooks for settings
  const { data: generalSettings } = useGeneralSettings();
  const { data: notificationSettings } = useNotificationSettings();
  const { data: securitySettings } = useSecuritySettings();
  const { data: payrollSettings } = usePayrollSettings();
  
  const updateGeneralSettings = useUpdateGeneralSettings();
  const updateNotificationSettings = useUpdateNotificationSettings();
  const updateSecuritySettings = useUpdateSecuritySettings();
  const updatePayrollSettings = useUpdatePayrollSettings();
  const createPayrollSettings = useCreatePayrollSettings();
  
  // Form states
  const [generalForm, setGeneralForm] = useState({
    company_name: '',
    company_email: '',
    company_address: '',
    phone: '',
    timezone: 'UTC-5 (Eastern Time)',
    language: 'English',
    currency: 'USD ($)',
    date_format: 'MM/DD/YYYY',
    time_format: '12-hour',
    theme: 'Light',
    sidebar_mode: 'Expanded'
  });
  
  const [notificationForm, setNotificationForm] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false
  });
  
  const [securityForm, setSecurityForm] = useState({
    two_factor_enabled: false,
    password_policy_enabled: false
  });

  const [payrollForm, setPayrollForm] = useState({
    income_tax_rate: 10,
    pf_rate: 12,
    esi_rate: 0.75,
    pay_frequency: 'monthly',
    monthly_pay_date: 1,
    overtime_rate: 1.5
  });

  // Update forms when data loads
  useEffect(() => {
    if (generalSettings) {
      setGeneralForm({
        company_name: generalSettings.company_name || '',
        company_email: generalSettings.company_email || '',
        company_address: generalSettings.company_address || '',
        phone: generalSettings.phone || '',
        timezone: generalSettings.timezone,
        language: generalSettings.language,
        currency: generalSettings.currency,
        date_format: generalSettings.date_format,
        time_format: generalSettings.time_format,
        theme: generalSettings.theme,
        sidebar_mode: generalSettings.sidebar_mode
      });
    }
  }, [generalSettings]);

  useEffect(() => {
    if (notificationSettings) {
      setNotificationForm({
        email_notifications: notificationSettings.email_notifications,
        push_notifications: notificationSettings.push_notifications,
        sms_notifications: notificationSettings.sms_notifications
      });
    }
  }, [notificationSettings]);

  useEffect(() => {
    if (securitySettings) {
      setSecurityForm({
        two_factor_enabled: securitySettings.two_factor_enabled,
        password_policy_enabled: securitySettings.password_policy_enabled
      });
    }
  }, [securitySettings]);

  useEffect(() => {
    if (payrollSettings) {
      setPayrollForm({
        income_tax_rate: payrollSettings.income_tax_rate,
        pf_rate: payrollSettings.pf_rate,
        esi_rate: payrollSettings.esi_rate,
        pay_frequency: payrollSettings.pay_frequency,
        monthly_pay_date: payrollSettings.monthly_pay_date,
        overtime_rate: payrollSettings.overtime_rate
      });
    }
  }, [payrollSettings]);

  const handleGeneralSave = () => {
    if (!user?.id) return;
    
    updateGeneralSettings.mutate({
      ...generalForm,
      user_id: user.id
    });
  };

  const handleNotificationSave = () => {
    if (!user?.id) return;
    
    updateNotificationSettings.mutate({
      ...notificationForm,
      user_id: user.id
    });
  };

  const handleSecuritySave = () => {
    if (!user?.id) return;
    
    updateSecuritySettings.mutate({
      ...securityForm,
      user_id: user.id
    });
  };

  const handlePayrollSave = () => {
    if (payrollSettings?.id) {
      // Update existing settings
      updatePayrollSettings.mutate({
        ...payrollForm,
        id: payrollSettings.id
      });
    } else {
      // Create new settings
      createPayrollSettings.mutate(payrollForm);
    }
  };

  const settingsNavigation = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'two-factor', name: 'Two-Factor Auth', icon: Shield },
    { id: 'payroll', name: 'Payroll Settings', icon: User },
    { id: 'users', name: 'User Management', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'delete', name: 'Delete', icon: Trash },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'integrations', name: 'Integrations', icon: Zap },
    { id: 'localization', name: 'Localization', icon: Globe },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'api', name: 'API Keys', icon: Key },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Settings Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="space-y-2">
              {settingsNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input 
                        id="company-name" 
                        placeholder="Enter company name"
                        value={generalForm.company_name}
                        onChange={(e) => setGeneralForm(prev => ({ ...prev, company_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company-email">Company Email</Label>
                      <Input 
                        id="company-email" 
                        type="email" 
                        placeholder="Enter company email"
                        value={generalForm.company_email}
                        onChange={(e) => setGeneralForm(prev => ({ ...prev, company_email: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="company-address">Company Address</Label>
                    <Input 
                      id="company-address" 
                      placeholder="Enter company address"
                      value={generalForm.company_address}
                      onChange={(e) => setGeneralForm(prev => ({ ...prev, company_address: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        placeholder="Enter phone number"
                        value={generalForm.phone}
                        onChange={(e) => setGeneralForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={generalForm.timezone} onValueChange={(value) => setGeneralForm(prev => ({ ...prev, timezone: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</SelectItem>
                          <SelectItem value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</SelectItem>
                          <SelectItem value="UTC+0 (GMT)">UTC+0 (GMT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleGeneralSave} disabled={updateGeneralSettings.isPending}>
                    {updateGeneralSettings.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="two-factor" className="space-y-4">
              <TwoFactorAuth />
            </TabsContent>

            <TabsContent value="payroll" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payroll Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="income-tax-rate">Income Tax Rate (%)</Label>
                      <Input 
                        id="income-tax-rate" 
                        type="number"
                        step="0.01"
                        placeholder="10.00"
                        value={payrollForm.income_tax_rate}
                        onChange={(e) => setPayrollForm(prev => ({ ...prev, income_tax_rate: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pf-rate">PF Rate (%)</Label>
                      <Input 
                        id="pf-rate" 
                        type="number"
                        step="0.01"
                        placeholder="12.00"
                        value={payrollForm.pf_rate}
                        onChange={(e) => setPayrollForm(prev => ({ ...prev, pf_rate: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="esi-rate">ESI Rate (%)</Label>
                      <Input 
                        id="esi-rate" 
                        type="number"
                        step="0.01"
                        placeholder="0.75"
                        value={payrollForm.esi_rate}
                        onChange={(e) => setPayrollForm(prev => ({ ...prev, esi_rate: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="overtime-rate">Overtime Rate (multiplier)</Label>
                      <Input 
                        id="overtime-rate" 
                        type="number"
                        step="0.1"
                        placeholder="1.5"
                        value={payrollForm.overtime_rate}
                        onChange={(e) => setPayrollForm(prev => ({ ...prev, overtime_rate: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pay-frequency">Pay Frequency</Label>
                      <Select value={payrollForm.pay_frequency} onValueChange={(value) => setPayrollForm(prev => ({ ...prev, pay_frequency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="monthly-pay-date">Monthly Pay Date</Label>
                      <Input 
                        id="monthly-pay-date" 
                        type="number"
                        min="1"
                        max="31"
                        placeholder="1"
                        value={payrollForm.monthly_pay_date}
                        onChange={(e) => setPayrollForm(prev => ({ ...prev, monthly_pay_date: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handlePayrollSave} 
                    disabled={updatePayrollSettings.isPending || createPayrollSettings.isPending}
                  >
                    {(updatePayrollSettings.isPending || createPayrollSettings.isPending) ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">User Roles</h3>
                      <Button size="sm">Add Role</Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span>Administrator</span>
                        <span className="text-sm text-gray-600">Full access</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span>HR Manager</span>
                        <span className="text-sm text-gray-600">HR operations</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span>Employee</span>
                        <span className="text-sm text-gray-600">Basic access</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-600">Add an extra layer of security</p>
                      </div>
                      <Switch 
                        checked={securityForm.two_factor_enabled}
                        onCheckedChange={(checked) => setSecurityForm(prev => ({ ...prev, two_factor_enabled: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Password Policy</h3>
                        <p className="text-sm text-gray-600">Enforce strong passwords</p>
                      </div>
                      <Switch 
                        checked={securityForm.password_policy_enabled}
                        onCheckedChange={(checked) => setSecurityForm(prev => ({ ...prev, password_policy_enabled: checked }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSecuritySave} disabled={updateSecuritySettings.isPending}>
                    {updateSecuritySettings.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="delete" className="space-y-4">
              <DeleteSection />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Email Notifications</h3>
                        <p className="text-sm text-gray-600">Receive updates via email</p>
                      </div>
                      <Switch 
                        checked={notificationForm.email_notifications}
                        onCheckedChange={(checked) => setNotificationForm(prev => ({ ...prev, email_notifications: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Push Notifications</h3>
                        <p className="text-sm text-gray-600">Browser notifications</p>
                      </div>
                      <Switch 
                        checked={notificationForm.push_notifications}
                        onCheckedChange={(checked) => setNotificationForm(prev => ({ ...prev, push_notifications: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">SMS Notifications</h3>
                        <p className="text-sm text-gray-600">Text message alerts</p>
                      </div>
                      <Switch 
                        checked={notificationForm.sms_notifications}
                        onCheckedChange={(checked) => setNotificationForm(prev => ({ ...prev, sms_notifications: checked }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleNotificationSave} disabled={updateNotificationSettings.isPending}>
                    {updateNotificationSettings.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Slack</h3>
                        <p className="text-sm text-gray-600">Team communication</p>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Google Calendar</h3>
                        <p className="text-sm text-gray-600">Schedule integration</p>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Microsoft Teams</h3>
                        <p className="text-sm text-gray-600">Video conferencing</p>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="localization" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Localization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select value={generalForm.language} onValueChange={(value) => setGeneralForm(prev => ({ ...prev, language: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={generalForm.currency} onValueChange={(value) => setGeneralForm(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD ($)">USD ($)</SelectItem>
                          <SelectItem value="EUR (€)">EUR (€)</SelectItem>
                          <SelectItem value="GBP (£)">GBP (£)</SelectItem>
                          <SelectItem value="JPY (¥)">JPY (¥)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date-format">Date Format</Label>
                      <Select value={generalForm.date_format} onValueChange={(value) => setGeneralForm(prev => ({ ...prev, date_format: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="time-format">Time Format</Label>
                      <Select value={generalForm.time_format} onValueChange={(value) => setGeneralForm(prev => ({ ...prev, time_format: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12-hour">12-hour</SelectItem>
                          <SelectItem value="24-hour">24-hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleGeneralSave} disabled={updateGeneralSettings.isPending}>
                    {updateGeneralSettings.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select value={generalForm.theme} onValueChange={(value) => setGeneralForm(prev => ({ ...prev, theme: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Light">Light</SelectItem>
                          <SelectItem value="Dark">Dark</SelectItem>
                          <SelectItem value="Auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="color-scheme">Color Scheme</Label>
                      <div className="flex space-x-2 mt-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full cursor-pointer border-2 border-blue-500"></div>
                        <div className="w-8 h-8 bg-green-500 rounded-full cursor-pointer border-2 border-transparent hover:border-green-500"></div>
                        <div className="w-8 h-8 bg-purple-500 rounded-full cursor-pointer border-2 border-transparent hover:border-purple-500"></div>
                        <div className="w-8 h-8 bg-red-500 rounded-full cursor-pointer border-2 border-transparent hover:border-red-500"></div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="sidebar">Sidebar</Label>
                      <Select value={generalForm.sidebar_mode} onValueChange={(value) => setGeneralForm(prev => ({ ...prev, sidebar_mode: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Expanded">Expanded</SelectItem>
                          <SelectItem value="Collapsed">Collapsed</SelectItem>
                          <SelectItem value="Auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleGeneralSave} disabled={updateGeneralSettings.isPending}>
                    {updateGeneralSettings.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">API Access</h3>
                      <Button size="sm">Generate New Key</Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">Production Key</span>
                          <p className="text-sm text-gray-600">••••••••••••••••••••••••••••••••</p>
                        </div>
                        <Button variant="outline" size="sm">Regenerate</Button>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">Development Key</span>
                          <p className="text-sm text-gray-600">••••••••••••••••••••••••••••••••</p>
                        </div>
                        <Button variant="outline" size="sm">Regenerate</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
