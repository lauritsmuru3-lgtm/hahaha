# Hitster 4-le

Reaalajas 4 mängija veebimäng.

## Kuidas töötab
1. Üks mängija loob toa.
2. Teised avavad sama veebiaadressi ja sisestavad toa koodi.
3. Kui kõik 4 on kohal, alustab mängujuht.
4. Kõigile kuvatakse sama lugu. Üks inimene avab selle Spotify kaudu ja mängib kõigile.
5. Aktiivne mängija valib oma telefonis, kuhu lugu tema kronoloogilisel ajajoonel kuulub.
6. Kui koht on õige, jääb kaart tema ajajoonele.
7. Esimene, kellel on 8 kaarti, võidab.

## Käivita arvutis
Vajalik Node.js 18+.

```bash
npm install
npm start
```

Seejärel ava:
http://localhost:3000

## Kõige lihtsam avalik deploy: Render
1. Tee GitHubis uus repository.
2. Laadi selle ZIP-i failid repository juurkausta.
3. Ava Render.com ja vali **New > Web Service**.
4. Ühenda GitHub repository.
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Deploy.

Render annab sulle avaliku lingi, mida saad sõpradele saata.

## Märkus
Toad on serveri mälus. Kui tasuta hosting serveri taaskäivitab, kaob pooleliolev mäng.
