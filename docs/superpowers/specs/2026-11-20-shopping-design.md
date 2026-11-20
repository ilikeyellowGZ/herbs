# Pricing, cart and checkout

Implement the user's authorised shopping flow within the existing design. Replace navbar search with a live total-unit cart badge and native cart drawer. Show proposed ZAR prices, forms and pack sizes on all cards, quick views and detail pages; add from each surface. Retain collection filtering and search input. Persist validated slug/count entries only; derive prices from catalogue data, integer cents and a 99-unit limit. Quantity changes, removal, empty state and refresh all work.

Checkout collects contact and South African courier address or free Gauteng collection, validates required fields, and opens a review that can be edited or copied as an order request. Draft courier rate R75, free at R650. No connected backend/payment provider exists. Explicitly disclose preview mode; never claim payment, submission or order placement. Do not persist customer details, invent supplement doses or collect card data. Show label-based supplement directions and quantity/form instead.

Use the shopping primitives and responsive rules in DESIGN.md. Verify catalogue/cart arithmetic and hostile persisted data with Node tests, then build/prerender and browser-test all purchase entry points, drawer keyboard interaction, persistence, checkout validation/review/edit/copy, empty state and layouts at 375/768/1280px.
