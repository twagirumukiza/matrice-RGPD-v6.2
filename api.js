(function () {
  async function request(action, payload = {}, token) {
    const config = window.RGPD_CONFIG;

    if (!config?.apiUrl || !config?.publishableKey) {
      throw new Error("Configuration Supabase absente.");
    }

    const headers = {
      "Content-Type": "application/json",
      apikey: config.publishableKey
    };

    if (token) {
      headers.Authorization = "Bearer " + token;
    }

    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action,
        ...payload
      })
    });

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error("Réponse incorrecte du serveur.");
    }

    if (!response.ok || result.success === false) {
      const error = new Error(
        result.error ||
        "La demande n’a pas pu être enregistrée."
      );
      error.status = response.status;
      throw error;
    }

    return result;
  }

  async function sessionToken(requiredMessage) {
    const sb = window.__sbAuth;

    if (!sb) {
      throw new Error("Authentification indisponible.");
    }

    const { data, error } = await sb.auth.getSession();
    const token = data?.session?.access_token;

    if (error || !token) {
      throw new Error(requiredMessage || "Session administrateur requise.");
    }

    return token;
  }

  window.RGPD_API = {
    health() {
      return request("health");
    },

    createLead(data) {
      return request("create_lead", data);
    },

    async saveAssessment(data) {
      const token = data?.assessmentMode === "audit"
        ? await sessionToken("Session auditeur requise pour enregistrer un audit.")
        : undefined;

      return request("submit_assessment", data, token);
    },

    createCommercialRequest(data) {
      return request(
        "create_commercial_request",
        data
      );
    },

    getPaymentStatus(sessionId) {
      return request("payment_status", { sessionId });
    },

    async getAuditQuestions() {
      const token = await sessionToken("Session administrateur requise.");
      return request("get_audit_questions", {}, token);
    }
  };
})();
