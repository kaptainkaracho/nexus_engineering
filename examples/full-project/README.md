# Full Project Example

A comprehensive example showing complete traceability across an e-commerce application.

## What's Included

| Document Type | Count | Files |
|---------------|-------|-------|
| Requirements | 2 | `requirements/product-catalog.req.yaml`, `requirements/orders.req.yaml` |
| ADRs | 3 | `architecture/adr-001-search.arch.yaml`, `adr-002-cart.arch.yaml`, `adr-003-payment.arch.yaml` |
| Specs | 3 | `specs/product-search.spec.yaml`, `specs/shopping-cart.spec.yaml`, `specs/checkout.spec.yaml` |
| Trace Links | 12 | `trace-links/trace-links.yaml` |

## Traceability Chain

```
Product Search (REQ-PROD-001)
    ├── satisfies ──► Elasticsearch ADR (ADR-001)
    └── verified-by ──► Search Spec (SPEC-SEARCH-001)
                            └── implements ──► TC-SEARCH-001

Shopping Cart (REQ-ORD-001)
    ├── satisfies ──► Redis Cart ADR (ADR-002)
    └── verified-by ──► Cart Spec (SPEC-CART-001)
                            └── implements ──► TC-CART-001

Checkout (REQ-ORD-002)
    ├── satisfies ──► Stripe Payment ADR (ADR-003)
    └── verified-by ──► Checkout Spec (SPEC-CHECKOUT-001)
                            └── implements ──► TC-CHECKOUT-001
```

## How to Use

1. Start Nexus: `pnpm dev`
2. Go to **Scanner** view
3. Enter path: `examples/full-project`
4. Click **Scan**
5. View trace links in **Graph View**

## Expected Results

- 8 documents ingested (2 reqs, 3 ADRs, 3 specs)
- 12 trace links discovered
- Full requirement → architecture → spec → test chains visible
- Cross-domain traces between search performance and Elasticsearch architecture
