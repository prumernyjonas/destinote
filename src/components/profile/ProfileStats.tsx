"use client";

import { PublicProfile } from "@/types/database";

interface ProfileStatsProps {
  profile: PublicProfile;
  isOwnProfile: boolean;
  visitedCountriesCount: number;
  articlesCount: number;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
}

export default function ProfileStats({
  profile,
  isOwnProfile,
  visitedCountriesCount,
  articlesCount,
  onFollowersClick,
  onFollowingClick,
}: ProfileStatsProps) {
  return (
    <div className="flex flex-wrap gap-4 mt-6">
      <button
        onClick={onFollowersClick}
        className="text-center px-4 py-3 rounded-lg cursor-pointer group transition-all duration-150 hover:bg-slate-50 hover:ring-1 hover:ring-slate-200"
      >
        <div className="text-2xl font-bold text-gray-900 transition-colors duration-150 group-hover:text-gray-700">
          {profile.followersCount}
        </div>
        <div className="text-sm text-slate-500 transition-colors duration-150 group-hover:text-slate-600 mt-1">
          Sledujících
        </div>
      </button>
      <button
        onClick={onFollowingClick}
        className="text-center px-4 py-3 rounded-lg cursor-pointer group transition-all duration-150 hover:bg-slate-50 hover:ring-1 hover:ring-slate-200"
      >
        <div className="text-2xl font-bold text-gray-900 transition-colors duration-150 group-hover:text-gray-700">
          {profile.followingCount}
        </div>
        <div className="text-sm text-slate-500 transition-colors duration-150 group-hover:text-slate-600 mt-1">
          Sleduji
        </div>
      </button>
      <div className="text-center px-4 py-3 rounded-lg">
        <div className="text-2xl font-bold text-emerald-600">
          {isOwnProfile ? visitedCountriesCount : profile.countriesVisited}
        </div>
        <div className="text-sm text-slate-500 mt-1">Zemí</div>
      </div>
      <div className="text-center px-4 py-3 rounded-lg">
        <div className="text-2xl font-bold text-gray-900">
          {isOwnProfile ? articlesCount : profile.articlesWritten}
        </div>
        <div className="text-sm text-slate-500 mt-1">Článků</div>
      </div>
    </div>
  );
}
