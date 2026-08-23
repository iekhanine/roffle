import {
  useState,
} from "react";

import type {
  Session,
} from "@supabase/supabase-js";

import {
  ChevronRight,
  Menu,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";

import type {
  UserRole,
} from "../../types/admin";


/* ==========================================================
   HEADER 001
   SHARED ROFFLE SITE HEADER
   ========================================================== */


type ActiveSection =
  | "home"
  | "blog"
  | "forums";


type Props = {
  session:
    Session | null;

  authReady:
    boolean;

  accessRole:
    UserRole | null;

  activeSection:
    ActiveSection;

  onPost: () => void;

  onSignOut: () => void;
};


export function RoffleLogo() {
  return (
    <a
      className="roffle-logo"
      href="/"
      aria-label="ROFFLE home"
    >
      <span className="logo-mark">
        R
      </span>

      <span className="logo-word">
        ROFFLE
      </span>
    </a>
  );
}


export default function SiteHeader({
  session,
  authReady,
  accessRole,
  activeSection,
  onPost,
  onSignOut,
}: Props) {
  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(false);


  const provider =
    session?.user.app_metadata
      ?.provider;

  const providerLabel =
    provider === "google"
      ? "Google"
      : provider === "discord"
        ? "Discord"
        : provider
          ? String(
              provider
            )
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


  const handlePost =
    () => {
      setMobileOpen(
        false
      );

      onPost();
    };


  return (
    <>
      <header className="site-header">
        <div className="header-shell">
          <RoffleLogo />

          <nav className="desktop-nav">
            <a
              className={
                activeSection ===
                  "home"
                  ? "nav-active"
                  : ""
              }
              href="/"
            >
              Home
            </a>

            <a
              className={
                activeSection ===
                  "blog"
                  ? "nav-active"
                  : ""
              }
              href="/blog"
            >
              Blog
            </a>

            <a
              className={
                activeSection ===
                  "forums"
                  ? "nav-active"
                  : ""
              }
              href="/forum"
            >
              Forums
            </a>
          </nav>

          <div className="header-actions">
            <button
              className="icon-button"
              type="button"
              aria-label="Search"
            >
              <Search
                size={19}
              />
            </button>

            <button
              className="quick-post-trigger"
              type="button"
              onClick={
                handlePost
              }
            >
              <Plus
                size={16}
              />

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
                      <UserRound
                        size={16}
                      />
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
                    onClick={
                      onSignOut
                    }
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
              type="button"
              onClick={() => {
                setMobileOpen(
                  (
                    current
                  ) =>
                    !current
                );
              }}
              aria-label="Menu"
            >
              {mobileOpen ? (
                <X
                  size={22}
                />
              ) : (
                <Menu
                  size={22}
                />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="mobile-nav">
            <a href="/">
              Home
            </a>

            <a href="/blog">
              Blog
            </a>

            <a href="/forum">
              Forums
            </a>

            <button
              className="mobile-post-trigger"
              type="button"
              onClick={
                handlePost
              }
            >
              <Plus
                size={15}
              />

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
                    onClick={
                      onSignOut
                    }
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
            <a href="/login">
              Create an account

              <ChevronRight
                size={15}
              />
            </a>
          )}
        </div>
      </div>
    </>
  );
}
