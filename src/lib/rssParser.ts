export function decodeEntities(input: string): string {
  if (!input) return '';
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .trim();
}

function findTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = block.match(re);
  if (!m) {
    const selfClosing = new RegExp(`<${tag}[^/>]*/>`, 'i');
    if (selfClosing.test(block)) return '';
    return '';
  }
  return decodeEntities(m[1]);
}

function findAttr(tag: string, attr: string): string {
  const re = new RegExp(`<[^>]*\\b${attr}="([^"]*)"`, 'i');
  const m = tag.match(re);
  return m ? decodeEntities(m[1]) : '';
}

function findAllBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, 'gi');
  return xml.match(re) ?? [];
}

export interface ParsedRssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
  thumbnail?: string;
  source: string;
}

export function parseRss(xml: string, feedSource: string): ParsedRssItem[] {
  const channelMatch = xml.match(/<channel[\s\S]*?<\/channel>/i);
  if (!channelMatch) return [];

  const channel = channelMatch[0];
  const items = findAllBlocks(channel, 'item');
  const out: ParsedRssItem[] = [];

  for (const item of items) {
    const title = findTag(item, 'title');
    const description = findTag(item, 'description');
    const link = findTag(item, 'link') || findAttr(item, 'link') || findTag(item, 'guid');
    const pubDate = findTag(item, 'pubDate');
    const guid = findTag(item, 'guid') || link;

    let thumbnail: string | undefined;
    const mediaContent = item.match(/<media:content[^>]*url="([^"]+)"/i);
    if (mediaContent) {
      thumbnail = mediaContent[1];
    } else {
      const enclosure = item.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i);
      if (enclosure) thumbnail = enclosure[1];
    }

    if (!thumbnail) {
      const imgMatch = description.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch) thumbnail = imgMatch[1];
    }

    let source = feedSource;
    const sourceTag = findTag(item, 'source');
    if (sourceTag) source = sourceTag;

    if (title && link) {
      out.push({
        title,
        description: stripHtml(description),
        link,
        pubDate,
        guid,
        thumbnail,
        source,
      });
    }
  }

  return out;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function hashId(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}
