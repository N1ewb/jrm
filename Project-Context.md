# JRM (Jeep Route Maps) – Main Project Context

## Project Overview

JRM (Jeep Route Maps) is a **community-driven public transportation navigation platform** designed specifically for the Philippines. Its primary goal is to help commuters, tourists, foreign visitors, students, and local residents navigate jeepney, modern jeepney, and bus routes through an intelligent mapping system powered by community contributions.

Unlike traditional navigation applications that rely primarily on official transportation datasets, JRM leverages crowdsourcing to continuously build, verify, and improve transportation information. The platform combines interactive maps, GPS navigation, route optimization, fare calculation, and community verification into a single ecosystem.

The project will initially launch in **Iligan City** as its pilot implementation, with a planned expansion to **Cagayan de Oro City (CDO)** and eventually other cities across the Philippines.

---

# Vision

To become the leading community-driven public transportation navigation platform in the Philippines by making public transportation easier, more accessible, and continuously updated through community participation.

---

# Mission

To empower commuters with accurate transportation information while enabling communities to collaboratively build and maintain the country's largest public transportation database.

---

# Core Philosophy

JRM is **not** simply a map application.

It is a **community-powered transportation platform** that combines:

- Google Maps' navigation experience
- Waze's community reporting
- OpenStreetMap's collaborative mapping
- Reddit's voting and verification model

The platform should prioritize simplicity, accessibility, and scalability while remaining intuitive for first-time users.

---

# Primary Target Users

- Tourists
- Foreign visitors
- Students
- Daily commuters
- Local residents exploring unfamiliar areas
- Community contributors
- System administrators

---

# Supported Transportation

Initial release:

- Traditional Jeepneys
- Modern Jeepneys
- Public Buses

Future support:

- UV Express
- Tricycles
- Taxis
- Rail Transit
- Ferries

---

# MVP Coverage

Launch City:

- Iligan City

Expansion Roadmap:

1. Iligan City
2. Cagayan de Oro City
3. Other Philippine cities

The database and software architecture must be city-independent to simplify nationwide scaling.

---

# Core Features

## Navigation

- Destination search
- Route recommendation
- GPS location
- Walking directions
- Interactive maps
- Fewest-transfer optimization
- ETA estimation
- Dynamic fare calculation

---

## Community

- Submit transportation routes
- Draw routes on the map
- Add loading/unloading areas
- Report road closures
- Suggest edits
- Upvote/downvote routes
- Community verification
- Route versioning

---

## Offline

- Download city maps
- Download transportation routes
- Offline navigation
- Synchronize changes when internet becomes available

---

## Administration

- Manage routes
- Manage users
- Moderate reports
- Moderate community submissions
- Analytics dashboard
- City management
- Fare management

---

# Route Recommendation Philosophy

The routing engine should prioritize:

1. Fewest Transfers
2. Shortest Travel Time
3. Lowest Fare

Walking should only be suggested when necessary to reach the nearest loading area or transfer point.

---

# Community Verification Model

Users may submit new transportation routes.

Every submitted route becomes a **pending version**.

Other community members may:

- View
- Vote
- Comment
- Suggest edits
- Verify accuracy

Routes become active after satisfying configurable community verification requirements. Administrators retain override authority to resolve disputes or remove malicious submissions.

The system must preserve route history through versioning rather than overwriting existing data.

---

# Authentication Philosophy

Guest Mode:

- Browse maps
- Search destinations
- View routes
- Calculate fares
- Navigate

Registered Users:

- Submit routes
- Vote
- Report issues
- Save favorite places
- Save recent destinations
- Participate in community verification

Authentication is optional for navigation but required for community contributions.

---

# Fare Calculation

The system computes fares using:

- Current minimum fare
- Distance traveled
- Vehicle type
- Future fare regulation updates

Fare computation should be configurable rather than hard-coded.

---

# Road Closure Handling

Users may report:

- Floods
- Construction
- Accidents
- Festivals
- Temporary road closures

The routing engine should automatically avoid affected roads when recommending routes.

Government or LGU integrations should be designed as future modules without requiring major architectural changes.

---

# Offline-First Philosophy

Downloaded cities should remain usable without an internet connection.

Offline capabilities include:

- Maps
- Routes
- Saved places
- Navigation

Synchronization should occur automatically when connectivity is restored.

---

# User Experience Principles

The interface should prioritize the map over menus.

Design principles:

- Clean
- Minimal
- Mobile-first
- Fast
- Accessible
- Responsive

The application should feel familiar to users of Google Maps while introducing community-focused transportation features.

---

# Main Application Layout

Desktop:

- Top navigation bar
- Interactive map as the primary focus
- Collapsible sidebar
- Bottom route information panel

Mobile:

- Full-screen map
- Floating search
- Bottom sheet for route information
- Floating action buttons

---

# Community Features

Current Release:

- Route submission
- Community voting
- Community verification
- Route versioning
- Reporting

Future Release:

- Contributor reputation
- Achievement badges
- Trusted contributors
- AI-assisted route validation
- Community leaderboards

---

# Technology Stack

Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React
- MapLibre GL JS or React Leaflet

Backend

- Next.js API Routes (MVP)
- Node.js
- Prisma ORM

Database

- PostgreSQL
- PostGIS

Authentication

- Better Auth or NextAuth
- Google OAuth
- Email authentication

Maps

- OpenStreetMap
- Nominatim
- MapLibre GL JS

Offline

- Progressive Web App (PWA)
- Service Workers
- IndexedDB

Mobile

- Capacitor for Android and iOS packaging

Hosting

- Vercel (Frontend)
- Railway, Render, or Supabase (Backend/Database)

---

# Future Scalability

Planned enhancements include:

- Nationwide transportation support
- AI route recommendations
- Live traffic integration
- Government transportation APIs
- Crowdsourced congestion reporting
- Public transit schedules
- Vehicle occupancy estimation
- Open API for third-party developers
- GTFS import/export support

---

# Success Metrics

The project will be considered successful when it enables users to:

- Quickly discover public transportation routes.
- Navigate unfamiliar cities with confidence.
- Reach destinations using minimal transfers.
- Access transportation information offline.
- Reliably calculate fares and estimated travel times.
- Contribute to and improve transportation data through community participation.
- Scale from a single-city deployment to a nationwide transportation platform without significant architectural changes.

---

# Guiding Principle

Every feature added to JRM should answer one question:

**"Does this make public transportation in the Philippines easier to understand, navigate, and improve as a community?"**

If the answer is yes, it aligns with the project's mission.

This project is a mobile first project.

Requirements when building:

- Reusable Components
- Modular functions
- Proper server and client rendering
- Caching (when fetching data)
