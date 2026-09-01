import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import { getBlogPosts } from '@/lib/api';
import type { BlogPost } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlogPosts().then(data => { setPosts(data); setLoading(false); });
  }, []);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-foreground mb-2">TechStore Blog</h1>
      <p className="text-muted-foreground text-sm mb-8">Reviews, guides, and the latest in tech news.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array(6).fill(null).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                <Skeleton className="aspect-video w-full bg-muted" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-3 w-20 bg-muted" />
                  <Skeleton className="h-5 w-full bg-muted" />
                  <Skeleton className="h-4 w-3/4 bg-muted" />
                </div>
              </div>
            ))
          : posts.map(post => (
              <article key={post.id} className="product-card flex flex-col h-full">
                {post.image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {post.category && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        {post.category}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground mb-2 line-clamp-2 flex-1">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>
                  )}
                  <span className="flex items-center gap-1 text-primary text-sm font-medium mt-auto">
                    Read More <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </article>
            ))
        }
      </div>
    </div>
  );
}
