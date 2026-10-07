import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { fetchJson } from './client';
import type {
  DocumentsPayload,
  FacilityPayload,
  GlobalSearchResponse,
  NewsFeed,
  NewsQuery,
  OperatorPayload,
  OperatorsList,
  ResourcesPayload,
  StatePage,
  SuggestResponse,
} from './types';

const HOUR = 60 * 60 * 1000;
const NEWS_PAGE_SIZE = 20;

export function useFacility(ref: string | undefined) {
  return useQuery({
    queryKey: ['facility', ref],
    queryFn: ({ signal }) => fetchJson<FacilityPayload>(`facility/${encodeURIComponent(ref ?? '')}`, undefined, signal),
    enabled: !!ref,
    staleTime: 10 * 60 * 1000,
  });
}

export function useOperator(ref: string | undefined) {
  return useQuery({
    queryKey: ['operator', ref],
    queryFn: ({ signal }) => fetchJson<OperatorPayload>(`operator/${encodeURIComponent(ref ?? '')}`, undefined, signal),
    enabled: !!ref,
    staleTime: 10 * 60 * 1000,
  });
}

/** A facility's or a company's document library. */
export function useDocuments(kind: 'facility' | 'operator', ref: string | undefined) {
  return useQuery({
    queryKey: ['documents', kind, ref],
    queryFn: ({ signal }) => fetchJson<DocumentsPayload>(`${kind}/${encodeURIComponent(ref ?? '')}/documents`, undefined, signal),
    enabled: !!ref,
    staleTime: 10 * 60 * 1000,
  });
}

/** A company found by the name a facility page gives it. */
export function useOperatorByName(name: string | undefined) {
  return useQuery({
    queryKey: ['operator-name', name],
    queryFn: ({ signal }) => fetchJson<OperatorPayload>('operator', { name }, signal),
    enabled: !!name,
    staleTime: 10 * 60 * 1000,
  });
}

export function useNews(query: NewsQuery = {}) {
  return useInfiniteQuery({
    queryKey: ['news', query],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchJson<NewsFeed>(
        'news',
        { page: pageParam, per_page: NEWS_PAGE_SIZE, archive: query.archive, story: query.story, facility: query.facility },
        signal,
      ),
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSuggest(q: string) {
  const phrase = q.trim();
  return useQuery({
    queryKey: ['suggest', phrase.toLowerCase()],
    queryFn: ({ signal }) => fetchJson<SuggestResponse>('facility-suggest', { q: phrase }, signal),
    enabled: phrase.length >= 3,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useGlobalSearch(q: string, enabled: boolean) {
  const phrase = q.trim();
  return useQuery({
    queryKey: ['global-search', phrase.toLowerCase()],
    queryFn: ({ signal }) => fetchJson<GlobalSearchResponse>('global-search', { q: phrase }, signal),
    enabled: enabled && phrase.length >= 3,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStatePage(slug: string | undefined, kind: 'state' | 'country' = 'state') {
  return useQuery({
    queryKey: [kind, slug],
    queryFn: ({ signal }) => fetchJson<StatePage>(`${kind}/${encodeURIComponent(slug ?? '')}`, undefined, signal),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

/** Every company page, one line each (12 KB; the facility index it replaced was 2.4 MB). */
export function useOperators() {
  return useQuery({
    queryKey: ['operators'],
    queryFn: ({ signal }) => fetchJson<OperatorsList>('operators', undefined, signal),
    staleTime: HOUR,
  });
}

/** The /resources/ page's list: crisis lines, where to report, support. */
export function useResources() {
  return useQuery({
    queryKey: ['resources'],
    queryFn: ({ signal }) => fetchJson<ResourcesPayload>('resources', undefined, signal),
    staleTime: HOUR,
  });
}
