export type FeaturedWork = {
  id: string;
  title: string;
  image: string;
  description: string;
  link: string;
  user_id?: string;
  created_at?: string;
};

export type CaseStudy = {
  id: string;
  user_id: string;
  title: string;
  image: string;
  link: string;
  summary: string;
  outcome: string;
  created_at: string;
};

export type Testimonial = {
  id?: string;
  quote: string;
  author: string;
  role: string;
  profile_id?: string;
  created_by: string;
  created_at: string;
  profiles?: {
    avatar_url?: string;
  };
};