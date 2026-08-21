# Matrice de conformité RGPD — V6.2

Application web statique prête pour GitHub Pages, avec backend Supabase pour les fonctions connectées.

## Parcours

- Diagnostic express : 10 contrôles essentiels, accessible librement.
- Auto-évaluation complète : 28 contrôles, parcours client.
- Audit professionnel : 40 contrôles, réservé à l’auditeur authentifié ; le visiteur public peut uniquement demander un audit.
- Analyse personnalisée, demande d’audit, licence / marque blanche et prise de rendez-vous.

## Intégrations conservées

- Supabase : prospects, évaluations, demandes commerciales et authentification de l’auditeur.
- Cal.com : réservation directe d’un créneau.
- GitHub Pages : hébergement de l’interface publique.
- Stripe : Payment Links 290 €, 490 € et 790 € intégrés, avec retour vers la page de confirmation.

## Fonctions conservées

- interface français / anglais ;
- thèmes clair / sombre ;
- tailles A− / A / A+ ;
- rapport PDF professionnel en deux parties ;
- réponses détaillées, observations et plan d’action ;
- responsive smartphone, tablette et ordinateur ;
- mentions légales et politique de confidentialité.

## Sécurité V6

Les contrôles réservés à l’audit ne sont pas inclus dans le JavaScript public. Ils sont délivrés par la fonction Supabase uniquement après vérification du JWT utilisateur et de l’adresse e-mail de l’auditeur autorisé. L’enregistrement d’une évaluation en mode `audit` est protégé par la même vérification côté serveur.

## Déploiement GitHub Pages

Placez les fichiers de ce dossier à la racine du dépôt GitHub Pages. Dans **Settings > Pages**, sélectionnez **Deploy from a branch**, branche **main**, dossier **/(root)**.

La fonction Edge Supabase V6 est fournie séparément et ne doit pas être publiée dans le dépôt GitHub Pages, car elle contient le référentiel réservé à l’audit professionnel.


## Paiement Stripe — V6.2

Les liens Stripe sont intégrés à l'analyse personnalisée :

- 1–9 salariés : 290 € HT ;
- 10–49 salariés : 490 € HT ;
- 50–249 salariés : 790 € HT ;
- 250+ salariés : sur devis.

Le formulaire préremplit l'adresse e-mail dans Stripe Checkout et transmet une référence de rapprochement structurée via `client_reference_id` (référence du diagnostic, lead, évaluation et taille lorsque disponibles). Cette référence reste un indice de rapprochement et n'est jamais utilisée seule comme preuve d'identité.

Dans Stripe, configurez chacun des trois Payment Links avec **After payment → Redirect to a URL** vers :

`https://twagirumukiza.github.io/matrice-RGPD-v6/merci.html?session_id={CHECKOUT_SESSION_ID}`

Activez également dans Stripe la collecte de l'adresse de facturation et, si nécessaire, des identifiants fiscaux / champs personnalisés destinés à la facture.


## Confirmation serveur des paiements — V6.2

La V6.2 ajoute un webhook Stripe signé vers une Edge Function Supabase `stripe-webhook`. Le navigateur n'est plus la source de vérité du paiement : Stripe envoie les événements de Checkout directement au backend.

Flux :

`Stripe → checkout.session.completed → stripe-webhook → payments`

La table `payments` conserve notamment le montant, la devise, l'e-mail du client, la référence du diagnostic, le statut, l'identifiant de session Stripe et la date de paiement. La table `stripe_events` assure l'idempotence des événements.

La page `merci.html` utilise ensuite l'action `payment_status` de `rgpd-api` pour vérifier que le webhook a bien enregistré le paiement côté serveur.

Les fichiers serveur (`rgpd-api-v6.2-index.ts`, `stripe-webhook-v6.2-index.ts` et `supabase-payments-v6.2.sql`) sont livrés séparément et ne doivent pas être copiés dans le dépôt GitHub Pages.
