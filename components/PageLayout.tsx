

import React from 'react';
import { UI_TEXT } from '@/constants';
import { UserRole, Theme } from '@/types';
import Button from '@/components/common/Button';

interface PageLayoutProps {
  children: React.ReactNode;
  currentUserRole: UserRole | null;
  onLogout: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, currentUserRole, onLogout, theme, toggleTheme }) => {
  const getRoleText = (role: UserRole | null) => {
    if (role === UserRole.TRAINEE) return UI_TEXT.roleTrainee;
    if (role === UserRole.TRAINER) return UI_TEXT.roleTrainer;
    return '';
  }

  const headerBgColor = theme === 'light' ? 'bg-white border-b border-secondary-200 shadow-sm' : 'bg-secondary-800 border-b border-secondary-700 shadow-lg';
  const appNameColor = theme === 'light' ? 'text-primary-600' : 'text-primary-400';
  const roleTextColor = theme === 'light' ? 'text-secondary-600' : 'text-secondary-300 opacity-90';
  const logoutButtonClass = theme === 'light' 
    ? 'text-sm font-medium text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-md transition-colors'
    : 'text-sm font-medium text-primary-300 hover:bg-primary-600 hover:text-white px-3 py-1.5 rounded-md transition-colors';
  const footerBgColor = theme === 'light' ? 'bg-secondary-100 border-t border-secondary-200' : 'bg-secondary-950 border-t border-secondary-700';
  const footerTextColor = theme === 'light' ? 'text-secondary-600' : 'text-secondary-400';
  const themeButtonColor = theme === 'light' ? 'text-secondary-700 hover:bg-secondary-200 focus:ring-primary-500' : 'text-secondary-300 hover:bg-secondary-700 focus:ring-primary-400';


  return (
    <div className={`min-h-screen flex flex-col ${theme === 'light' ? 'light-theme' : ''}`} dir="rtl">
      <header className={`p-4 sticky top-0 z-40 ${headerBgColor}`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <img 
              src="assets/images/logo.png" 
              alt="App Logo" 
              className="h-10 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const placeholder = document.createElement('span');
                placeholder.className = `text-xl font-bold ${appNameColor}`;
                placeholder.textContent = UI_TEXT.appName.substring(0,1);
                target.parentNode?.insertBefore(placeholder, target);
              }}
            />
            <h1 className={`text-xl sm:text-2xl font-bold ${appNameColor}`}>{UI_TEXT.appName}</h1>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full focus:outline-none focus:ring-2 ring-offset-2 ${theme === 'light' ? 'ring-offset-white' : 'ring-offset-secondary-800'} ${themeButtonColor}`}
              aria-label={theme === 'light' ? "Switch to dark theme" : "Switch to light theme"}
              title={theme === 'light' ? "החלף לעיצוב כהה" : "החלף לעיצוב בהיר"}
            >
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12h2.25m.386-6.364l1.591 1.591M12 12a2.25 2.25 0 00-2.25 2.25c0 1.37.296 2.652.813 3.75m0 0a2.25 2.25 0 004.374 0m2.187-3.75a2.25 2.25 0 00-4.374 0m1.187 3.75a2.25 2.25 0 01-2.187 0M12 2.25a.75.75 0 01.75.75v.008c0 .413-.337.75-.75.75S11.25 3.413 11.25 3v-.008a.75.75 0 01.75-.75z" />
                </svg>
              )}
            </button>
            {currentUserRole && currentUserRole !== UserRole.NONE && (
               <div className="flex items-center space-x-2 rtl:space-x-reverse"> {/* Reduced space for tighter layout */}
                  <span className={`text-sm hidden sm:inline ${roleTextColor}`}>תפקיד: {getRoleText(currentUserRole)}</span>
                  <button 
                      onClick={onLogout}
                      className={logoutButtonClass}
                      title="התנתק מהמערכת"
                  >
                      {UI_TEXT.logoutButton}
                  </button>
               </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <footer className={`text-center p-4 text-xs sm:text-sm ${footerBgColor} ${footerTextColor}`}>
        © {new Date().getFullYear()} {UI_TEXT.appName}. כל הזכויות שמורות.
      </footer>
    </div>
  );
};

export default PageLayout;