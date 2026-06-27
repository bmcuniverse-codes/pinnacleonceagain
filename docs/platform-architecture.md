# VoteWave Platform Architecture

## Main Hierarchy

Organization owns Events.
Event owns Categories.
Nominees belong to Organizations.
Nominations connect a Nominee to a Category inside an Event.
Vote Transactions belong to a specific Nomination.

## Why this matters

The same person can be nominated in multiple categories without mixing vote counts.
The same platform can serve multiple schools, churches, brands, or pageants.

## Payment Philosophy

The voter interface is kept simple: amount only.
Paystack still needs email, so the system generates one internally per reference.
Votes are only added after webhook confirmation.
The database function prevents duplicate webhook events from adding votes twice.
