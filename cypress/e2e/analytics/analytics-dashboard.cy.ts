/// <reference types="cypress" />
/// <reference path="../../support/index.d.ts" />

const SUPABASE_URL = "https://sbsxkbapdmlnyhvjvsei.supabase.co";
const PROJECT_REF = "sbsxkbapdmlnyhvjvsei";

function seedSessionInline() {
  const cookieName = `sb-${PROJECT_REF}-auth-token`;
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  cy.setCookie(
    cookieName,
    JSON.stringify({
      access_token: "test-access",
      refresh_token: "test-refresh",
      token_type: "bearer",
      expires_at: expiresAt,
    })
  );
  cy.intercept("GET", `${SUPABASE_URL}/auth/v1/user*`, {
    statusCode: 200,
    body: {
      id: "test-user-1",
      email: "test@example.com",
      role: "authenticated",
      aud: "authenticated",
    },
  }).as("getUser");
}

// ----- Stubs for individual pages -----

function stubDashboard() {
  // Minimal profile
  cy.intercept("GET", `${SUPABASE_URL}/rest/v1/profiles*`, (req) => {
    req.reply([
      {
        id: "test-user-1",
        first_name: "Test",
        middle_name: "",
        last_name: "User",
        avatar_url: null,
        bio: "UI/UX Designer",
      },
    ]);
  }).as("getProfile");

  // Designs list (use http URLs to avoid storage signing calls)
  cy.intercept("GET", `${SUPABASE_URL}/rest/v1/designs*`, (req) => {
    req.reply({
      body: [
        {
          id: "d1",
          title: "Sample Design",
          thumbnail_url: "https://example.com/placeholder.png",
          file_key: null,
          node_id: null,
          current_version_id: null,
          published_designs: [],
        },
      ],
      headers: { "content-range": "0-0/1" }, // support count handling
    });
  }).as("getDesigns");
}

function stubProjectPerformanceSmall() {
  cy.intercept("GET", `${SUPABASE_URL}/rest/v1/design_versions*`, (req) => {
    req.reply([
      {
        id: "v1",
        design_id: "d1",
        created_at: "2025-12-01T00:00:00Z",
        total_score: 85,
        ai_data: { issues: [{ severity: "Minor" }] },
        designs: { title: "Project A" },
      },
      {
        id: "v2",
        design_id: "d2",
        created_at: "2025-11-15T00:00:00Z",
        total_score: 42,
        ai_data: { issues: [{ severity: "Major" }, { severity: "Major" }] },
        designs: { title: "Project B" },
      },
      {
        id: "v3",
        design_id: "d3",
        created_at: "2025-11-01T00:00:00Z",
        total_score: 71,
        ai_data: { issues: [] },
        designs: { title: "Project C" },
      },
    ]);
  }).as("ppVersions");

  cy.intercept("GET", `${SUPABASE_URL}/rest/v1/design_frame_evaluations*`, {
    statusCode: 200,
    body: [
      { version_id: "v1", ai_data: { issues: [{}, {}] } },
      { version_id: "v2", ai_data: { issues: [{}] } },
    ],
  }).as("ppFrames");
}

function stubProjectPerformanceLarge(n = 200) {
  const rows = Array.from({ length: n }).map((_, i) => ({
    id: `v${i + 1}`,
    design_id: `d${i + 1}`,
    created_at: `2025-10-${(i % 28) + 1}T00:00:00Z`,
    total_score: (i * 7) % 101,
    ai_data: {
      issues: Array.from({ length: i % 5 }).map(() => ({
        severity: i % 2 ? "Major" : "Minor",
      })),
    },
    designs: { title: `Project ${i + 1}` },
  }));

  cy.intercept("GET", `${SUPABASE_URL}/rest/v1/design_versions*`, rows).as(
    "ppVersionsLarge"
  );
  cy.intercept(
    "GET",
    `${SUPABASE_URL}/rest/v1/design_frame_evaluations*`,
    []
  ).as("ppFramesLarge");
}

function stubHeuristicPageData() {
  cy.intercept("GET", `${SUPABASE_URL}/rest/v1/designs*`, [
    { id: "d1", owner_id: "test-user-1", title: "Heuristic Test Project" },
  ]).as("hvfDesigns");

  cy.intercept("GET", `${SUPABASE_URL}/rest/v1/design_versions*`, [
    {
      id: "v-h-1",
      design_id: "d1",
      created_at: "2025-12-01T00:00:00Z",
      ai_data: {
        ai: {
          heuristic_breakdown: [
            { code: "H01", score: 1, max_points: 4 }, // medium
            { code: "H02", score: 0.5, max_points: 4 }, // high
            { code: "H03", score: 3, max_points: 4 }, // low
          ],
        },
      },
    },
  ]).as("hvfVersions");
}

