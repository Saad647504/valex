'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/authcontext';
import AuthWrapper from '@/components/auth/authwrapper';
import DeskScene from '@/components/deskscene';
import FocusTimer from '@/components/timer/focustimer';
import AnalyticsDashboard from '@/components/analytics/analyticsdashboard';
import AIAssistant from '@/components/ai/aiassistant';
import KanbanBoard from '@/components/projects/kanbanboard';
import QuickNotes from '@/components/notes/quicknotes';
import SimplePeopleSearch from '@/components/people/simplepeoplesearch';
import UserSettings from '@/components/profile/usersettings';
import GlobalSearch from '@/components/search/globalsearch';
import NotificationsPage from '@/components/notifications/notificationspage';
import Colleagues from '@/components/team/colleagues';
import ExplosiveAnalyticsSection from '@/components/landing/explosiveanalyticsection';
import CyberpunkAIAssistant from '@/components/landing/cyberpunk-optimized';
import OrganicKanbanFlow from '@/components/landing/organickanbanflow';
import FocusTimerLandingSection from '@/components/landing/focustimerladingsection';
import QuickNotesLandingSection from '@/components/landing/quicknoteslandingsection';
import PendingInvitations from '@/components/team/pendinginvitations';
import ProjectsDashboard from '@/components/projects/projectsdashboard';

