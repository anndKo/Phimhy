import { Episode } from '@/types/database';
import { Play } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EpisodeSelectorProps {
  episodes: Episode[];
  currentEpisode: number;
  onSelectEpisode: (episodeNumber: number) => void;
}

export function EpisodeSelector({ episodes, currentEpisode, onSelectEpisode }: EpisodeSelectorProps) {
  if (episodes.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">Danh sách tập</h3>
      <ScrollArea className="max-h-[280px]">
        <div className="grid grid-cols-4 gap-2 pr-2">
          {episodes.map((ep) => (
            <button
              key={ep.id}
              onClick={() => onSelectEpisode(ep.episode_number)}
              className={`
                flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border transition-all text-center
                ${currentEpisode === ep.episode_number
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-secondary/50 border-border hover:bg-secondary hover:border-primary/50'
                }
              `}
            >
              {currentEpisode === ep.episode_number && (
                <Play className="w-3 h-3 flex-shrink-0" fill="currentColor" />
              )}
              <span className="font-medium text-sm">Tập {ep.episode_number}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
