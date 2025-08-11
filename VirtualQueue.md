# KioskQueue - Virtual Queue System for event kiosks
Develop the outlined system where users can sign up for a virtual queue at a kiosk tablet.

## Configurable System Settings
- LineCount = 2: number of parallel lines in the queue
- SlotTime = 5m: Time a slot is expected to take (for wait time estimation)
- AdminPassword: Password that must be entered to access admin view.

## Sign-Up Kiosk Frontend
The publicly accessible interface.
- **Default View:** "Join Queue" button. Displays current wait time and queue size, in minutes.
- **Join Queue View:** Users must enter a name and can optionally enter a phone number to join the queue. Additionally, the user may select how many slots ("party size") at a time they are reserving in range of [1, MAX=LineCount=2]. This enables friends and parties to experience together.
- **Confirmation View:** User's place in line, time until their turn in minutes, and their arrival time.

## Admin Frontend
Admins can access using a simple password, no username. Inconspicuous button to access it in a corner.
- **Queue Display**: Shows listed info of users in the queue, remove button for each entry.
- **Next Button:** Move queue to the next queued entry. Writes a log to an archive list.

## Backend
- Receives signups from Kiosk with party size
- Handles queue in a "best fit" mode where signups are fit in to the first available space that will fit the signup size (number of people in the party). E.g. Assume a two parallel lines example. if there is a single user (user a) queued before a party of two (group b), new user c will be placed in the empty spot next to user a.
```
[ --  current slot   -- ]
[ user a   ] [ empty    ]
[ group c1 ] [ group c2 ]

> user b signs up and is fit into the empty space:
[ --  current slot   -- ]
[ user a   ] [ user b   ]
[ group c1 ] [ group c2 ]
```
- Optimizes the queue when sign-ups are cancelled
- Texts users when they sign up and when they are next up (Twilio API)
- Allow cancellation if user responds to text with `CANCEL`

## Requirements
- Standalone application.
- Compartmentalize code so it is easily implemented/embedded into another application.