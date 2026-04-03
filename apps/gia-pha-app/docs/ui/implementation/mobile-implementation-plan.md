# Implementation Plan: Heritage Cloud Mobile App (v1)

## 1. Project Overview
Building the mobile application for **Heritage Cloud (Gia Phả Việt)** based on the V1 UI designs and V2 SaaS architecture. The app will provide Vietnamese families with an authentic, on-the-go experience for managing their genealogy, rituals, and ancestral maps.

## 2. Tech Stack Selection
Given the web app uses Next.js and Tailwind, an **Expo (React Native)** stack with NativeWind (Tailwind for React Native) is highly recommended for maximum code reuse and velocity.
- **Framework:** Expo (React Native)
- **Styling:** NativeWind (Tailwind CSS)
- **State Management:** Zustand (matching web)
- **Map Integration:** `react-native-maps`
- **API/Data:** tRPC or direct Supabase client (matching V2 web auth & RLS)

## 3. Implementation Phases

### Phase 1: Foundation & Navigation
*Setup the core app shell, theming, and routing.*
1. Initialize Expo project with TypeScript and NativeWind.
2. Configure custom fonts (WindSong, Playfair Display).
3. Set up the global color palette (Imperial Crimson, Antique Gold, Dark Lacquer).
4. Implement navigation:
   - Bottom Tab Navigator (Home, Map, Lineage, Calendar/Profile).
   - Stack Navigator for deep linking into specific ancestors.

### Phase 2: Core Screens Implementation
*Convert the HTML V1 designs to React Native components.*
1. **Homepage (Ancestral Hall):**
   - Hero banner with calligraphy and background image.
   - Real-time countdown timer widget for upcoming rituals.
   - Main 2x2 navigation grid.
2. **Lineage Tree (Cây Gia Hệ):**
   - Implement vertical/horizontal scrollable lists for generations.
   - Build the `MemberCard` component taking into account living (parchment) vs deceased (dark + lotus icon).
3. **Ancestral Map (Bản Đồ):**
   - Integrate `react-native-maps` with a custom dark map style.
   - Implement custom markers (Gold for primary, Red for secondary).
   - Build the bottom sheet/card for grave details (image, status, directions CTA).
4. **Ritual Calendar:**
   - List view of upcoming memorials.
   - Lunar-solar date conversion utility.

### Phase 3: SaaS Integration (Backend)
*Connect the mobile app to the existing Next.js/Supabase backend.*
1. Implement NextAuth/Supabase authentication flow (Login/Register).
2. Ensure the JWT/Session includes the `clanId` for multi-tenant isolation.
3. Fetch real family data, map coordinates, and rituals from the API.

## 4. Relevant Files (To Create)
- `app/(tabs)/index.tsx` — Homepage
- `app/(tabs)/lineage.tsx` — Lineage Tree
- `app/(tabs)/map.tsx` — Ancestral Map
- `components/ui/MemberCard.tsx` — Lineage node component
- `lib/theme.ts` — Tailwind/NativeWind color configurations

## 5. Verification
1. Run app on iOS Simulator and Android Emulator to ensure UI renders correctly in both.
2. Validate custom fonts load properly.
3. Authenticate as a user and verify that ONLY their clan's data is returned (respecting V2 RLS policies).

## 6. Scope Delimitations
- **Out of Scope for Mobile MVP:** Editing the lineage tree (complex drag/drop). This will be read-only on mobile initially, with edits happening on the Web platform.
