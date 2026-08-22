import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type Session,
} from "@supabase/supabase-js";

import { supabase } from "./lib/supabase";
import {
  Search,
  UserRound,
  Menu,
  X,
  Eye,
  MessageCircle,
  Play,
  ChevronRight,
  SlidersHorizontal,
  Clock,
  ExternalLink,
  Flame,
  Hash,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Plus,
  Heart,
} from "lucide-react";

import QuickPostDialog from "./components/posts/QuickPostDialog";
import PostComments from "./components/posts/PostComments";

import {
  getFeedPosts,
} from "./services/posts";

import {
  getYouTubeGems,
  togglePostLike,
  type YouTubeGem,
} from "./services/engagement";

import {
  getMyAccess,
} from "./services/admin";

import {
  getActiveTaxonomy,
} from "./services/taxonomy";

import type {
  UserRole,
} from "./types/admin";

import type {
  PostRecord,
} from "./types/post";

import type {
  PostCategory,
  PostTag,
  PostTagReference,
} from "./types/taxonomy";

import "./AppV2.css";

type PostType =
  | "short"
  | "video"
  | "image"
  | "gallery"
  | "link"
  | "text";


type TimeFilter =
  | "all"
  | "today"
  | "week"
  | "month";


type ContentFilter =
  | "all"
  | "videos"
  | "photos"
  | "discussions";

type Post = {
  id: number | string;
  title: string;
  author: string;
  avatar: string;
  published: string;
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
  likedByMe: boolean;
  type: PostType;
  description?: string;
  image?: string;
  youtubeId?: string;
  gifUrl?: string;
  source?: string;
  tag?: string;

  categoryId?:
    string;

  categorySlug?:
    string;

  articleTags:
    PostTagReference[];

  moderationStatus?:
    | "pending"
    | "approved"
    | "rejected";
};

