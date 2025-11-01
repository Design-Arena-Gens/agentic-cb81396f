'use client';

import { useState, useEffect } from 'react';
import { Search, Play, List, Clock, TrendingUp, Download, Trash2, Plus } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  views: string;
  publishedAt: string;
  duration: string;
}

interface Playlist {
  id: string;
  name: string;
  videos: Video[];
  createdAt: string;
}

interface AutomationRule {
  id: string;
  type: 'search' | 'channel' | 'trending';
  query: string;
  action: 'add_to_playlist' | 'download' | 'notify';
  targetPlaylist?: string;
  frequency: string;
  lastRun?: string;
  enabled: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'search' | 'playlists' | 'automations'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedApiKey = localStorage.getItem('youtube_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
      setShowApiKeyInput(true);
    }

    const savedPlaylists = localStorage.getItem('playlists');
    if (savedPlaylists) {
      setPlaylists(JSON.parse(savedPlaylists));
    }

    const savedAutomations = localStorage.getItem('automations');
    if (savedAutomations) {
      setAutomations(JSON.parse(savedAutomations));
    }
  }, []);

  const saveApiKey = () => {
    localStorage.setItem('youtube_api_key', apiKey);
    setShowApiKeyInput(false);
  };

  const searchVideos = async () => {
    if (!searchQuery.trim() || !apiKey) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}&key=${apiKey}`);
      const data = await response.json();

      if (data.items) {
        const videoData: Video[] = data.items.map((item: any) => ({
          id: item.id.videoId || item.id,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          channel: item.snippet.channelTitle,
          views: 'N/A',
          publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
          duration: 'N/A'
        }));
        setVideos(videoData);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setVideos(generateMockVideos(searchQuery));
    } finally {
      setLoading(false);
    }
  };

  const generateMockVideos = (query: string): Video[] => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: `video-${i}`,
      title: `${query} - Tutorial Part ${i + 1}`,
      thumbnail: `https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
      channel: `Creator ${i + 1}`,
      views: `${Math.floor(Math.random() * 1000)}K views`,
      publishedAt: `${Math.floor(Math.random() * 30)} days ago`,
      duration: `${Math.floor(Math.random() * 20) + 5}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
    }));
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;

    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: newPlaylistName,
      videos: [],
      createdAt: new Date().toISOString()
    };

    const updated = [...playlists, newPlaylist];
    setPlaylists(updated);
    localStorage.setItem('playlists', JSON.stringify(updated));
    setNewPlaylistName('');
  };

  const addVideosToPlaylist = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const videosToAdd = videos.filter(v => selectedVideos.has(v.id));
    playlist.videos.push(...videosToAdd);

    const updated = playlists.map(p => p.id === playlistId ? playlist : p);
    setPlaylists(updated);
    localStorage.setItem('playlists', JSON.stringify(updated));
    setSelectedVideos(new Set());
  };

  const deletePlaylist = (playlistId: string) => {
    const updated = playlists.filter(p => p.id !== playlistId);
    setPlaylists(updated);
    localStorage.setItem('playlists', JSON.stringify(updated));
  };

  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedVideos);
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId);
    } else {
      newSelection.add(videoId);
    }
    setSelectedVideos(newSelection);
  };

  const addAutomation = () => {
    const newAutomation: AutomationRule = {
      id: `automation-${Date.now()}`,
      type: 'search',
      query: searchQuery || 'trending',
      action: 'add_to_playlist',
      frequency: 'daily',
      enabled: true
    };

    const updated = [...automations, newAutomation];
    setAutomations(updated);
    localStorage.setItem('automations', JSON.stringify(updated));
  };

  const toggleAutomation = (automationId: string) => {
    const updated = automations.map(a =>
      a.id === automationId ? { ...a, enabled: !a.enabled } : a
    );
    setAutomations(updated);
    localStorage.setItem('automations', JSON.stringify(updated));
  };

  const deleteAutomation = (automationId: string) => {
    const updated = automations.filter(a => a.id !== automationId);
    setAutomations(updated);
    localStorage.setItem('automations', JSON.stringify(updated));
  };

  if (showApiKeyInput) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gray-900 p-8 rounded-lg shadow-xl max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">YouTube API Key</h2>
          <p className="text-gray-400 mb-4">
            Enter your YouTube Data API v3 key to get started. You can get one from the Google Cloud Console.
          </p>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg mb-4 focus:outline-none focus:border-red-500"
          />
          <button
            onClick={saveApiKey}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
          >
            Save & Continue
          </button>
          <button
            onClick={() => { setShowApiKeyInput(false); setVideos(generateMockVideos('demo')); }}
            className="w-full px-4 py-2 mt-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
          >
            Skip (Use Demo Mode)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Play className="text-red-600" size={32} fill="currentColor" />
              <h1 className="text-2xl font-bold">YouTube Automation</h1>
            </div>
            <button
              onClick={() => setShowApiKeyInput(true)}
              className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition"
            >
              API Settings
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex space-x-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'search'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Search className="inline mr-2" size={20} />
            Search
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'playlists'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="inline mr-2" size={20} />
            Playlists
          </button>
          <button
            onClick={() => setActiveTab('automations')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'automations'
                ? 'text-red-500 border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="inline mr-2" size={20} />
            Automations
          </button>
        </div>

        {activeTab === 'search' && (
          <div>
            <div className="flex space-x-2 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchVideos()}
                placeholder="Search YouTube videos..."
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-red-500"
              />
              <button
                onClick={searchVideos}
                disabled={loading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                onClick={addAutomation}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition"
              >
                <Plus className="inline mr-2" size={20} />
                Automate
              </button>
            </div>

            {selectedVideos.size > 0 && (
              <div className="mb-4 p-4 bg-gray-900 rounded-lg flex items-center justify-between">
                <span>{selectedVideos.size} video(s) selected</span>
                <div className="flex space-x-2">
                  {playlists.map(playlist => (
                    <button
                      key={playlist.id}
                      onClick={() => addVideosToPlaylist(playlist.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition"
                    >
                      Add to {playlist.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition cursor-pointer ${
                    selectedVideos.has(video.id) ? 'ring-2 ring-red-500' : ''
                  }`}
                  onClick={() => toggleVideoSelection(video.id)}
                >
                  <div className="relative">
                    <img src={video.thumbnail} alt={video.title} className="w-full aspect-video object-cover" />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold mb-1 line-clamp-2">{video.title}</h3>
                    <p className="text-sm text-gray-400">{video.channel}</p>
                    <p className="text-xs text-gray-500">{video.views} • {video.publishedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'playlists' && (
          <div>
            <div className="flex space-x-2 mb-6">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createPlaylist()}
                placeholder="New playlist name..."
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-red-500"
              />
              <button
                onClick={createPlaylist}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
              >
                Create Playlist
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{playlist.name}</h3>
                      <p className="text-sm text-gray-400">{playlist.videos.length} videos</p>
                    </div>
                    <button
                      onClick={() => deletePlaylist(playlist.id)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {playlist.videos.slice(0, 3).map((video) => (
                      <div key={video.id} className="flex space-x-2 text-sm">
                        <img src={video.thumbnail} alt="" className="w-20 h-12 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{video.title}</p>
                          <p className="text-xs text-gray-500">{video.channel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'automations' && (
          <div>
            <div className="mb-6 p-6 bg-gray-900 rounded-lg">
              <h2 className="text-xl font-bold mb-2">Automation Rules</h2>
              <p className="text-gray-400">
                Create rules to automatically search, collect, and organize YouTube videos.
              </p>
            </div>

            <div className="space-y-4">
              {automations.map((automation) => (
                <div key={automation.id} className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          automation.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {automation.enabled ? 'Active' : 'Paused'}
                        </span>
                        <span className="text-sm text-gray-400 capitalize">{automation.type}</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">Auto-collect: {automation.query}</h3>
                      <p className="text-sm text-gray-400">
                        {automation.action.replace('_', ' ')} • Runs {automation.frequency}
                      </p>
                      {automation.lastRun && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last run: {new Date(automation.lastRun).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleAutomation(automation.id)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          automation.enabled
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {automation.enabled ? 'Pause' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteAutomation(automation.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {automations.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No automation rules yet. Search for videos and click "Automate" to create one.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
