# Salon Frontend Workflow Document

## Scope
This document describes how the frontend app runs end-to-end for Customer, Salon Owner, and Admin users, including auth, routing, booking/payment, notifications, and Redux/API flow.

## System Entry
1. App bootstrap starts in [frontend/src/index.js](frontend/src/index.js#L1) with BrowserRouter + Redux Provider wrapping App.
2. Root orchestration is in [frontend/src/App.js](frontend/src/App.js#L1).
3. On startup, App dispatches getUser using Redux JWT or localStorage JWT via [frontend/src/Redux/Auth/action.js](frontend/src/Redux/Auth/action.js#L132).

## Global Routing Model
1. Root route split is defined in [frontend/src/App.js](frontend/src/App.js#L33).
2. Customer shell is the fallback route * and is implemented in [frontend/src/routes/CustomerRoutes.jsx](frontend/src/routes/CustomerRoutes.jsx#L14).
3. Salon owner area is mounted at /salon-dashboard/* and routed by [frontend/src/routes/SalonRoutes.jsx](frontend/src/routes/SalonRoutes.jsx#L14).
4. Admin area is mounted at /admin/* and routed by [frontend/src/routes/AdminRoutes.jsx](frontend/src/routes/AdminRoutes.jsx#L9).
5. Auth pages are /login and /register via [frontend/src/Auth/Auth.jsx](frontend/src/Auth/Auth.jsx#L26).

## Auth and Role Flow
1. Login and registration actions call backend auth endpoints in [frontend/src/Redux/Auth/action.js](frontend/src/Redux/Auth/action.js#L95).
2. JWT and user profile are normalized and saved in localStorage by persistAuthState in [frontend/src/Redux/Auth/action.js](frontend/src/Redux/Auth/action.js#L58).
3. Post-auth navigation is role-based:
4. ADMIN goes to /admin.
5. SALON_OWNER goes to /salon-dashboard.
6. Other roles go to /.
7. Auth reducer state shape and hydration behavior are in [frontend/src/Redux/Auth/reducer.js](frontend/src/Redux/Auth/reducer.js#L13).

## Customer Workflow
1. Customer routes load with Navbar + Footer wrapper in [frontend/src/routes/CustomerRoutes.jsx](frontend/src/routes/CustomerRoutes.jsx#L14).
2. Home page fetches salons on mount in [frontend/src/Customer/pages/Home/Home.jsx](frontend/src/Customer/pages/Home/Home.jsx#L13).
3. Salon details page loads salon info and categories using salonId param in [frontend/src/Customer/pages/Salon/SalonDetails/SalonDetails.jsx](frontend/src/Customer/pages/Salon/SalonDetails/SalonDetails.jsx#L27).
4. Service selection and booking creation happen in [frontend/src/Customer/pages/Salon/SalonDetails/SalonServiceDetails.jsx](frontend/src/Customer/pages/Salon/SalonDetails/SalonServiceDetails.jsx#L56).
5. Booking request posts to /api/bookings with paymentMethod=RAZORPAY in [frontend/src/Redux/Booking/action.js](frontend/src/Redux/Booking/action.js#L24).
6. Frontend redirects to Razorpay using payment_link_url in [frontend/src/Redux/Booking/action.js](frontend/src/Redux/Booking/action.js#L35).
7. Callback lands on /payment-success/:id and verifies payment using query params in [frontend/src/Customer/pages/Payment/PaymentSuccessHandler.jsx](frontend/src/Customer/pages/Payment/PaymentSuccessHandler.jsx#L24).
8. Payment finalize call is PATCH /api/payments/proceed in [frontend/src/Redux/Payment/action.js](frontend/src/Redux/Payment/action.js#L14).
9. Customer can view booking history at /bookings from [frontend/src/Customer/pages/Bookings/Bookings.jsx](frontend/src/Customer/pages/Bookings/Bookings.jsx#L9).

## Salon Owner Workflow
1. Dashboard shell is rendered by [frontend/src/salon/pages/SellerDashboard/SalonDashboard.jsx](frontend/src/salon/pages/SellerDashboard/SalonDashboard.jsx#L11).
2. On load, it fetches owner salon and report metrics via:
3. fetchSalonByOwner in [frontend/src/Redux/Salon/action.js](frontend/src/Redux/Salon/action.js#L88).
4. getSalonReport in [frontend/src/Redux/Booking/action.js](frontend/src/Redux/Booking/action.js#L98).
5. Navigation menu structure is in [frontend/src/salon/components/SideBar/DrawerList.jsx](frontend/src/salon/components/SideBar/DrawerList.jsx#L12).
6. Operational modules include services, bookings, category, payments, transactions, notifications, account through [frontend/src/routes/SalonRoutes.jsx](frontend/src/routes/SalonRoutes.jsx#L14).

## Admin Workflow
1. Admin shell uses shared navbar + drawer in [frontend/src/Admin/pages/Dashboard/Dashboard.jsx](frontend/src/Admin/pages/Dashboard/Dashboard.jsx#L21).
2. Current active admin route is primarily dashboard salon table at /admin in [frontend/src/routes/AdminRoutes.jsx](frontend/src/routes/AdminRoutes.jsx#L9).

## Notification Workflow
1. Initial notification fetch:
2. Customer side fetches user notifications in [frontend/src/Customer/pages/Navbar/Navbar.jsx](frontend/src/Customer/pages/Navbar/Navbar.jsx#L41).
3. Salon side fetches salon notifications in [frontend/src/admin seller/components/navbar/Navbar.jsx](frontend/src/admin%20seller/components/navbar/Navbar.jsx#L21).
4. Realtime subscription uses SockJS + STOMP in [frontend/src/util/useNotificationWebsoket.jsx](frontend/src/util/useNotificationWebsoket.jsx#L13).
5. Incoming messages dispatch addNotification in [frontend/src/Redux/Notifications/action.js](frontend/src/Redux/Notifications/action.js#L97).
6. Notification page UI consumption is in [frontend/src/Customer/pages/Notifications/Notification.jsx](frontend/src/Customer/pages/Notifications/Notification.jsx#L56).

## API and State Architecture
1. Axios base config and env-driven endpoints are centralized in [frontend/src/config/api.js](frontend/src/config/api.js#L1).
2. Redux root store combines auth, salon, service, booking, category, review, notification, chart in [frontend/src/Redux/store.js](frontend/src/Redux/store.js#L14).

## Primary User Journeys
1. Guest opens app.
2. App checks JWT and resolves profile.
3. Guest browses salons on Home.
4. Guest registers/logs in.
5. Customer selects salon, category, services, time.
6. Customer creates booking and is redirected to payment.
7. Payment callback confirms booking payment.
8. User tracks bookings and notifications.
9. Salon owner manages operations in dashboard.
10. Admin monitors salons from admin dashboard.

## Known Flow Characteristics
1. Route-level access control is mostly navigation-driven, not strict guarded-route components.
2. Backend bearer-token authorization is relied on for protected data APIs.
3. localStorage is central for auth persistence across reloads.
