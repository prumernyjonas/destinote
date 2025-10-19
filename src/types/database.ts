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
