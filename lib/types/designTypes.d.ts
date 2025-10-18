export type Snapshot = {
  age: string;
  occupation: string;
};

export type Versions = {
  id: string;
  design_id: string;
  version: number;
  file_key: string;
  node_id: string;
  total_score: number;
  thumbnail_url: string;
  ai_summary: string;
  ai_data: string;
  snapshot: Snapshot;
  created_at: string;
};

export type Design = {
  is_active: boolean;
  id: string;
  project_name: string;
  fileKey?: string;
  nodeId?: string;
  imageUrl: string;
  thumbnail?: string | null;
  thumbnailPath?: string;
  snapshot: Snapshot;
  current_version_id: string;
  frames?: { id: string | number; name: string; [key: string]: any }[];
  published_version_id?: string;
  published_at?: string;
  figma_link?: string;
  owner_id: string;
};