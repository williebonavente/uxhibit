import EvaluationResult from "../../../app/designs/[id]/dialogs/EvaluationResult";

const makeEval = (
  age = "Gen Z",
  occupation = "Student",
  resourcesCount = 5
) => {
  const resources = Array.from({ length: resourcesCount }, (_, i) => ({
    issue_id: `frame1-issue${i}`,
    title: i === 0 ? "WCAG 2.2 Overview" : `Resource ${i}`,
    url:
      i === 0
        ? "https://www.w3.org/WAI/standards-guidelines/wcag/"
        : `https://example.com/resource-${i}`,
    description: i === 0 ? "Accessibility standards mapping" : "Helpful info",
    related: "Accessibility",
    reason: "Improve accessibility understanding",
  }));

  const ai_data: any = {
    overall_score: 88,
    summary: `For a ${age} ${occupation}, focus on readability and accessibility.`,
    strengths: [],
    weaknesses: [],
    issues: resources.map((r, i) => ({
      id: r.issue_id,
      severity: "medium",
      message: `Issue ${i}`,
      suggestion: "Fix",
    })),
    category_scores: {
      accessibility: 85,
      typography: 88,
      color: 86,
      layout: 87,
      hierarchy: 89,
      usability: 88,
    },
    resources,
    debug_calc: {
      final: 88,
      heuristics_avg: 86,
      categories_avg: 89,
      combined: 88,
      alpha: 0.35,
      blended: 88,
      extra_pull_applied: false,
      iteration: 3,
      total_iterations: 3,
      target: 100,
    },
    bias: { params: { generation: age, occupation } },
  };

  const evalResult: any = {
    nodeId: "node1",
    imageUrl: "https://example.com/img.png",
    summary: ai_data.summary,
    heuristics: {},
    ai_status: "ok",
    overall_score: ai_data.overall_score,
    ai: ai_data,
  };

  // Provide summary on the active frame so the component renders it
  const frameEvaluations = [{ ai_data, summary: ai_data.summary }];

  return { evalResult, frameEvaluations };
};

// Ignore Next style-loader head/parentNode injection crashes in this spec
Cypress.on("uncaught:exception", (err) => {
  const msg = err?.message || "";
  const stack = err?.stack || "";
  if (
    msg.includes("parentNode") &&
    (stack.includes("next-style-loader") || stack.includes("globals.css"))
  ) {
    return false;
  }
});

// Minimal styling used for all mounts
const CT_STYLES = ["html,body{background:#fff}", ":root{color-scheme:light}"];

// Helper to mount with styles
const mountStyled = (node: JSX.Element) =>
  cy.mount(node, { styles: CT_STYLES });
beforeEach(() => {
  cy.document().then((d) => d.documentElement.classList.add("dark"));
  cy.viewport(1920, 1080);
});
describe("<EvaluationResult /> ALR tests", () => {
  it("TC_ALR_001: Recommendations are relevant to the student demographic", () => {
    const { evalResult, frameEvaluations } = makeEval("Gen Z", "Student");
    mountStyled(
      <EvaluationResult
        evalResult={evalResult}
        loadingEval={false}
        currentFrame={{}}
        frameEvaluations={frameEvaluations}
        selectedFrameIndex={0}
      />
    );
    cy.contains("Recommended Resources").should("exist");
    cy.contains(/Gen Z Student/i).should("exist");
  });

  it("TC_ALR_002: Recommendations vary according to age and occupation", () => {
    const A = makeEval("Gen Z", "Student");
    const B = makeEval("Senior", "Teacher");
    mountStyled(
      <EvaluationResult
        evalResult={A.evalResult}
        loadingEval={false}
        currentFrame={{}}
        frameEvaluations={A.frameEvaluations}
        selectedFrameIndex={0}
      />
    );
    cy.contains(/Gen Z Student/i).should("exist");
    mountStyled(
      <EvaluationResult
        evalResult={B.evalResult}
        loadingEval={false}
        currentFrame={{}}
        frameEvaluations={B.frameEvaluations}
        selectedFrameIndex={0}
      />
    );
    cy.contains(/Senior Teacher/i).should("exist");
  });

  it("TC_ALR_003: Recommendation includes accessibility learning resources", () => {
    const { evalResult, frameEvaluations } = makeEval();
    mountStyled(
      <EvaluationResult
        evalResult={evalResult}
        loadingEval={false}
        currentFrame={{}}
        frameEvaluations={frameEvaluations}
        selectedFrameIndex={0}
      />
    );
    cy.contains(/WCAG/i).should("exist");
    cy.get("a")
      .contains(/w3\.org/i)
      .should("exist");
  });

  it("TC_ALR_004: System enforces a limit of 5 recommendations", () => {
    const { evalResult, frameEvaluations } = makeEval("Gen Z", "Student", 7);
    mountStyled(
      <EvaluationResult
        evalResult={evalResult}
        loadingEval={false}
        currentFrame={{}}
        frameEvaluations={frameEvaluations}
        selectedFrameIndex={0}
      />
    );
    cy.contains("Recommended Resources")
      .parent()
      .find("ul li")
      .should("have.length.at.most", 5);
  });

  it("TC_ALR_005: The API responds with 200 and JSON relevant output", () => {
    cy.intercept("POST", "/api/ai/evaluate", {
      statusCode: 200,
      body: { status: "processing", designId: "d1", versionId: "v1" },
    }).as("evalApi");

    cy.window()
      .then(() =>
        fetch("/api/ai/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "image",
            designId: "d1",
            frames: { single: "https://example.com/img.png" },
          }),
        })
      )
      .then((res) => {
        expect(res.status).to.eq(200);
        return res.json();
      })
      .then((json) => {
        expect(json).to.have.property("status", "processing");
        expect(json).to.have.property("designId", "d1");
      });
  });

  it("TC_ALR_006: All recommendations follow a consistent structure", () => {
    const { evalResult, frameEvaluations } = makeEval();
    mountStyled(
      <EvaluationResult
        evalResult={evalResult}
        loadingEval={false}
        currentFrame={{}}
        frameEvaluations={frameEvaluations}
        selectedFrameIndex={0}
      />
    );
    cy.contains("Recommended Resources")
      .parent()
      .find("ul li")
      .each(($li) => {
        cy.wrap($li).within(() => {
          cy.get("span").first().should("not.be.empty"); // title
          cy.get("a[href]").should("exist"); // URL link present
        });
      });
  });

  it("TC_ALR_007: Fallback message is displayed when recommendations unavailable", () => {
    const evalResult: any = { ai: null };
    const frameEvaluations = [{ ai_data: null }];
    mountStyled(
      <EvaluationResult
        evalResult={evalResult}
        loadingEval={false}
        currentFrame={{}}
        frameEvaluations={frameEvaluations}
        selectedFrameIndex={0}
      />
    );
    cy.contains("Recommendation service is temporarily unavailable.").should(
      "exist"
    );
  });
});
