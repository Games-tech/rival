# Arena Rivals: self-hosted setup (Firebase)

Everyone who opens your hosted link and types the same room code plays together. No accounts needed
(players are signed in anonymously behind the scenes).

## 1. Create the Firebase project
1. Go to https://console.firebase.google.com and click **Add project**. Name it anything. You can skip Google Analytics.

## 2. Turn on anonymous sign-in
1. **Build > Authentication > Get started > Sign-in method**.
2. Click **Anonymous**, switch it on, and save.

## 3. Create the database and paste the rules
1. **Build > Realtime Database > Create database**. Pick a location and start in **locked mode**.
2. Open the **Rules** tab, replace everything with the contents of `database.rules.json`, and click **Publish**.
3. Note the database address at the top of the Data tab (like `https://xxxx-default-rtdb.firebaseio.com`).

## 4. Paste your config into the game
1. Click the gear icon > **Project settings** > **Your apps** > the web icon `</>` > register an app (hosting not needed).
2. Copy the values from the `firebaseConfig` it shows you.
3. Open `index.html` in a text editor and replace the placeholders in `FIREBASE_CONFIG` near the top.
   If `databaseURL` is missing from what Firebase showed, use the address from step 3.

## 5. Put it online
Any static host works. Pick one:
- **Netlify Drop (easiest):** go to https://app.netlify.com/drop and drag the folder containing `index.html` onto the page.
- **Firebase Hosting:** install Node.js, then run `npm i -g firebase-tools`, `firebase login`, `firebase use --add` (choose your project), and `firebase deploy --only hosting`.
- **Test on your own computer first:** in this folder run `python3 -m http.server 8000` and open http://localhost:8000.
  Opening `index.html` by double-clicking will not work, because sign-in needs a web address.

## 6. Test it
Open your link in two browser windows, type the same room code in both, and press Play.
The bar at the bottom should say 2 players, and you should see each other.

## Troubleshooting
- Bottom bar says "add your Firebase config": step 4 isn't done.
- "auth/operation-not-allowed": Anonymous sign-in isn't switched on (step 2).
- "auth/unauthorized-domain": add your site's domain under Authentication > Settings > Authorized domains.
- "Permission denied": the rules in step 3 weren't published, or the Realtime Database was created in a different place than `databaseURL`.

## Good to know
- The free Spark plan allows about 100 people connected at once, which is plenty for friends.
- Hit detection happens on each shooter's computer, so a determined cheater could fake hits. Fine for friends, not for a public competitive game.
- Coins, guns and skins are saved in each player's own browser, not on a server.
