/**
 * Shapes of the kop/v1 responses the app reads. The facility, operator and news routes are
 * inc/mobile-api.php in the Kids-Over-Profits theme; the rest are older public routes.
 * Sections that are empty for most records are optional and read defensively.
 */

export type Link = { url: string; label: string; live_url?: string; go_url?: string };

export type Source = { source: string; cite?: string; url?: string };

export type Fact = { label: string; value: string };

export type NewsImage = { src: string; kind: 'photo' | 'logo' } | null;

export type NewsFacility = { id: number; name: string; slug: string; url: string };

/** One article as the feed and the facility and company pages draw it. */
export type NewsItem = {
  id: number;
  title: string;
  outlet: string;
  date: string;
  date_label: string;
  url: string;
  type: string;
  summary: string;
  content_warnings?: string[];
  image: NewsImage;
  facilities?: NewsFacility[];
  story_arc?: { title: string; slug: string } | null;
  story_group_id?: number | null;
  link_type?: string;
  about?: string;
};

export type StoryArc = {
  id: number;
  title: string;
  slug: string;
  description: string;
  status: string;
  article_count: number;
  latest_date: string;
  facility: { label: string; url: string } | null;
};

export type NewsFeed = {
  items: NewsItem[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  months: { month: string; count: number }[];
  arcs: StoryArc[];
  story: StoryArc | null;
};

export type NewsQuery = { archive?: string; story?: string; facility?: number };

export type StaffEntry = {
  text: string;
  source?: string;
  cite?: string;
  url?: string;
  name?: string;
  role?: string;
  career?: { text?: string; label?: string; name?: string; url?: string; role?: string; place?: string; years?: string }[];
  from_map?: boolean;
};

export type Incident = {
  when?: string;
  kind?: string;
  text: string;
  source?: string;
  cite?: string;
  url?: string;
  also?: Source[];
};

export type LawsuitRow = {
  id?: number;
  case_name: string;
  case_number?: string;
  court?: string;
  year?: string;
  status?: string;
  outcome?: string;
  summary?: string;
  link_type?: string;
};

export type MemorialRow = {
  id?: number;
  name: string;
  age?: string;
  program?: string;
  date?: string;
  date_label?: string;
  cause?: string;
  category?: string;
  source_name?: string;
  source_url?: string;
  kop_url?: string;
};

export type InspectionReport = {
  id: number;
  date: string;
  date_label: string;
  url: string;
  summary: string;
  report_id: string;
  licensed_as: string;
  findings: { text: string; standard: string; label: string }[];
};

export type InspectionSummary = {
  licensed_names: string[];
  addresses: string[];
  phone: string;
  program_category: string;
  licensed_program_name: string;
  executive_director: string;
  bed_capacity: string;
  license_expiration: string;
  relicense_visit_date: string;
  licensing_action: string;
  states: string[];
};

export type FacilityInspections = {
  summary: InspectionSummary | null;
  total: number;
  reports: InspectionReport[];
  more: number;
  /** Approved serious findings, the page's "Serious violations" section. */
  violations?: SeriousFinding[];
  page_url: string;
};

/** An approved serious finding (kop_facility_pages_violations in the theme). */
export type SeriousFinding = {
  id: number;
  state?: string;
  category?: string;
  label: string;
  kinds?: string[];
  weight?: number;
  severe?: boolean;
  date?: string;
  date_label?: string;
  excerpt?: string;
  short?: string;
  state_label?: string;
  source_url?: string;
  full_url?: string;
  home?: string;
  home_url?: string;
};

export type Sibling = { name: string; place: string; status: string; url: string };

/** A kind of material the project holds for the record, not online (kop_facility_pages_resources_held()). */
export type HeldResource = { label: string; group: string; detail: string };

export type ResourceLinkGroup = { kind: string; label: string; links: Link[] };

/** What one name of a renamed program holds, its own record's and the other names' (inc/facility-eras.php). */
export type EraLists = {
  memorials: MemorialRow[];
  violations: SeriousFinding[];
  lawsuits: LawsuitRow[];
  incidents: Incident[];
  news: NewsItem[];
  staff: Record<string, StaffEntry[]>;
};
export type EraKind = keyof EraLists;

export type Era = EraLists & {
  /** The section's anchor on the website ("as-copper-canyon-academy"). */
  id: string;
  name: string;
  /** "1998 to 2014", "from 2014", "until 2000". */
  years: string;
  operators: string[];
  /** The record kept under this name when it is another record's; empty for this one. */
  url: string;
};

/** A renamed program's page cut into one section per name; `rest` is what no name took, `totals` the whole page's counts. */
export type FacilityEras = { list?: Era[]; rest?: Partial<EraLists>; totals?: Partial<Record<EraKind, number>> };

export type FacilityPayload = {
  api_version: number;
  id: number;
  slug: string;
  url: string;
  name: string;
  unique_name: string;
  current_name: string;
  formerly: string[];
  aka: string[];
  status: string;
  end_year: string;
  place: string;
  city: string;
  state_code: string;
  state_name: string;
  country: string;
  hub_name: string;
  hub_url: string;
  operator: { name: string; url: string };
  siblings: Sibling[];
  program_homes: { homes?: { id: number; name: string; home_name?: string; place?: string; status?: string; years?: string; url: string }[] } | null;
  home_of: { count: number; program: { name: string; url: string }; others?: Sibling[] } | null;
  addresses: string[];
  former_locations: { line: string; years: string }[];
  operated: string;
  summary: string;
  facts: Fact[];
  fact_sources: Record<string, Source[]>;
  practices: { label: string; items: string[] }[];
  incidents: Incident[];
  staff: Record<string, StaffEntry[]> | StaffEntry[];
  notes: string[];
  field_notes: { label: string; text: string }[];
  testimony: { text: string; date_label?: string; submitted?: boolean }[];
  forum: { incidents?: Incident[]; leads?: string[]; links?: { url: string; label: string }[] } | null;
  videos: { provider: string; id: string; title: string; url: string; source: string; thumb: string }[];
  profile_links: Link[];
  resources: HeldResource[];
  resource_links: ResourceLinkGroup[];
  news: NewsItem[];
  lawsuits: LawsuitRow[];
  memorials: MemorialRow[];
  eras: FacilityEras | null;
  wiki: { id: number; title: string; place: string; organization: string; type: string; years: string }[];
  inspections: FacilityInspections | null;
  documents: { folder_id: number; url: string };
  updated_at: string;
  updated_label: string;
  news_url: string;
  lawsuits_url: string;
  memorial_url: string;
  wiki_url: string;
  submit_url: string;
};

export type OperatorFacility = {
  id: number;
  name: string;
  place: string;
  status: string;
  years: string;
  url: string;
  has_page: boolean;
  start_year?: number | null;
  end_year?: number | null;
  own_years?: boolean;
};

export type OperatorPayload = {
  api_version: number;
  id: number;
  name: string;
  full_name: string;
  url: string;
  aka: string[];
  current_name: string;
  status: string;
  facts: Fact[];
  parents: { name: string; url: string }[];
  subsidiaries: { name: string; url: string }[];
  facilities: OperatorFacility[];
  program_tree: (OperatorFacility & { homes: OperatorFacility[] })[];
  open_count: number;
  place_count: number;
  lawsuits: LawsuitRow[];
  memorials: MemorialRow[];
  websites: Link[];
  notes: string[];
  timeline: { year?: string | number; label?: string; text?: string; url?: string; kind?: string }[];
  people: {
    leaders: { name: string; role: string; career?: unknown[]; personId?: number }[];
    others: { name: string; role: string; career?: unknown[]; personId?: number }[];
  };
  summary: string;
  index_url: string;
  network_url: string;
  updated_label: string;
  news: NewsItem[];
  history: { status: string; paragraphs: string[]; sources: { label: string; url: string }[] } | null;
  documents: { folder_id: number; program_total: number; url: string };
};

/** kop/v1/facility-suggest */
export type SuggestItem = { id?: number; name: string; place: string; status: string; hint: string; url?: string };
export type SuggestResponse = { query: string; items: SuggestItem[] };

/** kop/v1/global-search */
export type GlobalSearchItem = { title: string; url: string; meta?: string };
export type GlobalSearchGroup = { key: string; label: string; items: GlobalSearchItem[] };
export type GlobalSearchResponse = { query: string; total: number; groups: GlobalSearchGroup[] };

/** kop/v1/operators: every company page, one line each, A to Z (kop_mobile_operators()). */
export type OperatorListItem = {
  id: number;
  slug: string;
  name: string;
  url: string;
  programs: number;
  open: number;
  /** State codes, or a country's name outside the US. */
  places: string[];
  /** "Founded 2005" or "Programs from 2004", else empty. */
  years: string;
  status: string;
  /** Five or more programs, a published history or a large place on the map. */
  major: boolean;
};
export type OperatorsList = { api_version: number; total: number; items: OperatorListItem[] };

/** kop/v1/state/<slug> (the parts the app lists) */
export type StateTile = {
  name: string;
  city: string;
  state: string;
  status: string;
  operator_name: string;
  operating_period: string;
  profile_url: string;
  facility_ids: number[];
  inspection_count?: number;
  violation_count?: number;
};
export type StatePage = {
  state: { name: string; slug: string };
  inspections: { has_reports: boolean; page_url: string | null };
  facilities: { active: StateTile[]; closed: StateTile[]; total: number };
  news: { id: number; article_title: string; display_title: string; publication_name: string; publication_date: string; article_url: string; article_type: string; summary: string }[];
  lawsuits: { id: number; case_name: string; case_number?: string; court?: string; status?: string; summary?: string }[];
  counts: Record<string, number>;
};

/** Send to KOP: kop/v1/mobile/* (public) and kop/v1/extension/* (reviewers signed in). */
export type LinkType = 'article' | 'lawsuit' | 'legislation' | 'website';
export type FacilityType = 'facility_new' | 'facility_correction';
export type SubmitType = LinkType | FacilityType;

/** Everything the Send screen can fill in. Empty strings are left out of the request. */
export type SubmitDraft = {
  type: SubmitType;
  url: string;
  title: string;
  site_name: string;
  author: string;
  published: string;
  case_number: string;
  court: string;
  bill_number: string;
  jurisdiction: string;
  session: string;
  facility: string;
  facility_id: number | null;
  notes: string;
  selection: string;
  submitter_name: string;
  notify_email: string;
  newsletter_email: string;
  // facility_new only
  name: string;
  other_names: string[];
  city: string;
  state: string;
  country: string;
  operator: string;
  start_year: string;
  end_year: string;
  website: string;
  program_type: string;
};

export type Credentials = { username: string; appPassword: string };

export type DuplicateInfo = { type: string; status: string; id?: number; title?: string };
export type DuplicateCheck = { duplicate: boolean; duplicates: DuplicateInfo[] };

export type SubmitOutcome =
  | { kind: 'ok'; queue: string }
  | { kind: 'duplicate'; message: string; duplicates: DuplicateInfo[] }
  | { kind: 'error'; message: string };

/** kop/v1/facility/<slug>/documents and kop/v1/operator/<slug>/documents: the page's document library. */
export type DocFile = { id: number; title: string; url: string; ext: string; mime: string; size: number; thumb: string };
export type DocFolder = { name: string; merged_from: string; count: number; files: DocFile[]; folders: DocFolder[] };
export type DocumentsPayload = {
  api_version: number;
  kind: 'facility' | 'operator';
  name: string;
  page_url: string;
  total: number;
  files: DocFile[];
  folders: DocFolder[];
  /** A company's programs with libraries of their own. */
  programs: { name: string; slug: string; count: number }[];
};
