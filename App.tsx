import React, { useState, useEffect, Suspense, lazy } from 'react';
import '@/types'; // Ensure global JSX augmentations from types.ts are loaded
import { UserRole, User, InvestigationSession, MockTrainee, Scenario, Theme } from '@/types'; // Import Theme from types.ts
import { UI_TEXT } from '@/constants';
import PageLayout from '@/components/PageLayout';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import * as ApiService from '@/services/ApiService'; // Use the new ApiService
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// Lazy load the heavy view components
const TraineeView = lazy(() => import('@/components/TraineeView'));
const TrainerView = lazy(() => import('@/components/TrainerView'));


// Helper function to generate critical error HTML
const getCriticalErrorHTML = (uiTextStatus: string): string => {
  const appName = "סימולטור תשאול - מבית ענף שיטור דיגיטלי"; // Fallback app name
  const divStyle = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #1e293b; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; font-family: sans-serif; text-align: center; z-index: 9999; direction: rtl;";
  const h1Style = "font-size: 2em; color: #f87171;";
  const pStyle = "font-size: 1.2em; margin-top: 1em;";
  const pSubStyle = "margin-top: 0.5em;";
  const pFootStyle = "margin-top: 1em; font-size: 0.9em; color: #94a3b8;";

  return `
    <div style="${divStyle}">
      <h1 style="${h1Style}">שגיאה קריטית באפליקציה</h1>
      <p style="${pStyle}">
        רכיב חיוני (UI_TEXT ${uiTextStatus}) אינו זמין.
      </p>
      <p style="${pSubStyle}">
        האפליקציה אינה יכולה להמשיך. אנא בדוק את הקונסול (F12) של הדפדפן לשגיאות טעינת מודולים,
        במיוחד כאלה הקשורות לקבצים <code>constants.ts</code> או <code>types.ts</code>.
      </p>
      <p style="${pFootStyle}">
        (Diagnostic check in App.tsx) - ${appName}
      </p>
    </div>
  `;
};


