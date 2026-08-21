(function () {
  function normaliseCompanySize(value) {
    const sizes = {
      micro: "1-9",
      small: "10-49",
      medium: "50-249",
      large: "250+",
      "1–9": "1-9",
      "10–49": "10-49",
      "50–249": "50-249",
      "1-9": "1-9",
      "10-49": "10-49",
      "50-249": "50-249",
      "250+": "250+"
    };

    return sizes[value] || undefined;
  }

  function readAssessmentState() {
    try {
      return JSON.parse(
        localStorage.getItem("rgpd-matrix-github") || "{}"
      );
    } catch (error) {
      console.warn("État local RGPD illisible :", error);
      return {};
    }
  }

  function buildAssessmentAnswers(savedState) {
    const notes = savedState.notes || {};
    const acceptedAnswers = ["yes", "partial", "no", "na"];

    return Object.entries(savedState.ans || {})
      .filter(function (entry) {
        return acceptedAnswers.includes(entry[1]);
      })
      .map(function (entry) {
        const questionCode = entry[0];

        return {
          questionCode,
          answerValue: entry[1],
          auditorNote: String(notes[questionCode] || "").trim()
        };
      });
  }

  async function saveCurrentAssessment() {
    if (!window.RGPD_API?.saveAssessment) {
      throw new Error(
        "Le service d’enregistrement RGPD est indisponible."
      );
    }

    const savedState = readAssessmentState();
    const answers = buildAssessmentAnswers(savedState);

    if (!answers.length) {
      throw new Error("Aucune réponse à enregistrer.");
    }

    const leadId = localStorage.getItem(
      "rgpd-current-lead-id"
    );

    const payload = {
      assessmentMode: savedState.mode || "express",
      language: savedState.lang === "en" ? "en" : "fr",
      answers
    };

    if (leadId) {
      payload.leadId = leadId;
    }

    const result = await window.RGPD_API.saveAssessment(
      payload
    );

    localStorage.setItem(
      "rgpd-current-assessment-id",
      result.assessmentId
    );

    localStorage.setItem(
      "rgpd-current-assessment-reference",
      result.publicReference
    );

    return result;
  }

  function addCompanySizeField() {
    document
      .querySelectorAll(".commercial-dialog")
      .forEach(function (form) {
        if (
          form.elements.size ||
          form.classList.contains("pricing-dialog")
        ) {
          return;
        }

        const grid = form.querySelector(".lead-grid");

        if (!grid) {
          return;
        }

        const label = document.createElement("label");

        label.innerHTML = `
          Taille de l’entreprise / Company size *
          <select name="size" required>
            <option value="">
              Sélectionner / Select
            </option>
            <option value="1-9">
              1 à 9 salariés
            </option>
            <option value="10-49">
              10 à 49 salariés
            </option>
            <option value="50-249">
              50 à 249 salariés
            </option>
            <option value="250+">
              250 salariés et plus
            </option>
          </select>
        `;

        grid.appendChild(label);
      });
  }

  const companySizeObserver = new MutationObserver(
    addCompanySizeField
  );

  companySizeObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  addCompanySizeField();

  document.addEventListener(
    "click",
    async function (event) {
      const button = event.target.closest("#pdf");

      if (
        !button ||
        button.dataset.backendSaved === "1"
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      const originalText = button.textContent;

      button.disabled = true;
      button.textContent =
        "Enregistrement du rapport…";

      try {
        const result =
          await saveCurrentAssessment();

        console.info(
          "Évaluation complète enregistrée :",
          result.assessmentId
        );
      } catch (error) {
        console.error(
          "Enregistrement de l’évaluation impossible :",
          error
        );

        window.alert(
          "Le rapport va être généré, mais l’évaluation n’a pas pu être enregistrée automatiquement."
        );
      } finally {
        button.disabled = false;
        button.textContent = originalText;
        button.dataset.backendSaved = "1";

        button.click();

        delete button.dataset.backendSaved;
      }
    },
    true
  );

  document.addEventListener(
    "submit",
    function (event) {
      const form = event.target;

      if (
        !(form instanceof HTMLFormElement) ||
        !form.matches(".commercial-dialog")
      ) {
        return;
      }

      // V6.2 : le formulaire de paiement Stripe gère lui-même
      // l'enregistrement Supabase avant la redirection vers Checkout.
      if (form.dataset.stripeCheckout === "1") {
        return;
      }

      const fields = new FormData(form);

      const professionalEmail = String(
        fields.get("email") || ""
      ).trim();

      if (!professionalEmail) {
        return;
      }

      const isAnalysis =
        form.classList.contains("pricing-dialog");

      const isAudit = Boolean(
        fields.get("deadline")
      );

      const companySize = normaliseCompanySize(
        fields.get("size")
      );

      const leadPayload = {
        fullName: String(
          fields.get("name") || ""
        ).trim(),

        professionalEmail,

        organisation: String(
          fields.get("org") || ""
        ).trim(),

        roleTitle: String(
          fields.get("role") || ""
        ).trim(),

        contactConsent: Boolean(
          fields.get("consent")
        ),

        marketingConsent: Boolean(
          fields.get("marketing")
        ),

        source: "github-pages-v6"
      };

      if (companySize) {
        leadPayload.companySize = companySize;
      }

      window.RGPD_API
        .createLead(leadPayload)

        .then(async function (leadResult) {
          console.info(
            "Prospect enregistré :",
            leadResult.leadId
          );

          localStorage.setItem(
            "rgpd-current-lead-id",
            leadResult.leadId
          );

          if (!isAnalysis && !isAudit) {
            return;
          }

          const commercialPayload = {
            leadId: leadResult.leadId,

            requestType: isAnalysis
              ? "analysis"
              : "audit",

            context: String(
              fields.get("context") || ""
            ).trim()
          };

          if (companySize) {
            commercialPayload.companySize =
              companySize;
          }

          const assessmentId =
            localStorage.getItem(
              "rgpd-current-assessment-id"
            );

          if (assessmentId) {
            commercialPayload.assessmentId =
              assessmentId;
          }

          const requestResult =
            await window.RGPD_API
              .createCommercialRequest(
                commercialPayload
              );

          console.info(
            "Demande commerciale enregistrée :",
            requestResult.requestId
          );
        })

        .catch(function (error) {
          console.error(
            "Enregistrement Supabase impossible :",
            error
          );

          const message =
            form.querySelector(".form-note");

          if (message) {
            message.textContent =
              "La demande peut être envoyée par e-mail, mais son enregistrement automatique a échoué.";
          }
        });
    },
    true
  );
})();
