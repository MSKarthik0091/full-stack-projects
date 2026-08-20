import { useState } from 'react';
import { Community, User } from '../types.ts';
import { 
  Search, 
  MapPin, 
  Users, 
  Shield, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles, 
  PlusCircle, 
  Globe2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

interface CommunityDiscoveryProps {
  communities: Community[];
  currentUser: User | null;
  onSelectCommunity: (community: Community) => void;
  onOpenRequestModal: () => void;
  onJoinCommunity: (communityId: string) => void;
  onLeaveCommunity?: (communityId: string, communityName?: string) => void;
}

export function CommunityDiscovery({
  communities,
  currentUser,
  onSelectCommunity,
  onOpenRequestModal,
  onJoinCommunity,
  onLeaveCommunity
}: CommunityDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');

  const countries = ['All', ...Array.from(new Set(communities.map(c => c.location?.country).filter(Boolean)))];

  const filtered = communities.filter(c => {
    const loc = c.location;
    const matchCountry = selectedCountry === 'All' || (loc && loc.country === selectedCountry);
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || 
      c.name.toLowerCase().includes(q) ||
      (loc && (
        loc.townOrLocality.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q) ||
        loc.state.toLowerCase().includes(q) ||
        loc.country.toLowerCase().includes(q)
      ));
    return matchCountry && matchSearch;
  });

  const myCommunities = communities.filter(c => 
    c.myMembership && (c.myMembership.membershipStatus === 'active' || c.myMembership.membershipStatus === 'pending')
  );

  return (
    <div id="community-discovery-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Hero Search Section */}
      <section className="bg-[#EAF2ED] text-[#1D2A24] rounded-3xl p-8 sm:p-12 shadow-md relative overflow-hidden border-2 border-[#2A7B5F]/30">
        {/* Decorative subtle color accents */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-[#E8A227]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-[#C85A32]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#183120] text-xs font-bold text-[#E8A227] border border-[#E8A227]/40 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#E8A227]" />
            <span>Official Hyperlocal Neighborhood Network</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-[#183120] font-sans">
            Connect with your authentic local neighborhood.
          </h1>

          <p className="text-sm sm:text-base text-[#1D2A24]/80 leading-relaxed font-medium max-w-2xl">
            Hometown Hub unites residents in verified, single-locality communities. Discover authentic local news, organized cleanups, cultural initiatives, and discussions hosted by your neighbors.
          </p>

          {/* Search Input Bar */}
          <div className="pt-2">
            <div className="relative flex items-center bg-[#FAF8F3] text-[#1D2A24] rounded-2xl p-2 shadow-lg border-2 border-[#C85A32]/40 focus-within:border-[#C85A32]">
              <Search className="w-5 h-5 text-[#C85A32] ml-3 shrink-0" />
              <input
                id="search-locality-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by locality, neighborhood, district, city or state (e.g. Besant Nagar, Greenfield, Medavakkam)..."
                className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none text-[#1D2A24] placeholder-[#1D2A24]/60 font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-[#C85A32] bg-[#C85A32]/10 hover:bg-[#C85A32] hover:text-white transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8A227] text-[#183120] font-extrabold shadow-2xs border border-[#183120]/20">
              <Globe2 className="w-4 h-4 text-[#183120]" />
              <span>{communities.length} Active Localities</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2A7B5F] text-white font-bold shadow-2xs border border-[#2A7B5F]/30">
              <Shield className="w-4 h-4 text-[#FAF8F3]" />
              <span>Verified Membership</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C85A32] text-white font-bold shadow-2xs border border-[#C85A32]/30">
              <CheckCircle2 className="w-4 h-4 text-[#E8A227]" />
              <span>1 Official Hub per Locality</span>
            </span>
          </div>
        </div>
      </section>

      {/* "My Communities" Section (if user has active/pending memberships) */}
      {myCommunities.length > 0 && (
        <section id="my-communities-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#183120]">Your Neighborhoods</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#EAF4EC] text-[#2D6A4F] text-xs font-bold border border-[#2D6A4F]/20">
                {myCommunities.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myCommunities.map((comm) => {
              const mem = comm.myMembership;
              const isPending = mem?.membershipStatus === 'pending';
              const isBanned = mem?.membershipStatus === 'banned';
              const role = mem?.role;

              return (
                <div
                  key={comm._id}
                  id={`my-community-card-${comm.slug}`}
                  onClick={() => onSelectCommunity(comm)}
                  className="bg-[#FAF8F3] hover:bg-[#EAF4EC]/60 transition border border-[#2D6A4F]/20 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={comm.profileImage || 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80'}
                          alt={comm.name}
                          className="w-12 h-12 rounded-xl object-cover border border-[#2D6A4F]/30 group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div>
                          <h3 className="font-bold text-base text-[#183120] group-hover:text-[#2D6A4F] transition">
                            {comm.name}
                          </h3>
                          <p className="text-xs text-[#1F2D24]/60 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#C85A32]" />
                            <span>{comm.location?.district || comm.location?.state}, {comm.location?.country}</span>
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {isPending ? (
                        <span className="px-2 py-1 rounded bg-[#E9A019]/20 text-[#183120] text-[11px] font-bold flex items-center gap-1 border border-[#E9A019]/40">
                          <Clock className="w-3 h-3 text-[#E9A019]" />
                          <span>Pending</span>
                        </span>
                      ) : isBanned ? (
                        <span className="px-2 py-1 rounded bg-[#C85A32]/20 text-[#C85A32] text-[11px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Banned</span>
                        </span>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-2xs ${
                          role === 'communityAdmin'
                            ? 'bg-[#183120] text-[#E8A227] border border-[#E8A227]/40'
                            : role === 'moderator'
                            ? 'bg-[#E8A227] text-[#183120] border border-[#183120]/30'
                            : 'bg-[#EAF2ED] text-[#2A7B5F] border border-[#2A7B5F]/30'
                        }`}>
                          {role === 'communityAdmin' ? 'Admin' : role === 'moderator' ? 'Mod' : 'Member'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#1F2D24]/80 line-clamp-2 leading-relaxed">
                      {comm.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#2D6A4F]/10 text-xs text-[#1F2D24]/70">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#2D6A4F]" />
                      <span>{comm.memberCount} active members</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {onLeaveCommunity && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLeaveCommunity(comm._id, comm.name);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[#C85A32] hover:bg-[#C85A32] hover:text-white border border-[#C85A32]/30 text-[11px] font-semibold transition"
                          title={`Leave ${comm.name}`}
                        >
                          Leave
                        </button>
                      )}
                      <span className="font-semibold text-[#2D6A4F] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Enter Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Discovery / All Communities Directory */}
      <section id="all-communities-directory" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#183120]">Official Locality Communities</h2>
            <p className="text-xs text-[#1F2D24]/70">
              Each geographical locality has a single official Hometown Hub managed by local resident leaders.
            </p>
          </div>

          {/* Country Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {countries.map((c, idx) => {
              const isSel = selectedCountry === c;
              const bgColors = ['bg-[#C85A32]', 'bg-[#2A7B5F]', 'bg-[#E8A227] text-[#183120]', 'bg-[#E0856E]'];
              const activeColor = bgColors[idx % bgColors.length];
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCountry(c as string)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-2xs ${
                    isSel
                      ? `${activeColor} ${c === 'All' ? 'bg-[#183120] text-white' : 'text-white'} shadow-sm`
                      : 'bg-[#EAF2ED] text-[#1D2A24] hover:bg-[#D3E4DA] border border-[#2A7B5F]/20'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Communities Grid */}
        {filtered.length === 0 ? (
          <div className="bg-[#EAF2ED]/60 rounded-2xl p-12 text-center border border-[#2A7B5F]/30 space-y-4">
            <MapPin className="w-12 h-12 text-[#C85A32] mx-auto" />
            <h3 className="text-lg font-bold text-[#183120]">No official community found for this search</h3>
            <p className="text-xs text-[#1D2A24]/70 max-w-md mx-auto font-medium">
              Your locality might not have an official community hub yet. You can submit a creation request to Platform Administration!
            </p>
            <button
              onClick={onOpenRequestModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C85A32] hover:bg-[#b34c28] text-white text-xs font-bold transition shadow-sm border border-[#E8A227]/40"
            >
              <PlusCircle className="w-4 h-4 text-[#E8A227]" />
              <span>Propose New Locality Community</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((comm, idx) => {
              const loc = comm.location;
              const mem = comm.myMembership;
              const isAdminless = comm.adminCount === 0;

              // Alternating colorful accent border for visual variety across cards
              const topBorders = [
                'border-t-4 border-t-[#C85A32]',
                'border-t-4 border-t-[#2A7B5F]',
                'border-t-4 border-t-[#E8A227]',
                'border-t-4 border-t-[#E0856E]'
              ];
              const topAccent = topBorders[idx % topBorders.length];

              return (
                <div
                  key={comm._id}
                  id={`community-card-${comm.slug}`}
                  onClick={() => onSelectCommunity(comm)}
                  className={`bg-[#FAF8F3] border border-[#2A7B5F]/20 ${topAccent} rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#2A7B5F]/50 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between group`}
                >
                  <div>
                    {/* Card Cover Image Header */}
                    <div className="h-32 w-full relative overflow-hidden bg-[#183120]">
                      <img
                        src={comm.coverImage || 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1200&auto=format&fit=crop&q=80'}
                        alt={comm.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1200&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Admin-less Warning Pill */}
                      {isAdminless && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-[#C85A32] text-white text-[10px] font-bold flex items-center gap-1 shadow">
                          <ShieldAlert className="w-3 h-3" />
                          <span>Admin-less Hub (Oversight Active)</span>
                        </div>
                      )}

                      {/* Locality Hierarchy Badge */}
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
                        <span className="bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1 border border-white/20">
                          <MapPin className="w-3 h-3 text-[#E8A227]" />
                          <span>{loc?.townOrLocality}, {loc?.district || loc?.state}</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={comm.profileImage || 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80'}
                          alt={comm.name}
                          className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow -mt-8 relative z-10 bg-white"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=200&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div>
                          <h3 className="font-bold text-base text-[#183120] group-hover:text-[#C85A32] transition">
                            {comm.name}
                          </h3>
                          <p className="text-[11px] text-[#1D2A24]/60 font-medium">
                            {loc?.state}, {loc?.country}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-[#1D2A24]/80 line-clamp-2 leading-relaxed">
                        {comm.description}
                      </p>

                      {/* Community Leadership Roster snippet */}
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-[#1D2A24]/70 font-medium">
                        <Shield className="w-3.5 h-3.5 text-[#2A7B5F]" />
                        <span>{comm.adminCount} Admin{comm.adminCount !== 1 ? 's' : ''} • {comm.moderatorCount} Mod{comm.moderatorCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer / Action */}
                  <div className="p-4 bg-[#EAF2ED]/60 border-t border-[#2A7B5F]/15 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#183120]">
                      <Users className="w-4 h-4 text-[#2A7B5F]" />
                      <span>{comm.memberCount} Members</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {mem?.membershipStatus === 'active' ? (
                        <>
                          {onLeaveCommunity && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onLeaveCommunity(comm._id, comm.name);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-[#C85A32]/40 text-[#C85A32] hover:bg-[#C85A32] hover:text-white text-xs font-bold transition"
                              title={`Leave ${comm.name}`}
                            >
                              Leave
                            </button>
                          )}
                          <button
                            onClick={() => onSelectCommunity(comm)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#2A7B5F] hover:bg-[#183120] text-white text-xs font-bold transition flex items-center gap-1 border border-[#E8A227]/30"
                          >
                            <span>Open Hub</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : mem?.membershipStatus === 'pending' ? (
                        <button
                          onClick={() => onSelectCommunity(comm)}
                          className="px-3 py-1.5 rounded-lg bg-[#E8A227]/20 border border-[#E8A227]/50 text-[#183120] text-xs font-extrabold transition flex items-center gap-1"
                        >
                          <Clock className="w-3.5 h-3.5 text-[#E8A227]" />
                          <span>Pending</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectCommunity(comm)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#C85A32] hover:bg-[#b34c28] text-white text-xs font-bold transition shadow-xs border border-[#E8A227]/30"
                        >
                          View Community
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Propose Locality Banner CTA */}
      <section className="bg-[#FAF8F3] border-2 border-dashed border-[#2D6A4F]/30 rounded-3xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#EAF4EC] text-[#2D6A4F] flex items-center justify-center mx-auto shadow-inner">
          <MapPin className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-xl mx-auto">
          <h3 className="text-xl font-bold text-[#183120]">Is your neighborhood not listed yet?</h3>
          <p className="text-xs text-[#1F2D24]/70 leading-relaxed">
            Residents can submit a community creation request. Platform Administrators verify locality boundaries and assign an initial local Community Admin.
          </p>
        </div>
        <div>
          <button
            id="propose-community-cta-btn"
            onClick={onOpenRequestModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#183120] text-white text-xs font-bold transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-[#E9A019]" />
            <span>Submit Community Proposal</span>
          </button>
        </div>
      </section>

    </div>
  );
}
