import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  FileClock,
  ShieldCheck,
  Users,
} from "lucide-react";

import AdminUsers from "../../components/admin/AdminUsers";
import ModerationQueue from "../../components/admin/ModerationQueue";

import {
  getAdminStats,
  getMyAccess,
} from "../../services/admin";

import type {
  AdminStats,
  MyAccess,
} from "../../types/admin";

import "./Admin.css";


/* ==========================================================
   ROFFLE
   ADMIN
   ========================================================== */


type Tab =
  | "dashboard"
  | "moderation"
  | "users";


export default function Admin() {
  const [
    access,
    setAccess,
  ] =
    useState<MyAccess | null>(
      null
    );

  const [
    stats,
    setStats,
  ] =
    useState<AdminStats | null>(
      null
    );

  const [
    tab,
    setTab,
  ] =
    useState<Tab>(
      "dashboard"
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


  const refreshStats =
    async () => {
      try {
        setStats(
          await getAdminStats()
        );
      } catch (
        nextError
      ) {
        setError(
          nextError
            instanceof Error
            ? nextError.message
            : "Could not refresh admin stats."
        );
      }
    };


  useEffect(() => {
    let mounted = true;

    const load =
      async () => {
        try {
          const nextAccess =
            await getMyAccess();

          if (!mounted) {
            return;
          }

          setAccess(
            nextAccess
          );

          if (
            !nextAccess ||
            (
              nextAccess.role !==
                "moderator" &&
              nextAccess.role !==
                "admin"
            ) ||
            nextAccess.account_status !==
              "active"
          ) {
            return;
          }

          const nextStats =
            await getAdminStats();

          if (mounted) {
            setStats(
              nextStats
            );
          }
        } catch (
          nextError
        ) {
          setError(
            nextError
              instanceof Error
              ? nextError.message
              : "ROFFLE admin could not load."
          );
        } finally {
          if (mounted) {
            setLoading(
              false
            );
          }
        }
      };

    void load();

    return () => {
      mounted = false;
    };
  }, []);


  if (loading) {
    return (
      <main className="admin-gate">
        Loading ROFFLE admin...
      </main>
    );
  }


  const allowed =
    access &&
    (
      access.role ===
        "moderator" ||
      access.role ===
        "admin"
    ) &&
    access.account_status ===
      "active";


  if (!allowed) {
    return (
      <main className="admin-gate">
        <ShieldCheck
          size={28}
        />

        <h1>
          Nope.
        </h1>

        <p>
          This part of ROFFLE is for moderators and admins.
        </p>

        <a href="/">
          Back to the nonsense
        </a>
      </main>
    );
  }


  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <a
            className="admin-brand"
            href="/admin"
          >
            <span>
              R
            </span>

            <strong>
              ROFFLE ADMIN
            </strong>
          </a>

          <a
            className="admin-back-link"
            href="/"
          >
            <ArrowLeft
              size={14}
            />

            Back to ROFFLE
          </a>
        </div>
      </header>

      <div className="admin-shell">
        <aside className="admin-nav">
          <button
            className={
              tab ===
                "dashboard"
                ? "active"
                : ""
            }
            onClick={() => {
              setTab(
                "dashboard"
              );
            }}
          >
            <ShieldCheck
              size={16}
            />

            Dashboard
          </button>

          <button
            className={
              tab ===
                "moderation"
                ? "active"
                : ""
            }
            onClick={() => {
              setTab(
                "moderation"
              );
            }}
          >
            <FileClock
              size={16}
            />

            Moderation

            {stats &&
              stats.pending_posts >
                0 && (
              <span className="admin-nav-count">
                {stats.pending_posts}
              </span>
            )}
          </button>

          {access.role ===
            "admin" && (
            <button
              className={
                tab ===
                  "users"
                  ? "active"
                  : ""
              }
              onClick={() => {
                setTab(
                  "users"
                );
              }}
            >
              <Users
                size={16}
              />

              Users
            </button>
          )}
        </aside>

        <main className="admin-content">
          {error && (
            <div className="admin-error">
              {error}
            </div>
          )}

          {tab ===
            "dashboard" && (
            <>
              <div className="admin-page-title">
                <span className="admin-eyebrow">
                  ROFFLE CONTROL ROOM
                </span>

                <h1>
                  Dashboard
                </h1>
              </div>

              <div className="admin-stat-grid">
                <div className="admin-stat">
                  <span>
                    Users
                  </span>

                  <strong>
                    {stats?.total_users ??
                      0}
                  </strong>
                </div>

                <div className="admin-stat">
                  <span>
                    Posts
                  </span>

                  <strong>
                    {stats?.total_posts ??
                      0}
                  </strong>
                </div>

                <div className="admin-stat attention">
                  <span>
                    Pending
                  </span>

                  <strong>
                    {stats?.pending_posts ??
                      0}
                  </strong>
                </div>

                <div className="admin-stat">
                  <span>
                    Approved
                  </span>

                  <strong>
                    {stats?.approved_posts ??
                      0}
                  </strong>
                </div>
              </div>

              <div className="admin-dashboard-queue">
                <ModerationQueue
                  limit={5}
                  onChanged={() => {
                    void refreshStats();
                  }}
                  onViewAll={() => {
                    setTab(
                      "moderation"
                    );
                  }}
                />
              </div>
            </>
          )}

          {tab ===
            "moderation" && (
            <ModerationQueue
              onChanged={() => {
                void refreshStats();
              }}
            />
          )}

          {tab ===
            "users" &&
            access.role ===
              "admin" && (
            <AdminUsers />
          )}
        </main>
      </div>
    </div>
  );
}
