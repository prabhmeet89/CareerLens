import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  User as UserIcon,
  Search,
  LogOut,
  ChevronDown,
  CheckCircle,
  UploadCloud,
  Briefcase,
  Bookmark,
  ClipboardList,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Navbar search state — seeded from the current URL search param when on /jobs
  const jobsSearchParam = useMemo(() => {
    if (location.pathname === '/jobs') {
      return new URLSearchParams(location.search).get('search') || '';
    }
    return '';
  }, [location]);
  const [navSearch, setNavSearch] = useState(jobsSearchParam);

  // Keep Navbar input in sync when the user is already on the Jobs page
  // and navigates via browser back/forward or filter chips
  useEffect(() => {
    setNavSearch(jobsSearchParam);
  }, [jobsSearchParam]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = navSearch.trim();
    if (!trimmed) {
      navigate('/jobs?tab=all');
    } else {
      navigate(`/jobs?tab=all&search=${encodeURIComponent(trimmed)}`);
    }
    // Clear the Navbar input after navigating (unless already on Jobs page,
    // where the input mirrors the URL param and will sync itself)
    if (location.pathname !== '/jobs') {
      setNavSearch('');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Jobs', path: '/jobs', icon: Briefcase },
    { label: 'Tracker', path: '/applications', icon: ClipboardList },
    { label: 'Saved', path: '/saved', icon: Bookmark },
    { label: 'Upload', path: '/upload', icon: UploadCloud, highlight: true },
    { label: 'Profile', path: '/profile', icon: UserIcon },
  ];

  return (
    <>
      {/* Top App Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#141414] border-b border-linkedin-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-2 sm:gap-4">
            {/* Left: Brand Logo & Search */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Logo */}
              <Link to="/dashboard" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-[4px] bg-linkedin-blue flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-linkedin-blue-hover transition-colors">
                  <span>CL</span>
                </div>
                <span className="font-bold text-lg text-linkedin-blue tracking-tight">
                  Career<span className="text-linkedin-text-primary">Lens</span>
                </span>
              </Link>

              {/* Desktop search input — hidden on mobile */}
              <form
                onSubmit={handleNavSearchSubmit}
                className="relative hidden sm:block w-48 md:w-64 lg:w-72"
                role="search"
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-linkedin-text-secondary">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="search"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Search jobs, skills, roles..."
                  aria-label="Search jobs"
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#EDF3F8] dark:bg-[#1A1A1A] border border-transparent dark:border-[#2A2A2A] rounded-[4px] text-linkedin-text-primary placeholder:text-linkedin-text-secondary focus:bg-white dark:focus:bg-[#141414] focus:border-linkedin-blue focus:outline-none transition-all"
                />
              </form>
            </div>

            {/* Right: Desktop Navigation Items & User Avatar */}
            <div className="flex items-center gap-1 sm:gap-3 md:gap-4">
              {/* Desktop Nav Items */}
              <nav className="hidden sm:flex items-center gap-1 md:gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      className={`flex flex-col items-center justify-center min-w-[54px] md:min-w-[60px] h-14 px-1 text-center transition-colors border-b-2 ${
                        isActive
                          ? 'border-linkedin-blue text-linkedin-text-primary font-semibold'
                          : 'border-transparent text-linkedin-text-secondary hover:text-linkedin-text-primary'
                      }`}
                    >
                      <div className="relative">
                        <Icon
                          className={`w-5 h-5 ${
                            isActive
                              ? 'text-linkedin-blue'
                              : item.highlight
                              ? 'text-linkedin-blue/80'
                              : ''
                          }`}
                        />
                      </div>
                      <span className="text-[11px] leading-tight mt-0.5">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Search Button */}
              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full text-linkedin-text-secondary hover:text-linkedin-blue hover:bg-[#EDF3F8] dark:hover:bg-[#1A1A1A] transition-colors"
                aria-label="Search jobs"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex items-center justify-center w-9 h-9 rounded-full text-linkedin-text-secondary hover:text-linkedin-text-primary hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors focus:outline-none focus:ring-2 focus:ring-linkedin-blue focus:ring-offset-1 dark:focus:ring-offset-[#141414]"
              >
                {isDark ? (
                  <Sun className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Moon className="w-4 h-4" aria-hidden="true" />
                )}
              </button>

              <div className="h-7 w-[1px] bg-linkedin-border mx-1 hidden sm:block" />

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center sm:flex-col sm:justify-center min-w-[44px] sm:min-w-[56px] h-11 sm:h-14 text-linkedin-text-secondary hover:text-linkedin-text-primary transition-colors focus:outline-none"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-linkedin-blue text-white text-xs font-bold flex items-center justify-center ring-1 ring-white dark:ring-[#141414] shadow-sm overflow-hidden">
                    {getInitials(user?.name)}
                  </div>
                  <div className="hidden sm:flex items-center gap-0.5 text-[11px] mt-0.5 font-medium leading-tight">
                    <span className="max-w-[48px] truncate">Me</span>
                    <ChevronDown className="w-3 h-3 text-linkedin-text-secondary" />
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-[#1C1C1E] border border-linkedin-border rounded-[8px] shadow-linkedin-dropdown dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {/* User Snippet */}
                    <div className="px-4 py-3 border-b border-linkedin-border flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-linkedin-blue text-white font-bold text-sm flex items-center justify-center shrink-0 shadow">
                        {getInitials(user?.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-linkedin-text-primary truncate">
                          {user?.name || 'Student User'}
                        </p>
                        <p className="text-xs text-linkedin-text-secondary truncate">
                          {user?.email || 'user@careerlens.com'}
                        </p>
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-[#0D2818] px-1.5 py-0.5 rounded">
                          <CheckCircle className="w-2.5 h-2.5" />
                          {user?.role || 'student'}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Shortcuts */}
                    <div className="px-2 py-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-linkedin-text-primary hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-[4px] transition-colors min-h-[44px]"
                      >
                        <UserIcon className="w-4 h-4 text-linkedin-blue" />
                        <span>My Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/upload');
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-linkedin-text-primary hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-[4px] transition-colors min-h-[44px]"
                      >
                        <UploadCloud className="w-4 h-4 text-linkedin-blue" />
                        <span>Upload Resume</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/saved');
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-linkedin-text-primary hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-[4px] transition-colors min-h-[44px]"
                      >
                        <Bookmark className="w-4 h-4 text-linkedin-blue" />
                        <span>Saved Jobs</span>
                      </button>
                    </div>

                    <div className="border-t border-linkedin-border my-1" />

                    {/* Privacy & Terms Links */}
                    <div className="px-2 py-1 space-y-0.5 text-xs">
                      <Link
                        to="/privacy"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-linkedin-text-secondary hover:text-linkedin-blue hover:bg-gray-50 dark:hover:bg-[#2A2A2A] rounded-[4px] transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-linkedin-blue" />
                        <span>Privacy &amp; Data Handling</span>
                      </Link>

                      <Link
                        to="/terms"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-linkedin-text-secondary hover:text-linkedin-blue hover:bg-gray-50 dark:hover:bg-[#2A2A2A] rounded-[4px] transition-colors"
                      >
                        <span>Terms of Service</span>
                      </Link>
                    </div>

                    <div className="border-t border-linkedin-border my-1" />

                    {/* Sign Out Action */}
                    <div className="px-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setDropdownOpen(false);
                          await logout();
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-600 dark:text-linkedin-danger hover:bg-red-50 dark:hover:bg-linkedin-danger-bg rounded-[4px] transition-colors min-h-[44px]"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (< sm) */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-t border-linkedin-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)] dark:shadow-[0_-1px_0_rgba(255,255,255,0.06)] pb-[max(0.25rem,env(safe-area-inset-bottom))]"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 h-14 max-w-md mx-auto items-center">
          {[
            { label: 'Home', path: '/dashboard', icon: Home },
            { label: 'Jobs', path: '/jobs', icon: Briefcase },
            { label: 'Tracker', path: '/applications', icon: ClipboardList },
            { label: 'Saved', path: '/saved', icon: Bookmark },
            { label: 'Upload', path: '/upload', icon: UploadCloud, highlight: true },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                  isActive
                    ? 'text-linkedin-blue font-bold'
                    : 'text-linkedin-text-secondary hover:text-linkedin-text-primary'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? 'text-linkedin-blue'
                        : tab.highlight
                        ? 'text-linkedin-blue/80'
                        : ''
                    }`}
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-linkedin-blue" />
                  )}
                </div>
                <span className="text-[10px] leading-tight mt-1">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
