import {
  useEffect,
  useState,
} from "react";

import {
  BookOpen,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  deleteBlogPost,
  getAdminBlogPosts,
  saveBlogPost,
} from "../../services/blog";

import type {
  BlogAccent,
  BlogPost,
} from "../../types/blog";

import "./BlogManager.css";


/* ==========================================================
   BLOG ADMIN 001
   HELPERS
   ========================================================== */


function slugify(
  value: string,
) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}


type EditorState = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  heroImageUrl: string;
  accentStyle: BlogAccent;
  published: boolean;
  highlighted: boolean;
};


const emptyEditor:
EditorState = {
  id: null,
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  heroImageUrl: "",
  accentStyle:
    "orange",
  published: false,
  highlighted: false,
};


function toEditor(
  post: BlogPost,
): EditorState {
  return {
    id:
      post.id,

    title:
      post.title,

    slug:
      post.slug,

    excerpt:
      post.excerpt ??
      "",

    body:
      post.body,

    heroImageUrl:
      post.hero_image_url ??
      "",

    accentStyle:
      post.accent_style,

    published:
      post.published,

    highlighted:
      post.is_highlighted,
  };
}


/* ==========================================================
   BLOG ADMIN 002
   MANAGER
   ========================================================== */


export default function BlogManager() {
  const [
    posts,
    setPosts,
  ] =
    useState<BlogPost[]>(
      []
    );

  const [
    editor,
    setEditor,
  ] =
    useState<EditorState>(
      emptyEditor
    );

  const [
    slugTouched,
    setSlugTouched,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  const load =
    async () => {
      try {
        setPosts(
          await getAdminBlogPosts()
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not load blog posts."
        );
      } finally {
        setLoading(
          false
        );
      }
    };


  useEffect(() => {
    void load();
  }, []);


  const updateTitle =
    (
      value: string,
    ) => {
      setEditor(
        (
          current
        ) => ({
          ...current,

          title:
            value,

          slug:
            slugTouched
              ? current.slug
              : slugify(
                  value
                ),
        })
      );
    };


  const selectPost =
    (
      post: BlogPost,
    ) => {
      setEditor(
        toEditor(
          post
        )
      );

      setSlugTouched(
        true
      );

      setError(
        null
      );
    };


  const startNew =
    () => {
      setEditor(
        emptyEditor
      );

      setSlugTouched(
        false
      );

      setError(
        null
      );
    };


  const save =
    async () => {
      if (
        !editor.title.trim() ||
        !editor.slug.trim() ||
        !editor.body.trim()
      ) {
        setError(
          "Title, slug, and body are required."
        );

        return;
      }

      setSaving(
        true
      );

      setError(
        null
      );

      try {
        const id =
          await saveBlogPost({
            id:
              editor.id,

            title:
              editor.title,

            slug:
              editor.slug,

            excerpt:
              editor.excerpt,

            body:
              editor.body,

            heroImageUrl:
              editor.heroImageUrl,

            accentStyle:
              editor.accentStyle,

            published:
              editor.published,

            highlighted:
              editor.highlighted,
          });

        await load();

        const refreshed =
          await getAdminBlogPosts();

        setPosts(
          refreshed
        );

        const saved =
          refreshed.find(
            (
              post
            ) =>
              post.id ===
              id
          );

        if (saved) {
          setEditor(
            toEditor(
              saved
            )
          );

          setSlugTouched(
            true
          );
        }
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not save blog post."
        );
      } finally {
        setSaving(
          false
        );
      }
    };


  const remove =
    async () => {
      if (!editor.id) {
        return;
      }

      if (
        !window.confirm(
          `Delete "${editor.title}"?`
        )
      ) {
        return;
      }

      try {
        await deleteBlogPost(
          editor.id
        );

        startNew();

        await load();
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not delete blog post."
        );
      }
    };


  if (loading) {
    return (
      <div className="blog-admin-loading">
        Loading blog...
      </div>
    );
  }


  return (
    <section className="blog-admin">
      <header className="blog-admin-heading">
        <div>
          <span className="admin-eyebrow">
            ROFFLE EDITORIAL
          </span>

          <h1>
            Blog
          </h1>
        </div>

        <button
          type="button"
          onClick={
            startNew
          }
        >
          <Plus
            size={14}
          />

          New post
        </button>
      </header>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      <div className="blog-admin-grid">
        <aside className="blog-admin-list">
          {posts.length ===
            0 ? (
            <div className="blog-admin-empty">
              No blog posts yet.
            </div>
          ) : (
            posts.map(
              (
                post
              ) => (
                <button
                  className={
                    editor.id ===
                      post.id
                      ? "selected"
                      : ""
                  }
                  type="button"
                  key={
                    post.id
                  }
                  onClick={() => {
                    selectPost(
                      post
                    );
                  }}
                >
                  <BookOpen
                    size={14}
                  />

                  <span>
                    <strong>
                      {post.title}
                    </strong>

                    <small>
                      {post.published
                        ? "Published"
                        : "Draft"}

                      {post.is_highlighted
                        ? " · Homepage feature"
                        : ""}
                    </small>
                  </span>
                </button>
              )
            )
          )}
        </aside>

        <div className="blog-admin-editor">
          <label>
            <span>
              Title
            </span>

            <input
              value={
                editor.title
              }
              maxLength={180}
              onChange={
                (
                  event
                ) => {
                  updateTitle(
                    event.target.value
                  );
                }
              }
            />
          </label>

          <label>
            <span>
              Slug
            </span>

            <input
              value={
                editor.slug
              }
              maxLength={180}
              onChange={
                (
                  event
                ) => {
                  setSlugTouched(
                    true
                  );

                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      slug:
                        slugify(
                          event.target.value
                        ),
                    })
                  );
                }
              }
            />
          </label>

          <label>
            <span>
              Excerpt

              <small>
                {editor.excerpt.length}/500
              </small>
            </span>

            <textarea
              className="blog-admin-excerpt"
              value={
                editor.excerpt
              }
              maxLength={500}
              onChange={
                (
                  event
                ) => {
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      excerpt:
                        event.target.value,
                    })
                  );
                }
              }
            />
          </label>

          <label>
            <span>
              Body

              <small>
                {editor.body.length}/20000
              </small>
            </span>

            <textarea
              className="blog-admin-body"
              value={
                editor.body
              }
              maxLength={20000}
              onChange={
                (
                  event
                ) => {
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      body:
                        event.target.value,
                    })
                  );
                }
              }
            />
          </label>

          <label>
            <span>
              Hero image URL
            </span>

            <input
              value={
                editor.heroImageUrl
              }
              onChange={
                (
                  event
                ) => {
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      heroImageUrl:
                        event.target.value,
                    })
                  );
                }
              }
              placeholder="https://..."
            />
          </label>

          <label>
            <span>
              Highlight color
            </span>

            <select
              value={
                editor.accentStyle
              }
              onChange={
                (
                  event
                ) => {
                  setEditor(
                    (
                      current
                    ) => ({
                      ...current,

                      accentStyle:
                        event.target.value as
                          BlogAccent,
                    })
                  );
                }
              }
            >
              <option value="orange">
                ROFFLE Orange
              </option>

              <option value="blue">
                Light Blue
              </option>
            </select>
          </label>

          <div className="blog-admin-toggles">
            <label>
              <input
                type="checkbox"
                checked={
                  editor.published
                }
                onChange={
                  (
                    event
                  ) => {
                    const published =
                      event.target.checked;

                    setEditor(
                      (
                        current
                      ) => ({
                        ...current,

                        published,

                        highlighted:
                          published
                            ? current.highlighted
                            : false,
                      })
                    );
                  }
                }
              />

              Published
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  editor.highlighted
                }
                disabled={
                  !editor.published
                }
                onChange={
                  (
                    event
                  ) => {
                    setEditor(
                      (
                        current
                      ) => ({
                        ...current,

                        highlighted:
                          event.target.checked,
                      })
                    );
                  }
                }
              />

              Show as top homepage feature
            </label>
          </div>

          <footer className="blog-admin-actions">
            {editor.id && (
              <button
                className="danger"
                type="button"
                onClick={() => {
                  void remove();
                }}
              >
                <Trash2
                  size={13}
                />

                Delete
              </button>
            )}

            <button
              className="primary"
              type="button"
              disabled={
                saving
              }
              onClick={() => {
                void save();
              }}
            >
              <Save
                size={13}
              />

              {saving
                ? "Saving..."
                : "Save post"}
            </button>
          </footer>
        </div>
      </div>
    </section>
  );
}
