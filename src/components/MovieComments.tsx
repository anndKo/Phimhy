import { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useTier, TierSetting } from '@/hooks/useTier';

interface Comment {
  id: string;
  movie_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { full_name: string | null; email: string | null; avatar_url: string | null };
  userTier?: TierSetting | null;
}

interface MovieCommentsProps {
  movieId: string;
}

const TIER_BADGE_ICONS: Record<string, string> = {
  basic: '🔘',
  advanced: '🔷',
  pro: '💎',
  vip: '👑',
};

export function MovieComments({ movieId }: MovieCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { tiers } = useTier();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getUserTier = (totalDeposited: number): TierSetting | null => {
    if (tiers.length === 0) return null;
    return [...tiers]
      .sort((a, b) => b.min_amount - a.min_amount)
      .find(t => totalDeposited >= t.min_amount) || null;
  };

  const fetchComments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      // Fetch total_deposited separately to determine tiers
      const { data: depositData } = await supabase
        .from('profiles')
        .select('id')
        .in('id', userIds) as any;

      // Get raw deposit data
      const rawProfiles: any[] = [];
      if (userIds.length > 0) {
        const { data: rawData } = await (supabase.from('profiles') as any)
          .select('id, total_deposited')
          .in('id', userIds);
        if (rawData) rawProfiles.push(...rawData);
      }
      const depositMap = new Map(rawProfiles.map((p: any) => [p.id, p.total_deposited || 0]));

      const profileMap = new Map((profiles as any[])?.map(p => [p.id, p]) || []);
      const enriched = data.map(c => {
        const profile = profileMap.get(c.user_id);
        const totalDeposited = depositMap.get(c.user_id) || 0;
        return {
          ...c,
          profile: profile || null,
          userTier: getUserTier(totalDeposited),
        };
      });
      setComments(enriched as any);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (tiers.length >= 0) fetchComments();
  }, [movieId, tiers]);

  const handleSubmit = async () => {
    if (!user || !newComment.trim()) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      movie_id: movieId,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (error) {
      toast({ title: 'Lỗi', description: 'Không thể gửi bình luận', variant: 'destructive' });
    } else {
      setNewComment('');
      fetchComments();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
  };

  const getDisplayName = (comment: Comment) => {
    if (comment.profile?.full_name) return comment.profile.full_name;
    if (comment.profile?.email) return comment.profile.email.split('@')[0];
    return 'Người dùng';
  };

  const getTierKey = (comment: Comment): string => {
    return comment.userTier?.tier_key || 'basic';
  };

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <MessageCircle className="w-5 h-5 text-primary" />
        Bình luận ({comments.length})
      </h3>

      {user ? (
        <div className="flex gap-3">
          <UserAvatar user={user} />
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Viết bình luận..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[56px] resize-none bg-secondary/50 border-border/50 rounded-xl text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSubmitting}
                className="gap-2 rounded-full"
              >
                <Send className="w-3.5 h-3.5" />
                Gửi
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4 bg-secondary/30 rounded-xl">
          <a href="/auth" className="text-primary hover:underline">Đăng nhập</a> để bình luận
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-6">Chưa có bình luận nào</p>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2 pr-1">
            {comments.map((comment) => {
              const tierKey = getTierKey(comment);
              return (
                <div
                  key={comment.id}
                  className={`flex gap-3 p-3 rounded-xl transition-colors relative comment-tier-${tierKey}`}
                >
                  <Avatar className={`w-8 h-8 flex-shrink-0 ${tierKey !== 'basic' ? `tier-avatar-${tierKey}` : ''}`}>
                    {comment.profile?.avatar_url ? (
                      <AvatarImage src={comment.profile.avatar_url} alt={getDisplayName(comment)} />
                    ) : null}
                    <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                      {getDisplayName(comment).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{getDisplayName(comment)}</span>
                      <span className={`comment-badge comment-badge-${tierKey}`}>
                        {TIER_BADGE_ICONS[tierKey] || '🔘'}{' '}
                        {comment.userTier?.display_name || 'Cơ bản'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: vi })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                  {user?.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive relative z-10"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function UserAvatar({ user }: { user: { id: string } }) {
  const [profile, setProfile] = useState<{ avatar_url: string | null; full_name: string | null } | null>(null);

  useEffect(() => {
    supabase.from('profiles').select('avatar_url, full_name').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile(data);
    });
  }, [user.id]);

  return (
    <Avatar className="w-9 h-9 flex-shrink-0">
      {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} /> : null}
      <AvatarFallback className="bg-primary/20 text-primary text-sm">
        {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
      </AvatarFallback>
    </Avatar>
  );
}