function MainPage() {
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  // Track where the user launched the Focus Timer from so Back can return correctly
  const [timerEntryFrom, setTimerEntryFrom] = useState<string | null>(null);
  const { user } = useAuth();
  
  const handleNavigation = (view: string, projectId?: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🚀 NAVIGATION: From', selectedView, 'to', view, 'projectId:', projectId);
      console.log('🚀 Current history before:', navigationHistory);
    }
    
    // Update navigation history and view together
    if (selectedView && selectedView !== view) {
      const newHistory = [...navigationHistory, selectedView];
      if (process.env.NODE_ENV !== 'production') {
        console.log('🚀 Added', selectedView, 'to history. New history will be:', newHistory);
      }
      setNavigationHistory(newHistory);
    }

    // Remember where Timer was launched from
    if (view === 'timer') {
      // If coming from landing, selectedView is null; encode that explicitly
      setTimerEntryFrom(selectedView ?? 'landing');
    } else if (selectedView === 'timer' && view !== 'timer') {
      // Leaving timer, clear entry point so future sessions re-evaluate origin
      setTimerEntryFrom(null);
    }
    
    setSelectedView(view);
    if (projectId) {
      setSelectedProjectId(projectId);
    } else if (view !== 'kanban' && view !== 'timer') {
      // Clear project ID when not navigating to kanban or timer
      setSelectedProjectId(null);
    }
  };

  const handleBack = () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔙 BACK BUTTON: Current view:', selectedView, 'History:', navigationHistory);
    }

    // Special handling: exiting Focus Timer should return to where it was launched from
    if (selectedView === 'timer') {
      if (timerEntryFrom === 'landing' || timerEntryFrom === null) {
        console.log('🔙 Exiting Timer back to landing');
        setSelectedView(null);
        setSelectedProjectId(null);
      } else {
        console.log('🔙 Exiting Timer back to', timerEntryFrom);
        setSelectedView(timerEntryFrom);
        if (timerEntryFrom !== 'kanban' && timerEntryFrom !== 'timer') {
          setSelectedProjectId(null);
        }
      }
      return;
    }
    
    if (navigationHistory.length > 0) {
      // Go back to the previous view in history
      const previousView = navigationHistory[navigationHistory.length - 1];
      const newHistory = navigationHistory.slice(0, -1);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔙 Going back from', selectedView, 'to', previousView);
        console.log('🔙 New history will be:', newHistory);
      }
      
      setNavigationHistory(newHistory);
      setSelectedView(previousView);
      
      // Clear project ID when going back to non-project views
      if (previousView !== 'kanban' && previousView !== 'timer') {
        setSelectedProjectId(null);
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔙 Cleared project ID');
        }
      }
    } else {
      // No history - provide smart defaults based on current view
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔙 No history available');
      }
      // Improve logic: if we are in timer, return to where we came from
      if (selectedView === 'timer') {
        if (timerEntryFrom === 'landing' || timerEntryFrom === null) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('🔙 Exiting Timer back to landing');
          }
          setSelectedView(null);
          setSelectedProjectId(null);
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.log('🔙 Exiting Timer back to', timerEntryFrom);
          }
          setSelectedView(timerEntryFrom);
          if (timerEntryFrom !== 'kanban' && timerEntryFrom !== 'timer') {
            setSelectedProjectId(null);
          }
        }
      } else if (selectedView === 'kanban') {
        // Keep existing behavior for kanban fallback
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔙 Going from kanban to projects (smart default)');
        }
        setSelectedView('projects');
      } else {
        // Otherwise go to landing
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔙 Going to landing page');
        }
        setSelectedView(null);
        setSelectedProjectId(null);
      }
    }
  };

  // Global navigation events for components that don't receive onNavigate
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const ce = ev as CustomEvent<string>;
        const targetView = ce.detail;
        if (typeof targetView === 'string') {
          handleNavigation(targetView);
        }
      } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('navigate', handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('navigate', handler as EventListener);
      }
    };
  }, [selectedView, navigationHistory]);

  try {
    // Handle different views
    if (selectedView === 'timer') {
      return <FocusTimer onBack={handleBack} onNavigate={handleNavigation} projectId={selectedProjectId || undefined} />;
    }
    
    if (selectedView === 'analytics') {
      // Show personal analytics for the logged-in user
      return <AnalyticsDashboard userId={user?.id} onBack={handleBack} />;
    }
    if (selectedView === 'ai') {
      return <AIAssistant onBack={handleBack} />;
    }
    if (selectedView === 'projects') {
      return <ProjectsDashboard 
        onBack={handleBack} 
        onNavigate={handleNavigation} 
      />;
    }
    if (selectedView === 'kanban') {
      return <KanbanBoard 
        onBack={handleBack} 
        projectId={selectedProjectId || undefined}
        onNavigate={handleNavigation}
      />;
    }
    if (selectedView === 'notes') {
      return <QuickNotes onBack={handleBack} />;
    }
    
    if (selectedView === 'people') {
      return <SimplePeopleSearch onBack={handleBack} onNavigate={handleNavigation} />;
    }
    
    if (selectedView === 'colleagues') {
      return <Colleagues onBack={handleBack} />;
    }
    
    if (selectedView === 'search') {
      return <GlobalSearch onBack={handleBack} />;
    }
    
    if (selectedView === 'notifications') {
      return <NotificationsPage onBack={handleBack} onNavigate={handleNavigation} />;
    }
    
    if (selectedView === 'profile') {
      return <UserSettings onBack={handleBack} />;
    }
    
    if (selectedView === 'invitations') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 text-white">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold">Team Invitations</h1>
              <button 
                onClick={handleBack}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
            <PendingInvitations />
          </div>
        </div>
      );
    }
    
    if (selectedView === 'login') {
      return <AuthWrapper onBack={handleBack} />;
    }
    
    // Show proper dashboard for logged in users
    if (user) {
      return <DeskScene onNavigate={handleNavigation} isLoggedIn={!!user} />;
    }

    // Show landing page for non-logged in users
    return (
      <div className="relative">
        <DeskScene onNavigate={handleNavigation} isLoggedIn={false} />
        <ExplosiveAnalyticsSection />
        <CyberpunkAIAssistant />
        <OrganicKanbanFlow />
        <FocusTimerLandingSection />
        <QuickNotesLandingSection />
      </div>
    );
  } catch (error) {
    console.error('Error in MainPage component:', error);
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-lg">Error loading page. Check console.</div>
      </div>
    );
  }
}

export default function Home() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-slate-300 text-lg">Loading your workspace...</div>
        </div>
      </div>
    );
  }

  return <MainPage />;
}
