import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Briefcase,
  User as UserIcon,
  Search,
  LogOut,
  ChevronDown,
  Sparkles,
  Bell,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    { label: 'Home', path: '/', icon: Home },
    { label: 'Jobs', path: '#jobs', icon: Briefcase, badge: 'Phase 2' },
    { label: 'Network', path: '#network', icon: Sparkles, badge: 'Soon' },
    { label: 'Notifications', path: '#notifications', icon: Bell, count: 2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-linkedin-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-2 sm:gap-4">
          {/* Left: Brand Logo & Search */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-[4px] bg-linkedin-blue flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-linkedin-blue-hover transition-colors">
                <span>R2R</span>
              </div>
              <span className="hidden md:inline-block font-bold text-lg text-linkedin-blue tracking-tight">
                Resume<span className="text-linkedin-text-primary">2Role</span>
              </span>
            </Link>

            {/* LinkedIn-style Search Input */}
            <div className="relative hidden sm:block w-48 md:w-64 lg:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-linkedin-text-secondary">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search jobs, skills, companies..."
                disabled
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#EDF3F8] border border-transparent rounded-[4px] text-linkedin-text-primary placeholder:text-linkedin-text-secondary focus:bg-white focus:border-linkedin-blue focus:outline-none transition-all cursor-not-allowed"
                title="Search will be activated in Phase 2"
              />
            </div>
          </div>

          {/* Right: Navigation Items & User Avatar */}
          <nav className="flex items-center gap-1 sm:gap-3 md:gap-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <div key={item.label} className="relative group">
                  <Link
                    to={item.path.startsWith('#') ? '#' : item.path}
                    onClick={(e) => item.path.startsWith('#') && e.preventDefault()}
                    className={`flex flex-col items-center justify-center min-w-[52px] sm:min-w-[64px] h-14 px-1 text-center transition-colors border-b-2 ${
                      isActive
                        ? 'border-linkedin-blue text-linkedin-text-primary font-semibold'
                        : 'border-transparent text-linkedin-text-secondary hover:text-linkedin-text-primary'
                    }`}
                  >
                    <div className="relative">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-linkedin-blue' : ''}`} />
                      {item.count && (
                        <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {item.count}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] leading-tight mt-0.5 hidden xs:inline-block">
                      {item.label}
                    </span>
                  </Link>
                  {item.badge && (
                    <span className="hidden group-hover:block absolute -bottom-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-50">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}

            <div className="h-7 w-[1px] bg-linkedin-border mx-1 hidden sm:block" />

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex flex-col items-center justify-center min-w-[56px] h-14 text-linkedin-text-secondary hover:text-linkedin-text-primary transition-colors focus:outline-none"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-6 h-6 rounded-full bg-linkedin-blue text-white text-xs font-bold flex items-center justify-center ring-1 ring-white shadow-sm overflow-hidden">
                  {getInitials(user?.name)}
                </div>
                <div className="flex items-center gap-0.5 text-[11px] mt-0.5 font-medium leading-tight">
                  <span className="max-w-[48px] truncate">Me</span>
                  <ChevronDown className="w-3 h-3 text-linkedin-text-secondary" />
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white border border-linkedin-border rounded-[8px] shadow-linkedin-dropdown py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {/* User Snippet */}
                  <div className="px-4 py-3 border-b border-linkedin-border flex gap-3 items-center">
                    <div className="w-11 h-11 rounded-full bg-linkedin-blue text-white font-bold text-base flex items-center justify-center shrink-0 shadow">
                      {getInitials(user?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-linkedin-text-primary truncate">
                        {user?.name || 'Student User'}
                      </p>
                      <p className="text-xs text-linkedin-text-secondary truncate">
                        {user?.tagline || 'Aspiring Full Stack Developer'}
                      </p>
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        <CheckCircle className="w-2.5 h-2.5" />
                        {user?.role || 'student'}
                      </span>
                    </div>
                  </div>

                  {/* Account Options */}
                  <div className="px-2 py-1.5">
                    <div className="px-2 py-1 text-[11px] font-bold text-linkedin-text-muted uppercase tracking-wider">
                      Account
                    </div>
                    <div className="px-2 py-1.5 text-xs text-linkedin-text-secondary truncate">
                      <span className="font-medium text-linkedin-text-primary">Email: </span>
                      {user?.email}
                    </div>
                    <div className="px-2 py-1.5 text-xs text-linkedin-text-secondary">
                      <span className="font-medium text-linkedin-text-primary">Status: </span>
                      Phase 1 Foundation Active
                    </div>
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
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-[4px] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