function formatPostDate(
  value: string,
) {
  const date =
    new Date(value);

  return date.toLocaleString(
    undefined,
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}


function getTextPostBackground(
  postId: string,
) {
  return `https://picsum.photos/seed/roffle-${postId}/1200/800`;
}


function mapPostRecord(
  post: PostRecord,
): Post {
  const author =
    post.profiles
      ?.display_name ??
    "ROFFLE User";

  const avatar =
    author
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "R";

  if (
    post.post_type ===
    "youtube"
  ) {
    return {
      id:
        post.id,

      title:
        post.title ??
        (
          post.video_type ===
          "short"
            ? "YouTube Short"
            : "YouTube video"
        ),

      author,
      avatar,

      published:
        formatPostDate(
          post.created_at
        ),

      createdAt:
        post.created_at,

      views: 0,

      likes:
        post.like_count ??
        0,

      comments:
        post.comment_count ??
        0,

      likedByMe:
        post.liked_by_me ??
        false,

      type:
        post.video_type ===
        "short"
          ? "short"
          : "video",

      tag:
        post.category
          ?.name ??
        "VIDEO",

      categoryId:
        post.category
          ?.id,

      categorySlug:
        post.category
          ?.slug,

      articleTags:
        post.tags ??
        [],

      moderationStatus:
        post.moderation_status,

      description:
        post.body ??
        undefined,

      gifUrl:
        post.gif_url ??
        undefined,

      youtubeId:
        post.youtube_id ??
        undefined,

      image:
        post.youtube_id
          ? `https://i.ytimg.com/vi/${post.youtube_id}/hqdefault.jpg`
          : undefined,
    };
  }

  if (
    post.post_type ===
    "image"
  ) {
    return {
      id:
        post.id,

      title:
        post.title ??
        "Image post",

      author,
      avatar,

      published:
        formatPostDate(
          post.created_at
        ),

      createdAt:
        post.created_at,

      views: 0,

      likes:
        post.like_count ??
        0,

      comments:
        post.comment_count ??
        0,

      likedByMe:
        post.liked_by_me ??
        false,

      type:
        "image",

      tag:
        post.category
          ?.name ??
        "IMAGE",

      categoryId:
        post.category
          ?.id,

      categorySlug:
        post.category
          ?.slug,

      articleTags:
        post.tags ??
        [],

      moderationStatus:
        post.moderation_status,

      description:
        post.body ??
        undefined,

      gifUrl:
        post.gif_url ??
        undefined,

      image:
        post.image_url ??
        undefined,
    };
  }

  return {
    id:
      post.id,

    title:
      post.title ??
      "Untitled nonsense",

    author,
    avatar,

    published:
      formatPostDate(
        post.created_at
      ),

    createdAt:
      post.created_at,

    views: 0,

    likes:
      post.like_count ??
      0,

    comments:
      post.comment_count ??
      0,

    likedByMe:
      post.liked_by_me ??
      false,

    type:
      "text",

    tag:
      post.category
        ?.name ??
      "TEXT",

    categoryId:
      post.category
        ?.id,

    categorySlug:
      post.category
        ?.slug,

    articleTags:
      post.tags ??
      [],

    moderationStatus:
      post.moderation_status,

    description:
      post.body ??
      undefined,

    gifUrl:
      post.gif_url ??
      undefined,

    image:
      getTextPostBackground(
        post.id
      ),
  };
}


function RoffleLogo() {
  return (
    <a className="roffle-logo" href="#">
      <span className="logo-mark">R</span>

      <span className="logo-word">
        ROFFLE
      </span>
    </a>
  );
}


function MediaStage({
  post,
}: {
  post: Post;
}) {
  if (post.type === "short") {
    const hasRealVideo =
      post.youtubeId &&
      post.youtubeId !== "YOUR_SHORT_ID";

    return (
      <div className="short-stage">
        <div className="short-ambient">
          <img
            src={post.image}
            alt=""
          />
        </div>

        <div className="short-frame">
          {hasRealVideo ? (
            <iframe
              src={`https://www.youtube.com/embed/${post.youtubeId}?rel=0&modestbranding=1`}
              title={post.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="short-placeholder">
              <img
                src={post.image}
                alt={post.title}
              />

              <div className="short-shade" />

              <button
                className="big-play"
                aria-label="Play video"
              >
                <Play
                  size={29}
                  fill="currentColor"
                />
              </button>

              <div className="short-label">
                <Video size={15} />
                YouTube Short
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (
    post.type ===
    "video"
  ) {
    return (
      <div className="video-stage">
        {post.youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${post.youtubeId}?rel=0&modestbranding=1`}
            title={post.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="video-stage-empty">
            Video unavailable
          </div>
        )}
      </div>
    );
  }


  if (
    post.type === "image" ||
    post.type === "gallery"
  ) {
    return (
      <div className="photo-stage">
        <img
          src={post.image}
          alt={post.title}
        />

        {post.type === "gallery" && (
          <div className="photo-count">
            <ImageIcon size={15} />
            3 photos
          </div>
        )}
      </div>
    );
  }

  if (post.type === "link") {
    return (
      <a
        className="link-card"
        href="#external"
      >
        <div className="link-image">
          <img
            src={post.image}
            alt=""
          />

          <span className="external-badge">
            <ExternalLink size={15} />
          </span>
        </div>

        <div className="link-copy">
          <span className="link-source">
            {post.source}
          </span>

          <h3>{post.title}</h3>

          <p>
            {post.description}
          </p>

          <span className="visit-link">
            Visit link
            <ChevronRight size={15} />
          </span>
        </div>
      </a>
    );
  }

  return null;
}

function PostCard({
  post,
  session,
  onToggleLike,
  onCommentCountChanged,
  isStaff,
}: {
  post: Post;

  session:
    Session | null;

  onToggleLike: (
    post: Post,
  ) => void;

  onCommentCountChanged: (
    postId: string,
    count: number,
  ) => void;

  isStaff: boolean;
}) {
  const [
    commentsOpen,
    setCommentsOpen,
  ] =
    useState(false);


  return (
    <article
      className="post-card"
      id={`post-${post.id}`}
    >
      <header className="post-header">
        <div className="post-header-top">
          <div className="post-badge-group">
            <span className="content-badge">
              {post.tag}
            </span>

            {post.moderationStatus ===
              "pending" && (
              <span className="moderation-badge pending">
                Pending approval
              </span>
            )}

            {post.moderationStatus ===
              "rejected" && (
              <span className="moderation-badge rejected">
                Rejected
              </span>
            )}
          </div>

          <button
            className="post-menu"
            aria-label="Post menu"
          >
            •••
          </button>
        </div>

        <a
          className="post-title"
          href={`#post-${post.id}`}
        >
          {post.title}
        </a>

        {post.articleTags.length >
          0 && (
          <div className="post-article-tags">
            {post.articleTags.map(
              (
                articleTag
              ) => (
                <span
                  key={
                    articleTag.id
                  }
                >
                  #
                  {articleTag.name}
                </span>
              )
            )}
          </div>
        )}

        <div className="post-meta-row">
          <div className="avatar">
            {post.avatar}
          </div>

          <div className="author-inline">
            <a href="#author">
              {post.author}
            </a>

            <span className="meta-dot">
              •
            </span>

            <span>
              {post.published}
            </span>
          </div>

          <div className="post-metrics">
            <span>
              <Heart size={15} />
              {post.likes}
            </span>

            <span>
              <MessageCircle size={15} />
              {post.comments}
            </span>
          </div>
        </div>
      </header>

      <div className="post-media">
        <MediaStage post={post} />
      </div>

      {post.description &&
        post.type !== "link" && (
          <div className="post-description">
            {post.description}
          </div>
        )}

      {post.gifUrl && (
        <div className="post-gif-attachment">
          <img
            src={
              post.gifUrl
            }
            alt="Attached reaction GIF"
            loading="lazy"
          />

          <span>
            GIF
          </span>
        </div>
      )}

      <footer className="post-footer">
        <button
          className={
            post.likedByMe
              ? "reaction liked"
              : "reaction"
          }
          type="button"
          onClick={() => {
            onToggleLike(
              post
            );
          }}
        >
          😂
          <span>
            Roffle
          </span>

          {post.likes >
            0 && (
            <strong>
              {post.likes}
            </strong>
          )}
        </button>

        <button
          className={
            commentsOpen
              ? "comment-link active"
              : "comment-link"
          }
          type="button"
          onClick={() => {
            setCommentsOpen(
              (
                current
              ) =>
                !current
            );
          }}
        >
          <MessageCircle size={16} />

          {post.comments === 1
            ? "1 comment"
            : `${post.comments} comments`}
        </button>

        <a
          className="open-post"
          href={`#post-${post.id}`}
        >
          Open post
          <ChevronRight size={17} />
        </a>
      </footer>

      {commentsOpen && (
        <PostComments
          postId={
            String(
              post.id
            )
          }
          session={
            session
          }
          onCountChanged={
            (
              count
            ) => {
              onCommentCountChanged(
                String(
                  post.id
                ),
                count
              );
            }
          }
          isStaff={
            isStaff
          }
        />
      )}
    </article>
  );
}


function RailModule({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rail-module">
      <header className="rail-heading">
        <div>
          {icon}
          <h3>{title}</h3>
        </div>

        <button aria-label="Module options">
          •••
        </button>
      </header>

      <div className="rail-body">
        {children}
      </div>
    </section>
  );
}

function App() {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [filterOpen, setFilterOpen] =
    useState(false);

  const [
    timeFilter,
    setTimeFilter,
  ] =
    useState<TimeFilter>(
      "all"
    );

  const [
    contentFilter,
    setContentFilter,
  ] =
    useState<ContentFilter>(
      "all"
    );

  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState("all");

  const [
    tagFilter,
    setTagFilter,
  ] =
    useState("all");

  const [
    filterCategories,
    setFilterCategories,
  ] =
    useState<PostCategory[]>(
      []
    );

  const [
    filterTags,
    setFilterTags,
  ] =
    useState<PostTag[]>(
      []
    );

  const [
    postDialogOpen,
    setPostDialogOpen,
  ] =
    useState(false);

  const [
    livePosts,
    setLivePosts,
  ] =
    useState<Post[]>([]);

  const [
    youtubeGems,
    setYoutubeGems,
  ] =
    useState<YouTubeGem[]>(
      []
    );

  const [
    session,
    setSession,
  ] = useState<Session | null>(
    null
  );

  const [
    authReady,
    setAuthReady,
  ] = useState(false);

  const [
    accessRole,
    setAccessRole,
  ] =
    useState<UserRole | null>(
      null
    );


  useEffect(() => {
    let mounted = true;

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) {
          return;
        }

        setSession(
          data.session
        );

        setAuthReady(true);
      });

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, nextSession) => {
          if (!mounted) {
            return;
          }

          setSession(
            nextSession
          );

          setAuthReady(true);
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
          if (!mounted) {
            return;
          }

          setAccessRole(
            access?.role ??
            null
          );
        }
      )
      .catch(() => {
        if (mounted) {
          setAccessRole(
            null
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [session]);


  useEffect(() => {
    let mounted = true;

    void getActiveTaxonomy()
      .then(
        (
          taxonomy
        ) => {
          if (!mounted) {
            return;
          }

          setFilterCategories(
            taxonomy.categories
          );

          setFilterTags(
            taxonomy.tags
          );
        }
      )
      .catch(
        (
          error
        ) => {
          console.warn(
            "ROFFLE FILTER TAXONOMY ERROR:",
            error
          );
        }
      );

    return () => {
      mounted = false;
    };
  }, []);


  useEffect(() => {
    if (!authReady) {
      return;
    }

    let mounted = true;

    void getFeedPosts()
      .then(
        (
          records
        ) => {
          if (!mounted) {
            return;
          }

          console.log(
            "ROFFLE POSTS LOADED:",
            records.length
          );

          setLivePosts(
            records.map(
              mapPostRecord
            )
          );
        }
      )
      .catch(
        (
          error
        ) => {
          console.error(
            "ROFFLE FEED ERROR:",
            error
          );

          if (mounted) {
            setLivePosts([]);
          }
        }
      );

    return () => {
      mounted = false;
    };
  }, [
    authReady,
    session?.user.id,
  ]);


  useEffect(() => {
    let mounted = true;

    void getYouTubeGems(
      3
    ).then(
      (
        gems
      ) => {
        if (mounted) {
          setYoutubeGems(
            gems
          );
        }
      }
    );

    return () => {
      mounted = false;
    };
  }, []);


  const refreshYouTubeGems =
    () => {
      void getYouTubeGems(
        3
      ).then(
        setYoutubeGems
      );
    };


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


  const handlePostCreated =
    (
      post:
        PostRecord
    ) => {
      const mapped =
        mapPostRecord(
          post
        );

      setLivePosts(
        (
          current
        ) => [
          mapped,

          ...current.filter(
            (
              item
            ) =>
              item.id !==
              mapped.id
          ),
        ]
      );
    };


  const handleToggleLike =
    async (
      post: Post,
    ) => {
      if (!session) {
        window.location.assign(
          "/login"
        );

        return;
      }

      try {
        const liked =
          await togglePostLike(
            String(
              post.id
            ),
            post.likedByMe
          );

        setLivePosts(
          (
            current
          ) =>
            current.map(
              (
                item
              ) =>
                item.id ===
                  post.id
                  ? {
                      ...item,

                      likedByMe:
                        liked,

                      likes:
                        Math.max(
                          0,
                          item.likes +
                            (
                              liked
                                ? 1
                                : -1
                            )
                        ),
                    }
                  : item
            )
        );

        refreshYouTubeGems();
      } catch (
        error
      ) {
        console.error(
          "ROFFLE LIKE ERROR:",
          error
        );
      }
    };


  const handleCommentCountChanged =
    (
      postId: string,
      count: number,
    ) => {
      setLivePosts(
        (
          current
        ) =>
          current.map(
            (
              post
            ) =>
              String(
                post.id
              ) === postId
                ? {
                    ...post,
                    comments:
                      count,
                  }
                : post
          )
      );

      refreshYouTubeGems();
    };


  const signOut =
    async () => {
      await supabase.auth.signOut();

      window.location.assign(
        "/"
      );
    };


  const provider =
    session?.user.app_metadata
      ?.provider;

  const providerLabel =
    provider === "google"
      ? "Google"
      : provider === "discord"
        ? "Discord"
        : provider
          ? String(provider)
          : "Account";

  const userLabel =
    session?.user.email ??
    session?.user.user_metadata
      ?.preferred_username ??
    session?.user.user_metadata
      ?.user_name ??
    session?.user.user_metadata
      ?.full_name ??
    "Signed in";


  const filteredPosts =
    useMemo(
      () => {
        const now =
          Date.now();

        return livePosts.filter(
          (
            post
          ) => {
            const created =
              new Date(
                post.createdAt
              ).getTime();

            let matchesTime =
              true;

            if (
              timeFilter ===
              "today"
            ) {
              const startOfToday =
                new Date();

              startOfToday.setHours(
                0,
                0,
                0,
                0
              );

              matchesTime =
                created >=
                startOfToday.getTime();
            } else if (
              timeFilter ===
              "week"
            ) {
              matchesTime =
                created >=
                now -
                  7 *
                    24 *
                    60 *
                    60 *
                    1000;
            } else if (
              timeFilter ===
              "month"
            ) {
              matchesTime =
                created >=
                now -
                  30 *
                    24 *
                    60 *
                    60 *
                    1000;
            }

            let matchesContent =
              true;

            if (
              contentFilter ===
              "videos"
            ) {
              matchesContent =
                post.type ===
                  "video" ||
                post.type ===
                  "short";
            } else if (
              contentFilter ===
              "photos"
            ) {
              matchesContent =
                post.type ===
                  "image" ||
                post.type ===
                  "gallery";
            } else if (
              contentFilter ===
              "discussions"
            ) {
              matchesContent =
                post.type ===
                  "text";
            }

            const matchesCategory =
              categoryFilter ===
                "all" ||
              post.categoryId ===
                categoryFilter;

            const matchesTag =
              tagFilter ===
                "all" ||
              post.articleTags.some(
                (
                  articleTag
                ) =>
                  articleTag.id ===
                  tagFilter
              );

            return (
              matchesTime &&
              matchesContent &&
              matchesCategory &&
              matchesTag
            );
          }
        );
      },
      [
        livePosts,
        timeFilter,
        contentFilter,
        categoryFilter,
        tagFilter,
      ]
    );


  const activeFilterCount =
    (
      timeFilter !==
      "all"
        ? 1
        : 0
    ) +
    (
      contentFilter !==
      "all"
        ? 1
        : 0
    ) +
    (
      categoryFilter !==
      "all"
        ? 1
        : 0
    ) +
    (
      tagFilter !==
      "all"
        ? 1
        : 0
    );


  const clearFilters =
    () => {
      setTimeFilter(
        "all"
      );

      setContentFilter(
        "all"
      );

      setCategoryFilter(
        "all"
      );

      setTagFilter(
        "all"
      );
    };


  const happeningPosts =
    livePosts
      .filter(
        (
          post
        ) =>
          post.moderationStatus ===
            "approved"
      )
      .slice(
        0,
        4
      );


  return (
    <div className="roffle-app">
      {/* ==================================================
          HEADER
          ================================================== */}

      <header className="site-header">
        <div className="header-shell">
          <RoffleLogo />

          <nav className="desktop-nav">
            <a
              className="nav-active"
              href="#home"
            >
              Home
            </a>

            <a href="#forums">
              Forums
            </a>

            <a href="#latest">
              Latest
            </a>

            <a href="#members">
              Members
            </a>
          </nav>

          <div className="header-actions">
            <button
              className="icon-button"
              aria-label="Search"
            >
              <Search size={19} />
            </button>

            <button
              className="quick-post-trigger"
              type="button"
              onClick={
                openQuickPost
              }
            >
              <Plus size={16} />
              Post
            </button>

            {authReady &&
              (session ? (
                <>
                  <div
                    className="header-user"
                    title={`${userLabel} via ${providerLabel}`}
                  >
                    <span className="header-user-icon">
                      <UserRound size={16} />
                    </span>

                    <span className="header-user-copy">
                      <strong>
                        {userLabel}
                      </strong>

                      <small>
                        {providerLabel}
                      </small>
                    </span>
                  </div>

                  {(accessRole ===
                    "moderator" ||
                    accessRole ===
                      "admin") && (
                    <a
                      className="header-admin-link"
                      href="/admin"
                    >
                      Admin
                    </a>
                  )}

                  <button
                    className="header-signout"
                    type="button"
                    onClick={() => {
                      void signOut();
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <a
                  className="login-link"
                  href="/login"
                >
                  Sign in
                </a>
              ))}

            <button
              className="mobile-menu"
              onClick={() =>
                setMobileOpen(
                  !mobileOpen
                )
              }
              aria-label="Menu"
            >
              {mobileOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="mobile-nav">
            <a href="#home">
              Home
            </a>

            <a href="#forums">
              Forums
            </a>

            <a href="#latest">
              Latest
            </a>

            <a href="#members">
              Members
            </a>

            <button
              className="mobile-post-trigger"
              type="button"
              onClick={() => {
                setMobileOpen(
                  false
                );

                openQuickPost();
              }}
            >
              <Plus size={15} />
              Post
            </button>

            {authReady &&
              (session ? (
                <div className="mobile-auth">
                  <div className="mobile-auth-copy">
                    <strong>
                      {userLabel}
                    </strong>

                    <small>
                      Signed in with {providerLabel}
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void signOut();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <a href="/login">
                  Sign in
                </a>
              ))}
          </nav>
        )}
      </header>

      {/* ==================================================
          ANNOUNCEMENT
          ================================================== */}

      <div className="announcement">
        <div className="announcement-shell">
          <span className="announcement-dot" />

          <span>
            New around here?
          </span>

          <strong>
            Come lurk. Posting is optional.
          </strong>

{!session && (
          <a href="#join">
            Create an account
            <ChevronRight size={15} />
          </a>
)}
        </div>
      </div>

      {/* ==================================================
          PAGE
          ================================================== */}

      <main className="page-shell">
        {/* ==================================================
            FEATURED STRIP
            ================================================== */}

        <section className="trend-section">
          <div className="section-label">
            <Flame size={16} />

            Happening on ROFFLE
          </div>

          <div className="trend-grid">
            {happeningPosts.map(
              (
                item,
                index
              ) => (
                <a
                  className={`trend-card trend-${index} ${
                    item.type === "text"
                      ? "trend-text-card"
                      : ""
                  }`}
                  href={`#post-${item.id}`}
                  key={item.id}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                    />
                  ) : item.type === "text" ? (
                    <div className="trend-text-preview">
                      <span>
                        ROFFLE
                      </span>

                      <p>
                        {item.title}
                      </p>
                    </div>
                  ) : (
                    <div className="trend-media-placeholder">
                      <Video size={28} />
                    </div>
                  )}

                  <div className="trend-overlay" />

                  <div className="trend-copy">
                    <span>
                      {item.tag ??
                        item.type}
                    </span>

                    <strong>
                      {item.title}
                    </strong>
                  </div>
                </a>
              )
            )}
          </div>
        </section>

        {/* ==================================================
            TABS + FILTER
            ================================================== */}

        <div className="feed-controls">
          <div className="feed-tabs">
            <button className="feed-tab active">
              Articles
            </button>

            <button className="feed-tab">
              My Subscriptions
            </button>
          </div>

          <button
            className={`filter-trigger ${
              filterOpen ? "open" : ""
            }`}
            onClick={() =>
              setFilterOpen(
                !filterOpen
              )
            }
          >
            <SlidersHorizontal
              size={17}
            />

            Filter

            {activeFilterCount >
              0 && (
              <span className="filter-count">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {filterOpen && (
          <div className="filter-panel">
            <div className="filter-panel-top">
              <div>
                <strong>
                  Filter posts
                </strong>

                <span>
                  {filteredPosts.length} of{" "}
                  {livePosts.length} shown
                </span>
              </div>

              {activeFilterCount >
                0 && (
                <button
                  className="filter-clear"
                  type="button"
                  onClick={
                    clearFilters
                  }
                >
                  Clear
                </button>
              )}
            </div>

            <div className="filter-row">
              <span>
                Time
              </span>

              <button
                className={
                  timeFilter ===
                    "all"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setTimeFilter(
                    "all"
                  );
                }}
              >
                All time
              </button>

              <button
                className={
                  timeFilter ===
                    "today"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setTimeFilter(
                    "today"
                  );
                }}
              >
                Today
              </button>

              <button
                className={
                  timeFilter ===
                    "week"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setTimeFilter(
                    "week"
                  );
                }}
              >
                Last week
              </button>

              <button
                className={
                  timeFilter ===
                    "month"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setTimeFilter(
                    "month"
                  );
                }}
              >
                Last month
              </button>
            </div>

            <div className="filter-row">
              <span>
                Content
              </span>

              <button
                className={
                  contentFilter ===
                    "all"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setContentFilter(
                    "all"
                  );
                }}
              >
                All
              </button>

              <button
                className={
                  contentFilter ===
                    "videos"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setContentFilter(
                    "videos"
                  );
                }}
              >
                Videos
              </button>

              <button
                className={
                  contentFilter ===
                    "photos"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setContentFilter(
                    "photos"
                  );
                }}
              >
                Photos
              </button>

              <button
                className={
                  contentFilter ===
                    "discussions"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setContentFilter(
                    "discussions"
                  );
                }}
              >
                Discussions
              </button>
            </div>

            <div className="filter-row">
              <span>
                Category
              </span>

              <button
                className={
                  categoryFilter ===
                    "all"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setCategoryFilter(
                    "all"
                  );
                }}
              >
                All
              </button>

              {filterCategories.map(
                (
                  category
                ) => (
                  <button
                    key={
                      category.id
                    }
                    className={
                      categoryFilter ===
                        category.id
                        ? "selected"
                        : ""
                    }
                    type="button"
                    onClick={() => {
                      setCategoryFilter(
                        category.id
                      );
                    }}
                  >
                    {category.name}
                  </button>
                )
              )}
            </div>

            <div className="filter-row">
              <span>
                Tags
              </span>

              <button
                className={
                  tagFilter ===
                    "all"
                    ? "selected"
                    : ""
                }
                type="button"
                onClick={() => {
                  setTagFilter(
                    "all"
                  );
                }}
              >
                All
              </button>

              {filterTags.map(
                (
                  articleTag
                ) => (
                  <button
                    key={
                      articleTag.id
                    }
                    className={
                      tagFilter ===
                        articleTag.id
                        ? "selected"
                        : ""
                    }
                    type="button"
                    onClick={() => {
                      setTagFilter(
                        articleTag.id
                      );
                    }}
                  >
                    #
                    {articleTag.name}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* ==================================================
            MAIN GRID
            ================================================== */}

        <div className="main-grid">
          {/* ==========================
              FEED
              ========================== */}

          <section className="feed-column">
            <div className="feed-status">
              <div>
                <span className="live-dot" />

                New posts
              </div>

              <span>
                {filteredPosts.length} shown
                {" · "}
                Latest first
              </span>
            </div>

            {filteredPosts.length ===
              0 ? (
              <div className="feed-empty-filter">
                <strong>
                  Nothing matches that.
                </strong>

                <span>
                  ROFFLE looked. The nonsense is elsewhere.
                </span>

                {activeFilterCount >
                  0 && (
                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              filteredPosts.map(
                (
                  post
                ) => (
                  <PostCard
                    key={
                      post.id
                    }
                    post={
                      post
                    }
                    session={
                      session
                    }
                    onToggleLike={
                      handleToggleLike
                    }
                    onCommentCountChanged={
                      handleCommentCountChanged
                    }
                    isStaff={
                      accessRole ===
                        "moderator" ||
                      accessRole ===
                        "admin"
                    }
                  />
                )
              )
            )}

            <div className="pagination">
              <button disabled>
                Previous
              </button>

              <button className="page-current">
                1
              </button>

              <button>
                2
              </button>

              <button>
                3
              </button>

              <button>
                Next
              </button>
            </div>
          </section>

          {/* ==========================
              RIGHT RAIL
              ========================== */}

          <aside className="right-rail">
            <RailModule
              title="YouTube Gems"
              icon={
                <Play size={17} />
              }
            >
              <div className="gem-list">
                {youtubeGems.length ===
                  0 ? (
                  <div className="gem-empty">
                    No YouTube gems yet.
                  </div>
                ) : (
                  youtubeGems.map(
                    (
                      gem
                    ) => (
                      <a
                        className="gem"
                        href={`#post-${gem.id}`}
                        key={gem.id}
                      >
                        <div className="gem-image">
                          <img
                            src={`https://i.ytimg.com/vi/${gem.youtubeId}/hqdefault.jpg`}
                            alt=""
                          />

                          <span>
                            <Play
                              size={14}
                              fill="currentColor"
                            />
                          </span>
                        </div>

                        <div>
                          <strong>
                            {gem.title}
                          </strong>

                          <small className="gem-engagement">
                            <span>
                              <Heart
                                size={11}
                              />
                              {gem.likeCount}
                            </span>

                            <span>
                              <MessageCircle
                                size={11}
                              />
                              {gem.commentCount}
                            </span>
                          </small>
                        </div>
                      </a>
                    )
                  )
                )}
              </div>
            </RailModule>

            <RailModule
              title="Categories"
              icon={
                <Hash size={17} />
              }
            >
              <div className="category-list">
                <a href="#goods">
                  <div>
                    <span className="category-icon">
                      <Flame
                        size={16}
                      />
                    </span>

                    <span>
                      The Goods
                    </span>
                  </div>

                  <strong>
                    384
                  </strong>
                </a>

                <a href="#videos">
                  <div>
                    <span className="category-icon">
                      <Video
                        size={16}
                      />
                    </span>

                    <span>
                      Videos
                    </span>
                  </div>

                  <strong>
                    209
                  </strong>
                </a>

                <a href="#photos">
                  <div>
                    <span className="category-icon">
                      <ImageIcon
                        size={16}
                      />
                    </span>

                    <span>
                      Photos
                    </span>
                  </div>

                  <strong>
                    91
                  </strong>
                </a>

                <a href="#links">
                  <div>
                    <span className="category-icon">
                      <LinkIcon
                        size={16}
                      />
                    </span>

                    <span>
                      Links
                    </span>
                  </div>

                  <strong>
                    84
                  </strong>
                </a>
              </div>
            </RailModule>

            <RailModule
              title="Article Tags"
              icon={
                <Hash size={17} />
              }
            >
              <div className="tag-list">
                <a href="#cats">
                  cats
                </a>

                <a href="#dads">
                  dads
                </a>

                <a href="#wtf">
                  wtf
                </a>

                <a href="#video">
                  video
                </a>

                <a href="#internet">
                  internet
                </a>

                <a href="#fail">
                  fail
                </a>

                <a href="#funny">
                  funny
                </a>
              </div>
            </RailModule>

            {!session && (
              <section className="join-card">
                <div className="join-orb">
                  R
                </div>

                <h3>
                  You're already here.
                </h3>

                <p>
                  Might as well make an
                  account.
                </p>

                <a href="/login">
                  Join ROFFLE
                </a>
              </section>
            )}
          </aside>
        </div>
      </main>

      <QuickPostDialog
        open={postDialogOpen}
        onClose={() => {
          setPostDialogOpen(
            false
          );
        }}
        onPosted={
          handlePostCreated
        }
      />

      {/* ==================================================
          FOOTER
          ================================================== */}

      <footer className="site-footer">
        <div className="footer-shell">
          <div className="footer-brand">
            <RoffleLogo />

            <p>
              wtf internet nonsense
            </p>
          </div>

          <div className="footer-links">
            <div>
              <strong>
                ROFFLE
              </strong>

              <a href="#home">
                Home
              </a>

              <a href="#forums">
                Forums
              </a>

              <a href="#latest">
                Latest
              </a>
            </div>

            <div>
              <strong>
                ACCOUNT
              </strong>

              <a href="/login">
                Sign in
              </a>

              <a href="#register">
                Register
              </a>

              <a href="#help">
                Help
              </a>
            </div>

            <div>
              <strong>
                LEGAL
              </strong>

              <a href="#privacy">
                Privacy
              </a>

              <a href="#terms">
                Terms
              </a>

              <a href="#contact">
                Contact
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © 2026 ROFFLE
          </span>

          <span>
            <Clock size={13} />
            The internet never closes. I work a lot... this sucks. tf are you even doing reading down here?
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;