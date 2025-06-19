# Service Worker Setup Guide - 27.06.25 App

Questa guida ti aiuterà a configurare correttamente il Service Worker per l'app PWA "27.06.25".

## 🚀 Quick Start

### 1. Verifica Prerequisiti

Il Service Worker funziona solo in questi contesti:
- **HTTPS** (produzione)
- **localhost** (sviluppo)
- **127.0.0.1** (sviluppo)

### 2. File Richiesti

Assicurati che questi file siano presenti nella **root** del progetto:

```
/
├── sw.js              ✅ Service Worker
├── manifest.json      ✅ PWA Manifest  
├── index.html         ✅ HTML principale
└── App.tsx           ✅ App React
```

### 3. Verifica Configurazione

1. Apri l'app in Chrome/Firefox/Safari
2. Vai nelle **Impostazioni** dell'app
3. Clicca **"Avvia Diagnostica e Setup"**
4. Segui le istruzioni per risolvere eventuali problemi

## 🔧 Setup Ambiente Locale

### Opzione 1: Server di Sviluppo Locale

```bash
# Se usi Vite
npm run dev
# oppure
yarn dev

# Se usi altri bundler
npx serve . -p 3000
# oppure  
python -m http.server 3000
```

### Opzione 2: HTTPS Locale (Raccomandato)

```bash
# Con mkcert (raccomandato)
mkcert -install
mkcert localhost 127.0.0.1 ::1

# Servi con HTTPS
npx serve . -p 3000 --ssl-cert localhost.pem --ssl-key localhost-key.pem
```

## 🐛 Troubleshooting Comuni

### Service Worker non si registra

**Problema**: Console mostra errori di registrazione

**Soluzioni**:
1. Verifica che `sw.js` sia accessibile: vai a `http://localhost:3000/sw.js`
2. Controlla che non ci siano errori JavaScript nel file `sw.js`
3. Verifica di essere su HTTPS o localhost
4. Apri DevTools → Application → Service Workers

### Cache non funziona

**Problema**: L'app non funziona offline

**Soluzioni**:
1. Verifica che le risorse siano cachate: DevTools → Application → Storage
2. Controlla la strategia di caching nel Service Worker
3. Forza il refresh: DevTools → Application → Service Workers → "Update"

### Install prompt non appare

**Problema**: Il pulsante "Installa App" non si mostra

**Criteri PWA richiesti**:
- [x] Service Worker registrato
- [x] Manifest.json valido
- [x] Icone app presenti
- [x] Servito su HTTPS/localhost
- [x] App è "engaging" (l'utente ha interagito)

### Problemi in Figma Preview

**Limitazioni**:
- Service Worker potrebbe non registrarsi
- Install prompt disabilitato
- Cache limitata

**Soluzione**: Testa sempre in ambiente locale o produzione per PWA complete.

## 🏭 Deploy Produzione

### 1. Server HTTPS

Il Service Worker **DEVE** essere servito su HTTPS in produzione.

### 2. Headers Corretti

Configura il server per servire:

```nginx
# Nginx example
location /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Service-Worker-Allowed "/";
}

location /manifest.json {
    add_header Content-Type "application/manifest+json";
}
```

### 3. Verifica Post-Deploy

1. Testa l'app su dispositivo mobile
2. Verifica l'installazione PWA
3. Testa la funzionalità offline
4. Controlla gli aggiornamenti automatici

## 🛠️ Debug Tools

### Chrome DevTools

1. **Application Tab**:
   - Service Workers: Stato registrazione
   - Storage: Cache e dati
   - Manifest: Verifica PWA

2. **Network Tab**:
   - Verifica richieste cachate
   - Testa modalità offline

3. **Console**: 
   - Errori Service Worker
   - Log di registrazione

### Lighthouse

Esegui audit PWA:
```bash
npm install -g lighthouse
lighthouse https://yourapp.com --view
```

## 📱 Test Installazione

### Desktop
- Chrome: Icona + nell'address bar
- Edge: Icona app nella toolbar
- Firefox: Menu → "Install this site as an app"

### Mobile
- iOS Safari: Share → "Add to Home Screen"
- Android Chrome: Menu → "Add to Home Screen"
- Android Firefox: Menu → "Install"

## 🔄 Aggiornamenti Service Worker

Il Service Worker si aggiorna automaticamente:

1. **Verifica**: Ogni caricamento pagina
2. **Download**: Nuova versione in background  
3. **Install**: Quando disponibile
4. **Activate**: Al prossimo refresh

### Forzare Aggiornamento

```javascript
// In console del browser
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(reg => {
    if (reg) reg.update();
  });
}
```

## 📋 Checklist Pre-Launch

- [ ] Service Worker registra senza errori
- [ ] Manifest.json valido e accessibile  
- [ ] App funziona offline
- [ ] Install prompt appare
- [ ] Installazione PWA funziona
- [ ] Aggiornamenti automatici testati
- [ ] Lighthouse score PWA > 90
- [ ] Test su diversi dispositivi/browser

## 🆘 Supporto

Se continui ad avere problemi:

1. **Usa la Diagnostica**: Impostazioni → "Avvia Diagnostica e Setup"
2. **Controlla Console**: F12 → Console per errori
3. **Testa Manualmente**: DevTools → Application → Service Workers

## 🌐 Browser Support

| Browser | Service Worker | PWA Install | Offline |
|---------|----------------|-------------|---------|
| Chrome  | ✅             | ✅          | ✅      |
| Firefox | ✅             | ✅          | ✅      |
| Safari  | ✅             | ✅          | ✅      |
| Edge    | ✅             | ✅          | ✅      |

---

💕 **Happy coding!** L'app PWA "27.06.25" sarà pronta per il vostro viaggio di nozze! 🎉