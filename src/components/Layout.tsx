import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, DollarSign, Target, FileText, Settings, Bell, User, Building2, FileBarChart, Menu, X, Download, LogOut, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { OfflineStatus } from '@/components/OfflineStatus';
interface LayoutProps {
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({
  children
}) => {
  const location = useLocation();
  const {
    user,
    signOut
  } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }

    // Listen for PWA install prompt (desktop only)
    const handleBeforeInstallPrompt = (e: any) => {
      // Check if it's desktop (not mobile)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (!isMobile) {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallButton(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const {
        outcome
      } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallButton(false);
      }
      setDeferredPrompt(null);
    }
  };
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  const navigation = [{
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  }, {
    name: 'Employees',
    href: '/employees',
    icon: Users
  }, {
    name: 'Attendance',
    href: '/attendance',
    icon: Clock
  }, {
    name: 'Payroll',
    href: '/payroll',
    icon: DollarSign
  }, {
    name: 'Branches',
    href: '/branches',
    icon: Building2
  }, {
    name: 'Reports',
    href: '/reports',
    icon: FileText
  }, {
    name: 'Settings',
    href: '/settings',
    icon: Settings
  }, {
    name: 'Customized Reports',
    href: '/customized-reports',
    icon: FileBarChart
  }, {
    name: 'Check',
    href: '/check',
    icon: Calculator
  }];
  return <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Offline Status Indicator */}
      <OfflineStatus />
      
      {/* Fixed Header */}
      <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          {/* Left side - Hamburger menu for mobile */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="md:hidden" onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800 hidden sm:block">SSS Solutions</span>
            </div>
          </div>
          
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <div className="relative">
              
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* PWA Install Button - Desktop only */}
            {showInstallButton && <Button variant="outline" size="sm" onClick={handleInstallClick} className="hidden md:flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Install App</span>
              </Button>}
            
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                
              </div>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-gray-600 hover:text-gray-900">
                <LogOut className="h-4 w-4" />
                <span className="hidden md:ml-2 md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-20 min-h-screen">
        {/* Desktop Sidebar - always visible on desktop */}
        <div className="hidden md:block w-64 bg-white shadow-lg fixed left-0 top-20 bottom-0 overflow-y-auto z-40">
          <nav className="mt-8">
            {navigation.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return <Link key={item.name} to={item.href} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>;
          })}
          </nav>
        </div>

        {/* Mobile Sidebar - overlay */}
        {isMobileMenuOpen && <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={toggleMobileMenu}>
            <div className="fixed left-0 top-20 bottom-0 w-64 bg-white shadow-lg overflow-y-auto" onClick={e => e.stopPropagation()}>
              <nav className="mt-8">
                {navigation.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return <Link key={item.name} to={item.href} className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`} onClick={toggleMobileMenu}>
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>;
            })}
              </nav>
            </div>
          </div>}

        {/* Main Content - responsive margin */}
        <div className="flex-1 overflow-auto md:ml-64">
          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>;
};
export default Layout;