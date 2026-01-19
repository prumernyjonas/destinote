"use client";

import Link from "next/link";
import { PublicProfile } from "@/types/database";
import { FollowButton } from "./FollowButton";
import ProfileStatItem from "./ProfileStatItem";

interface ProfileHeaderProps {
  profile: PublicProfile;
  avatarUrl: string | null;
  initials: string;
  isOwnProfile: boolean;
  isFriend: boolean;
  onFollowToggle: (newState: boolean) => void;
  visitedCountriesCount: number;
  articlesCount: number;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
  user: { uid: string } | null;
}

export default function ProfileHeader({
  profile,
  avatarUrl,
  initials,
  isOwnProfile,
  isFriend,
  onFollowToggle,
  visitedCountriesCount,
  articlesCount,
  onFollowersClick,
  onFollowingClick,
  user,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      {/* Avatar - 64px */}
      <div className="flex-shrink-0">
        {avatarUrl && avatarUrl.trim() !== "" ? (
          <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-green-200">
            <img
              src={avatarUrl}
              alt={profile.nickname || "Avatar"}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Pokud se obrázek nenačte, zobrazit inicial
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `<div class="h-16 w-16 rounded-full flex items-center justify-center bg-green-100 text-green-700 font-bold text-xl border-2 border-white shadow-sm ring-2 ring-green-200">${initials || "?"}</div>`;
                }
              }}
            />
          </div>
        ) : (
          <div className="h-16 w-16 rounded-full flex items-center justify-center bg-green-100 text-green-700 font-bold text-xl border-2 border-white shadow-sm ring-2 ring-green-200">
            {initials || "?"}
          </div>
        )}
      </div>

      {/* Info - kompaktnější layout */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Jméno a @ pod sebou + statistiky vedle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-semibold text-gray-900">
                  {profile.displayName}
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">@{profile.nickname}</p>
                {isFriend && (
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Přátelé
                  </span>
                )}
              </div>
              
              {/* Statistiky jako pills vedle jména - vycentrované s avatarem */}
              <div className="flex items-center gap-2 flex-wrap">
                <ProfileStatItem
                  value={profile.followersCount}
                  label="Sledujících"
                  onClick={onFollowersClick}
                  isClickable={true}
                />
                <ProfileStatItem
                  value={profile.followingCount}
                  label="Sleduji"
                  onClick={onFollowingClick}
                  isClickable={true}
                />
                <ProfileStatItem
                  value={isOwnProfile ? visitedCountriesCount : profile.countriesVisited}
                  label="Zemí"
                  highlight={true}
                />
                <ProfileStatItem
                  value={isOwnProfile ? articlesCount : profile.articlesWritten}
                  label="Článků"
                />
              </div>
            </div>
          </div>

          {/* Tlačítko vpravo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {!isOwnProfile && user && (
              <FollowButton
                userId={profile.id}
                isFollowing={profile.isFollowedByMe}
                onToggle={onFollowToggle}
              />
            )}

            {isOwnProfile && (
              <Link
                href="/nastaveni"
                className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 hover:bg-slate-50 shadow-none rounded-lg text-slate-700 font-medium transition-all duration-200 text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2"
                aria-label="Upravit profil"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Upravit profil
              </Link>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="mt-2.5 text-sm text-gray-600">{profile.bio}</p>
        )}
      </div>
    </div>
  );
}

