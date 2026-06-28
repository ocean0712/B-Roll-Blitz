import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import {
  Film, Monitor, Smartphone, Sparkles, Play,
  Loader2, Clapperboard, ArrowRight, Clock, User, ExternalLink
} from 'lucide-react';

interface VideoResult {
  id: number;
  url: string;
  thumbnail: string;
  duration: number;
  author: string;
  authorUrl: string;
  videoUrl: string;
  width: number;
  height: number;
  aspectRatio: string;
}

function getFingerprint() {
  let fp = localStorage.getItem('broll_fingerprint');
  if (!fp) {
    fp = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    localStorage.setItem('broll_fingerprint', fp);
  }
  return fp;
}

export default function App() {
  const [script, setScript] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [searchesLeft, setSearchesLeft] = useState(5);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  const fetchUsage = useCallback(async () => {
    const fp = getFingerprint();
    const { data } = await supabase
      .from('broll_usage')
      .select('*')
      .eq('fingerprint', fp)
      .eq('usage_date', new Date().toISOString().split('T')[0])
      .maybeSingle();
    if (data) {
      setSearchesLeft(Math.max(0, data.max_searches - data.searches_count));
    } else {
      setSearchesLeft(5);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const extractKeywords = (text: string) => {
    if (!text.trim()) return [];
    const commonWords = new Set([
      'the','a','an','to','and','is','in','it','of','for','my','your','with','on','at','by','from','as','but','or','so','if','this','that','be','are','was','were','have','has','had','do','does','did','will','would','could','should','may','might','can','shall','am','been','being','than','then','them','they','their','there','when','where','what','who','how','why','which','while','about','into','through','during','before','after','above','below','between','among','within','without','against','until','since','because','although','though','unless','whether','however','therefore','moreover','furthermore','nevertheless','meanwhile','instead','otherwise','besides','according','actually','already','almost','although','always','another','anyone','anything','around','available','back','become','behind','believe','better','between','both','bring','build','call','came','come','could','course','create','each','early','either','else','even','ever','every','everyone','everything','example','experience','face','fact','family','feel','felt','few','find','first','follow','following','found','give','given','goes','going','gone','got','gotten','great','group','grow','had','hand','happened','having','help','high','higher','highest','him','himself','his','how','however','hundred','idea','important','inside','instead','interest','interested','interesting','into','its','itself','keep','kind','know','known','large','last','later','learn','leave','left','less','let','letter','life','light','like','likely','line','list','little','live','living','long','longer','look','looking','looks','made','make','making','many','matter','mean','means','meet','member','members','mention','mentioned','merely','method','methods','middle','might','million','mind','mine','minute','minutes','miss','moment','money','month','months','more','morning','most','mostly','move','movement','much','must','name','named','nearly','need','needed','needs','never','new','next','nine','ninety','no','nobody','none','nor','normal','north','not','note','nothing','notice','now','number','numbers','object','objects','often','old','older','once','one','only','open','opened','opening','opens','opinion','opinions','order','ordered','ordering','orders','other','others','otherwise','ought','out','outside','over','own','page','pages','part','parts','particular','particularly','past','people','per','perhaps','person','persons','personal','picture','pictures','piece','pieces','place','placed','places','plan','plans','play','played','playing','plays','point','points','poor','position','possible','power','present','presented','presenting','presents','press','pressed','presses','pressure','pretty','private','probably','problem','problems','process','produce','produced','produces','producing','product','products','proper','properly','provide','provided','provides','providing','public','pull','pulled','pulling','pulls','purpose','purposes','push','pushed','pushes','pushing','put','puts','quality','question','questions','quick','quickly','quite','rather','reach','reached','reaches','reaching','read','reading','ready','real','really','reason','reasons','receive','received','receives','receiving','recent','recently','record','records','red','reduce','reduced','reduces','reducing','reference','references','related','relation','relations','remain','remained','remaining','remains','remember','remembered','remembering','remembers','remove','removed','removes','removing','repeat','repeated','repeating','repeats','reply','report','reported','reporting','reports','require','required','requires','requiring','research','rest','result','results','return','returned','returning','returns','right','room','rooms','round','run','running','runs','said','same','saw','say','saying','says','second','seconds','see','seeing','seem','seemed','seeming','seems','seen','self','send','sending','sends','sense','sent','series','serious','set','sets','setting','several','shall','shape','shapes','share','shared','shares','sharing','she','should','show','showed','showing','shown','shows','side','sides','sign','signs','similar','simple','simply','since','single','sit','sits','sitting','situation','situations','six','size','sizes','small','smaller','smallest','so','some','somebody','someone','something','sometimes','somewhere','soon','south','space','spaces','speak','speaking','speaks','special','specific','spend','spent','spoke','stand','standing','stands','start','started','starting','starts','state','stated','states','stating','still','stop','stopped','stopping','stops','story','stories','strong','student','students','study','studies','subject','subjects','such','suddenly','suggest','suggested','suggesting','suggests','sum','support','supported','supporting','supports','suppose','supposed','supposing','supposes','sure','surface','surfaces','system','systems','table','tables','take','taken','takes','taking','talk','talked','talking','talks','tall','taste','taught','teach','teaches','teaching','team','teams','tell','telling','tells','ten','tends','term','terms','test','tested','testing','tests','than','thank','thanked','thanking','thanks','that','the','their','them','themselves','then','there','therefore','these','they','thing','things','think','thinking','thinks','third','thirty','this','those','though','thought','thoughts','thousand','three','through','throughout','thus','till','time','times','title','titles','today','together','too','took','toward','towards','town','towns','train','trained','training','trains','travel','traveling','travels','tried','tries','try','trying','turn','turned','turning','turns','twenty','two','type','types','under','understand','understanding','understands','understood','unit','units','until','up','upon','us','use','used','uses','using','usually','value','values','various','very','view','viewed','viewing','views','voice','voices','wait','waited','waiting','waits','walk','walked','walking','walks','wall','walls','want','wanted','wanting','wants','war','warm','was','watch','watched','watching','watches','water','way','ways','we','week','weeks','well','went','were','west','what','whatever','when','where','whether','which','while','white','who','whole','whom','whose','why','wide','wife','will','willing','win','wind','wins','wish','wished','wishes','wishing','with','within','without','woman','women','won','wonder','wondered','wondering','wonders','word','words','work','worked','working','works','world','worlds','would','write','writes','writing','written','wrong','wrote','year','years','yes','yesterday','yet','you','young','younger','youngest','your','yourself','yourselves'
    ]);
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
    const freq = new Map<string, number>();
    words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));
    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 5).map(([w]) => w);
  };

  const handleAnalyze = async () => {
    if (searchesLeft <= 0) {
      setError("You've reached your daily free limit. Upgrade to Pro for unlimited searches.");
      return;
    }
    if (!script.trim()) {
      setError("Please paste a script first.");
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    setHasSearched(true);
    setVideos([]);

    const extracted = extractKeywords(script);
    setKeywords(extracted);

    if (extracted.length === 0) {
      setError("No meaningful keywords found. Try a longer script.");
      setIsAnalyzing(false);
      return;
    }

    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brollblitz`;
      const resp = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ keywords: extracted, aspectRatio, perPage: 6 }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${resp.status})`);
      }
      const data = await resp.json();
      setVideos(data.videos || []);

      const fp = getFingerprint();
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('broll_usage')
        .select('id, searches_count')
        .eq('fingerprint', fp)
        .eq('usage_date', today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('broll_usage')
          .update({ searches_count: existing.searches_count + 1 })
          .eq('id', existing.id);
        setSearchesLeft(Math.max(0, 5 - (existing.searches_count + 1)));
      } else {
        await supabase
          .from('broll_usage')
          .insert({ fingerprint: fp, usage_date: today, searches_count: 1 });
        setSearchesLeft(4);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch videos.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-400 text-black p-2 rounded-lg">
              <Clapperboard className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">B-Roll Blitz</h1>
          </div>
          <button className="bg-amber-400 text-black px-4 py-2 rounded-lg font-semibold text-sm hover:bg-amber-300 transition-colors">
            Upgrade to Pro
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                01. Script Input
              </p>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Paste your video script here. Mention scenes, places, objects, moods..."
                className="w-full h-48 bg-neutral-900 border-2 border-amber-400/60 rounded-lg text-white p-4 text-base placeholder-neutral-600 resize-none focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                02. Aspect Ratio
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setAspectRatio('16:9')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all ${
                    aspectRatio === '16:9'
                      ? 'bg-amber-400 text-black'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  LANDSCAPE 16:9
                </button>
                <button
                  onClick={() => setAspectRatio('9:16')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all ${
                    aspectRatio === '9:16'
                      ? 'bg-amber-400 text-black'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  SHORTS 9:16
                </button>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-4 bg-amber-400 text-black rounded-lg font-bold text-base uppercase tracking-wide hover:bg-amber-300 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze & Find B-Roll
                </>
              )}
            </button>

            <p className="text-xs text-neutral-600 text-center flex items-center justify-center gap-1">
              <Film className="w-3 h-3" />
              POWERED BY PEXELS
              <span className="mx-1">|</span>
              {searchesLeft} OF 5 FREE SEARCHES LEFT TODAY
            </p>

            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="bg-neutral-900 border border-dashed border-neutral-700 rounded-lg p-6 min-h-[400px] flex flex-col">
            {hasSearched && keywords.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                  Detected Keywords
                </p>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="bg-neutral-800 text-amber-400 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-amber-400" />
                <p className="text-sm">Scanning your script for B-Roll opportunities...</p>
              </div>
            ) : videos.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Found {videos.length} Video{videos.length > 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-neutral-800 rounded-lg overflow-hidden group hover:ring-2 hover:ring-amber-400/40 transition-all"
                      onMouseEnter={() => {
                        const el = videoRefs.current[video.id];
                        if (el) el.play().catch(() => {});
                      }}
                      onMouseLeave={() => {
                        const el = videoRefs.current[video.id];
                        if (el) { el.pause(); el.currentTime = 0; }
                      }}
                    >
                      <div className="relative bg-neutral-950">
                        <video
                          ref={(el) => { videoRefs.current[video.id] = el; }}
                          src={video.videoUrl}
                          muted
                          loop
                          playsInline
                          className="w-full h-40 object-cover"
                          poster={video.thumbnail}
                        />
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(video.duration)}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="bg-black/50 rounded-full p-2">
                            <Play className="w-6 h-6 text-white fill-white" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {video.author}
                          </span>
                          <span>{video.width}x{video.height}</span>
                        </div>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-1"
                        >
                          View on Pexels
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : hasSearched && keywords.length === 0 ? null : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-center">
                <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                  <Play className="w-8 h-8 text-neutral-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-400 mb-2">
                  Your Video Clips Will Appear Here
                </h3>
                <p className="text-sm max-w-xs text-neutral-600">
                  Paste a script on the left and hit Analyze & Find B-Roll.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
