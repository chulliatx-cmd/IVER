// ⚙️ Réglages de l'app — modifiez ce fichier puis poussez-le sur GitHub.
window.CHIOT_CONFIG = {
  // Nom du chiot (affiché sur l'accueil)
  nomChiot: "Iver",

  // Les deux personnes qui notent
  personnes: [
    { id: "a", nom: "Xavier", initiale: "X", couleur: "#2F5BC4" },
    { id: "b", nom: "Violaine", initiale: "V", couleur: "#B4467A" }
  ],

  // Rappel "Sortir bientôt" si pas de pipi depuis X minutes
  rappelPipiMinutes: 90,

  // Synchronisation entre vos deux téléphones (Firebase, gratuit).
  // Laissez `null` pour un mode local (données gardées seulement sur cet appareil).
  // Voir README.md pour obtenir ces valeurs.
  firebase: {
    apiKey: "AIzaSyBcbx80Qt99-JFUFmzgpUvKyX4ZJDHW7DY",
    authDomain: "iver-919e0.firebaseapp.com",
    projectId: "iver-919e0",
    appId: "1:830892115709:web:45192ddb5cf4028669a094"
  },

  // Identifiant secret de votre journal (changez-le pour une suite de lettres au hasard)
  journalId: "journal-b8dz4gysrf4r3kzf"
};
