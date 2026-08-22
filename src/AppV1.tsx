import "./AppV1.css";

type PostType =
  | "video-vertical"
  | "video-horizontal"
  | "image"
  | "link"
  | "text";

type Post = {
  id: number;
  title: string;
  author: string;
  avatar: string;
  date: string;
  views: number;
  comments: number;
  type: PostType;

  mediaUrl?: string;
  thumbnail?: string;

  body?: string;
  source?: string;
};

const posts: Post[] = [
  {
    id: 1,
    title: "Well, That Sucks",
    author: "Tooterfish",
    avatar: "T",
    date: "Today, 1:42 AM",
    views: 84,
    comments: 7,
    type: "video-vertical",

    // Replace with actual YouTube embed URL.
    mediaUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",

    body:
      "Sometimes you can see the exact second somebody realizes they made a terrible decision.",
  },

  {
    id: 2,
    title: "Nature Is Completely Normal",
    author: "Roffler",
    avatar: "R",
    date: "Yesterday, 11:18 PM",
    views: 132,
    comments: 14,
    type: "image",

    thumbnail: "https://picsum.photos/1000/620?random=21",

    body:
      "Another perfectly ordinary day on planet Earth.",
  },

  {
    id: 3,
    title: "This Judge Is Awesome",
    author: "MisterE",
    avatar: "M",
    date: "Yesterday, 8:04 PM",
    views: 97,
    comments: 3,
    type: "link",

    thumbnail: "https://picsum.photos/800/480?random=33",
    source: "example.com",

    body:
      "External links can still live inside the same ROFFLE article stream without turning the homepage into Reddit.",
  },

  {
    id: 4,
    title: "Guy Immediately Regrets This",
    author: "Tooterfish",
    avatar: "T",
    date: "Yesterday, 5:31 PM",
    views: 211,
    comments: 28,
    type: "video-vertical",

    mediaUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },

  {
    id: 5,
    title: "Old Internet Energy",
    author: "Admin",
    avatar: "A",
    date: "Yesterday, 2:14 PM",
    views: 54,
    comments: 6,
    type: "text",

    body:
      "The goal here isn't to turn ROFFLE into another polished corporate social network. The slightly old-school internet forum structure is part of what gives the site personality.",
  },
];

const featuredPosts = [
  "Instant Karma",
  "What Could Possibly Go Wrong?",
  "The Internet Remains Undefeated",
  "That's Going To Leave A Mark",
];

