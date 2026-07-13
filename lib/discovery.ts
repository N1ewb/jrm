const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "JRM-JeepneyRouteMapper/1.0";

interface WikimediaImage {
  title: string;
  thumbnailUrl: string;
  fullUrl: string;
}

export async function searchPlaceImages(
  query: string,
): Promise<WikimediaImage[]> {
  if (!query.trim()) return [];

  const searchParams = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: `${query} Iligan City`,
    srlimit: "5",
    format: "json",
    origin: "*",
  });

  try {
    const searchRes = await fetch(`${WIKIMEDIA_API}?${searchParams}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const titles = searchData.query?.search?.map(
      (s: { title: string }) => s.title,
    );
    if (!titles || titles.length === 0) return [];

    const imageParams = new URLSearchParams({
      action: "query",
      titles: titles.join("|"),
      prop: "imageinfo",
      iiprop: "url",
      iiurlwidth: "400",
      format: "json",
      origin: "*",
    });

    const imageRes = await fetch(`${WIKIMEDIA_API}?${imageParams}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!imageRes.ok) return [];
    const imageData = await imageRes.json();
    const pages = imageData.query?.pages ?? {};
    const results: WikimediaImage[] = [];

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId];
      const imageInfo = page.imageinfo?.[0];
      if (imageInfo?.url) {
        results.push({
          title: page.title,
          thumbnailUrl: imageInfo.thumburl ?? imageInfo.url,
          fullUrl: imageInfo.url,
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

export function generatePlaceImageFallback(name: string): string {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials;
}

export function getPlaceInitialsBg(name: string): string {
  const hue =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue}, 40%, 50%)`;
}
