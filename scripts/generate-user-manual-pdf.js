const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Grand Azure Ops — Enterprise User Manual v3.0</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

    @page {
      size: A4;
      margin: 16mm 14mm 16mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.55;
      font-size: 9.5pt;
    }

    .page-break {
      page-break-before: always;
    }

    /* Cover Page */
    .cover-page {
      height: 100vh;
      min-height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 20mm 15mm;
      background: linear-gradient(135deg, #020617 0%, #0f172a 60%, #1e1b4b 100%);
      color: #ffffff;
      border-radius: 6px;
    }

    .cover-badge {
      display: inline-block;
      padding: 4px 14px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #34d399;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      border-radius: 9999px;
      margin-bottom: 12px;
    }

    .cover-title {
      font-size: 32pt;
      font-weight: 800;
      line-height: 1.15;
      color: #ffffff;
      letter-spacing: -0.03em;
      margin-bottom: 12px;
    }

    .cover-subtitle {
      font-size: 13pt;
      color: #94a3b8;
      font-weight: 400;
      max-width: 85%;
      line-height: 1.4;
      margin-bottom: 25px;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 16px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      margin-top: 20px;
    }

    .cover-meta-item label {
      display: block;
      font-size: 7.5pt;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.05em;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .cover-meta-item span {
      font-size: 9pt;
      color: #e2e8f0;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
    }

    .cover-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 12px;
      font-size: 8pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }

    /* Content Layout */
    .header-bar {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 6px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .header-bar .doc-title {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      color: #64748b;
    }

    .header-bar .page-tag {
      font-size: 8pt;
      font-family: 'JetBrains Mono', monospace;
      color: #059669;
      font-weight: 700;
    }

    h1 {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }

    h2 {
      font-size: 12pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 14px;
      margin-bottom: 6px;
      border-left: 3.5px solid #10b981;
      padding-left: 8px;
    }

    h3 {
      font-size: 10pt;
      font-weight: 600;
      color: #334155;
      margin-top: 10px;
      margin-bottom: 4px;
    }

    p {
      margin-bottom: 8px;
      color: #334155;
    }

    /* Callout Boxes */
    .callout {
      border-radius: 6px;
      padding: 10px 12px;
      margin: 10px 0;
      font-size: 8.5pt;
      border-left: 3.5px solid;
    }

    .callout-info {
      background: #f0fdf4;
      border-color: #10b981;
      color: #065f46;
    }

    .callout-alert {
      background: #fef2f2;
      border-color: #ef4444;
      color: #991b1b;
    }

    .callout-warn {
      background: #fffbeb;
      border-color: #f59e0b;
      color: #92400e;
    }

    .callout-indigo {
      background: #eef2ff;
      border-color: #6366f1;
      color: #3730a3;
    }

    .callout-title {
      font-weight: 700;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px 0;
      font-size: 8pt;
    }

    th {
      background: #0f172a;
      color: #ffffff;
      text-align: left;
      padding: 6px 8px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.04em;
    }

    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 4px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      font-family: 'JetBrains Mono', monospace;
    }

    .badge-green { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-rose { background: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3; }
    .badge-indigo { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }

    /* Wireframe ASCII Box */
    .wireframe-box {
      background: #020617;
      color: #94a3b8;
      font-family: 'JetBrains Mono', monospace;
      font-size: 6.8pt;
      line-height: 1.25;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid #1e293b;
      margin: 8px 0;
      white-space: pre;
      overflow-x: hidden;
    }

    .wireframe-box .hl-white { color: #f8fafc; font-weight: 700; }
    .wireframe-box .hl-emerald { color: #34d399; font-weight: 700; }
    .wireframe-box .hl-amber { color: #fbbf24; font-weight: 700; }
    .wireframe-box .hl-rose { color: #fb7185; font-weight: 700; }

    /* Key Value Grid */
    .feature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 8px 0;
    }

    .feature-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px;
    }

    .feature-card h4 {
      font-size: 8.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .feature-card p {
      font-size: 7.8pt;
      color: #475569;
      margin: 0;
      line-height: 1.35;
    }

    ul, ol {
      margin-left: 18px;
      margin-bottom: 8px;
    }

    li {
      margin-bottom: 3px;
      font-size: 8.5pt;
    }
  </style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover-page">
    <div>
      <div class="cover-badge">Enterprise Edition • Version 3.0</div>
      <div class="cover-title">Grand Azure Operations Platform</div>
      <div class="cover-subtitle">
        Comprehensive Technical User Manual, Operator Guide & Interactive Feature Blueprint
      </div>

      <div class="cover-meta-grid">
        <div class="cover-meta-item">
          <label>Product Domain</label>
          <span>Multi-Tenant Hotel SaaS</span>
        </div>
        <div class="cover-meta-item">
          <label>Lead Engineering Ownership</label>
          <span>Member 3: Operations & Control</span>
        </div>
        <div class="cover-meta-item">
          <label>Operational Surfaces</label>
          <span>8 Core Screens + 2 Auxiliary Pages</span>
        </div>
        <div class="cover-meta-item">
          <label>Security & Tenancy</label>
          <span>Zero-Trust RLS / Integer Minor Units</span>
        </div>
        <div class="cover-meta-item">
          <label>Hardware Telemetry</label>
          <span>Web Audio Synthesizer / Web Push</span>
        </div>
        <div class="cover-meta-item">
          <label>Live Local URL</label>
          <span>http://localhost:3000</span>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>Confidential • Internal Hotel Operations & Control Blueprint</div>
      <div>Designed for 24/7 Hospitality Touchscreens & Executive Control</div>
    </div>
  </div>

  <!-- ==================== SECTION 1: EXECUTIVE OVERVIEW & ARCHITECTURE ==================== -->
  <div class="page-break"></div>
  <div class="header-bar">
    <span class="doc-title">Section 1: Architecture & Engineering Mandate</span>
    <span class="page-tag">OVERVIEW</span>
  </div>

  <h1>1. Executive Summary & Engineering Architecture</h1>
  <p>
    The <strong>Grand Azure Operations Platform</strong> is an enterprise-grade, zero-lag SaaS built for modern hotel staff, department supervisors, executive general managers, and multi-tenant platform administrators.
  </p>

  <div class="callout callout-info">
    <div class="callout-title">Three Uncompromising Engineering Pillars</div>
    <strong>1. Default Dark Mode &amp; High-Contrast Ergonomics:</strong> Built on a <code>slate-950</code> base with <code>slate-900</code> cards and subtle <code>slate-800</code> borders. Minimum touch targets are 48px to 52px for gloved or wet kitchen fingers.<br>
    <strong>2. Zero-Trust Security &amp; Currency Safety:</strong> The client <em>never</em> computes prices, taxes, or discounts. All monetary figures are rendered from server-returned integer paise. Cross-tenant access attempts are strictly blocked by PostgreSQL Row-Level Security (RLS) and gracefully render a branded 403 Access Denied state.<br>
    <strong>3. Anti-Lag &amp; Real-Time Telemetry:</strong> Kitchen and housekeeping queues update in &lt; 1.0 second via scoped WebSockets (<code>hotel:{id}:dept:{dept}</code>). Optimistic UI allows instant feedback with conflict collision rollback.
  </div>

  <h2>System Architecture & Directory Blueprint</h2>
  <table>
    <thead>
      <tr>
        <th>Module / Route</th>
        <th>Screen Identity</th>
        <th>Target Persona</th>
        <th>Core Technology</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>app/(staff)/kitchen</code></td>
        <td>Screen 1: Kitchen Display (KDS)</td>
        <td>Line Cook, Sous Chef, Expediter</td>
        <td>Web Audio Synth, Horizontal Ticket Rail</td>
      </tr>
      <tr>
        <td><code>app/(staff)/desk</code></td>
        <td>Screen 2: Front Desk &amp; Billing</td>
        <td>Front Desk Agent, Night Auditor</td>
        <td>TanStack Table, Server Paise Ledger</td>
      </tr>
      <tr>
        <td><code>app/(staff)/housekeeping</code></td>
        <td>Screen 3: Housekeeping Matrix</td>
        <td>Housekeeping Lead, Floor Attendants</td>
        <td>Room Turnover Grid, Dispatch Queue</td>
      </tr>
      <tr>
        <td><code>app/(staff)/device</code></td>
        <td>Screen 4: Device &amp; Web Push</td>
        <td>IT Lead, Shift Operators</td>
        <td>VAPID RFC-8292, PIN Fast Switch</td>
      </tr>
      <tr>
        <td><code>app/(admin)/manager</code></td>
        <td>Screen 5: Manager Dashboard</td>
        <td>General Manager, Ops Director</td>
        <td>Zero-Dep SVG Charts, P0 SLA Radar</td>
      </tr>
      <tr>
        <td><code>app/(admin)/hotel</code></td>
        <td>Screen 6: Hotel Admin Config</td>
        <td>Hotel GM, IT Administrator</td>
        <td>Menu Catalog, Instant Zod Validation</td>
      </tr>
      <tr>
        <td><code>app/(admin)/platform</code></td>
        <td>Screen 7: Platform Admin (SaaS)</td>
        <td>Platform SuperAdmin</td>
        <td>Break-Glass Session, Typed Suspension</td>
      </tr>
      <tr>
        <td><code>app/(admin)/audit</code></td>
        <td>Screen 8: Immutable Audit Log</td>
        <td>Platform Auditor, Security Lead</td>
        <td>Append-Only Log, Monospace JSON Viewer</td>
      </tr>
      <tr>
        <td><code>app/(marketing)/pricing</code></td>
        <td>Auxiliary 1: Pricing Page</td>
        <td>Prospective Hotel Clients</td>
        <td>Tier Matrix, Room ROI Calculator</td>
      </tr>
      <tr>
        <td><code>app/(admin)/reports</code></td>
        <td>Auxiliary 2: Reports &amp; Exports</td>
        <td>General Manager, Dept Heads</td>
        <td>Throughput Analytics, CSV &amp; JSON Engine</td>
      </tr>
    </tbody>
  </table>

  <h2>The 8 Shared Ops-Kit Components</h2>
  <div class="feature-grid">
    <div class="feature-card">
      <h4>1. DataTable (Virtualized)</h4>
      <p>Sticky headers, multi-column sorting, text search, pagination, and built-in 403 access error handling.</p>
    </div>
    <div class="feature-card">
      <h4>2. SlaBadge (Dynamic Pulse)</h4>
      <p>Emerald (&gt;5m), soft amber pulse (&le;5m), and high-visibility rose ping when SLA is breached.</p>
    </div>
    <div class="feature-card">
      <h4>3. PremiumDialog (Modal)</h4>
      <p>Glassmorphic backdrop blur, focus-trapping, and Escape key listeners for adjustments and PIN switching.</p>
    </div>
    <div class="feature-card">
      <h4>4. KpiTile (Metric Card)</h4>
      <p>Dense metric cards with subtle gradient glow, loading skeleton state, and percentage trend delta pills.</p>
    </div>
    <div class="feature-card">
      <h4>5. QueueListItem</h4>
      <p>Draggable/tap ticket card with bold allergen tags, special guest notes, and 52px touch-friendly action buttons.</p>
    </div>
    <div class="feature-card">
      <h4>6. AnimatedSvgChart</h4>
      <p>Pure zero-dependency SVG bezier curve and horizontal benchmark bars keeping JS bundle &lt; 150KB.</p>
    </div>
    <div class="feature-card">
      <h4>7. TabNavigation</h4>
      <p>Smooth animated underline indicator, count badge bubbles, and instant client-side routing.</p>
    </div>
    <div class="feature-card">
      <h4>8. EmptyErrorState</h4>
      <p>Branded states for "no-orders", "access-denied" (Zero-Trust 403), "offline", and "application-error".</p>
    </div>
  </div>

  <!-- ==================== SECTION 2: SCREEN 1 KITCHEN DISPLAY ==================== -->
  <div class="page-break"></div>
  <div class="header-bar">
    <span class="doc-title">Section 2: Staff Operations</span>
    <span class="page-tag">SCREEN 1</span>
  </div>

  <h1>Screen 1: Kitchen Display System (KDS)</h1>
  <p><strong>Route:</strong> <code>app/(staff)/kitchen/page.tsx</code> | <strong>Channel:</strong> <code>hotel:{id}:dept:kitchen</code></p>
  <p>
    The Kitchen Display System replaces obsolete paper printers with an ultra-responsive, touch-friendly horizontal rail. Optimized for line cooks and expediters under high-stress, greasy environments.
  </p>

  <div class="wireframe-box">
<span class="hl-white">KITCHEN WORKSPACE</span>         [Station: All v]  [Filter: Active v]  <span class="hl-emerald">[SOUND: ON]</span>  [12:44:18 PM]
STATS: Pending: 1 | Preparing: 2 | Ready for Pickup: 1 | Avg Prep: 11m 40s
+-------------------------+ +-------------------------+ +-------------------------+
| <span class="hl-white">TICKET #0421    Rm: 402</span> | | <span class="hl-white">TICKET #0422    Rm: 118</span> | | <span class="hl-white">TICKET #0420    Rm: 305</span> |
| Placed: 3m ago          | | Placed: 6m ago          | | Placed: 18m ago         |
| <span class="hl-emerald">[SLA: 12m left - GREEN]</span> | | <span class="hl-amber">[SLA: 4m left - AMBER]</span>  | | <span class="hl-rose">[SLA: BREACHED - ROSE]</span>  |
| • 2x Truffle Risotto    | | • 1x Wagyu Burger       | | • 2x Club Sandwich      |
|   <span class="hl-rose">[ALLERGY: Dairy]</span>      | |   - Medium Rare, Fries  | |   - Extra mayo          |
| • 1x Sparkling Water    | | • 1x Diet Coke (Chilled)| | • 2x Fresh Orange Juice |
| Note: Guest anniversary | |                         | | Note: Urgent VIP Guest  |
| <span class="hl-emerald">[ACCEPT ORDER (Tap/Spc)]</span>| | <span class="hl-amber">[START PREP (Cook Line)]</span>| | <span class="hl-white">[MARK READY / CHIME]</span>    |
| [Reject / Hold]         | | [Print Kitchen Slip]    | | [Call Runner Alert]     |
+-------------------------+ +-------------------------+ +-------------------------+
  </div>

  <h2>Step-by-Step Operator Instructions</h2>
  <ol>
    <li>
      <strong>Incoming Ticket Audio Alert:</strong> When a guest submits an order via QR, the Web Audio engine synthesizes a D5 $\rightarrow$ A5 chime. The card animates onto the rail within 1 second.
    </li>
    <li>
      <strong>Accepting an Order:</strong> Tap the large <code>[ACCEPT ORDER]</code> button (or press Space on physical desktop). The status badge changes to <em>Preparing</em> and the order assigns to your station.
    </li>
    <li>
      <strong>Allergen Safety Protocol:</strong> Any dish with allergens renders bold, high-contrast badges (e.g. <code>ALLERGY: Dairy</code>). Never clear a ticket until dietary modifiers are fulfilled.
    </li>
    <li>
      <strong>Marking Ready for Runner:</strong> Tapping <code>[MARK READY / CHIME]</code> signals the guest timeline and triggers a notification for the floor runner to expedite delivery.
    </li>
    <li>
      <strong>Concurrency Collision Protocol (409 Conflict):</strong> If two cooks tap Accept at the exact same moment, the server locks the row for Cook A. Cook B's interface instantly rolls back with a distinct warning tone and displays a toast: <em>"Order #0421 was already accepted by Chef Marco"</em>.
    </li>
  </ol>

  <!-- ==================== SECTION 3: SCREEN 2 FRONT DESK ==================== -->
  <div class="page-break"></div>
  <div class="header-bar">
    <span class="doc-title">Section 3: Staff Operations</span>
    <span class="page-tag">SCREEN 2</span>
  </div>

  <h1>Screen 2: Front Desk &amp; Billing Screen</h1>
  <p><strong>Route:</strong> <code>app/(staff)/desk/page.tsx</code> | <strong>Primary Persona:</strong> Front Desk Agent, Night Auditor</p>
  <p>
    Provides the central hub for in-house guest folios, active stay tokens, room assignments, and immutable billing settlement.
  </p>

  <h2>Active Stays Ledger (TanStack Table)</h2>
  <table>
    <thead>
      <tr>
        <th>Room</th>
        <th>Guest Name</th>
        <th>Stay Window</th>
        <th>Folio Balance (Server Paise)</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>#101</code></td>
        <td><strong>Elena Rostova</strong></td>
        <td>24 Sep &rarr; 28 Sep</td>
        <td><strong>₹18,450.00</strong> (1,845,000 paise)</td>
        <td><span class="badge badge-green">Checked In</span></td>
        <td>[View Folio]</td>
      </tr>
      <tr>
        <td><code>#102</code></td>
        <td>David Chen</td>
        <td>26 Sep &rarr; 27 Sep</td>
        <td><strong>₹3,200.00</strong> (320,000 paise)</td>
        <td><span class="badge badge-amber">Active Due</span></td>
        <td>[View Folio]</td>
      </tr>
      <tr>
        <td><code>#204</code></td>
        <td>Sarah Jenkins <span class="badge badge-amber">VIP</span></td>
        <td>22 Sep &rarr; 26 Sep</td>
        <td><strong>₹44,800.00</strong> (4,480,000 paise)</td>
        <td><span class="badge badge-rose">Check-Out</span></td>
        <td>[Settle Bill]</td>
      </tr>
      <tr>
        <td><code>#305</code></td>
        <td>Michael Vance</td>
        <td>25 Sep &rarr; 29 Sep</td>
        <td><strong>₹0.00</strong> (0 paise)</td>
        <td><span class="badge badge-indigo">Clean Ready</span></td>
        <td>[Assign Room]</td>
      </tr>
    </tbody>
  </table>

  <h2>Selected Folio Inspection &amp; Manual Adjustment Modal</h2>
  <div class="callout callout-indigo">
    <div class="callout-title">Financial Rule of Zero-Trust</div>
    The client <strong>never</strong> calculates money or taxes. All amounts are rendered strictly from server-computed integer minor units (paise). 1 Rupee = 100 paise. When an adjustment is made, the server validates limits (&le; ₹50,000) and writes an immutable record to the audit ledger.
  </div>

  <h3>How to Perform a Signed Manual Folio Adjustment</h3>
  <ol>
    <li>Select a stay from the table (e.g. Room 101 - Elena Rostova).</li>
    <li>Click <strong><code>[+ MANUAL ADJUSTMENT]</code></strong> to trigger the glassmorphic modal.</li>
    <li>Select <strong>Credit / Discount (-)</strong> or <strong>Extra Charge (+)</strong>.</li>
    <li>Enter the INR amount (e.g. <code>500.00</code>). The server paise value (<code>50,000 paise</code>) calculates dynamically.</li>
    <li>Select a Reason Category (e.g. <em>Service Recovery (Delay)</em>) and enter a mandatory audit note (&ge; 10 characters).</li>
    <li>Input the <strong>Manager Override Key</strong> (Demo code: <code>9999</code> or <code>1234</code>) and click <strong>[Confirm &amp; Sign Entry]</strong>.</li>
    <li>The folio balance updates and an immutable entry is added to the system audit trail with your Staff ID.</li>
  </ol>

  <!-- ==================== SECTION 4: SCREEN 3 HOUSEKEEPING ==================== -->
  <div class="page-break"></div>
  <div class="header-bar">
    <span class="doc-title">Section 4: Staff Operations</span>
    <span class="page-tag">SCREEN 3</span>
  </div>

  <h1>Screen 3: Housekeeping Matrix &amp; Room Board</h1>
  <p><strong>Route:</strong> <code>app/(staff)/housekeeping/page.tsx</code> | <strong>Primary Persona:</strong> Housekeeping Supervisor, Floor Attendant</p>
  <p>
    Provides a real-time room cleanliness matrix across hotel floors, maintenance work order alerts, and an active guest service dispatch queue.
  </p>

  <h2>Cleanliness States &amp; Tap Transition Workflow</h2>
  <table>
    <thead>
      <tr>
        <th>Status</th>
        <th>Badge Color</th>
        <th>Meaning</th>
        <th>Available Action</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>DIRTY</code></td>
        <td><span class="badge badge-amber">DIRTY</span></td>
        <td>Guest checked out or morning turnover pending</td>
        <td><strong>[Start Cleaning]</strong> &rarr; Moves to CLEANING</td>
      </tr>
      <tr>
        <td><code>CLEANING</code></td>
        <td><span class="badge badge-indigo">CLEANING</span></td>
        <td>Attendant actively inside room working</td>
        <td><strong>[Mark Clean]</strong> &rarr; Moves to CLEAN</td>
      </tr>
      <tr>
        <td><code>CLEAN</code></td>
        <td><span class="badge badge-green">CLEAN</span></td>
        <td>Turnover finished, awaiting supervisor audit</td>
        <td><strong>[Inspect / OK]</strong> &rarr; Moves to INSPECTED</td>
      </tr>
      <tr>
        <td><code>INSPECTED</code></td>
        <td><span class="badge badge-green">INSPECTED</span></td>
        <td>Supervisor verified white-glove inspection</td>
        <td><strong>[Set Available]</strong> &rarr; Ready for Check-In</td>
      </tr>
      <tr>
        <td><code>OOO</code></td>
        <td><span class="badge badge-rose">OOO</span></td>
        <td>Out of Order / Engineering maintenance flag</td>
        <td><strong>[View Work Order]</strong> &rarr; Technician dispatched</td>
      </tr>
    </tbody>
  </table>

  <h2>Housekeeping Service Dispatch Queue</h2>
  <p>
    Guest requests for extra items (towels, feather pillows, baby cribs) appear in the bottom dispatch rail with dynamic SLA countdown timers:
  </p>
  <ul>
    <li><strong>Room 304 (Extra Towels):</strong> <code>SLA BREACHED (6m ago)</code> &bull; Priority: Critical &bull; Action: <code>[ASSIGN TO ME]</code></li>
    <li><strong>Room 206 (3x Feather Pillows):</strong> <code>SLA: 11m left [AMBER]</code> &bull; Action: <code>[ASSIGN TO ME]</code></li>
    <li><strong>Room 402 (Baby Crib):</strong> <code>SLA: 29m left [GREEN]</code> &bull; Assigned to Rosa M &bull; Action: <code>[MARK FULFILLED]</code></li>
  </ul>

  <!-- ==================== SECTION 5: SCREEN 4 DEVICE SETUP ==================== -->
  <div class="page-break"></div>
  <div class="header-bar">
    <span class="doc-title">Section 5: Staff Operations</span>
    <span class="page-tag">SCREEN 4</span>
  </div>

  <h1>Screen 4: Device &amp; Shared Tablet Setup</h1>
  <p><strong>Route:</strong> <code>app/(staff)/device/page.tsx</code> | <strong>Primary Persona:</strong> IT Administrator, Shift Leads</p>
  <p>
    Manages station hardware profiles, Web Push notification keys (VAPID RFC-8292), Apple iOS Safari PWA compliance, and rapid PIN-based shift handovers.
  </p>

  <h2>Shared Tablet PIN Quick Switch Protocol</h2>
  <div class="callout callout-warn">
    <div class="callout-title">Multi-Shift Ergonomics</div>
    Hotel wall tablets are shared by multiple staff across shifts. Operators never need to type cumbersome email and password combinations. Switching is accomplished in under 3 seconds using a 4-digit PIN.
  </div>

  <table>
    <thead>
      <tr>
        <th>Staff Operator</th>
        <th>Department</th>
        <th>Station Assignment</th>
        <th>Default Demo PIN</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Marcus Vance</strong></td>
        <td>Kitchen (F&amp;B)</td>
        <td>Hot Line #2 (Expediter)</td>
        <td><code>1234</code></td>
      </tr>
      <tr>
        <td><strong>Chef Marco Pierre</strong></td>
        <td>Kitchen (F&amp;B)</td>
        <td>Grill Station #1</td>
        <td><code>5566</code></td>
      </tr>
      <tr>
        <td><strong>Elena Garcia</strong></td>
        <td>Front Desk</td>
        <td>Front Desk Counter 1</td>
        <td><code>4321</code></td>
      </tr>
      <tr>
        <td><strong>David Chen</strong></td>
        <td>Front Desk</td>
        <td>Night Operations Deck</td>
        <td><code>7788</code></td>
      </tr>
      <tr>
        <td><strong>Rosa Martinez</strong></td>
        <td>Housekeeping</td>
        <td>Floor 2 &amp; 3 Supervisor</td>
        <td><code>2345</code></td>
      </tr>
      <tr>
        <td><strong>Juan Kim</strong></td>
        <td>Housekeeping</td>
        <td>Floor 2 West</td>
        <td><code>6789</code></td>
      </tr>
      <tr>
        <td><strong>Arthur Pendelton</strong></td>
        <td>Executive Admin</td>
        <td>General Manager Suite</td>
        <td><code>9999</code></td>
      </tr>
    </tbody>
  </table>

  <h2>Apple iOS Safari Web Push Compliance Checklist</h2>
  <ol>
    <li><strong>Step 1:</strong> Open Grand Azure URL in Apple Mobile Safari.</li>
    <li><strong>Step 2:</strong> Tap the iOS Share icon &rarr; select <strong>"Add to Home Screen"</strong>.</li>
    <li><strong>Step 3:</strong> Launch the app from the newly created Home Screen icon (detects standalone window mode).</li>
    <li><strong>Step 4:</strong> Tap <strong>"Enable Push Notifications"</strong> and accept the native iOS permission prompt.</li>
    <li><strong>Fallback Heartbeat:</strong> If push connection drops, the application automatically initiates a 5,000ms background polling fallback loop.</li>
  </ol>

  <!-- ==================== SECTION 6: SCREEN 5 MANAGER DASHBOARD ==================== -->
  <div class="page-break"></div>
  <div class="header-bar">
    <span class="doc-title">Section 6: Executive Control Plane</span>
    <span class="page-tag">SCREEN 5</span>
  </div>

  <h1>Screen 5: Manager Dashboard &amp; SLA Radar</h1>
  <p><strong>Route:</strong> <code>app/(admin)/manager/page.tsx</code> | <strong>Primary Persona:</strong> General Manager, Operations Director</p>
  <p>
    Provides high-density operational telemetry, an automated P0 SLA escalation radar, and lightweight pure SVG analytical charts.
  </p>

  <h2>Executive Key Performance Indicators (KPIs)</h2>
  <div class="feature-grid">
    <div class="feature-card">
      <h4>Average Response Time: 4m 12s</h4>
      <p><span class="badge badge-green">-18.4% vs Yesterday</span> &bull; Well under the 5m 00s operational standard target.</p>
    </div>
    <div class="feature-card">
      <h4>Active SLA Alerts: 2 Critical</h4>
      <p><span class="badge badge-rose">Requires Action</span> &bull; Tasks unassigned beyond configured threshold.</p>
    </div>
    <div class="feature-card">
      <h4>Orders Processed: 184 Orders</h4>
      <p><span class="badge badge-green">+12.5%</span> &bull; 98.2% on-time fulfillment rate across line stations.</p>
    </div>
    <div class="feature-card">
      <h4>Today's Ops Revenue: ₹2,48,920.00</h4>
      <p><span class="badge badge-indigo">Server Minor Units</span> &bull; Aggregated from 41 active guest stay folios.</p>
    </div>
  </div>

  <h2>Critical SLA Escalation Radar (P0 Interventions)</h2>
  <p>
    When a front-line task is ignored past its SLA threshold, the system scheduler escalates it directly to the Manager Radar:
  </p>
  <table>
    <thead>
      <tr>
        <th>Target Room</th>
        <th>Escalation Description</th>
        <th>Overdue</th>
        <th>Root Cause</th>
        <th>Manager Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>Room 304</code></td>
        <td>Extra Towels &amp; Cold Water</td>
        <td><span class="badge badge-rose">+6m Overdue</span></td>
        <td>No staff accepted within 10m SLA window</td>
        <td><strong>[Reassign to Rosa M]</strong> &bull; <strong>[Call Desk]</strong> &bull; <strong>[Dismiss (Reason)]</strong></td>
      </tr>
      <tr>
        <td><code>Room 102</code></td>
        <td>In-Room Dining #0412</td>
        <td><span class="badge badge-amber">2m Left</span></td>
        <td>Preparation time exceeding 80% SLA window</td>
        <td><strong>[Expedite Priority]</strong></td>
      </tr>
    </tbody>
  </table>

  <h2>Zero-Dependency Pure SVG Chart Engine</h2>
  <p>
    To preserve our <em>Anti-Lag Mandate</em> and prevent heavy charting JavaScript bundles (&gt;400KB), all telemetry visuals are rendered using pure SVG:
  </p>
  <ul>
    <li><strong>Hourly Service Volume Curve (08:00 - 24:00):</strong> A responsive cubic bezier spline (<code>M... C...</code>) with smooth gradients and interactive hover tooltips.</li>
    <li><strong>Department Velocity Benchmarks:</strong> Horizontal comparison bars showing actual performance vs target goals (Front Desk: 2.1m vs 3.0m goal; Kitchen: 11.4m vs 15.0m goal).</li>
  </ul>

  <!-- ==================== SECTION 7: SCREEN 6 HOTEL ADMIN ==================== -->
  <div class="page-break"></div>
  <div class="header-bar">
    <span class="doc-title">Section 7: Executive Control Plane</span>
    <span class="page-tag">SCREEN 6</span>
  </div>

  <h1>Screen 6: Hotel Admin &amp; Catalog Config</h1>
  <p><strong>Route:</strong> <code>app/(admin)/hotel/page.tsx</code> | <strong>Primary Persona:</strong> Hotel General Manager, IT Administrator</p>
  <p>
    Allows configuring hotel inventory topologies, dining menu catalogs with instant Zod schema validation, and staff invitation tokens.
  </p>

  <h2>Menu Catalog Manager</h2>
  <table>
    <thead>
      <tr>
        <th>Dish / Beverage</th>
        <th>Category</th>
        <th>Server Price (Paise / INR)</th>
        <th>Station Target</th>
        <th>Availability</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Truffle Tagliolini</strong></td>
        <td>Mains</td>
        <td><code>125,000</code> / ₹1,250.00</td>
        <td>Pasta &amp; Sauté #1 (18m SLA)</td>
        <td><span class="badge badge-green">Available</span></td>
      </tr>
      <tr>
        <td><strong>Wagyu Sliders (3pcs)</strong></td>
        <td>Starters</td>
        <td><code>95,000</code> / ₹950.00</td>
        <td>Grill Station #1 (14m SLA)</td>
        <td><span class="badge badge-green">Available</span></td>
      </tr>
      <tr>
        <td><strong>Tiramisu Classico</strong></td>
        <td>Desserts</td>
        <td><code>45,000</code> / ₹450.00</td>
        <td>Pastry &amp; Cold Prep (8m SLA)</td>
        <td><span class="badge badge-amber">Disabled</span></td>
      </tr>
      <tr>
        <td><strong>Sparkling San Pellegrino</strong></td>
        <td>Beverages</td>
        <td><code>35,000</code> / ₹350.00</td>
        <td>Beverage Bar (5m SLA)</td>
        <td><span class="badge badge-green">Available</span></td>
      </tr>
      <tr>
        <td><strong>Late Night Artisan Pizza</strong></td>
        <td>Late Night</td>
        <td><code>85,000</code> / ₹850.00</td>
        <td>Pizza Hearth (15m SLA)</td>
        <td><span class="badge badge-green">Available</span></td>
      </tr>
    </tbody>
  </table>

  <h2>Instant Client-Side Zod Validation</h2>
  <div class="callout callout-info">
    <div class="callout-title">Validation Contract (modules/ops/schema.ts)</div>
    When adding or editing a menu item, the form executes <code>MenuItemSchema.safeParse(...)</code> prior to network submission. Invalid character counts, negative numbers, or missing station routing are caught instantly with zero round-trip latency.
  </div>

  <!-- ==================== SECTION 8: SCREEN 7 PLATFORM ADMIN ==================== -->
  <div class="page-break"></div>
  <div class="header-bar">
    <span class="doc-title">Section 8: SaaS Control Plane</span>
    <span class="page-tag">SCREEN 7</span>
  </div>

  <h1>Screen 7: Platform Admin (SaaS Control Plane)</h1>
  <p><strong>Route:</strong> <code>app/(admin)/platform/page.tsx</code> | <strong>Primary Persona:</strong> Platform SuperAdmin (<code>sys_lead@saas.com</code>)</p>
  <p>
    Provides global oversight across all tenant properties, plan quotas, usage consumption, break-glass support sessions, and tenant suspension.
  </p>

  <h2>Registered Hotel Tenants</h2>
  <table>
    <thead>
      <tr>
        <th>Tenant ID</th>
        <th>Hotel Property Name</th>
        <th>Plan Tier</th>
        <th>Rooms</th>
        <th>Active Stays</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>h_901</code></td>
        <td><strong>Grand Azure Resort &amp; Spa</strong></td>
        <td>Enterprise</td>
        <td>180</td>
        <td>142 Stays</td>
        <td><span class="badge badge-green">ACTIVE</span></td>
      </tr>
      <tr>
        <td><code>h_902</code></td>
        <td><strong>The Palm Heritage Boutique</strong></td>
        <td>Boutique</td>
        <td>45</td>
        <td>38 Stays</td>
        <td><span class="badge badge-green">ACTIVE</span></td>
      </tr>
      <tr>
        <td><code>h_903</code></td>
        <td><strong>Alpine Vista Chalet</strong></td>
        <td>Standard</td>
        <td>28</td>
        <td>4 Stays</td>
        <td><span class="badge badge-green">ACTIVE</span></td>
      </tr>
      <tr>
        <td><code>h_904</code></td>
        <td><strong>Metro Boutique Suites</strong></td>
        <td>Trial</td>
        <td>15</td>
        <td>0 Stays</td>
        <td><span class="badge badge-rose">SUSPENDED</span></td>
      </tr>
    </tbody>
  </table>

  <h2>Break-Glass Support Sessions &amp; Tenant Suspension</h2>
  <div class="callout callout-alert">
    <div class="callout-title">Destructive Action Confirmation Protocol</div>
    Suspending a hotel property immediately invalidates all active staff JWTs and rejects guest ordering channels. To prevent accidental disruption, the platform enforces typed confirmation: the operator must explicitly enter <code>SUSPEND &lt;tenant_id&gt;</code> before the button unlocks.
  </div>
  <ul>
    <li><strong>15-Minute Support Impersonation:</strong> Generates a cryptographically signed, time-limited JWT session for diagnostics. The event is watermarked and permanently logged to the system audit trail.</li>
    <li><strong>Tenant Suspension:</strong> Sets the tenant status to <code>SUSPENDED</code> and writes a <code>tenant.suspended</code> audit log entry.</li>
  </ul>

  <!-- ==================== SECTION 9: SCREEN 8 AUDIT LOG & AUXILIARY PAGES ==================== -->
  <div class="page-break"></div>
  <div class="header-bar">
    <span class="doc-title">Section 9: Compliance & Auxiliary Surfaces</span>
    <span class="page-tag">SCREEN 8 &amp; AUX</span>
  </div>

  <h1>Screen 8: Immutable Audit Log Viewer</h1>
  <p><strong>Route:</strong> <code>app/(admin)/audit/page.tsx</code> | <strong>Primary Persona:</strong> Platform Security Officer, Auditor</p>
  <p>
    An append-only, 100% read-only compliance viewer with cursor pagination, monospace trace IDs, and syntax-highlighted JSON payload inspection.
  </p>

  <table>
    <thead>
      <tr>
        <th>Timestamp (UTC)</th>
        <th>Actor</th>
        <th>Event Type</th>
        <th>Entity Target</th>
        <th>IP &amp; Trace ID</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>2026-09-26T08:14:02Z</code></td>
        <td>Marcus Vance (Sous Chef)</td>
        <td><span class="badge badge-green">order.accepted</span></td>
        <td>ord_0421 (Rm 402)</td>
        <td><code>192.241.14.82</code><br><code>tr_91b72e0a</code></td>
      </tr>
      <tr>
        <td><code>2026-09-26T08:11:45Z</code></td>
        <td>SuperAdmin</td>
        <td><span class="badge badge-indigo">audit.support_access</span></td>
        <td>hotel_h901</td>
        <td><code>104.28.192.11</code><br><code>tr_44c10a99</code></td>
      </tr>
      <tr>
        <td><code>2026-09-26T08:04:19Z</code></td>
        <td>David Chen (Auditor)</td>
        <td><span class="badge badge-amber">folio.manual_discount</span></td>
        <td>fol_101 (-₹500)</td>
        <td><code>192.241.14.90</code><br><code>tr_f88019aa</code></td>
      </tr>
      <tr>
        <td><code>2026-09-26T07:55:00Z</code></td>
        <td>Guest (Room 102)</td>
        <td><span class="badge badge-green">order.created</span></td>
        <td>ord_8920 (Rm 102)</td>
        <td><code>172.56.21.04</code><br><code>tr_61b89912</code></td>
      </tr>
      <tr>
        <td><code>2026-09-26T07:42:11Z</code></td>
        <td>SLA Escalation Engine</td>
        <td><span class="badge badge-rose">notification.escalated</span></td>
        <td>req_042 (Rm 304)</td>
        <td><code>10.0.4.1</code><br><code>tr_ee014798</code></td>
      </tr>
    </tbody>
  </table>

  <h2>Auxiliary Page 1: Public Marketing Pricing Page</h2>
  <p><strong>Route:</strong> <code>app/(marketing)/pricing/page.tsx</code></p>
  <ul>
    <li><strong>Boutique Tier ($199/mo or $159/mo annual):</strong> Up to 35 rooms, guest QR web app, 1 kitchen terminal, push alerts.</li>
    <li><strong>Resort Professional ($499/mo or $399/mo annual):</strong> Up to 150 rooms, 5 kitchen stations, housekeeping matrix, manager SLA radar.</li>
    <li><strong>Enterprise Chain (Custom):</strong> Unlimited rooms, multi-hotel HQ view, PMS integrations, 99.9% SLA.</li>
    <li><strong>Interactive ROI Calculator:</strong> Dynamic slider calculating projected labor savings ($145/room/month) and order turnaround speedup.</li>
  </ul>

  <h2>Auxiliary Page 2: Operational Reports &amp; Exports</h2>
  <p><strong>Route:</strong> <code>app/(admin)/reports/page.tsx</code></p>
  <ul>
    <li><strong>Performance Analytics:</strong> Total requests (412), average response velocity (2.8m), and breach rate (0.7%).</li>
    <li><strong>1-Click Export Generation:</strong> Instant client-side generation and download of CSV spreadsheets and JSON archives.</li>
  </ul>

  <!-- ==================== SECTION 10: DEMO SCRIPT & JUDGE Q&A ==================== -->
  <div class="page-break"></div>
  <div class="header-bar">
    <span class="doc-title">Section 10: Live Pitch & Troubleshooting</span>
    <span class="page-tag">PITCH DECK</span>
  </div>

  <h1>10. Live Pitch Execution &amp; Judge Defense</h1>

  <h2>Member 3 Stage Script: Exactly 2:00 (120 Seconds) | Slides 7 to 12</h2>
  <table>
    <thead>
      <tr>
        <th>Time</th>
        <th>Slide</th>
        <th>Speaker Action (Member 3)</th>
        <th>Judge Screen Experience</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1:30</strong></td>
        <td>Slide 7</td>
        <td>Switch to Kitchen Display Tablet. Tap "Simulate Order".</td>
        <td>Order pops up in &lt;1s. Web Audio chime rings. M3 taps "Accept". Phone updates live.</td>
      </tr>
      <tr>
        <td><strong>2:00</strong></td>
        <td>Slide 8</td>
        <td>Lock tablet display. Trigger background event.</td>
        <td>Live Web Push alert appears on locked device without dashboard open.</td>
      </tr>
      <tr>
        <td><strong>2:30</strong></td>
        <td>Slide 9</td>
        <td>Simulate ignored task. Automatic SLA escalation triggers.</td>
        <td>Radar alert turns Amber &rarr; Rose. Manager notified with reason and timestamp.</td>
      </tr>
      <tr>
        <td><strong>3:30</strong></td>
        <td>Slide 10</td>
        <td>Open Manager Dashboard.</td>
        <td>Zero-lag SVG line charts, response time benchmarks, zero bundle bloat.</td>
      </tr>
      <tr>
        <td><strong>3:45</strong></td>
        <td>Slide 11</td>
        <td>Display Multi-Tenant SaaS Admin &amp; Immutable Audit Log.</td>
        <td>Monospace security ledger with trace IDs and 1-click break-glass support session.</td>
      </tr>
      <tr>
        <td><strong>4:00</strong></td>
        <td>Slide 12</td>
        <td>Hand back to M1/M2 for closing.</td>
        <td>Seamless transition to summary and business vision.</td>
      </tr>
    </tbody>
  </table>

  <h2>The 3 Judge Questions Member 3 Defends</h2>
  <div class="callout callout-info">
    <div class="callout-title">Q1: "What happens if a notification or alert is missed?"</div>
    <em>"Our system tracks every task through a state-machine outbox from enqueue to delivery and acknowledgment. If a staff member does not accept a task within the configured SLA threshold (e.g. 5 minutes for food, 10 minutes for towels), an escalation scheduler fires an automated alert to the department supervisor and flags it in bold amber/rose on the Manager Radar with the exact timestamp."</em>
  </div>

  <div class="callout callout-info">
    <div class="callout-title">Q2: "What would your engineering team build next on this foundation?"</div>
    <em>"Because we built an immutable, append-only event log for every operational transition, we already have complete historical time-series data. Next is an AI predictive prep-time engine for the kitchen, automatic shift scheduling based on peak demand, and direct PMS/accounting payroll exports."</em>
  </div>

  <div class="callout callout-info">
    <div class="callout-title">Q3: "How did a 3-person team build this full SaaS so fast without breaking?"</div>
    <em>"We operated with a strict contract-first workflow: Member 1 published typed Zod schemas and DB migrations on Day 2; Member 2 and I split the product into two mirrored halves with our shared 16-component kit. We built against typed mocks, held daily evening integration hours, and enforced automated Playwright E2E gates before every merge."</em>
  </div>

</body>
</html>
`;

const htmlFilePath = path.resolve('Grand_Azure_Ops_User_Manual.html');
const pdfFilePath = path.resolve('Grand_Azure_Ops_User_Manual_v3.0.pdf');

fs.writeFileSync(htmlFilePath, htmlContent, 'utf-8');

const edgeExecutable = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
console.log('Generating high-resolution enterprise PDF manual...');

try {
  execSync(`"${edgeExecutable}" --headless --no-sandbox --disable-gpu --print-to-pdf="${pdfFilePath}" "${htmlFilePath}"`);
  const stats = fs.statSync(pdfFilePath);
  console.log(`SUCCESS! User manual PDF created at: ${pdfFilePath} (${stats.size} bytes)`);
} catch (err) {
  console.error('Error generating PDF:', err);
  process.exit(1);
}
