import { useRouter, type Href } from 'expo-router';

import type { NewsItem } from '@/api/types';
import { FeedCard } from '@/components/site';
import { openLink, slugFromUrl } from '@/lib/links';

/** One article as the site's feed card; each facility chip opens that facility in the app. */
export function NewsCard({ item, onStory }: { item: NewsItem; onStory?: (slug: string) => void }) {
  const router = useRouter();
  return (
    <FeedCard
      item={item}
      onStory={onStory}
      onFacility={(f) => {
        const slug = f.slug || slugFromUrl(f.url);
        if (slug) router.push(`/facility/${slug}` as Href);
        else void openLink(f.url, (href) => router.push(href));
      }}
    />
  );
}
