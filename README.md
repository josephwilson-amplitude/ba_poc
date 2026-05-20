# British Airways — Amplitude Demo Site

A static demo site built to showcase Amplitude analytics across a realistic airline booking funnel.

## Pages & Amplitude events

| Page | File | Events fired |
|------|------|-------------|
| Home / Flight Search | `index.html` | `Flight Search Completed`, `Destination Searched`, `Sale Promotion Viewed` |
| Flight Results | `results.html` | `Flight Selected`, `Fare Class Browsed`, `Flight Saved`, `Upgrade Offer Clicked`, `Customer Review Read` |
| Passenger Details | `passengers.html` | `Passenger Details Submitted`, `Booking Abandoned` |
| Seat Selection ⚡ | `seats.html` | `Seat Selection Abandoned` (on load — friction), `Seat Selection Confirmed` |
| Payment | `payment.html` | _(no events — payment details never tracked)_ |
| Booking Confirmed | `confirmation.html` | `Booking Confirmed` |
| Offers & Promotions | `offers.html` | `Sale Promotion Viewed`, `Upgrade Offer Clicked`, `Promo Code Entered` |

## Demo flow

1. Open `index.html` — click **Sign In** (top right) to set your Amplitude identity
2. Search for a flight → **Flight Search Completed**
3. Select a flight → **Flight Selected**
4. Fill passenger details → **Passenger Details Submitted**
5. Seat selection page loads → **Seat Selection Abandoned** fires immediately (friction event)
6. Select a seat and confirm → **Seat Selection Confirmed**
7. Complete payment → redirect to confirmation
8. **Booking Confirmed** fires on load

## Amplitude configuration

- **Project key:** `f70ef2dbfa2b6bfc6316397d090f6b16`
- **Data centre:** EU (`https://api.eu.amplitude.com/2/httpapi`)
- **Session Replay:** enabled at 100% sample rate
- **Autocapture:** enabled

## GitHub Pages deployment

All site files are in `/docs`. In your repo settings:

**Settings → Pages → Source → Deploy from branch → `main` → `/docs`**

Site will be live at: `https://<username>.github.io/<repo-name>/`
