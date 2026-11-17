# Meadow Mage

Pierwszoosobowa gra o czarodzieju w przeglądarce (Three.js): FPS + RPG + clicker.

**Graj:** https://vereka.github.io/meadow-mage/ (po włączeniu GitHub Pages dla gałęzi `main`)

## Co jest w grze
- 8 zaklęć z maną, czasem odnowienia i zasięgiem; budynki z ~1700 klocków z fizyką
- 7 rodzajów stworów (animowane modele 3D), fale, bossowie, 3 krainy
- drzewko umiejętności, przedmioty, kowal, handlarz, skrzynie, automat, koło fortuny
- zakładka **Rozwój**: trening statystyk za złoto, Kryształ many (clicker), chowańce, odrodzenie
- **obrona wieży**: zadmij w róg w obozie, stwory idą na kryształ, klawisz `B` stawia wieżyczki

## Sterowanie
`WASD` ruch · `Shift` bieg · `Spacja` skok · mysz — celowanie i rzucanie · `1–8` / `Q` zaklęcia ·
`E` interakcja · `F` Tunel · `B` wieżyczka · `T` postać · `P` menu · `R` odbudowa · `M` tryb spokojny

## Uruchomienie lokalnie
Gra ładuje modele z `assets/`, więc potrzebuje serwera HTTP (nie `file://`):

    python3 -m http.server 8000
    # http://localhost:8000

Bez plików z `assets/` gra nadal działa — stwory i postacie rysuje wtedy kodem.

Autorzy grafik: zobacz [CREDITS.md](CREDITS.md).
