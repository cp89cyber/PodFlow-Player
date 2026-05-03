import React, { useState, useEffect, useRef } from 'react';

// --- Icons ---
const Icons = {
  Home: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Search: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Play: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Pause: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  SkipForward: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17.5 5.5C19.7 7.7 21 10.7 21 14c0 6.6-5.4 12-12 12S-3 20.6-3 14c0-3.3 1.3-6.3 3.5-8.5L2 4"/><path d="M10 14h10"/><path d="m16 10 4 4-4 4"/><text x="11" y="14" fontSize="6" fontWeight="bold" dominantBaseline="middle" textAnchor="middle">15</text></svg>,
  SkipBack: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6.5 5.5C4.3 7.7 3 10.7 3 14c0 6.6-5.4 12 12 12s12-5.4 12-12c0-3.3-1.3-6.3-3.5-8.5L22 4"/><path d="M14 14H4"/><path d="m8 10-4 4 4 4"/><text x="13" y="14" fontSize="6" fontWeight="bold" dominantBaseline="middle" textAnchor="middle">15</text></svg>,
  ChevronDown: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m6 9 6 6 6-6"/></svg>,
  ChevronLeft: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m15 18-6-6 6-6"/></svg>,
  Loader: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  AlertCircle: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
};

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [viewedPodcast, setViewedPodcast] = useState(null); 
  
  const [podcasts, setPodcasts] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [isFetchingPodcasts, setIsFetchingPodcasts] = useState(false);
  const [isFetchingEpisodes, setIsFetchingEpisodes] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  
  const audioRef = useRef(null);

  useEffect(() => {
    searchPodcasts('technology');
  }, []);

  const searchPodcasts = async (term) => {
    if (!term) return;
    setIsFetchingPodcasts(true);
    try {
      // Increased limit to 50 so we still have plenty of results after filtering out duplicates
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=podcast&entity=podcast&limit=50`);
      const data = await res.json();
      
      // Deduplicate podcasts by name to remove copycats/re-uploads
      const uniquePodcasts = [];
      const seenNames = new Set();
      
      data.results.forEach(podcast => {
        const name = podcast.collectionName?.toLowerCase().trim();
        if (name && !seenNames.has(name)) {
          seenNames.add(name);
          uniquePodcasts.push(podcast);
        }
      });

      setPodcasts(uniquePodcasts);
    } catch (err) {
      console.error("Failed to fetch podcasts:", err);
    } finally {
      setIsFetchingPodcasts(false);
    }
  };

  const loadEpisodes = async (podcast) => {
    setViewedPodcast(podcast);
    setEpisodes([]);
    setFetchError(null);
    setIsFetchingEpisodes(true);

    if (!podcast.feedUrl) {
      setFetchError("This podcast does not provide a valid RSS feed URL.");
      setIsFetchingEpisodes(false);
      return;
    }

    try {
      // 1. STRATEGY ONE: RSS2JSON API (Highly reliable, bypasses host CORS/Proxy blocks)
      const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(podcast.feedUrl)}`;
      
      try {
        const res = await fetch(rss2jsonUrl);
        const data = await res.json();
        
        if (data.status === 'ok' && data.items && data.items.length > 0) {
          const parsedEpisodes = data.items.map(item => {
            // Find audio link
            const audioUrl = item.enclosure?.link;
            if (!audioUrl) return null;

            // Clean description
            let description = item.description || item.content || "";
            description = description.replace(/<[^>]*>?/gm, '').substring(0, 150).trim();
            if (description) description += "...";

            return {
              id: audioUrl,
              title: item.title || "Unknown Title",
              description: description,
              audioUrl: audioUrl,
              pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : "Unknown Date",
              imageUrl: item.thumbnail || podcast.artworkUrl600,
              podcastTitle: podcast.collectionName
            };
          }).filter(Boolean);

          if (parsedEpisodes.length > 0) {
            setEpisodes(parsedEpisodes.slice(0, 100));
            setIsFetchingEpisodes(false);
            return; // Exit early! We succeeded.
          }
        }
      } catch (e) {
        console.warn("RSS2JSON strategy failed, falling back to raw XML fetch.", e);
      }

      // 2. STRATEGY TWO: Multi-proxy fallback for raw XML (If RSS2JSON fails)
      const fetchSources = [
        { url: podcast.feedUrl, type: 'text' }, 
        { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(podcast.feedUrl)}`, type: 'text' },
        { url: `https://corsproxy.io/?${encodeURIComponent(podcast.feedUrl)}`, type: 'text' }
      ];

      let xmlText = null;

      for (const source of fetchSources) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); 
          
          const res = await fetch(source.url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!res.ok) continue;

          const text = await res.text();
          if (text && (text.includes('<rss') || text.includes('<feed'))) {
            xmlText = text;
            break;
          }
        } catch (e) {
          console.warn(`Source ${source.url} failed, moving to next.`);
        }
      }

      if (!xmlText) {
        throw new Error("Cannot reach the podcast feed server.\n\nThe podcast host has blocked external web access, preventing playback in the browser.\n\nURL: " + podcast.feedUrl);
      }
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      if (xmlDoc.querySelector("parsererror")) {
        throw new Error("The podcast feed returned invalid or malformed XML data.");
      }

      const items = xmlDoc.querySelectorAll("item, entry");
      
      const parsedEpisodes = Array.from(items).map(item => {
        const title = item.querySelector("title")?.textContent || "Unknown Title";
        
        const audioUrl = item.querySelector("enclosure")?.getAttribute("url") || 
                         item.querySelector("link[rel='enclosure']")?.getAttribute("href");
        
        if (!audioUrl) return null;

        let description = item.querySelector("description")?.textContent || 
                          item.querySelector("summary")?.textContent || 
                          item.getElementsByTagNameNS("*", "encoded")[0]?.textContent || 
                          "";
                          
        description = description.replace(/<[^>]*>?/gm, '').substring(0, 150).trim();
        if (description) description += "...";
        
        const pubDateRaw = item.querySelector("pubDate")?.textContent || 
                           item.querySelector("published")?.textContent ||
                           item.querySelector("updated")?.textContent;
                           
        const pubDate = pubDateRaw ? new Date(pubDateRaw).toLocaleDateString() : "Unknown Date";
        
        let imageUrl = podcast.artworkUrl600;
        const itunesImage = item.getElementsByTagNameNS("*", "image");
        if(itunesImage.length > 0) {
           imageUrl = itunesImage[0].getAttribute("href") || imageUrl;
        }

        return { 
          id: audioUrl, 
          title, 
          description,
          audioUrl, 
          pubDate, 
          imageUrl,
          podcastTitle: podcast.collectionName
        };
      }).filter(Boolean);

      if (parsedEpisodes.length === 0) {
        throw new Error("Found items in the feed, but none of them contained playable audio files.");
      }

      setEpisodes(parsedEpisodes.slice(0, 100));
      
    } catch (err) {
      console.error("Episode Parsing Error:", err);
      setFetchError(err.message || "An unexpected error occurred while processing the podcast feed.");
    } finally {
      setIsFetchingEpisodes(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !currentEpisode) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playEpisode = (episode) => {
    if (currentEpisode?.id === episode.id) {
      handlePlayPause();
      return;
    }
    setCurrentEpisode(episode);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current && currentEpisode) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Playback interrupted", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentEpisode, isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setProgress(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const skip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchPodcasts(searchQuery);
    setViewedPodcast(null);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      
      <audio 
        ref={audioRef}
        src={currentEpisode?.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={handleTimeUpdate}
      />

      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        
        {/* VIEW: Home / Search Results */}
        {!viewedPodcast && (
          <div className="p-4 sm:p-6 pb-20 max-w-5xl mx-auto">
            <div className="mb-8 mt-4">
              <h1 className="text-3xl font-bold mb-6 text-white tracking-tight">Discover</h1>
              <form onSubmit={handleSearchSubmit} className="relative">
                <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search podcasts..." 
                  className="w-full bg-slate-800/80 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 backdrop-blur-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>

            {isFetchingPodcasts ? (
              <div className="flex justify-center py-20 text-indigo-400">
                <Icons.Loader size={40} />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {podcasts.map(podcast => (
                  <div 
                    key={podcast.collectionId} 
                    className="cursor-pointer group flex flex-col gap-2 active:scale-95 transition-transform"
                    onClick={() => loadEpisodes(podcast)}
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-800 shadow-lg shadow-black/40">
                      <img 
                        src={podcast.artworkUrl600} 
                        alt={podcast.collectionName}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2 mt-1 group-hover:text-indigo-400 transition-colors">
                        {podcast.collectionName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {podcast.artistName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: Podcast Details & Episode List */}
        {viewedPodcast && (
          <div className="pb-20">
            <div className="relative pt-12 pb-8 px-4 sm:px-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 bg-gradient-to-b from-indigo-900/40 to-slate-950">
              <button 
                className="absolute top-4 left-4 p-2 bg-black/40 rounded-full backdrop-blur-md hover:bg-black/60 transition z-10"
                onClick={() => setViewedPodcast(null)}
              >
                <Icons.ChevronLeft size={24} />
              </button>
              
              <img 
                src={viewedPodcast.artworkUrl600} 
                alt="Cover" 
                className="w-40 h-40 sm:w-56 sm:h-56 rounded-2xl shadow-2xl shadow-black/60 object-cover bg-slate-800"
              />
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">{viewedPodcast.collectionName}</h1>
                <p className="text-slate-400 text-lg font-medium">{viewedPodcast.artistName}</p>
                <div className="mt-4 flex gap-2 justify-center sm:justify-start">
                  <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-semibold uppercase tracking-wider text-slate-300">
                    {viewedPodcast.primaryGenreName}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-8 max-w-5xl mx-auto">
              <h2 className="text-xl font-bold mb-4 border-b border-slate-800 pb-2">Episodes</h2>
              
              {isFetchingEpisodes ? (
                <div className="flex justify-center py-10 text-indigo-400">
                  <Icons.Loader size={32} />
                </div>
              ) : fetchError ? (
                // Safe, constrained Error Display Box
                <div className="flex flex-col items-center justify-center py-8 px-4 sm:px-8 bg-slate-900/50 rounded-3xl border border-slate-800 w-full overflow-hidden shadow-inner">
                  <Icons.AlertCircle className="text-red-400 mb-4 shrink-0" size={48} />
                  <p className="text-slate-200 text-xl font-semibold mb-2 text-center">Could not load episodes</p>
                  
                  {/* The scrollable error text container */}
                  <div className="w-full max-w-full max-h-40 overflow-y-auto bg-slate-950/80 p-4 rounded-xl border border-slate-800/50 mb-6 mt-2">
                     <p className="text-slate-400 text-xs sm:text-sm font-mono text-left break-all whitespace-pre-wrap">
                       {fetchError}
                     </p>
                  </div>

                  <button 
                    onClick={() => loadEpisodes(viewedPodcast)}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-full transition-all font-medium shrink-0 flex items-center gap-2"
                  >
                    Try Request Again
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {episodes.map((ep, idx) => {
                    const isActive = currentEpisode?.id === ep.id;
                    return (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-2xl flex flex-col sm:flex-row gap-4 transition-colors cursor-pointer ${isActive ? 'bg-indigo-900/30 ring-1 ring-indigo-500/50' : 'bg-slate-800/40 hover:bg-slate-800'}`}
                        onClick={() => playEpisode(ep)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-400">{ep.pubDate}</span>
                            {isActive && isPlaying && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>}
                          </div>
                          <h3 className={`font-semibold mb-2 leading-snug truncate sm:whitespace-normal ${isActive ? 'text-indigo-300' : 'text-slate-100'}`}>
                            {ep.title}
                          </h3>
                          <p className="text-sm text-slate-400 line-clamp-2">
                            {ep.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end sm:w-24 mt-2 sm:mt-0">
                          <button 
                            className={`p-3 rounded-full flex items-center justify-center transition-transform active:scale-90 ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-900 hover:bg-white'}`}
                            onClick={(e) => { e.stopPropagation(); playEpisode(ep); }}
                          >
                            {isActive && isPlaying ? <Icons.Pause size={20} /> : <Icons.Play size={20} className="ml-0.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mini Player */}
      {currentEpisode && (
        <div 
          className="fixed bottom-16 sm:bottom-20 left-2 right-2 sm:left-auto sm:right-6 sm:w-96 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 p-2 rounded-2xl shadow-2xl shadow-black/50 flex items-center gap-3 cursor-pointer z-40 transition-transform active:scale-[0.98]"
          onClick={() => setIsPlayerExpanded(true)}
        >
          <img 
            src={currentEpisode.imageUrl} 
            alt="Now Playing" 
            className="w-12 h-12 rounded-xl object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="truncate font-semibold text-sm text-white">{currentEpisode.title}</div>
            <div className="truncate text-xs text-slate-400">{currentEpisode.podcastTitle}</div>
          </div>
          <button 
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all mr-1"
            onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
          >
            {isPlaying ? <Icons.Pause size={18} /> : <Icons.Play size={18} className="ml-0.5" />}
          </button>
        </div>
      )}

      {/* Full Screen Player */}
      <div 
        className={`fixed inset-0 z-50 bg-slate-950 flex flex-col transition-transform duration-300 ease-out will-change-transform ${isPlayerExpanded ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <button 
            onClick={() => setIsPlayerExpanded(false)}
            className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
          >
            <Icons.ChevronDown size={28} />
          </button>
          <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">Now Playing</span>
          <div className="w-10"></div> 
        </div>

        <div className="flex-1 flex flex-col px-8 pb-12 max-w-md mx-auto w-full">
          <div className="flex-1 flex items-center justify-center min-h-0 mb-8">
            <img 
              src={currentEpisode?.imageUrl} 
              alt="Artwork" 
              className={`w-full aspect-square object-cover rounded-3xl shadow-2xl shadow-black/80 transition-transform duration-500 ${isPlaying ? 'scale-100' : 'scale-95'}`}
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2 line-clamp-2 leading-tight">{currentEpisode?.title}</h2>
            <p className="text-lg text-slate-400 line-clamp-1">{currentEpisode?.podcastTitle}</p>
          </div>

          <div className="mb-8">
            <div className="relative w-full h-2 bg-slate-800 rounded-full mb-3 cursor-pointer">
              <div 
                className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full pointer-events-none"
                style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
              ></div>
              <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                value={progress} 
                onChange={handleSeek}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-medium tabular-nums">
              <span>{formatTime(progress)}</span>
              <span>-{formatTime(duration - progress)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 mb-6">
            <button 
              className="text-slate-300 hover:text-white active:scale-90 transition-all"
              onClick={() => skip(-15)}
            >
              <Icons.SkipBack size={36} />
            </button>
            <button 
              className="w-20 h-20 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-900/50"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Icons.Pause size={36} /> : <Icons.Play size={36} className="ml-1" />}
            </button>
            <button 
              className="text-slate-300 hover:text-white active:scale-90 transition-all"
              onClick={() => skip(15)}
            >
              <Icons.SkipForward size={36} />
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-16 sm:h-20 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 flex justify-around items-center px-6 z-30">
        <button 
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'home' && !viewedPodcast ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => { setActiveTab('home'); setViewedPodcast(null); }}
        >
          <Icons.Home size={24} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'search' && !viewedPodcast ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => { setActiveTab('search'); setViewedPodcast(null); }}
        >
          <Icons.Search size={24} />
          <span className="text-[10px] font-medium">Search</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