function MediaRenderer({ post }: { post: Post }) {
  switch (post.type) {
    case "video-vertical":
      return (
        <div className="vertical-video-wrap">
          <div className="vertical-video">
            <iframe
              src={post.mediaUrl}
              title={post.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      );

    case "video-horizontal":
      return (
        <div className="horizontal-video">
          <iframe
            src={post.mediaUrl}
            title={post.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );

    case "image":
      return (
        <div className="image-post">
          <img src={post.thumbnail} alt={post.title} />
        </div>
      );

    case "link":
      return (
        <a className="link-preview" href="#post">
          <img src={post.thumbnail} alt="" />

          <div className="link-preview-content">
            <span className="link-domain">
              {post.source}
            </span>

            <strong>{post.title}</strong>

            <p>{post.body}</p>
          </div>
        </a>
      );

    default:
      return null;
  }
}

function ArticleCard({ post }: { post: Post }) {
  return (
    <article className="article-card">
      <header className="article-header">
        <h2>
          <a href="#post">{post.title}</a>
        </h2>

        <div className="article-meta">
          <div className="avatar">
            {post.avatar}
          </div>

          <div className="article-author">
            <a href="#author">
              {post.author}
            </a>

            <span>{post.date}</span>
          </div>

          <div className="article-stats">
            <span>
              ≡ƒæü {post.views}
            </span>

            <span>
              ≡ƒÆ¼ {post.comments}
            </span>
          </div>
        </div>
      </header>

      <div className="article-body">
        <MediaRenderer post={post} />

        {post.body && post.type !== "link" && (
          <p className="post-description">
            {post.body}
          </p>
        )}
      </div>

      <footer className="article-footer">
        <button className="reaction-button">
          ≡ƒæì Like
        </button>

        <a href="#post">
          {post.comments} comments
        </a>

        <a className="go-post" href="#post">
          Go to post ΓåÆ
        </a>
      </footer>
    </article>
  );
}

function SidebarModule({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="sidebar-module">
      <header>
        <h3>{title}</h3>
        <button aria-label="Collapse">
          ΓêÆ
        </button>
      </header>

      <div className="sidebar-module-body">
        {children}
      </div>
    </section>
  );
}

function App() {
  return (
    <div className="site">
      {/* TOP HEADER */}

      <header className="top-header">
        <div className="header-inner">
          <a className="logo" href="/">
            ROFFLE
          </a>

          <nav className="main-nav">
            <a className="active" href="/">
              Home
            </a>

            <a href="#forums">
              The Forum
            </a>
            <a href="#forums">
              Organized Dorks
            </a>
            <a href="#forums">
              Meme Gallery
            </a>


         </nav>

          <div className="header-actions">
            <a href="#login">
              Log in
            </a>

            <a className="signup-button" href="#signup">
              Sign up
            </a>
          </div>
        </div>
      </header>

      {/* SUB NAV */}

      <div className="sub-nav">
        <div className="sub-nav-inner">
          <a href="#">
           [SUB NAVIGATION HERE]
          </a>
        </div>
      </div>

      {/* PAGE */}

      <main className="page">
        {/* NOTICE */}

        <div className="notice">
          <div>

            If you want to add a global web notice.

          </div>
          <button>
            ├ù
          </button>
        </div>

        {/* FEATURE STRIP */}

        <section className="featured-strip">
          {featuredPosts.map(
            (title, index) => (
              <article
                className="featured-item"
                key={title}
              >
                <div className="featured-thumb">
                  <img
                    src={`https://picsum.photos/260/150?random=${
                      index + 60
                    }`}
                    alt=""
                  />
                </div>

                <div>
                  <strong>
                    {title}
                  </strong>

                  <span>
                    Today
                  </span>
                </div>
              </article>
            )
          )}
        </section>

        {/* BREADCRUMB */}

        <div className="breadcrumbs">
          <a href="/">
            Home
          </a>

          <span>ΓÇ║</span>

          <strong>
            Roffle Homepage
          </strong>
        </div>

        {/* CONTENT TABS */}

        <div className="content-tabs">
          <button className="active">
            Articles
          </button>

          <button>
            My Subscriptions
          </button>
        </div>

        {/* TOOLBAR */}

        <div className="feed-toolbar">
          <div className="pagination">
            <button className="active">
              1
            </button>

            <button>2</button>
            <button>3</button>
            <button>4</button>

            <button>Next ΓÇ║</button>
          </div>

          <div className="filter-buttons">
            <select>
              <option>All Time</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>

            <select>
              <option>All Content</option>
              <option>Videos</option>
              <option>Photos</option>
              <option>Links</option>
              <option>Discussions</option>
            </select>
          </div>
        </div>

        {/* GRID */}

        <div className="content-grid">
          {/* MAIN FEED */}

          <section className="feed">
            {posts.map((post) => (
              <ArticleCard
                key={post.id}
                post={post}
              />
            ))}
          </section>

          {/* SIDEBAR */}

          <aside className="sidebar">
            <SidebarModule title="YouTube Gems">
              <div className="youtube-gem">
                <img
                  src="https://picsum.photos/240/135?random=91"
                  alt=""
                />

                <strong>
                  This week's questionable
                  decisions
                </strong>

                <span>
                  12 videos
                </span>
              </div>

              <div className="youtube-gem">
                <img
                  src="https://picsum.photos/240/135?random=92"
                  alt=""
                />

                <strong>
                  People doing things they
                  probably shouldn't
                </strong>

                <span>
                  8 videos
                </span>
              </div>
            </SidebarModule>

            <SidebarModule title="Categories">
              <ul className="sidebar-list">
                <li>
                  <a href="#goods">
                    The Goods
                  </a>

                  <span>384</span>
                </li>

                <li>
                  <a href="#videos">
                    Videos
                  </a>

                  <span>209</span>
                </li>

                <li>
                  <a href="#pics">
                    Pics
                  </a>

                  <span>91</span>
                </li>

                <li>
                  <a href="#random">
                    Random
                  </a>

                  <span>84</span>
                </li>
              </ul>
            </SidebarModule>

            <SidebarModule title="Article Tags">
              <div className="tag-cloud">
                <a href="#tag">
                  funny
                </a>

                <a href="#tag">
                  video
                </a>

                <a href="#tag">
                  youtube
                </a>

                <a href="#tag">
                  fail
                </a>

                <a href="#tag">
                  internet
                </a>

                <a href="#tag">
                  wtf
                </a>

                <a href="#tag">
                  random
                </a>
              </div>
            </SidebarModule>

            <SidebarModule title="Roffle Stats">
              <div className="stats-list">
                <div>
                  <span>Articles</span>
                  <strong>384</strong>
                </div>

                <div>
                  <span>Members</span>
                  <strong>1,842</strong>
                </div>

                <div>
                  <span>Comments</span>
                  <strong>12,391</strong>
                </div>
              </div>
            </SidebarModule>
          </aside>
        </div>
      </main>

      {/* FOOTER */}

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <strong>ROFFLE</strong>

            <span>
              Internet nonsense since whenever.
            </span>
          </div>

          <nav>
            <a href="#help">
              Help
            </a>

            <a href="#contact">
              Contact Us
            </a>

            <a href="#privacy">
              Privacy
            </a>

            <a href="#terms">
              Terms
            </a>

            <a href="#top">
              Go to top
            </a>
          </nav>
        </div>

        <div className="footer-bottom">
          Inspired by the OG ROFFLE - built by OneTime Labs
        </div>
      </footer>
    </div>
  );
}

export default App;
