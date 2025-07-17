

import React from 'react';
import { UI_TEXT } from '@/constants';
import { UserRole, Theme } from '@/types';
import Button from '@/components/common/Button';
import MagicMouseTrail from '@/components/common/MagicMouseTrail';

interface PageLayoutProps {
  children: React.ReactNode;
  currentUserRole: UserRole | null;
  onLogout: () => void;
  toggleTheme: () => void;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, currentUserRole, onLogout, toggleTheme }) => {
  const getRoleText = (role: UserRole | null) => {
    if (role === UserRole.TRAINEE) return UI_TEXT.roleTrainee;
    if (role === UserRole.TRAINER) return UI_TEXT.roleTrainer;
    return '';
  }

  return (
    <>
      <MagicMouseTrail />
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100" dir="rtl">
        <header className="p-4 sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm dark:shadow-lg">
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
                placeholder.className = "text-xl font-bold text-primary-600 dark:text-primary-400";
                placeholder.textContent = UI_TEXT.appName.substring(0,1);
                target.parentNode?.insertBefore(placeholder, target);
              }}
            />
            <h1 className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">{UI_TEXT.appName}</h1>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-800 focus:ring-primary-500 dark:focus:ring-primary-400"
              aria-label="Toggle theme"
              title="החלף עיצוב"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 block dark:hidden">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 hidden dark:block">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12h2.25m.386-6.364l1.591 1.591M12 12a2.25 2.25 0 00-2.25 2.25c0 1.37.296 2.652.813 3.75m0 0a2.25 2.25 0 004.374 0m2.187-3.75a2.25 2.25 0 00-4.374 0m1.187 3.75a2.25 2.25 0 01-2.187 0M12 2.25a.75.75 0 01.75.75v.008c0 .413-.337.75-.75.75S11.25 3.413 11.25 3v-.008a.75.75 0 01.75-.75z" />
              </svg>
            </button>
            {currentUserRole && currentUserRole !== UserRole.NONE && (
               <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="text-sm hidden sm:inline text-neutral-600 dark:text-neutral-300 opacity-90">תפקיד: {getRoleText(currentUserRole)}</span>
                  <button 
                      onClick={onLogout}
                      className="text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-600 dark:hover:text-white px-3 py-1.5 rounded-md transition-colors"
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
      <footer className="text-center p-4 text-xs sm:text-sm bg-neutral-100 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
        © {new Date().getFullYear()} {UI_TEXT.appName}. כל הזכויות שמורות.
      </footer>
    </div>
    </>
  );
};

export default PageLayout;