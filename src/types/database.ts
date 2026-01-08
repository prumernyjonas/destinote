// types/database.ts
export interface VisitedCountry {
  countryId: string;
  countryName: string;
  visitedAt: Date;
  notes?: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  countryId: string;
  countryName: string;
  authorId: string;
  authorName: string;
  status?: "draft" | "pending" | "approved" | "rejected" | string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  comments: number;
  tags: string[];
  images?: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "travel" | "social" | "achievement";
  requirement: {
    type: "countries_visited" | "articles_written" | "followers" | "custom";
    value: number;
    description: string;
  };
  earnedAt?: Date;
  progress?: number;
}

export interface UserStats {
  countriesVisited: number;
  continentsVisited: number;
  articlesWritten: number;
  badgesEarned: number;
  level: number;
  followers: number;
  following: number;
}

export interface FlightOffer {
  id: string;
  from: string;
  to: string;
  price: number;
  currency: string;
  departure: Date;
  arrival: Date;
  airline: string;
  stops: number;
  duration: string;
  link: string;
}

// Sledování uživatelů
export interface UserFollow {
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface PublicProfile {
  id: string;
  nickname: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  countriesVisited: number;
  articlesWritten: number;
  followersCount: number;
  followingCount: number;
  isFollowedByMe: boolean;
  isFollowingMe: boolean;
}

export interface FollowListItem {
  id: string;
  nickname: string;
  displayName: string;
  avatarUrl: string | null;
  isFollowedByMe: boolean;
}
