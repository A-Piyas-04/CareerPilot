export type RoadmapItemStatus = "todo" | "in_progress" | "done" | "cancelled";

export type RoadmapResource = {
  name: string;
  url?: string;
};

export type Roadmap = {
  id: string;
  user_id: string;
  resume_id: string | null;
  target_role: string;
  duration_weeks: number;
  overview: string | null;
  progress_percent: number;
  created_at: string;
  updated_at: string;
};

export type RoadmapItem = {
  id: string;
  roadmap_id: string;
  user_id: string;
  week_number: number;
  title: string;
  description: string | null;
  resources: RoadmapResource[];
  status: RoadmapItemStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RoadmapListItem = Roadmap & {
  item_count: number;
  completed_count: number;
};

export type GenerateRoadmapRequest = {
  targetRole: string;
  durationWeeks: 4 | 8 | 12;
  jobDescription?: string;
};

export type GenerateRoadmapResponse = {
  roadmapId: string;
  roadmap: Roadmap;
  items: RoadmapItem[];
};

export type RoadmapDetailResponse = {
  roadmap: Roadmap;
  items: RoadmapItem[];
};

export type CreateRoadmapTaskResponse = {
  created: boolean;
  task: {
    id: string;
    roadmap_item_id: string | null;
    title: string;
    status: RoadmapItemStatus;
  };
};

export type AddRoadmapCalendarEventResponse = {
  event: {
    id: string;
    title: string;
    event_type: "study";
    start_time: string;
  };
};
