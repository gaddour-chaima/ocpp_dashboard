import WebSocket from 'ws';

const CSMS_URL = 'ws://10.10.20.20:8080/ocpp';

// Définition de nos 3 bornes de recharge
const CHARGERS = [
  { id: 'CP-Fast-01', vendor: 'Tesla', model: 'Supercharger V3', connector: 1 },
  { id: 'CP-City-02', vendor: 'Schneider', model: 'EVlink', connector: 1 },
  { id: 'CP-Mall-03', vendor: 'ABB', model: 'Terra 54', connector: 1 }
];

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

class ChargerSimulator {
  constructor(config) {
    this.config = config;
    this.url = `${CSMS_URL}/${config.id}`;
    this.ws = null;
    this.messageId = 1;
    this.isConnected = false;
    this.transactionId = null;
    this.meterValue = 0;
  }

  connect() {
    console.log(`[${this.config.id}] Connexion à ${this.url}...`);
    this.ws = new WebSocket(this.url, ['ocpp1.6']);

    this.ws.on('open', () => {
      this.isConnected = true;
      console.log(`[${this.config.id}] ✅ Connecté ! Envoi de BootNotification...`);
      this.sendBootNotification();
    });

    this.ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg[0] === 3) {
        // Log les réponses du backend (CallResult)
        console.log(`[${this.config.id}] ⬅️ Reçu (ID: ${msg[1]}):`, msg[2]);

        // Si c'est la réponse au StartTransaction, on sauvegarde le transactionId
        if (msg[2] && msg[2].transactionId) {
          this.transactionId = msg[2].transactionId;
        }
      } else if (msg[0] === 2) {
        // Le Backend nous envoie une requête -> On répond toujours accepté pour simuler
        console.log(`[${this.config.id}] ⬅️ Call Backend: ${msg[2]}`);
        this.ws.send(JSON.stringify([3, msg[1], { status: 'Accepted' }]));
      }
    });

    this.ws.on('close', () => {
      this.isConnected = false;
      console.log(`[${this.config.id}] ❌ Déconnecté.`);
    });

    this.ws.on('error', (err) => {
      console.error(`[${this.config.id}] Erreur WS:`, err.message);
    });
  }

  send(action, payload) {
    if (!this.isConnected) return;
    const msgId = String(this.messageId++);
    const message = [2, msgId, action, payload];
    console.log(`[${this.config.id}] ➡️ Envoi ${action}`);
    this.ws.send(JSON.stringify(message));
  }

  sendBootNotification() {
    this.send('BootNotification', {
      chargePointVendor: this.config.vendor,
      chargePointModel: this.config.model,
      chargePointSerialNumber: generateId(),
      firmwareVersion: '1.0.5'
    });

    // 2 secondes après, on se met en Available
    setTimeout(() => this.sendStatus('Available'), 2000);
  }

  sendStatus(status, errorCode = 'NoError') {
    this.send('StatusNotification', {
      connectorId: this.config.connector,
      errorCode: errorCode,
      status: status
    });
  }

  startSession(idTag = 'USER-A123') {
    console.log(`[${this.config.id}] ⚡ Démarrage d'une session...`);
    this.sendStatus('Preparing');

    setTimeout(() => {
      this.send('StartTransaction', {
        connectorId: this.config.connector,
        idTag: idTag,
        meterStart: this.meterValue,
        timestamp: new Date().toISOString()
      });
      this.sendStatus('Charging');

      // Simuler l'envoi de compteurs (MeterValues) d'énergie toutes les 5 secondes
      this.meterInterval = setInterval(() => {
        this.meterValue += Math.floor(Math.random() * 500) + 100; // Ajoute entre 100 et 600 Wh
        this.send('MeterValues', {
          connectorId: this.config.connector,
          transactionId: this.transactionId || 1,
          meterValue: [{
            timestamp: new Date().toISOString(),
            sampledValue: [
              { value: String(this.meterValue), context: 'Sample.Periodic', measurand: 'Energy.Active.Import.Register', unit: 'Wh' },
              { value: String(Math.floor(Math.random() * 22000)), measurand: 'Power.Active.Import', unit: 'W' }
            ]
          }]
        });
      }, 5000);

    }, 2000);
  }

  stopSession(idTag = 'USER-A123') {
    if (!this.meterInterval) return;
    console.log(`[${this.config.id}] 🛑 Arrêt de la session...`);

    clearInterval(this.meterInterval);
    this.meterInterval = null;
    this.sendStatus('Finishing');

    setTimeout(() => {
      this.send('StopTransaction', {
        idTag: idTag,
        meterStop: this.meterValue,
        timestamp: new Date().toISOString(),
        transactionId: this.transactionId || 1,
        reason: 'Local'
      });
      this.sendStatus('Available');
      this.transactionId = null;
    }, 2000);
  }
}

// === EXÉCUTION DU SCÉNARIO ===
console.log("🚀 Lancement du Simulateur de Bornes OCPP...");

const simulators = CHARGERS.map(c => new ChargerSimulator(c));

// 1. Connecter toutes les bornes
simulators.forEach(sim => sim.connect());

// 2. Démarrer une session sur la borne 1 après 5 secondes
setTimeout(() => {
  simulators[0].startSession('RFID-987654');
}, 5000);

// 3. Démarrer une autre session sur la borne 2 après 15 secondes
setTimeout(() => {
  simulators[1].startSession('RFID-112233');
}, 15000);

// 4. Mettre la borne 3 en défaut (Faulted) après 10 secondes
setTimeout(() => {
  simulators[2].sendStatus('Faulted', 'GroundFailure');
}, 10000);

// 5. Arrêter la session de la borne 1 après 35 secondes
setTimeout(() => {
  simulators[0].stopSession('RFID-987654');
}, 35000);

// Instructions:
// 1. Assurez-vous d'avoir node.js installé.
// 2. Dans ce dossier, exécutez: npm install ws
// 3. Ensuite, exécutez: node ocpp-simulator.js
