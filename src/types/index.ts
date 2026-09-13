export type Role = 'ADMIN' | 'USER';
export type Status = 'DRAFT' | 'PUBLISHED';
export type ReactionType = 'LIKE' | 'DISLIKE';
export type CategoryType = 'TECH' | 'PROJECT' | 'BLOG';
export type AchievementType = 'ACHIEVEMENT' | 'CERTIFICATION' | 'PUBLICATION';

export interface CategoryBrief {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  types: CategoryType[];
  order: number;
}

export interface Technology {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  order: number;
  categoryId?: string;
  category?: CategoryBrief;
}

export interface Skill {
  id: string;
  name: string;
  icon?: string;
  order: number;
  categoryId: string; // Required now
  category: CategoryBrief;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortSummary?: string;
  liveUrl?: string;
  repoUrl?: string;
  clientName?: string;
  featured: boolean;
  order: number;
  status: Status;
  viewCount: number;
  startDate?: string;
  endDate?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  categoryId?: string;
  category?: CategoryBrief;
  images: { id: string; url: string; alt?: string; order: number }[];
  technologies: Technology[];
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  id: string;
  company: string;
  companyUrl?: string;
  role: string;
  location?: string;
  description: string;
  isCurrent: boolean;
  startDate: string;
  endDate?: string;
  order: number;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  location?: string;
  description?: string;
  isCurrent: boolean;
  startDate: string;
  endDate?: string;
  order: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  coverImageAlt?: string;
  tags: string[];
  status: Status;
  viewCount: number;
  readingTimeMins?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  categoryId?: string;
  category?: CategoryBrief;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description?: string;
  issuer?: string;
  issueDate?: string;
  credentialUrl?: string;
  certificateFile?: string;
  featured: boolean;
  order: number;
  images: { id: string; url: string; alt?: string; order: number }[];
  createdAt: string;
  updatedAt: string;
}
