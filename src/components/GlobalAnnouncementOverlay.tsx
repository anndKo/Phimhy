import { useActiveAnnouncements } from '@/hooks/useGlobalAnnouncements';
import { X, ShieldAlert, Megaphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function GlobalAnnouncementOverlay() {
  const { blockingAnnouncement, dismissableAnnouncements, dismiss } = useActiveAnnouncements();
  const { isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Block site mode: prevent any interaction (only for non-admins)
  useEffect(() => {
    if (blockingAnnouncement && !isAdmin) {
      document.body.style.overflow = 'hidden';
      const interval = setInterval(() => {
        const overlay = document.getElementById('site-block-overlay');
        if (!overlay) window.location.reload();
      }, 2000);
      return () => {
        document.body.style.overflow = '';
        clearInterval(interval);
      };
    }
  }, [blockingAnnouncement, isAdmin]);

  if (isAdmin) return null;

  // Blocking announcement - fullscreen, unclosable
  if (blockingAnnouncement) {
    return (
      <div
        id="site-block-overlay"
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
        style={{ pointerEvents: 'all' }}
        onContextMenu={e => e.preventDefault()}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-black" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, hsl(var(--destructive) / 0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, hsl(var(--primary) / 0.2) 0%, transparent 50%)',
          }}
        />
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-destructive/20 blur-xl"
              style={{
                width: `${60 + i * 30}px`,
                height: `${60 + i * 30}px`,
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animation: `pulse ${3 + i * 0.5}s cubic-bezier(0.4,0,0.6,1) infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        <div className={`relative max-w-lg w-full text-center space-y-8 transition-all duration-700 ${mounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}>
          {/* Icon with glow */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-destructive/20 blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-destructive/30 to-destructive/10 border border-destructive/30 flex items-center justify-center backdrop-blur-sm">
              <ShieldAlert className="w-12 h-12 text-destructive drop-shadow-lg" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {blockingAnnouncement.title}
          </h1>

          {/* Content card */}
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-2xl">
            <p className="text-muted-foreground text-base md:text-lg whitespace-pre-wrap leading-relaxed">
              {blockingAnnouncement.content}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Thông báo từ quản trị viên • Không thể đóng</span>
          </div>
        </div>
      </div>
    );
  }

  // Dismissable announcements
  if (dismissableAnnouncements.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => dismissableAnnouncements.forEach(a => dismiss(a.id))} />

      <div className="relative max-w-md w-full space-y-4">
        {dismissableAnnouncements.map((a, index) => (
          <div
            key={a.id}
            className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-2xl shadow-2xl transition-all duration-500"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fade-in 0.5s ease-out forwards, scale-in 0.4s ease-out forwards',
            }}
          >
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative p-6">
              <div className="flex items-start gap-4 mb-5">
                {/* Icon */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg" />
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                    <Megaphone className="w-6 h-6 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-foreground tracking-tight">{a.title}</h3>
                    <Sparkles className="w-4 h-4 text-primary/60 flex-shrink-0" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{a.content}</p>
                </div>
              </div>

              {/* Close button */}
              <Button
                onClick={() => dismiss(a.id)}
                className="w-full rounded-xl h-11 gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-0 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                variant="outline"
              >
                <X className="w-4 h-4" />
                Đã hiểu
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}