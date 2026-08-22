import { lazy, Suspense } from "react";

import "./AppSelector.css";

const AppV1 = lazy(() => import("./AppV1"));
const AppV2 = lazy(() => import("./AppV2"));

function PrototypeLoading() {
  return (
    <main className="prototype-loading">
      <span>Loading ROFFLE...</span>
    </main>
  );
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const version = params.get("v")?.toLowerCase();

  if (version === "1" || version === "v1") {
    return (
      <Suspense fallback={<PrototypeLoading />}>
        <AppV1 />
      </Suspense>
    );
  }

  if (version === "2" || version === "v2") {
    return (
      <Suspense fallback={<PrototypeLoading />}>
        <AppV2 />
      </Suspense>
    );
  }

  return (
    <main className="prototype-selector">
      <section className="prototype-panel">
        <div className="prototype-brand">
          <span className="prototype-mark">R</span>
          <span>ROFFLE</span>
        </div>

        <div className="prototype-heading">
          <span>PROTOTYPE BUILDS</span>
          <h1>Choose a version.</h1>
          <p>
            Both concepts are preserved independently so V2 can keep moving
            without touching the original prototype.
          </p>
        </div>

        <div className="prototype-options">
          <a className="prototype-option" href="?v=1">
            <span className="prototype-index">01</span>
            <div>
              <strong>ROFFLE V1</strong>
              <span>Original prototype</span>
            </div>
            <span className="prototype-arrow" aria-hidden="true">
              →
            </span>
          </a>

          <a className="prototype-option prototype-option-primary" href="?v=2">
            <span className="prototype-index">02</span>
            <div>
              <strong>ROFFLE V2</strong>
              <span>Modern redesign</span>
            </div>
            <span className="prototype-arrow" aria-hidden="true">
              →
            </span>
          </a>
        </div>

        <p className="prototype-paths">
          Direct links: <code>?v=1</code> and <code>?v=2</code>
        </p>
      </section>
    </main>
  );
}

export default App;
