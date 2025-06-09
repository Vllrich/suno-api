'use client';

import { useState, useEffect } from 'react';

interface AudioInfo {
  id: string;
  title?: string;
  image_url?: string;
  lyric?: string;
  audio_url?: string;
  video_url?: string;
  created_at: string;
  model_name: string;
  prompt?: string;
  status: string;
  tags?: string;
  duration?: string;
  error_message?: string;
}

interface StoredTrack {
  id: string;
  title: string;
  audio_url: string;
  image_url?: string;
  created_at: string;
  tags?: string;
  model_name: string;
}

interface Persona {
  id: string;
  name: string;
  description: string;
  reference_track_id: string;
  created_at: string;
}

export default function SunoGenerator() {
  const [formData, setFormData] = useState({
    prompt: 'Ambient techno foundations with 120-140 BPM, complex polyrhythmic structures generated through analog synthesis, deep sub-bass emphasis, and ethereal pad layers. Spectral characteristics include warm analog filter sweeps, resonant low-frequency modulation, and crystalline high-frequency textures. Incorporates processed field recordings, detuned piano samples, and evolving atmospheric soundscapes. Sound design utilizes granular manipulation, spatial reverb processing, and gradual timbral morphing. Compositional structure emphasizes hypnotic repetition with subtle harmonic drift, building tension through layered polyrhythms and dynamic filtering. Timbral palette combines organic warmth with digital precision, featuring cascading melodic sequences, syncopated percussion programming, and immersive drone foundations. Textural density varies from minimal sparse arrangements to dense layered climaxes. Classification: downtempo electronica, IDM, cinematic ambient with meditative techno elements',
    lyrics: '',
    tags: '',
    negative_tags: '',
    title: '',
    model: 'chirp-v4-5',
    make_instrumental: true,
    wait_audio: true,
    style_influence: 50,
    witness: 50,
    persona_id: '',
    persona_influence: 70,
    reference_track_id: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AudioInfo[]>([]);
  const [error, setError] = useState<string>('');
  const [storedTracks, setStoredTracks] = useState<StoredTrack[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [showPersonaCreation, setShowPersonaCreation] = useState(false);
  const [newPersona, setNewPersona] = useState({ name: '', description: '', reference_track_id: '' });

  const models = [
    { value: 'chirp-v4-5', label: 'Chirp v4.5 (Latest)' },
    { value: 'chirp-v4', label: 'Chirp v4' },
    { value: 'chirp-v3-5', label: 'Chirp v3.5' },
    { value: 'chirp-v3-0', label: 'Chirp v3.0' },
    { value: 'chirp-v2-xxl-alpha', label: 'Chirp v2 XXL Alpha' }
  ];

  // Load stored tracks and personas from localStorage on component mount
  useEffect(() => {
    const stored = localStorage.getItem('suno-tracks');
    if (stored) {
      setStoredTracks(JSON.parse(stored));
    }

    const storedPersonas = localStorage.getItem('suno-personas');
    if (storedPersonas) {
      setPersonas(JSON.parse(storedPersonas));
    }
  }, []);

  // Save tracks to localStorage
  const saveTrackToStorage = (track: AudioInfo) => {
    if (!track.audio_url || !track.title) return;
    
    const storedTrack: StoredTrack = {
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      image_url: track.image_url,
      created_at: track.created_at,
      tags: track.tags,
      model_name: track.model_name
    };

    const updatedTracks = [storedTrack, ...storedTracks.filter(t => t.id !== track.id)];
    setStoredTracks(updatedTracks);
    localStorage.setItem('suno-tracks', JSON.stringify(updatedTracks));
  };

  // Save persona to localStorage
  const savePersonaToStorage = (persona: Persona) => {
    const updatedPersonas = [persona, ...personas.filter(p => p.id !== persona.id)];
    setPersonas(updatedPersonas);
    localStorage.setItem('suno-personas', JSON.stringify(updatedPersonas));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSliderChange = (name: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePersonaChange = (personaId: string) => {
    const selectedPersona = personas.find(p => p.id === personaId);
    setFormData(prev => ({
      ...prev,
      persona_id: personaId,
      reference_track_id: selectedPersona?.reference_track_id || ''
    }));
  };

  const createPersona = () => {
    if (!newPersona.name || !newPersona.reference_track_id) {
      setError('Please provide a name and select a reference track for the persona');
      return;
    }

    const persona: Persona = {
      id: Date.now().toString(),
      name: newPersona.name,
      description: newPersona.description,
      reference_track_id: newPersona.reference_track_id,
      created_at: new Date().toISOString()
    };

    savePersonaToStorage(persona);
    setNewPersona({ name: '', description: '', reference_track_id: '' });
    setShowPersonaCreation(false);
  };

  const generateMusic = async () => {
    setIsLoading(true);
    setError('');
    setResults([]);

    try {
      const payload: any = {
        tags: formData.tags,
        negative_tags: formData.negative_tags,
        title: formData.title,
        make_instrumental: formData.make_instrumental,
        model: formData.model || 'chirp-v4-5', // Ensure model is always sent
        wait_audio: formData.wait_audio
      };

      // Correctly handle prompt vs lyrics based on instrumental setting
      if (formData.make_instrumental) {
        // For instrumental: use prompt as style description
        payload.prompt = formData.prompt;
      } else {
        // For vocal: use lyrics as what to sing, or fallback to prompt
        payload.prompt = formData.lyrics.trim() || formData.prompt;
      }

      console.log('Payload being sent:', payload);

      // Add persona-specific parameters if persona is selected
      if (formData.persona_id && formData.reference_track_id) {
        payload.history_prompt = formData.reference_track_id;
        payload.persona_influence = formData.persona_influence / 100;
      }

      const response = await fetch('/api/custom_generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const resultTracks = Array.isArray(data) ? data : [data];
      setResults(resultTracks);

      // Save completed tracks to localStorage
      resultTracks.forEach(track => {
        if (track.status === 'complete' || track.audio_url) {
          saveTrackToStorage(track);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const generateLyrics = async () => {
    if (!formData.prompt) {
      setError('Please enter a prompt to generate lyrics');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate_lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: formData.prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Extract the actual lyrics text from the response
      let lyricsText = '';
      if (typeof data === 'string') {
        lyricsText = data;
      } else if (data.text) {
        lyricsText = data.text;
      } else if (data.lyrics) {
        lyricsText = data.lyrics;
      } else if (data.data && data.data.text) {
        lyricsText = data.data.text;
      } else {
        lyricsText = JSON.stringify(data);
      }
      setFormData(prev => ({ ...prev, lyrics: lyricsText }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred generating lyrics');
    } finally {
      setIsLoading(false);
    }
  };

  const playTrack = (trackId: string) => {
    setCurrentlyPlaying(currentlyPlaying === trackId ? null : trackId);
  };

  const deleteTrack = (trackId: string) => {
    const updatedTracks = storedTracks.filter(t => t.id !== trackId);
    setStoredTracks(updatedTracks);
    localStorage.setItem('suno-tracks', JSON.stringify(updatedTracks));
  };

  const downloadTrack = async (track: StoredTrack | AudioInfo) => {
    if (!track.audio_url) return;
    
    try {
      const response = await fetch(track.audio_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${track.title || 'suno-track'}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Failed to download track');
    }
  };

  const selectedPersona = personas.find(p => p.id === formData.persona_id);

  return (
    <div className="min-h-screen bg-white py-4">
      <div className="max-w-7xl mx-auto p-4">
        
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Main Controls */}
          <div className="space-y-4 bg-white border rounded-lg p-4 relative" style={{ minWidth: '640px' }}>
            <h3 className="text-xl font-semibold text-gray-800">Generation Settings</h3>
            
            {/* Song Title - moved to be first */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Song Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter song title..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Prompt Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.make_instrumental ? 'Style Description/Prompt' : 'Song Description/Prompt'}
              </label>
              <div className="relative">
                <textarea
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleInputChange}
                  placeholder={formData.make_instrumental ? 
                    "Describe the style and mood of the instrumental you want to create..." : 
                    "Describe the song you want to create..."
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-16"
                  rows={8}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-1 rounded">
                  {formData.prompt.length}
                </div>
              </div>
              {!formData.make_instrumental && (
                <button
                  onClick={generateLyrics}
                  disabled={isLoading || !formData.prompt}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Lyrics from Prompt
                </button>
              )}
            </div>

            {/* Custom Lyrics */}
            {!formData.make_instrumental && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Lyrics
                </label>
                <div className="relative">
                  <textarea
                    name="lyrics"
                    value={formData.lyrics}
                    onChange={handleInputChange}
                    placeholder="Enter custom lyrics or use generated lyrics..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-16"
                    rows={6}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-1 rounded">
                    {formData.lyrics.length}
                  </div>
                </div>
              </div>
            )}

            {/* Style Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Music Style/Genre Tags
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., pop, rock, electronic, jazz, acoustic..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-16"
                />
                <div className="absolute top-1/2 transform -translate-y-1/2 right-2 text-xs text-gray-500 bg-white px-1 rounded">
                  {formData.tags.length}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Advanced Options */}
          <div className="space-y-4 bg-white border rounded-lg p-4">
            <h3 className="text-xl font-semibold text-gray-800">Advanced Options</h3>
            
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Model
              </label>
              <select
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {models.map(model => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Persona Section */}
            <div className="bg-white border p-3 rounded-md">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-gray-800">Personas</h4>
                <button
                  onClick={() => setShowPersonaCreation(!showPersonaCreation)}
                  className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                >
                  Create Persona
                </button>
              </div>

              {showPersonaCreation && (
                <div className="mb-4 p-4 bg-white rounded-md border">
                  <h5 className="font-medium mb-2">Create New Persona</h5>
                  <input
                    type="text"
                    placeholder="Persona name"
                    value={newPersona.name}
                    onChange={(e) => setNewPersona(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border rounded-md mb-2"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newPersona.description}
                    onChange={(e) => setNewPersona(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2 border rounded-md mb-2"
                    rows={2}
                  />
                  <select
                    value={newPersona.reference_track_id}
                    onChange={(e) => setNewPersona(prev => ({ ...prev, reference_track_id: e.target.value }))}
                    className="w-full p-2 border rounded-md mb-2"
                  >
                    <option value="">Select reference track</option>
                    {storedTracks.map(track => (
                      <option key={track.id} value={track.id}>{track.title}</option>
                    ))}
                  </select>
                  <div className="flex space-x-2">
                    <button
                      onClick={createPersona}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setShowPersonaCreation(false)}
                      className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Persona
                </label>
                <select
                  value={formData.persona_id}
                  onChange={(e) => handlePersonaChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">No persona</option>
                  {personas.map(persona => (
                    <option key={persona.id} value={persona.id}>{persona.name}</option>
                  ))}
                </select>
              </div>

              {selectedPersona && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">{selectedPersona.description}</p>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persona Influence: {formData.persona_influence}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.persona_influence}
                    onChange={(e) => handleSliderChange('persona_influence', parseInt(e.target.value))}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Subtle</span>
                    <span>Strong</span>
                  </div>
                </div>
              )}
            </div>

            {/* Negative Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Negative Tags (Avoid)
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="negative_tags"
                  value={formData.negative_tags}
                  onChange={handleInputChange}
                  placeholder="e.g., sad, slow, heavy metal..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-16"
                />
                <div className="absolute top-1/2 transform -translate-y-1/2 right-2 text-xs text-gray-500 bg-white px-1 rounded">
                  {formData.negative_tags.length}
                </div>
              </div>
            </div>

            {/* Style Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style Influence: {formData.style_influence}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.style_influence}
                  onChange={(e) => handleSliderChange('style_influence', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Loose</span>
                  <span>Strict</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Witness: {formData.witness}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.witness}
                  onChange={(e) => handleSliderChange('witness', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="make_instrumental"
                  checked={formData.make_instrumental}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Make Instrumental (No Vocals)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="wait_audio"
                  checked={formData.wait_audio}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Wait for Audio Generation</span>
              </label>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6 text-center">
          <button
            onClick={generateMusic}
            disabled={isLoading || !formData.prompt}
            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {isLoading ? 'Generating Music...' : 'Generate Music'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results Display */}
        {results.length > 0 && (
          <div className="mt-6 bg-white border rounded-lg p-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Generated Music</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((audio) => (
                <div key={audio.id} className="bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {audio.title || 'Untitled'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Status: <span className="font-medium">{audio.status}</span>
                  </p>
                  
                  {audio.image_url && (
                    <img 
                      src={audio.image_url} 
                      alt={audio.title || 'Generated music'} 
                      className="w-full h-48 object-cover rounded-md mb-3"
                    />
                  )}
                  
                  {audio.audio_url && (
                    <div className="mb-3">
                      <audio controls className="w-full">
                        <source src={audio.audio_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => saveTrackToStorage(audio)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          Save to Library
                        </button>
                        <button
                          onClick={() => downloadTrack(audio)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {audio.lyric && (
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-700 mb-1">Lyrics:</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{audio.lyric}</p>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Model: {audio.model_name}</p>
                    <p>Duration: {audio.duration || 'N/A'}</p>
                    <p>Created: {new Date(audio.created_at).toLocaleString()}</p>
                    {audio.tags && <p>Tags: {audio.tags}</p>}
                  </div>
                  
                  {audio.error_message && (
                    <div className="mt-3 p-2 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
                      Error: {audio.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
                      </div>
          )}

        {/* Saved Audio Library */}
        {storedTracks.length > 0 && (
          <div className="mt-6 bg-white border rounded-lg p-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Music Library</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {storedTracks.map((track) => (
                <div key={track.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  {track.image_url && (
                    <img src={track.image_url} alt={track.title} className="w-12 h-12 rounded object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{track.title}</p>
                    <p className="text-xs text-gray-500">{track.tags}</p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => playTrack(track.id)}
                      className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Play/Pause"
                    >
                      {currentlyPlaying === track.id ? '⏸️' : '▶️'}
                    </button>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, reference_track_id: track.id }))}
                      className="p-1 text-green-600 hover:text-green-800 transition-colors"
                      title="Use as reference"
                    >
                      🎯
                    </button>
                    <button
                      onClick={() => downloadTrack(track)}
                      className="p-1 text-purple-600 hover:text-purple-800 transition-colors"
                      title="Download"
                    >
                      💾
                    </button>
                    <button
                      onClick={() => deleteTrack(track.id)}
                      className="p-1 text-red-600 hover:text-red-800 transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                  {currentlyPlaying === track.id && (
                    <audio controls autoPlay className="hidden">
                      <source src={track.audio_url} type="audio/mpeg" />
                    </audio>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    );
  } 