function stubTrendData() {
  cy.intercept("GET", `${SUPABASE_URL}/rest/v1/design_versions*`, [
    { version: 1, total_score: 3, created_at: "2025-09-01T00:00:00Z" },
    { version: 2, total_score: 7, created_at: "2025-10-01T00:00:00Z" },
    { version: 3, total_score: 9, created_at: "2025-11-01T00:00:00Z" },
  ]).as("trendVersions");
}

// ----- Tests -----
describe("Analytics Dashboard E2E", () => {
  beforeEach(() => {
    // Step 1 for any “Log in” precondition
    cy.loginBySupabaseApi(); // reads SUPABASE_* from Cypress env
  });

  it("TC_AD_001: Verify that the analytics dashboard loads successfully", () => {
    // 1) Log in as a user (handled in beforeEach)
    // 2) Navigate to Analytics Dashboard (choose Project Performance as the main analytics dashboard)
    stubProjectPerformanceSmall();
    cy.visit("/analytics/project-performance");

    cy.contains("Project Performance Comparison").should("be.visible");
    cy.get("table").should("be.visible");
  });

  it("TC_AD_002: Verify aggregate heuristic scores are properly displayed", () => {
    // 1) Upload a Figma design (stub data for heuristic page)
    // 2) Complete heuristic evaluation (represented by heuristic_breakdown in stub)
    // 3) Open the dashboard (Heuristic Violation Frequency)
    stubHeuristicPageData();
    cy.visit("/analytics/heuristic-violation-frequency");

    cy.contains("Heuristic Violation Frequency").should("be.visible");

    // Chart present
    cy.get("#heuristic-chart-container svg").should("exist");

    // List shows heuristic items with values
    cy.contains("Visibility of System Status").should("exist");
  });

  it('TC_AD_003: Verify filtering by "Minor Issues"', () => {
    // 1) Login (beforeEach)
    // 2) Navigate to Project Performance
    // 3) Apply filter = Minor Issues
    stubProjectPerformanceSmall();
    cy.visit("/analytics/project-performance");

    cy.get("select").first().select("Minor Issues");
    cy.get("tbody tr").should("have.length.greaterThan", 0);
    cy.get("tbody tr").each(($tr) => cy.wrap($tr).contains("td", "Minor"));
  });

  it('TC_AD_004: Verify filtering by "Major Issues"', () => {
    // 1) Login (beforeEach)
    // 2) Navigate to Project Performance
    // 3) Apply filter = Major Issues
    stubProjectPerformanceSmall();
    cy.visit("/analytics/project-performance");

    cy.get("select").first().select("Major Issues");
    cy.get("tbody tr").should("have.length.greaterThan", 0);
    cy.get("tbody tr").each(($tr) => cy.wrap($tr).contains("td", "Major"));
  });

  it("TC_AD_005: Verify that chart visualizations render properly", () => {
    // 1) Generate report (not strictly needed to render charts; ensure pages render their charts)
    // 2) Check charts for usability, readability, and accuracy (presence of SVGs and axes)
    // Heuristic radar
    stubHeuristicPageData();
    cy.visit("/analytics/heuristic-violation-frequency");
    cy.get("#heuristic-chart-container svg").within(() => {
      cy.get("g").should("exist"); // axes/layers
    });

    // Usability trend area chart
    stubTrendData();
    cy.visit("/analytics/usability-score-trend");
    cy.get("svg").should("exist");
  });

  it('TC_AD_006: Export summarized report in PDF format', () => {
    // 1) Log in (beforeEach)
    // 2) Navigate to Analytics page (use Project Performance)
    // 3) Click "Export Report"
    stubProjectPerformanceSmall();
    cy.visit("/analytics/project-performance");
    cy.contains("button", "Export").click();
    cy.contains(/pdf report generated successfully/i).should("be.visible");
  });

  it("TC_AD_007: Verify handling of large data sets", () => {
    // 1) Upload multiple Figma designs (large stub)
    // 2) Generate aggregate report (page loads + calculations)
    // 3) Monitor load time (sanity: page shows all items and remains responsive)
    stubProjectPerformanceLarge(200);
    cy.visit("/analytics/project-performance");
    cy.contains("Showing").should("contain.text", "200");
    cy.get("tbody tr").should("have.length.greaterThan", 10);
  });
  it("TC_AD_008: Verify error handling when no data is available", () => {
  cy.intercept("GET", `${SUPABASE_URL}/rest/v1/design_versions*`, []).as("trendEmpty");
  cy.visit("/analytics/usability-score-trend");

  cy.contains("No data available. Submit evaluations to see trends.").should("be.visible");
  cy.contains("button", "Export").should("not.exist");
});
});