// Diagnostic check for UI_TEXT
if (typeof UI_TEXT !== 'object' || UI_TEXT === null) {
  const uiTextStatus = UI_TEXT === undefined ? "(undefined)" : "(not an object)";
  console.error(`CRITICAL ERROR: UI_TEXT is ${uiTextStatus}. This usually indicates a problem with loading 'constants.ts' or its dependency 'types.ts'. Check the browser console for module resolution errors.`);
  
  const rootElementForError = document.getElementById('root');
  if (rootElementForError) {
    rootElementForError.innerHTML = getCriticalErrorHTML(uiTextStatus);
  }
  throw new Error(`UI_TEXT is ${uiTextStatus}. Application cannot start.`);
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(true);
  const [isLoginView, setIsLoginView] = useState<boolean>(true);
  const [theme, setTheme] = useState<Theme>(() => ApiService.getTheme());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [demoUsers, setDemoUsers] = useState<MockTrainee[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);


  useEffect(() => {
    const checkUserAndLoadData = async () => {
        setIsAppLoading(true);
        const storedUser = await ApiService.getCurrentUser();
        if (storedUser) {
            setCurrentUser(storedUser);
            setIsLoginModalOpen(false);
        }
        const users = await ApiService.getUsers();
        setDemoUsers(users.slice(0, 4));
        setIsAppLoading(false);
    };

    checkUserAndLoadData();
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
    ApiService.saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLogin = async (userEmail?: string, userPassword?: string) => {
    setError('');
    setIsLoading(true);

    const emailToUse = userEmail || email;
    const passwordToUse = userPassword || password;

    if (!emailToUse || !passwordToUse) {
      setError(UI_TEXT.errorFieldsMissing);
      setIsLoading(false);
      return;
    }
    
    const loggedInUser = await ApiService.login(emailToUse, passwordToUse);
    setIsLoading(false);

    if (loggedInUser) {
      setCurrentUser(loggedInUser);
      setIsLoginModalOpen(false);
      resetAuthForms();
    } else {
      setError(UI_TEXT.errorLoginFailed);
    }
  };

  const handleSignup = async () => {
    setError('');
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError(UI_TEXT.errorFieldsMissing);
      return;
    }
    if (password !== confirmPassword) {
      setError(UI_TEXT.errorPasswordsDontMatch);
      return;
    }
    
    setIsLoading(true);

    const { user, error: signupError } = await ApiService.signup(fullName, email, password);
    
    if (signupError === 'Email exists') {
        setError(UI_TEXT.errorEmailExists);
        setIsLoading(false);
        return;
    }

    if (user) {
        setError(UI_TEXT.accountCreatedSuccessfully);
        setTimeout(() => {
            setCurrentUser(user);
            setIsLoginModalOpen(false);
            resetAuthForms();
            setIsLoading(false);
        }, 1000);
    } else {
        setError(UI_TEXT.errorCreatingAccount);
        setIsLoading(false);
    }
  };


  const resetAuthForms = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setError('');
  };

  const handleLogout = async () => {
    await ApiService.logout();
    setCurrentUser(null);
    resetAuthForms();
    setIsLoginModalOpen(true);
  };

  const handleDemoUserLogin = async (demoUser: MockTrainee) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password || '');
    // Using a short timeout to allow state to update before triggering login
    setTimeout(() => handleLogin(demoUser.email, demoUser.password || ''), 0);
  };

  const toggleAuthView = () => {
    resetAuthForms();
    setIsLoginView(!isLoginView);
  }

  const renderContent = () => {
    if (isAppLoading) {
      return <LoadingSpinner message="טוען אפליקציה..." />;
    }
    
    if (!currentUser) {
      return null;
    }

    const loadingFallback = (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner message="טוען רכיב..." />
      </div>
    );

    if (currentUser.role === UserRole.TRAINEE) {
      return (
        <ErrorBoundary>
          <Suspense fallback={loadingFallback}>
            <TraineeView traineeIds={[currentUser.id]} onSessionComplete={ApiService.saveSession} theme={theme} />
          </Suspense>
        </ErrorBoundary>
      );
    } else if (currentUser.role === UserRole.TRAINER || currentUser.role === UserRole.SYSTEM_ADMIN) {
      return (
        <ErrorBoundary>
          <Suspense fallback={loadingFallback}>
            <TrainerView currentTrainer={currentUser} theme={theme} />
          </Suspense>
        </ErrorBoundary>
      );
    }
    return <p>תפקיד משתמש לא ידוע.</p>;
  };

  const renderAuthForm = () => {
    if (isLoginView) {
        return (
            <div className="space-y-4">
                <Input label={UI_TEXT.emailLabel} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" title="הזן כתובת אימייל" disabled={isLoading} />
                <Input label={UI_TEXT.passwordLabel} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" title="הזן סיסמה" disabled={isLoading} />
                {error && <p className="text-red-400 text-xs text-center" role="alert">{error}</p>}
                <Button onClick={() => handleLogin()} className="w-full" isLoading={isLoading} title={UI_TEXT.loginButton + ": נסה להתחבר למערכת עם הפרטים שהוזנו"}>
                    {UI_TEXT.loginButton}
                </Button>
            </div>
        );
    }
    return (
        <div className="space-y-4">
            <Input label={UI_TEXT.fullNameLabel} type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ישראל ישראלי" title="הזן שם מלא" disabled={isLoading} />
            <Input label={UI_TEXT.emailLabel} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" title="הזן כתובת אימייל" disabled={isLoading} />
            <Input label={UI_TEXT.passwordLabel} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="לפחות 6 תווים" title="הזן סיסמה" disabled={isLoading} />
            <Input label={UI_TEXT.confirmPasswordLabel} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="הקלד סיסמה שוב" title="אמת סיסמה" disabled={isLoading}/>
            {error && <p className={`text-xs text-center ${error === UI_TEXT.accountCreatedSuccessfully ? 'text-green-400' : 'text-red-400'}`} role="alert">{error}</p>}
            <Button onClick={handleSignup} className="w-full" isLoading={isLoading} title={UI_TEXT.signupButton}>
                {UI_TEXT.signupButton}
            </Button>
        </div>
    );
  };

  return (
    <PageLayout currentUserRole={currentUser ? currentUser.role : null} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
      {isLoginModalOpen && !currentUser && (
        <Modal 
          isOpen={isLoginModalOpen} 
          onClose={() => { /* Prevent closing by clicking outside or Escape if no user */ }} 
          title={isLoginView ? UI_TEXT.loginTitle : UI_TEXT.signupTitle}
          size="md"
        >
          {renderAuthForm()}
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className={`w-full border-t ${theme === 'light' ? 'border-secondary-300' : 'border-secondary-600'}`}></div>
            </div>
            <div className="relative flex justify-center">
              <span className={`px-2 text-xs ${theme === 'light' ? 'bg-white' : 'bg-secondary-800'} ${theme === 'light' ? 'text-secondary-500' : 'text-secondary-400'}`}>{UI_TEXT.orSeparator}</span>
            </div>
          </div>
          
          <button onClick={toggleAuthView} className={`w-full text-sm font-medium ${theme === 'light' ? 'text-primary-600 hover:text-primary-800' : 'text-primary-400 hover:text-primary-200'} transition-colors`} disabled={isLoading}>
              {isLoginView ? UI_TEXT.switchToSignup : UI_TEXT.switchToLogin}
          </button>

          {!isLoginView && (
            <div className="mt-4 text-xs text-center themed-text-secondary">
              <p>ברוכים הבאים לסימולטור התשאול המתקדם. צרו חשבון כדי להתחיל להתאמן בתרחישים מציאותיים.</p>
            </div>
          )}

          {isLoginView && (
            <div className="mt-6">
              <h3 className={`text-sm font-medium mb-2 text-center ${theme === 'light' ? 'text-secondary-700' : 'text-secondary-300'}`}>{UI_TEXT.quickLoginAsDemoUser}</h3>
              <div className="grid grid-cols-2 gap-2">
                {demoUsers.map(demoUser => (
                  <Button
                    key={demoUser.id}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleDemoUserLogin(demoUser)}
                    title={`התחבר כ: ${demoUser.name}`}
                    disabled={isLoading}
                  >
                    {demoUser.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}
      {renderContent()}
    </PageLayout>
  );
};

export default App;