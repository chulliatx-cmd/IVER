// ⚙️ Réglages de l'app — modifiez ce fichier puis poussez-le sur GitHub.
window.CHIOT_CONFIG = {
  // Nom du chiot (affiché sur l'accueil)
  nomChiot: "[Nom]",

  // Les deux personnes qui notent
  personnes: [
    { id: "a", nom: "Moi", initiale: "A", couleur: "#2F5BC4" },
    { id: "b", nom: "Ma chérie", initiale: "B", couleur: "#B4467A" }
  ],

  // Rappel "Sortir bientôt" si pas de pipi depuis X minutes
  rappelPipiMinutes: 90,

  // Synchronisation entre vos deux téléphones (Firebase, gratuit).
  // Laissez `null` pour un mode local (données gardées seulement sur cet appareil).
  // Voir README.md pour obtenir ces valeurs.
  firebase: null,
  /* Exemple :
  firebase: {
    apiKey: "AIza...",
    authDomain: "mon-chiot.firebaseapp.com",
    projectId: "mon-chiot",
    appId: "1:123:web:abc"
  },
  */

  // Identifiant secret de votre journal (changez-le pour une suite de lettres au hasard)
  journalId: "journal-a-changer-xk29p"
};
