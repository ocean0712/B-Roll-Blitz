import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  video_files: PexelsVideoFile[];
  video_pictures: { id: number; picture: string }[];
  duration: number;
  user: { id: number; name: string; url: string };
}

interface PexelsSearchResponse {
  page: number;
  per_page: number;
  total_results: number;
  videos: PexelsVideo[];
}

function getBestVideoFile(videos: PexelsVideoFile[], aspectRatio: string): PexelsVideoFile | null {
  if (!videos || videos.length === 0) return null;

  // Filter by aspect ratio preference
  const targetRatio = aspectRatio === "9:16" ? 0.56 : 1.77;

  const scored = videos.map((vf) => {
    const ratio = vf.width / vf.height;
    const ratioDiff = Math.abs(ratio - targetRatio);
    const qualityScore = vf.quality === "hd" ? 100 : vf.quality === "sd" ? 50 : 25;
    return { file: vf, score: ratioDiff * 100 - qualityScore };
  });

  scored.sort((a, b) => a.score - b.score);
  return scored[0]?.file || null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { keywords, aspectRatio, perPage } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing keywords array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("PEXELS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Pexels API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const query = keywords.join(" ");
    const limit = perPage || 6;
    const orientation = aspectRatio === "9:16" ? "portrait" : "landscape";

    const pexelsUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=${orientation}`;

    const pexelsResponse = await fetch(pexelsUrl, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!pexelsResponse.ok) {
      const errorText = await pexelsResponse.text();
      return new Response(
        JSON.stringify({ error: `Pexels API error: ${pexelsResponse.status}`, details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = (await pexelsResponse.json()) as PexelsSearchResponse;

    const results = data.videos.map((video) => {
      const bestFile = getBestVideoFile(video.video_files, aspectRatio);
      return {
        id: video.id,
        url: video.url,
        thumbnail: video.image,
        duration: video.duration,
        author: video.user.name,
        authorUrl: video.user.url,
        videoUrl: bestFile?.link || video.video_files[0]?.link || "",
        width: video.width,
        height: video.height,
        aspectRatio: aspectRatio,
      };
    });

    return new Response(
      JSON.stringify({ videos: results, total: data.total_results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
