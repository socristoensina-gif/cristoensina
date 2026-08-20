// lib/youtube.ts
//
// O YouTube publica um feed RSS público e gratuito para todo canal — não precisa
// de API key nem de cota diária. Formato: https://www.youtube.com/feeds/videos.xml?channel_id=XXXX
// Isso resolve "página com os vídeos do canal" sem custo e sem limite de requisições.

export interface YoutubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

export async function getLatestVideos(limit = 6): Promise<YoutubeVideo[]> {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId) return [];

  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { next: { revalidate: 3600 } }, // atualiza a cada 1h, não a cada visita
    );
    if (!res.ok) return [];

    const xml = await res.text();
    const entries = xml.split("<entry>").slice(1);

    return entries.slice(0, limit).map((entry) => {
      const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? "";
      const title = entry.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? "";

      return {
        id: videoId,
        title,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: published,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    });
  } catch {
    return [];
  }
}
