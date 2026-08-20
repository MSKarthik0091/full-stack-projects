import { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { User } from '../types.ts';
import { UserCheck, Shield, ChevronDown, Check, Sparkles, RefreshCw } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal.tsx';

interface PersonaSwitcherProps {
  currentUser: User | null;
  onUserChanged: (user: User) => void;
  activeCommunityName?: string;
  activeRoleInCommunity?: string;
}

export function PersonaSwitcher({
  currentUser,
  onUserChanged,
  activeCommunityName,
  activeRoleInCommunity
}: PersonaSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      const data = await api.getPersonas();
      setPersonas(data.personas);
    } catch (e) {
      console.error('Failed to load personas', e);
    }
  };

  const handleSelectPersona = async (personaId: string) => {
    setLoading(true);
    try {
      const res = await api.switchUser(personaId);
      onUserChanged(res.user);
      setIsOpen(false);
    } catch (e) {
      console.error('Error switching persona', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDb = () => {
    setResetModalOpen(true);
  };

  const executeResetDb = async () => {
    setResetting(true);
    try {
      await api.resetDb();
      window.location.reload();
    } catch (e) {
      console.error(e);
      setResetting(false);
      setResetModalOpen(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div id="persona-switcher-bar" className="bg-[#183120] text-[#FAF8F3] border-b border-[#2A7B5F]/40 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2A7B5F] text-white font-bold border border-[#E8A227]/30 shadow-xs">
            <UserCheck className="w-3.5 h-3.5 text-[#E8A227]" />
            <span>Interactive Demo Persona:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-white">
              {currentUser.firstName} {currentUser.lastName}
            </span>
            <span className="text-[#FAF8F3]/70 font-medium">(@{currentUser.username})</span>
            
            {currentUser.platformRole === 'platformAdmin' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-[#E8A227] text-[#183120] font-extrabold text-[10px] tracking-wide shadow-xs border border-[#183120]/30">
                GLOBAL PLATFORM ADMIN
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-[#E0856E]/20 text-[#FAF8F3] font-bold text-[10px] border border-[#E0856E]/40">
                {activeCommunityName ? `${activeRoleInCommunity?.toUpperCase()} in ${activeCommunityName}` : 'Standard User'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            id="switch-persona-btn"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#C85A32] hover:bg-[#b34c28] text-white transition font-bold shadow-xs border border-[#E8A227]/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E8A227]" />
            <span>Switch Role / User</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          <button
            id="reset-db-btn"
            onClick={handleResetDb}
            disabled={resetting}
            title="Reset database to seed data"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1D2A24] hover:bg-black text-[#E0856E] font-semibold border border-[#E0856E]/30 transition"
          >
            <RefreshCw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo DB</span>
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#FAF8F3] text-[#1F2D24] rounded-lg shadow-2xl border border-[#2D6A4F]/30 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-[#2D6A4F]/15 font-semibold text-xs text-[#183120] flex items-center justify-between">
                <span>Select Test Persona</span>
                <span className="text-[10px] font-normal text-[#1F2D24]/60">Multi-Role Testing</span>
              </div>
              <div className="py-1 max-h-96 overflow-y-auto space-y-1">
                {personas.map((p) => {
                  const isSelected = p.user?._id === currentUser._id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPersona(p.id)}
                      disabled={loading}
                      className={`w-full text-left p-2.5 rounded-md transition flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#2D6A4F] text-[#FAF8F3]'
                          : 'hover:bg-[#EAF4EC] text-[#1F2D24]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-semibold text-xs">
                          {p.user?.platformRole === 'platformAdmin' && (
                            <Shield className={`w-3 h-3 ${isSelected ? 'text-[#E9A019]' : 'text-[#C85A32]'}`} />
                          )}
                          <span>{p.name}</span>
                        </div>
                        <p className={`text-[11px] leading-tight ${isSelected ? 'text-[#FAF8F3]/80' : 'text-[#1F2D24]/70'}`}>
                          {p.roleDescription}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#E9A019] shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
              <div className="p-2 border-t border-[#2D6A4F]/15 text-[10px] text-[#1F2D24]/60 leading-relaxed">
                💡 Test how permissions dynamically adjust for Co-Admins, Moderators, Members, and Platform Admin.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset DB Confirmation Modal */}
      <ConfirmModal
        isOpen={resetModalOpen}
        title="Reset Platform Database?"
        message="Are you sure you want to reset the entire platform database back to initial seed data? All custom communities, posts, events, and role offers will be reset."
        confirmLabel="Reset Database"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={resetting}
        onConfirm={executeResetDb}
        onCancel={() => setResetModalOpen(false)}
      />

    </div>
  );
}
