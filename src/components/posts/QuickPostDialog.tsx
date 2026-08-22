import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Image as ImageIcon,
  Send,
  Type,
  UploadCloud,
  Video,
  X,
} from "lucide-react";

import {
  parseYouTubeUrl,
} from "../../lib/youtube";

import {
  createQuickPost,
} from "../../services/posts";

import type {
  PostRecord,
  QuickPostType,
} from "../../types/post";

import "./QuickPostDialog.css";


/* ==========================================================
   ROFFLE
   QUICK POST DIALOG
   ========================================================== */


type Props = {
  open: boolean;

  onClose: () => void;

  onPosted: (
    post: PostRecord,
  ) => void;
};


export default function QuickPostDialog({
  open,
  onClose,
  onPosted,
}: Props) {
  const [
    postType,
    setPostType,
  ] =
    useState<QuickPostType>(
      "youtube"
    );

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    youtubeUrl,
    setYoutubeUrl,
  ] =
    useState("");

  const [
    body,
    setBody,
  ] =
    useState("");

  const [
    image,
    setImage,
  ] =
    useState<File | null>(
      null
    );

  const [
    imagePreview,
    setImagePreview,
  ] =
    useState<string | null>(
      null
    );

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

  const [
    postedMessage,
    setPostedMessage,
  ] =
    useState<string | null>(
      null
    );


  const parsedYouTube =
    useMemo(
      () =>
        parseYouTubeUrl(
          youtubeUrl
        ),
      [youtubeUrl]
    );


  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown =
      (
        event:
          KeyboardEvent
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          onClose();
        }
      };

    document.addEventListener(
      "keydown",
      onKeyDown
    );

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow =
        "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        onKeyDown
      );

      document.body.style
        .overflow =
          previousOverflow;
    };
  }, [
    open,
    onClose,
  ]);


  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview
        );
      }
    };
  }, [imagePreview]);


  if (!open) {
    return null;
  }


  const resetForm = () => {
    setPostType(
      "youtube"
    );

    setTitle("");
    setYoutubeUrl("");
    setBody("");

    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setImage(null);
    setImagePreview(null);

    setSaving(false);
    setError(null);
    setPostedMessage(null);
  };


  const closeDialog = () => {
    resetForm();
    onClose();
  };


  const selectImage =
    (
      file:
        File | null
    ) => {
      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview
        );
      }

      setImage(file);

      setImagePreview(
        file
          ? URL.createObjectURL(
              file
            )
          : null
      );
    };


  const submit =
    async () => {
      setSaving(true);
      setError(null);

      try {
        let created:
          PostRecord;

        if (
          postType ===
          "youtube"
        ) {
          created =
            await createQuickPost(
              {
                postType:
                  "youtube",

                title,

                youtubeUrl,
              }
            );
        } else if (
          postType ===
          "text"
        ) {
          created =
            await createQuickPost(
              {
                postType:
                  "text",

                title,

                body,
              }
            );
        } else {
          if (!image) {
            throw new Error(
              "Pick an image first."
            );
          }

          created =
            await createQuickPost(
              {
                postType:
                  "image",

                title,

                body,

                image,
              }
            );
        }

        setPostedMessage(
          created.moderation_status ===
            "approved"
            ? "Posted."
            : "Submitted for approval."
        );

        onPosted(
          created
        );

        window.setTimeout(
          () => {
            closeDialog();
          },
          450
        );
      } catch (
        nextError
      ) {
        const message =
          nextError
            instanceof Error
            ? nextError.message
            : "ROFFLE could not create the post.";

        setError(
          message
        );

        setSaving(false);
      }
    };


  const canSubmit =
    postType === "youtube"
      ? Boolean(
          parsedYouTube
        )
      : postType === "text"
        ? Boolean(
            title.trim()
          ) &&
          title.trim()
            .length <= 180 &&
          Boolean(
            body.trim()
          ) &&
          body.trim()
            .length <= 500
        : Boolean(image);


  return (
    <div
      className="quick-post-backdrop"
      role="presentation"
      onMouseDown={
        (
          event
        ) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            closeDialog();
          }
        }
      }
    >
      <section
        className="quick-post-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-post-title"
      >
        <header className="quick-post-header">
          <div>
            <span className="quick-post-eyebrow">
              QUICK POST
            </span>

            <h2 id="quick-post-title">
              Throw something on ROFFLE
            </h2>
          </div>

          <button
            className="quick-post-close"
            type="button"
            onClick={
              closeDialog
            }
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="quick-post-tabs">
          <button
            type="button"
            className={
              postType ===
              "youtube"
                ? "active"
                : ""
            }
            onClick={() => {
              setPostType(
                "youtube"
              );

              setError(null);
            }}
          >
            <Video size={16} />
            YouTube
          </button>

          <button
            type="button"
            className={
              postType ===
              "text"
                ? "active"
                : ""
            }
            onClick={() => {
              setPostType(
                "text"
              );

              setError(null);
            }}
          >
            <Type size={16} />
            Text
          </button>

          <button
            type="button"
            className={
              postType ===
              "image"
                ? "active"
                : ""
            }
            onClick={() => {
              setPostType(
                "image"
              );

              setError(null);
            }}
          >
            <ImageIcon size={16} />
            Image
          </button>
        </div>

        <div className="quick-post-body">
          {postType ===
            "youtube" && (
            <>
              <label className="quick-post-field">
                <span>
                  YouTube URL
                </span>

                <input
                  type="url"
                  value={
                    youtubeUrl
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setYoutubeUrl(
                        event
                          .target
                          .value
                      )
                  }
                  placeholder="https://youtube.com/shorts/..."
                  autoFocus
                />
              </label>

              <label className="quick-post-field">
                <span>
                  Title
                  <small>
                    optional
                  </small>
                </span>

                <input
                  type="text"
                  value={
                    title
                  }
                  maxLength={180}
                  onChange={
                    (
                      event
                    ) =>
                      setTitle(
                        event
                          .target
                          .value
                      )
                  }
                  placeholder="Give it a name, or don't."
                />
              </label>

              {youtubeUrl &&
                !parsedYouTube && (
                  <div className="quick-post-inline-error">
                    That URL does not look like a YouTube video or Short.
                  </div>
                )}

              {parsedYouTube && (
                <div className="quick-post-youtube-preview">
                  <iframe
                    src={
                      parsedYouTube
                        .embedUrl
                    }
                    title="YouTube preview"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />

                  <div>
                    <strong>
                      {parsedYouTube
                        .videoType ===
                      "short"
                        ? "YouTube Short"
                        : "YouTube video"}
                    </strong>

                    <span>
                      Ready to post.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {postType ===
            "text" && (
            <>
              <label className="quick-post-field">
                <span>
                  Title
                  <small>
                    {title.length}/180
                  </small>
                </span>

                <input
                  type="text"
                  value={title}
                  maxLength={180}
                  onChange={
                    (
                      event
                    ) =>
                      setTitle(
                        event
                          .target
                          .value
                      )
                  }
                  placeholder="Headline the nonsense..."
                  autoFocus
                />
              </label>

              <label className="quick-post-field">
                <span>
                  Main content
                  <small>
                    {body.length}/500
                  </small>
                </span>

                <textarea
                  value={body}
                  maxLength={500}
                  onChange={
                    (
                      event
                    ) =>
                      setBody(
                        event
                          .target
                          .value
                      )
                  }
                  placeholder="Now explain yourself..."
                />
              </label>

              <div className="quick-post-text-note">
                Happening on ROFFLE will show only the title over a random background image.
              </div>
            </>
          )}

          {postType ===
            "image" && (
            <>
              <label className="quick-post-upload">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={
                    (
                      event
                    ) => {
                      selectImage(
                        event
                          .target
                          .files?.[0] ??
                          null
                      );
                    }
                  }
                />

                {imagePreview ? (
                  <img
                    src={
                      imagePreview
                    }
                    alt="Selected upload preview"
                  />
                ) : (
                  <div>
                    <UploadCloud size={27} />

                    <strong>
                      Pick an image
                    </strong>

                    <span>
                      JPG, PNG, WEBP, or GIF · 10 MB max
                    </span>
                  </div>
                )}
              </label>

              <label className="quick-post-field">
                <span>
                  Title
                  <small>
                    optional
                  </small>
                </span>

                <input
                  type="text"
                  value={
                    title
                  }
                  maxLength={180}
                  onChange={
                    (
                      event
                    ) =>
                      setTitle(
                        event
                          .target
                          .value
                      )
                  }
                  placeholder="What are we looking at?"
                />
              </label>

              <label className="quick-post-field">
                <span>
                  Caption
                  <small>
                    optional
                  </small>
                </span>

                <textarea
                  value={body}
                  maxLength={500}
                  onChange={
                    (
                      event
                    ) =>
                      setBody(
                        event
                          .target
                          .value
                      )
                  }
                  placeholder="Context, if this deserves any."
                />
              </label>
            </>
          )}

          {error && (
            <div className="quick-post-error">
              {error}
            </div>
          )}

          {postedMessage && (
            <div className="quick-post-success">
              <CheckCircle2 size={16} />
              {postedMessage}
            </div>
          )}
        </div>

        <footer className="quick-post-footer">
          <button
            className="quick-post-cancel"
            type="button"
            onClick={
              closeDialog
            }
            disabled={
              saving
            }
          >
            Cancel
          </button>

          <button
            className="quick-post-submit"
            type="button"
            onClick={() => {
              void submit();
            }}
            disabled={
              saving ||
              !canSubmit
            }
          >
            <Send size={15} />

            {saving
              ? "Posting..."
              : "Post to ROFFLE"}
          </button>
        </footer>
      </section>
    </div>
  );
}
