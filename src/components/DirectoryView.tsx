import React, { useState } from 'react';
import { RegisteredPerson, Role } from '../types';
import {
  Search,
  Filter,
  UserPlus,
  Trash2,
  ShieldCheck,
  Calendar,
  Building,
  CreditCard,
  Cpu,
} from 'lucide-react';

interface DirectoryViewProps {
  persons: RegisteredPerson[];
  onDeletePerson: (id: string) => void;
  onOpenRegister: () => void;
  theme: 'dark' | 'light';
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  persons,
  onDeletePerson,
  onOpenRegister,
  theme,
}) => {
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredPersons = persons.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.department.toLowerCase().includes(search.toLowerCase()) ||
      (p.cardId && p.cardId.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'all' || p.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role: Role) => {
    switch (role) {
      case 'Doctor':
        return 'bg-teal-500/20 text-teal-400 border border-teal-500/30';
      case 'Nurse':
        return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30';
      case 'Staff':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'Approved Visitor':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Patient Attendant':
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Ribbon */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
          isDark ? 'glass-panel-dark' : 'glass-panel-light'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or hospital ward..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              {['all', 'Doctor', 'Nurse', 'Staff', 'Approved Visitor', 'Patient Attendant'].map(
                (r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                      roleFilter === r
                        ? 'bg-white dark:bg-teal-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {r === 'all' ? 'All Personnel' : r}
                  </button>
                )
              )}
            </div>

            <button
              onClick={onOpenRegister}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Person</span>
            </button>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPersons.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300 mb-1">
              No matching records found
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Try adjusting your search criteria or register a new individual.
            </p>
            <button
              onClick={onOpenRegister}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold cursor-pointer"
            >
              Enroll New Personnel
            </button>
          </div>
        ) : (
          filteredPersons.map((person) => (
            <div
              key={person.id}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isDark ? 'glass-panel-dark' : 'glass-panel-light'
              }`}
            >
              <div>
                <div className="flex items-start gap-3.5 mb-3">
                  {person.photos[0] ? (
                    <img
                      src={person.photos[0]}
                      alt={person.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-700 shadow-sm shrink-0 bg-slate-900"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {person.name}
                      </h3>
                      <button
                        onClick={() => onDeletePerson(person.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                        title="Delete from biometric directory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getRoleBadgeClass(
                        person.role
                      )}`}
                    >
                      {person.role}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2.5">
                  <div className="flex items-center gap-2 truncate">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{person.department}</span>
                  </div>

                  {person.cardId && (
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{person.cardId}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                    <Cpu className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>
                      {person.descriptors.length} descriptor vector(s) active
                    </span>
                  </div>

                  {person.notes && (
                    <p className="text-[11px] text-slate-400 italic pt-1 line-clamp-2">
                      &quot;{person.notes}&quot;
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(person.registeredAt).toLocaleDateString()}
                </span>
                <span className="text-emerald-400 font-semibold">VERIFIED PASS</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
