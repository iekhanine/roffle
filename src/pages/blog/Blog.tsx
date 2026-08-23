import {
  useEffect,
  useState,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock3,
} from "lucide-react";

import {
  supabase,
} from "../../lib/supabase";

import SiteHeader from "../../components/layout/SiteHeader";
import QuickPostDialog from "../../components/posts/QuickPostDialog";

import {
  getMyAccess,
} from "../../services/admin";

import {
  getBlogPostBySlug,
  getPublishedBlogPosts,
} from "../../services/blog";

import type {
  UserRole,
} from "../../types/admin";

import type {
  BlogPost,
} from "../../types/blog";

import "./Blog.css";


/* ==========================================================
   BLOG 001
   HELPERS
   ========================================================== */


function formatBlogDate(
  value:
    string | null,
) {
  if (!value) {
    return "Draft";
  }

  return new Date(
    value
  ).toLocaleDateString(
    undefined,
    {
      year:
        "numeric",

      month:
        "long",

      day:
        "numeric",
    }
  );
}


/* ==========================================================
   BLOG 002
   BLOG INDEX
   ========================================================== */


function BlogIndex() {
  const [
    posts,
    setPosts,
  ] =
    useState<BlogPost[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  useEffect(() => {
    let mounted = true;

    void getPublishedBlogPosts()
      .then(
        (
          nextPosts
        ) => {
          if (mounted) {
            setPosts(
              nextPosts
            );
          }
        }
      )
      .catch(
        (
          nextError
        ) => {
          if (mounted) {
            setError(
              nextError
                instanceof Error
                ? nextError.message
                : "ROFFLE Blog could not load."
            );
          }
        }
      )
      .finally(
        () => {
          if (mounted) {
            setLoading(
              false
            );
          }
        }
      );

    return () => {
      mounted = false;
    };
  }, []);


  return (
    <>
      <section className="blog-page-heading">
        <div>
          <span>
            ROFFLE EDITORIAL
          </span>

          <h1>
            Blog
          </h1>

          <p>
            Longer thoughts from the people running this thing.
          </p>
        </div>

        <BookOpen
          size={28}
        />
      </section>

      {error && (
        <div className="blog-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="blog-loading">
          Loading the blog...
        </div>
      ) : posts.length ===
        0 ? (
        <div className="blog-empty">
          Nothing published yet.
        </div>
      ) : (
        <section className="blog-index-grid">
          {posts.map(
            (
              post,
              index
            ) => (
              <a
                className={`blog-index-card ${
                  index === 0
                    ? "lead"
                    : ""
                }`}
                href={`/blog/${post.slug}`}
                key={
                  post.id
                }
              >
                {post.hero_image_url ? (
                  <div className="blog-index-image">
                    <img
                      src={
                        post.hero_image_url
                      }
                      alt=""
                    />
                  </div>
                ) : (
                  <div
                    className={`blog-index-placeholder blog-${post.accent_style}`}
                  >
                    BLOG
                  </div>
                )}

                <div className="blog-index-copy">
                  <span className="blog-index-kicker">
                    {post.is_highlighted
                      ? "Highlighted"
                      : "ROFFLE Blog"}
                  </span>

                  <h2>
                    {post.title}
                  </h2>

                  {post.excerpt && (
                    <p>
                      {post.excerpt}
                    </p>
                  )}

                  <div className="blog-index-meta">
                    <Clock3
                      size={12}
                    />

                    {formatBlogDate(
                      post.published_at
                    )}

                    <ArrowRight
                      size={13}
                    />
                  </div>
                </div>
              </a>
            )
          )}
        </section>
      )}
    </>
  );
}


/* ==========================================================
   BLOG 003
   ARTICLE
   ========================================================== */


function BlogArticle({
  slug,
}: {
  slug: string;
}) {
  const [
    post,
    setPost,
  ] =
    useState<BlogPost | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  useEffect(() => {
    let mounted = true;

    void getBlogPostBySlug(
      slug
    )
      .then(
        (
          nextPost
        ) => {
          if (mounted) {
            setPost(
              nextPost
            );
          }
        }
      )
      .catch(
        (
          nextError
        ) => {
          if (mounted) {
            setError(
              nextError
                instanceof Error
                ? nextError.message
                : "Could not load the blog post."
            );
          }
        }
      )
      .finally(
        () => {
          if (mounted) {
            setLoading(
              false
            );
          }
        }
      );

    return () => {
      mounted = false;
    };
  }, [
    slug,
  ]);


  if (loading) {
    return (
      <div className="blog-loading">
        Loading article...
      </div>
    );
  }


  if (!post) {
    return (
      <div className="blog-empty">
        <strong>
          Blog post not found.
        </strong>

        <a href="/blog">
          Back to Blog
        </a>
      </div>
    );
  }


  return (
    <article className="blog-article">
      <a
        className="blog-back"
        href="/blog"
      >
        <ArrowLeft
          size={13}
        />

        Back to Blog
      </a>

      <header
        className={`blog-article-hero blog-${post.accent_style}`}
      >
        <div>
          <span>
            {post.is_highlighted
              ? "HIGHLIGHTED POST"
              : "ROFFLE BLOG"}
          </span>

          <h1>
            {post.title}
          </h1>

          {post.excerpt && (
            <p>
              {post.excerpt}
            </p>
          )}

          <time>
            {formatBlogDate(
              post.published_at
            )}
          </time>
        </div>

        {post.hero_image_url && (
          <img
            src={
              post.hero_image_url
            }
            alt=""
          />
        )}
      </header>

      {error && (
        <div className="blog-error">
          {error}
        </div>
      )}

      <div className="blog-article-body">
        {post.body}
      </div>
    </article>
  );
}


/* ==========================================================
   BLOG 004
   PAGE / AUTH / SHARED HEADER
   ========================================================== */


export default function Blog() {
  const [
    session,
    setSession,
  ] =
    useState<Session | null>(
      null
    );

  const [
    authReady,
    setAuthReady,
  ] =
    useState(false);

  const [
    accessRole,
    setAccessRole,
  ] =
    useState<UserRole | null>(
      null
    );

  const [
    postDialogOpen,
    setPostDialogOpen,
  ] =
    useState(false);


  useEffect(() => {
    let mounted = true;

    void supabase.auth
      .getSession()
      .then(
        ({
          data,
        }) => {
          if (!mounted) {
            return;
          }

          setSession(
            data.session
          );

          setAuthReady(
            true
          );
        }
      );

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth
        .onAuthStateChange(
          (
            _event,
            nextSession
          ) => {
            if (!mounted) {
              return;
            }

            setSession(
              nextSession
            );

            setAuthReady(
              true
            );
          }
        );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  useEffect(() => {
    let mounted = true;

    if (!session) {
      setAccessRole(
        null
      );

      return () => {
        mounted = false;
      };
    }

    void getMyAccess()
      .then(
        (
          access
        ) => {
          if (mounted) {
            setAccessRole(
              access?.role ??
              null
            );
          }
        }
      )
      .catch(
        () => {
          if (mounted) {
            setAccessRole(
              null
            );
          }
        }
      );

    return () => {
      mounted = false;
    };
  }, [
    session,
  ]);


  const openQuickPost =
    () => {
      if (!session) {
        window.location.assign(
          "/login"
        );

        return;
      }

      setPostDialogOpen(
        true
      );
    };


  const signOut =
    async () => {
      await supabase.auth
        .signOut();

      window.location.assign(
        "/"
      );
    };


  const path =
    window.location.pathname;

  const articleMatch =
    path.match(
      /^\/blog\/([^/]+)\/?$/
    );


  return (
    <div className="blog-page">
      <SiteHeader
        session={
          session
        }
        authReady={
          authReady
        }
        accessRole={
          accessRole
        }
        activeSection="blog"
        onPost={
          openQuickPost
        }
        onSignOut={() => {
          void signOut();
        }}
      />

      <main className="blog-shell">
        {articleMatch ? (
          <BlogArticle
            slug={
              decodeURIComponent(
                articleMatch[1]
              )
            }
          />
        ) : (
          <BlogIndex />
        )}
      </main>

      <QuickPostDialog
        open={
          postDialogOpen
        }
        onClose={() => {
          setPostDialogOpen(
            false
          );
        }}
        onPosted={() => {
          setPostDialogOpen(
            false
          );
        }}
      />
    </div>
  );
}
